using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// JS interop surface for the terminal UI and executor control.
///
/// User-code execution happens in a dedicated Web Worker hosting its own
/// single-threaded .NET runtime (see js/executor.js and the
/// Spectre.Docs.Playground.Executor project). Terminal I/O flows through
/// SharedArrayBuffer ring buffers owned entirely by JS — this app never touches
/// them, which keeps the main runtime free of threading (and of the
/// multithreaded-runtime interop deadlock, dotnet/runtime#106788).
/// </summary>
[SupportedOSPlatform("browser")]
public sealed partial class SharedTerminalIO
{
    private static SharedTerminalIO? _instance;
    private static bool _moduleLoaded;

    /// <summary>
    /// Get the singleton instance.
    /// </summary>
    public static SharedTerminalIO? Instance => _instance;

    private SharedTerminalIO()
    {
        _instance = this;
    }

    /// <summary>
    /// Cancel the current execution. Cooperative first; the JS side hard-kills
    /// the worker if the run doesn't stop promptly.
    /// </summary>
    public void Cancel()
    {
        JSCancelExecution();
    }

    /// <summary>
    /// Reset execution I/O state for a fresh run.
    /// </summary>
    public void Reset()
    {
        JSResetExecution();
    }

    /// <summary>
    /// Create (or reuse) the terminal IO instance, loading the JS module on first use.
    /// Must be called from the main thread with JS interop access.
    /// </summary>
    public static async Task<SharedTerminalIO> CreateAsync(CancellationToken cancellationToken = default)
    {
        if (!_moduleLoaded)
        {
            try
            {
                // Apply a timeout to the module import to prevent indefinite hanging
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

                await JSHost.ImportAsync("sharedTerminal", "/js/sharedTerminal.js").WaitAsync(linkedCts.Token);
                _moduleLoaded = true;
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                throw new TimeoutException("Failed to load sharedTerminal.js module within 30 seconds. The terminal may not be available.");
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to load sharedTerminal.js module: {ex.Message}", ex);
            }
        }

        if (_instance != null)
        {
            _instance.Reset();
            return _instance;
        }

        return new SharedTerminalIO();
    }

    /// <summary>
    /// Write text directly to the terminal (host-side writes such as the welcome
    /// animation and error messages).
    /// </summary>
    public void WriteOutput(string text)
    {
        JSWriteTerminal(text);
    }

    /// <summary>
    /// Start the JS terminal in the given container. Must be called from main thread.
    /// </summary>
    public static async Task StartTerminalAsync(string containerId)
    {
        await JSStartTerminal(containerId);
    }

    /// <summary>
    /// Stop the JS terminal output polling.
    /// </summary>
    public static void StopTerminal()
    {
        JSStopTerminal();
    }

    /// <summary>
    /// Clear the terminal display.
    /// </summary>
    public static void ClearTerminal()
    {
        JSClearTerminal();
    }

    /// <summary>
    /// Focus the terminal.
    /// </summary>
    public static void FocusTerminal()
    {
        JSFocusTerminal();
    }

    /// <summary>
    /// Get the terminal size.
    /// </summary>
    public static (int cols, int rows) GetTerminalSize()
    {
        var result = JSGetTerminalSize();
        return ((int)result.GetPropertyAsDouble("cols"), (int)result.GetPropertyAsDouble("rows"));
    }

    /// <summary>
    /// Set whether execution is currently running.
    /// Controls cursor blink behavior (cursor only blinks when running AND focused).
    /// </summary>
    public static void SetExecutionRunning(bool running)
    {
        JSSetExecutionRunning(running);
    }

    [JSImport("startTerminal", "sharedTerminal")]
    private static partial Task JSStartTerminal(string containerId);

    [JSImport("stopTerminal", "sharedTerminal")]
    private static partial void JSStopTerminal();

    [JSImport("clearTerminal", "sharedTerminal")]
    private static partial void JSClearTerminal();

    [JSImport("focusTerminal", "sharedTerminal")]
    private static partial void JSFocusTerminal();

    [JSImport("getTerminalSize", "sharedTerminal")]
    private static partial JSObject JSGetTerminalSize();

    [JSImport("writeTerminal", "sharedTerminal")]
    private static partial void JSWriteTerminal(string text);

    [JSImport("setExecutionRunning", "sharedTerminal")]
    private static partial void JSSetExecutionRunning(bool running);

    [JSImport("cancelExecution", "sharedTerminal")]
    private static partial void JSCancelExecution();

    [JSImport("resetExecution", "sharedTerminal")]
    private static partial void JSResetExecution();
}
