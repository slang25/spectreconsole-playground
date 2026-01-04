namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Interface for terminal I/O bridge implementations.
/// </summary>
public interface ITerminalBridge
{
    /// <summary>
    /// Write text to terminal output.
    /// </summary>
    void WriteOutput(string text);

    /// <summary>
    /// Send clear screen command.
    /// </summary>
    void WriteClear();

    /// <summary>
    /// Read a key, blocking until available.
    /// </summary>
    ConsoleKeyInfo ReadKey();

    /// <summary>
    /// Read a key asynchronously.
    /// </summary>
    ValueTask<ConsoleKeyInfo> ReadKeyAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if input is available without blocking.
    /// </summary>
    bool IsInputAvailable();

    /// <summary>
    /// Signal that execution is complete.
    /// </summary>
    void Complete();
}
