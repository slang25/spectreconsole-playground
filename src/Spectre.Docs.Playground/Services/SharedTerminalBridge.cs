namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Thread-safe bridge for terminal I/O using SharedTerminalIO.
/// This replaces the channel-based TerminalBridge with direct memory access,
/// completely bypassing Blazor JS interop for terminal communication.
/// </summary>
public class SharedTerminalBridge : ITerminalBridge
{
    private readonly SharedTerminalIO _terminalIO;
    private readonly CancellationToken _cancellationToken;
    private volatile bool _isComplete;

    public SharedTerminalBridge(SharedTerminalIO terminalIO, CancellationToken cancellationToken = default)
    {
        _terminalIO = terminalIO;
        _cancellationToken = cancellationToken;
    }

    /// <summary>
    /// Writer for output - writes directly to WASM shared memory.
    /// No JS interop required - can be called from any thread.
    /// Throws OperationCanceledException if cancellation was requested.
    /// </summary>
    public void WriteOutput(string text)
    {
        if (_isComplete) return;
        _cancellationToken.ThrowIfCancellationRequested();
        _terminalIO.WriteOutput(text);
    }

    /// <summary>
    /// Clear signal - sends ANSI clear sequence.
    /// </summary>
    public void WriteClear()
    {
        if (_isComplete) return;
        _cancellationToken.ThrowIfCancellationRequested();
        // ANSI escape sequence to clear screen and move cursor to home
        _terminalIO.WriteOutput("\x1b[2J\x1b[H");
    }

    /// <summary>
    /// Read a key - blocks until available.
    /// No JS interop required - reads directly from WASM shared memory.
    /// </summary>
    public ConsoleKeyInfo ReadKey()
    {
        return _terminalIO.ReadKey(_cancellationToken);
    }

    /// <summary>
    /// Async version of ReadKey.
    /// </summary>
    public ValueTask<ConsoleKeyInfo> ReadKeyAsync(CancellationToken cancellationToken = default)
    {
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _cancellationToken);

        // Since the ring buffer doesn't support async, we poll with Sleep to yield
        while (!_terminalIO.IsKeyAvailable())
        {
            linkedCts.Token.ThrowIfCancellationRequested();
            Thread.Sleep(1);
        }

        return new ValueTask<ConsoleKeyInfo>(_terminalIO.ReadKey(linkedCts.Token));
    }

    /// <summary>
    /// Check if input is available without blocking.
    /// </summary>
    public bool IsInputAvailable()
    {
        return _terminalIO.IsKeyAvailable();
    }

    /// <summary>
    /// Signal that execution is complete.
    /// </summary>
    public void Complete()
    {
        _isComplete = true;
    }

    /// <summary>
    /// Reset the bridge for a new execution.
    /// </summary>
    public void Reset()
    {
        _isComplete = false;
        _terminalIO.Reset();
    }
}
