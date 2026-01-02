using System.Threading.Channels;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Thread-safe bridge for terminal I/O that allows background threads to communicate
/// with the main thread (which has JS interop access).
/// </summary>
public class TerminalBridge
{
    private readonly Channel<string> _outputChannel;
    private readonly Channel<ConsoleKeyInfo> _inputChannel;
    private readonly CancellationToken _cancellationToken;

    public TerminalBridge(CancellationToken cancellationToken = default)
    {
        _cancellationToken = cancellationToken;
        _outputChannel = Channel.CreateUnbounded<string>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
        _inputChannel = Channel.CreateUnbounded<ConsoleKeyInfo>(new UnboundedChannelOptions
        {
            SingleReader = false,
            SingleWriter = true
        });
    }

    /// <summary>
    /// Writer for output - used by the background thread (TerminalConsole).
    /// This blocks until the message is written to the channel.
    /// </summary>
    public void WriteOutput(string text)
    {
        _outputChannel.Writer.TryWrite(text);
    }

    /// <summary>
    /// Clear signal - sends a special marker.
    /// </summary>
    public void WriteClear()
    {
        _outputChannel.Writer.TryWrite("\fLEAR\0");
    }

    /// <summary>
    /// Reader for output - used by the main thread to send to xterm.js.
    /// </summary>
    public ChannelReader<string> OutputReader => _outputChannel.Reader;

    /// <summary>
    /// Write a key to the input channel - called by main thread when key is received.
    /// </summary>
    public void WriteInput(ConsoleKeyInfo keyInfo)
    {
        _inputChannel.Writer.TryWrite(keyInfo);
    }

    /// <summary>
    /// Read a key from the input channel - called by background thread (blocks until available).
    /// </summary>
    public ConsoleKeyInfo ReadKey()
    {
        // Use polling with short sleeps instead of Task.Wait() which can timeout in WASM
        // This is more compatible with the WASM threading model in cross-origin isolated contexts
        while (!_cancellationToken.IsCancellationRequested)
        {
            if (_inputChannel.Reader.TryRead(out var keyInfo))
            {
                return keyInfo;
            }

            // Short sleep to yield to other work without fully blocking
            // Thread.Sleep(1) in WASM uses a cooperative yield mechanism
            Thread.Sleep(1);
        }

        _cancellationToken.ThrowIfCancellationRequested();
        return default; // Unreachable, but satisfies compiler
    }

    /// <summary>
    /// Async version of ReadKey for when async is available.
    /// </summary>
    public async ValueTask<ConsoleKeyInfo> ReadKeyAsync(CancellationToken cancellationToken = default)
    {
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _cancellationToken);
        return await _inputChannel.Reader.ReadAsync(linkedCts.Token);
    }

    /// <summary>
    /// Check if input is available without blocking.
    /// </summary>
    public bool IsInputAvailable()
    {
        return _inputChannel.Reader.TryPeek(out _);
    }

    /// <summary>
    /// Signal that execution is complete.
    /// </summary>
    public void Complete()
    {
        _outputChannel.Writer.TryComplete();
    }

}
