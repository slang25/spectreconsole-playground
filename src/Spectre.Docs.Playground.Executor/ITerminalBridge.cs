namespace Spectre.Docs.Playground.Executor;

/// <summary>
/// Abstraction for terminal I/O between executing user code and the host terminal.
/// </summary>
public interface ITerminalBridge
{
    void WriteOutput(string text);
    void WriteClear();
    ConsoleKeyInfo ReadKey();
    ValueTask<ConsoleKeyInfo> ReadKeyAsync(CancellationToken cancellationToken = default);
    bool IsInputAvailable();
    void Complete();
}
