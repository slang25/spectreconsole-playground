using System.Runtime.InteropServices;
using System.Runtime.InteropServices.JavaScript;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// Manages terminal I/O using WASM linear memory ring buffers.
/// This completely bypasses Blazor JS interop for terminal communication.
///
/// The buffers are allocated from the WASM heap (via Marshal.AllocHGlobal),
/// making them accessible from both C# and JS (via Module.HEAPU8).
/// </summary>
public sealed partial class SharedTerminalIO : IDisposable
{
    private readonly unsafe byte* _outputBufferPtr;
    private readonly unsafe byte* _inputBufferPtr;
    private readonly SharedRingBuffer _outputBuffer;
    private readonly SharedRingBuffer _inputBuffer;
    private readonly KeyInfoReader _keyReader;
    private readonly nint _outputHandle;
    private readonly nint _inputHandle;
    private bool _disposed;

    // Buffer sizes (including 12-byte header)
    public const int OutputBufferSize = 64 * 1024 + 12;  // 64KB for terminal output
    public const int InputBufferSize = 4 * 1024 + 12;    // 4KB for keyboard input

    private static SharedTerminalIO? _instance;
    private static bool _moduleLoaded;
    private CancellationTokenSource? _cancellationTokenSource;

    /// <summary>
    /// Get the singleton instance.
    /// </summary>
    public static SharedTerminalIO? Instance => _instance;

    /// <summary>
    /// Get a cancellation token that is cancelled when Cancel() is called or Ctrl+C is pressed.
    /// </summary>
    public CancellationToken CancellationToken => _cancellationTokenSource?.Token ?? CancellationToken.None;

    private unsafe SharedTerminalIO()
    {
        // Allocate from WASM heap - this memory is accessible from JS via Module.HEAPU8
        _outputHandle = Marshal.AllocHGlobal(OutputBufferSize);
        _inputHandle = Marshal.AllocHGlobal(InputBufferSize);

        _outputBufferPtr = (byte*)_outputHandle;
        _inputBufferPtr = (byte*)_inputHandle;

        // Zero out the memory
        new Span<byte>(_outputBufferPtr, OutputBufferSize).Clear();
        new Span<byte>(_inputBufferPtr, InputBufferSize).Clear();

        _outputBuffer = new SharedRingBuffer(_outputBufferPtr, OutputBufferSize);
        _inputBuffer = new SharedRingBuffer(_inputBufferPtr, InputBufferSize);
        _keyReader = new KeyInfoReader(_inputBuffer);

        // Register the buffer pointers with JS
        JSRegisterBuffers((int)_outputHandle, OutputBufferSize, (int)_inputHandle, InputBufferSize);

        // Create cancellation token source for this execution
        _cancellationTokenSource = new CancellationTokenSource();

        _instance = this;
    }

    /// <summary>
    /// Cancel the current execution.
    /// Can be called from the Stop button or when Ctrl+C is pressed.
    /// </summary>
    public void Cancel()
    {
        _cancellationTokenSource?.Cancel();

        // Write a special "cancel" key to the input buffer via JS to wake up any waiting ReadKey
        // We use JS because it writes to the shared memory in a way the background thread can see
        try
        {
            JSWriteCancelKey();
        }
        catch
        {
            // Ignore errors - cancellation token is already set
        }
    }

    /// <summary>
    /// Static method to cancel - called from JS when Ctrl+C is pressed.
    /// Must be async to work with threaded WASM (can't call sync C# from JS main thread).
    /// </summary>
    [JSExport]
    public static Task RequestCancellationAsync()
    {
        _instance?.Cancel();
        return Task.CompletedTask;
    }

    /// <summary>
    /// Create a new SharedTerminalIO instance.
    /// Must be called from the main thread with JS interop access.
    /// </summary>
    public static async Task<SharedTerminalIO> CreateAsync(CancellationToken cancellationToken = default)
    {
        // Load the JS module if not already loaded
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
    /// Write text to the terminal output buffer.
    /// Can be called from any thread - no JS interop required.
    /// </summary>
    public void WriteOutput(string text)
    {
        _outputBuffer.WriteString(text);
    }

    /// <summary>
    /// Write bytes to the terminal output buffer.
    /// </summary>
    public void WriteOutput(ReadOnlySpan<byte> data)
    {
        _outputBuffer.Write(data);
    }

    /// <summary>
    /// Check if a key is available.
    /// </summary>
    public bool IsKeyAvailable()
    {
        return _keyReader.IsKeyAvailable();
    }

    /// <summary>
    /// Read a key from the input buffer, blocking until available.
    /// Can be called from any thread - no JS interop required.
    /// </summary>
    public ConsoleKeyInfo ReadKey(CancellationToken cancellationToken = default)
    {
        return _keyReader.ReadKey(cancellationToken);
    }

    /// <summary>
    /// Try to read a key without blocking.
    /// </summary>
    public bool TryReadKey(out ConsoleKeyInfo keyInfo)
    {
        return _keyReader.TryReadKey(out keyInfo);
    }

    /// <summary>
    /// Reset both buffers and create a new cancellation token.
    /// </summary>
    public void Reset()
    {
        _outputBuffer.Reset();
        _inputBuffer.Reset();

        // Create a new cancellation token source for the next execution
        _cancellationTokenSource?.Dispose();
        _cancellationTokenSource = new CancellationTokenSource();
    }

    /// <summary>
    /// Start the JS terminal with the shared buffers.
    /// Must be called from main thread.
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

    // JS interop methods - these are the ONLY JS calls needed after initialization
    [JSImport("registerBuffers", "sharedTerminal")]
    private static partial void JSRegisterBuffers(int outputPtr, int outputSize, int inputPtr, int inputSize);

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

    [JSImport("writeCancelKey", "sharedTerminal")]
    private static partial void JSWriteCancelKey();

    public void Dispose()
    {
        if (_disposed)
            return;

        _disposed = true;

        StopTerminal();

        _cancellationTokenSource?.Dispose();
        _cancellationTokenSource = null;

        _outputBuffer.Dispose();
        _inputBuffer.Dispose();

        // Free the WASM heap memory
        Marshal.FreeHGlobal(_outputHandle);
        Marshal.FreeHGlobal(_inputHandle);

        if (_instance == this)
            _instance = null;
    }
}
