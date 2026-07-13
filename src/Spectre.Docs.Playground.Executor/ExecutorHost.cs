using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;

namespace Spectre.Docs.Playground.Executor;

/// <summary>
/// Entry points and JS bindings for the executor worker.
/// All interop here is same-thread and synchronous where possible: this runtime is
/// single-threaded on purpose, so none of the multithreaded proxying machinery runs.
/// </summary>
[SupportedOSPlatform("browser")]
public partial class ExecutorHost
{
    /// <summary>
    /// Execute a compiled user assembly. Returns when the user program finishes.
    /// </summary>
    [JSExport]
    public static async Task ExecuteAsync(byte[] assemblyBytes, int cols, int rows)
    {
        await ExecutionCore.ExecuteAsync(assemblyBytes, cols, rows);
    }

    /// <summary>
    /// Cheap liveness probe for the page-side watchdog.
    /// </summary>
    [JSExport]
    public static bool Ping() => true;

    // --- Imports provided by executorWorker.js via setModuleImports("executorIO", ...) ---

    /// <summary>Write text to the shared output ring buffer (may block briefly if full).</summary>
    [JSImport("writeOutput", "executorIO")]
    internal static partial void WriteOutput(string text);

    /// <summary>
    /// Block (Atomics.wait) until a key packet is available or execution is cancelled.
    /// Returns the packed key (keyCode | keyChar &lt;&lt; 8 | modifiers &lt;&lt; 24), or -1 on cancellation.
    /// </summary>
    [JSImport("readKeyBlocking", "executorIO")]
    internal static partial int ReadKeyBlocking();

    /// <summary>Check whether a key packet is available without blocking.</summary>
    [JSImport("isInputAvailable", "executorIO")]
    internal static partial bool IsInputAvailable();

    /// <summary>Check whether the page requested cancellation.</summary>
    [JSImport("isCancelled", "executorIO")]
    internal static partial bool IsCancelled();

    /// <summary>Best-effort sleep that keeps the cancel flag observable. Blocks the worker.</summary>
    [JSImport("sleep", "executorIO")]
    internal static partial void SleepJs(int milliseconds);
}
