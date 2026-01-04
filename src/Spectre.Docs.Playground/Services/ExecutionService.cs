using System.Reflection;
using System.Runtime.Loader;
using Spectre.Console;

namespace Spectre.Docs.Playground.Services;

public class ExecutionService
{
    /// <summary>
    /// Execute code using the new SharedTerminalIO architecture.
    /// This completely bypasses Blazor JS interop for terminal I/O.
    /// </summary>
    public async Task ExecuteAsync(byte[] assemblyBytes, SharedTerminalIO terminalIO, int cols, int rows)
    {
        // Use the SharedTerminalIO's cancellation token (cancelled by Stop button or Ctrl+C)
        var cancellationToken = terminalIO.CancellationToken;

        // Create a bridge that uses the shared memory ring buffers
        var bridge = new SharedTerminalBridge(terminalIO, cancellationToken);

        // Create a custom IAnsiConsole that writes to the bridge with actual terminal size
        var console = new TerminalConsole(bridge, cols, rows);

        // Set the console as the default for Spectre.Console
        SetDefaultConsole(console);

        try
        {
            // Execute on a background thread
            // The ring buffers handle all I/O without any JS interop calls
            await Task.Run(() => ExecuteOnBackgroundThread(assemblyBytes, bridge, cancellationToken), cancellationToken);
        }
        catch (OperationCanceledException)
        {
            terminalIO.WriteOutput("\e[33mExecution cancelled.\e[0m\r\n");
        }
        finally
        {
            // Mark execution as complete
            bridge.Complete();

            // Reset the default console
            ResetDefaultConsole();
        }
    }

    private void ExecuteOnBackgroundThread(byte[] assemblyBytes, SharedTerminalBridge bridge, CancellationToken cancellationToken)
    {
        try
        {
            // Load the assembly
            using var ms = new MemoryStream(assemblyBytes);
            var context = new CollectibleAssemblyLoadContext();
            var assembly = context.LoadFromStream(ms);

            // Find the entry point
            var entryPoint = assembly.EntryPoint;
            if (entryPoint == null)
            {
                bridge.WriteOutput("\e[31mError: No entry point found in the compiled assembly.\e[0m\r\n");
                return;
            }

            // Execute the entry point
            var parameters = entryPoint.GetParameters();
            object?[] args = parameters.Length > 0
                ? [Array.Empty<string>()]
                : [];

            var result = entryPoint.Invoke(null, args);

            // Handle async entry points
            if (result is Task task)
            {
                task.GetAwaiter().GetResult(); // Safe to block on background thread
            }

            // Unload the assembly context
            context.Unload();
        }
        catch (TargetInvocationException ex) when (ex.InnerException != null)
        {
            // Unwrap reflection exceptions
            bridge.WriteOutput($"\e[31mError: {ex.InnerException.Message}\e[0m\r\n");
            if (ex.InnerException.StackTrace != null)
            {
                bridge.WriteOutput($"\e[90m{ex.InnerException.StackTrace}\e[0m\r\n");
            }
        }
        catch (OperationCanceledException)
        {
            bridge.WriteOutput("\e[33mExecution cancelled.\e[0m\r\n");
        }
        catch (Exception ex)
        {
            bridge.WriteOutput($"\e[31mError: {ex.Message}\e[0m\r\n");
            if (ex.StackTrace != null)
            {
                bridge.WriteOutput($"\e[90m{ex.StackTrace}\e[0m\r\n");
            }
        }
    }

    private static void SetDefaultConsole(IAnsiConsole console)
    {
        // Use reflection to set the internal console
        // This allows code using AnsiConsole.WriteLine etc. to work
        var field = typeof(AnsiConsole).GetField("_console", BindingFlags.Static | BindingFlags.NonPublic);
        field?.SetValue(null, new Lazy<IAnsiConsole>(() => console));
    }

    private static void ResetDefaultConsole()
    {
        // Reset to null so Spectre.Console recreates its default
        var field = typeof(AnsiConsole).GetField("_console", BindingFlags.Static | BindingFlags.NonPublic);
        field?.SetValue(null, null);
    }

    /// <summary>
    /// An assembly load context that can be unloaded to free memory.
    /// </summary>
    private class CollectibleAssemblyLoadContext : AssemblyLoadContext
    {
        public CollectibleAssemblyLoadContext() : base(isCollectible: true)
        {
        }

        protected override Assembly? Load(AssemblyName assemblyName)
        {
            // Return null to fall back to the default context
            return null;
        }
    }
}
