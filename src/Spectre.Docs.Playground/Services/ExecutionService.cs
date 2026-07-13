using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Runs compiled user code on the executor worker (a separate single-threaded
/// .NET runtime in a Web Worker). The returned task completes when the user
/// program finishes, is cancelled, or the worker is terminated.
/// </summary>
[SupportedOSPlatform("browser")]
public partial class ExecutionService
{
    public async Task ExecuteAsync(byte[] assemblyBytes, SharedTerminalIO terminalIO, int cols, int rows)
    {
        try
        {
            await JSRunOnExecutor(assemblyBytes, cols, rows);
        }
        catch (JSException ex)
        {
            terminalIO.WriteOutput($"\e[31mExecution failed: {ex.Message}\e[0m\r\n");
        }
    }

    [JSImport("runOnExecutor", "sharedTerminal")]
    private static partial Task JSRunOnExecutor(byte[] assemblyBytes, int cols, int rows);
}
