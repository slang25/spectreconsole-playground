using System.Runtime.Versioning;

namespace Spectre.Docs.Playground.Executor;

/// <summary>
/// Terminal bridge backed by SharedArrayBuffer ring buffers via worker-local JS.
/// Output writes are synchronous same-thread JS calls; blocking key reads use
/// Atomics.wait, which is legal on a worker thread and consumes no CPU.
/// </summary>
[SupportedOSPlatform("browser")]
public class WorkerTerminalBridge : ITerminalBridge
{
    private volatile bool _isComplete;

    public void WriteOutput(string text)
    {
        if (_isComplete)
        {
            return;
        }

        ThrowIfCancelled();
        ExecutorHost.WriteOutput(text);
    }

    public void WriteClear()
    {
        if (_isComplete)
        {
            return;
        }

        ThrowIfCancelled();
        ExecutorHost.WriteOutput("\x1b[2J\x1b[H");
    }

    public ConsoleKeyInfo ReadKey()
    {
        var packed = ExecutorHost.ReadKeyBlocking();
        return Unpack(packed);
    }

    public ValueTask<ConsoleKeyInfo> ReadKeyAsync(CancellationToken cancellationToken = default)
    {
        // Complete synchronously via the blocking read. Spectre's sync prompt APIs
        // block on ShowAsync internally; a truly-yielding read would deadlock the
        // single thread, whereas blocking the worker in Atomics.wait is free.
        cancellationToken.ThrowIfCancellationRequested();
        return new ValueTask<ConsoleKeyInfo>(ReadKey());
    }

    public bool IsInputAvailable()
    {
        return ExecutorHost.IsInputAvailable();
    }

    public void Complete()
    {
        _isComplete = true;
    }

    private static void ThrowIfCancelled()
    {
        if (ExecutorHost.IsCancelled())
        {
            throw new OperationCanceledException();
        }
    }

    private static ConsoleKeyInfo Unpack(int packed)
    {
        if (packed < 0)
        {
            throw new OperationCanceledException();
        }

        var keyCode = (ConsoleKey)(packed & 0xFF);
        var keyChar = (char)((packed >> 8) & 0xFFFF);
        var modifiers = (packed >> 24) & 0xFF;

        return new ConsoleKeyInfo(
            keyChar,
            keyCode,
            shift: (modifiers & 1) != 0,
            alt: (modifiers & 2) != 0,
            control: (modifiers & 4) != 0);
    }
}
