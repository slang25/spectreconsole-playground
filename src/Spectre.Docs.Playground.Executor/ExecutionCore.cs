using System.Reflection;
using System.Runtime.Loader;
using System.Runtime.Versioning;
using Spectre.Console;

namespace Spectre.Docs.Playground.Executor;

/// <summary>
/// Loads and runs a user assembly on this (single) thread.
/// Sync user code blocks the worker — that's fine and expected. Async entry points
/// are awaited so timers and async interop keep working.
/// </summary>
[SupportedOSPlatform("browser")]
public static class ExecutionCore
{
    public static async Task ExecuteAsync(byte[] assemblyBytes, int cols, int rows)
    {
        var bridge = new WorkerTerminalBridge();
        var console = new TerminalConsole(bridge, cols, rows);

        SetDefaultConsole(console);

        try
        {
            using var ms = new MemoryStream(assemblyBytes);
            var context = new CollectibleAssemblyLoadContext();
            var assembly = context.LoadFromStream(ms);

            WirePlaygroundRuntime(assembly, console);

            var entryPoint = assembly.EntryPoint;
            if (entryPoint == null)
            {
                bridge.WriteOutput("\e[31mError: No entry point found in the compiled assembly.\e[0m\r\n");
                return;
            }

            var parameters = entryPoint.GetParameters();
            object?[] args = parameters.Length > 0
                ? [Array.Empty<string>()]
                : [];

            var result = entryPoint.Invoke(null, args);

            // Async entry points must be awaited, never blocked on: this runtime has
            // a single thread, and their continuations need the event loop.
            if (result is Task task)
            {
                await task;
            }

            context.Unload();
        }
        catch (TargetInvocationException ex) when (ex.InnerException is OperationCanceledException)
        {
            WriteCancelled(bridge);
        }
        catch (TargetInvocationException ex) when (ex.InnerException != null)
        {
            WriteError(bridge, ex.InnerException);
        }
        catch (OperationCanceledException)
        {
            WriteCancelled(bridge);
        }
        catch (Exception ex)
        {
            WriteError(bridge, ex);
        }
        finally
        {
            bridge.Complete();
            ResetDefaultConsole();
        }
    }

    /// <summary>
    /// The user assembly carries an injected PlaygroundRuntime class (see the main
    /// app's WorkspaceService). Hand it the host callbacks it needs: cancellation
    /// polling and a real blocking sleep.
    /// </summary>
    private static void WirePlaygroundRuntime(Assembly assembly, IAnsiConsole console)
    {
        var runtimeType = assembly.GetType("PlaygroundRuntime");
        if (runtimeType == null)
        {
            return;
        }

        runtimeType.GetField("CancellationRequested", BindingFlags.Public | BindingFlags.Static)
            ?.SetValue(null, (Func<bool>)ExecutorHost.IsCancelled);

        runtimeType.GetField("NativeSleep", BindingFlags.Public | BindingFlags.Static)
            ?.SetValue(null, (Action<int>)ExecutorHost.SleepJs);
    }

    private static void WriteCancelled(ITerminalBridge bridge)
    {
        try
        {
            bridge.WriteOutput("\r\n\e[33mExecution cancelled.\e[0m\r\n");
        }
        catch (OperationCanceledException)
        {
            // Bridge refuses writes after cancellation was flagged; the page shows
            // its own cancellation notice when it tears the run down.
        }
    }

    private static void WriteError(ITerminalBridge bridge, Exception ex)
    {
        bridge.WriteOutput($"\e[31mError: {ex.Message}\e[0m\r\n");
        if (ex.StackTrace != null)
        {
            bridge.WriteOutput($"\e[90m{ex.StackTrace}\e[0m\r\n");
        }
    }

    private static void SetDefaultConsole(IAnsiConsole console)
    {
        var field = typeof(AnsiConsole).GetField("_console", BindingFlags.Static | BindingFlags.NonPublic);
        field?.SetValue(null, new Lazy<IAnsiConsole>(() => console));
    }

    private static void ResetDefaultConsole()
    {
        var field = typeof(AnsiConsole).GetField("_console", BindingFlags.Static | BindingFlags.NonPublic);
        field?.SetValue(null, null);
    }

    private class CollectibleAssemblyLoadContext : AssemblyLoadContext
    {
        public CollectibleAssemblyLoadContext() : base(isCollectible: true)
        {
        }

        protected override Assembly? Load(AssemblyName assemblyName)
        {
            // Fall back to the default context (runtime + Spectre assemblies).
            return null;
        }
    }
}
