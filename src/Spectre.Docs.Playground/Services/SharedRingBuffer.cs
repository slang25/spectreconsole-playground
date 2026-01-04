using System.Runtime.InteropServices;
using System.Runtime.InteropServices.JavaScript;
using System.Text;

namespace Spectre.Docs.Playground.Services;

/// <summary>
/// A lock-free ring buffer backed by SharedArrayBuffer for communication between C# and JS.
/// Completely bypasses Blazor JS interop for terminal I/O.
///
/// Memory Layout:
/// - Offset 0-3:   Write index (Uint32)
/// - Offset 4-7:   Read index (Uint32)
/// - Offset 8-11:  Signal counter (Int32) - for Atomics.notify/wait
/// - Offset 12+:   Data buffer
/// </summary>
public unsafe class SharedRingBuffer : IDisposable
{
    private const int HeaderSize = 12;
    private const int WriteIndexOffset = 0;
    private const int ReadIndexOffset = 4;
    private const int SignalOffset = 8;

    private readonly byte* _bufferPtr;
    private readonly int _dataSize;
    private readonly int _totalSize;
    private readonly bool _ownsMemory;
    private bool _disposed;

    // For non-pointer access (safer but slightly slower)
    private readonly uint* _writeIndexPtr;
    private readonly uint* _readIndexPtr;
    private readonly int* _signalPtr;
    private readonly byte* _dataPtr;

    /// <summary>
    /// Create a ring buffer wrapping existing memory (from SharedArrayBuffer).
    /// </summary>
    /// <param name="bufferPtr">Pointer to the SharedArrayBuffer memory</param>
    /// <param name="totalSize">Total size including header</param>
    public SharedRingBuffer(byte* bufferPtr, int totalSize)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(totalSize, HeaderSize + 1);

        _bufferPtr = bufferPtr;
        _totalSize = totalSize;
        _dataSize = totalSize - HeaderSize;
        _ownsMemory = false;

        _writeIndexPtr = (uint*)(bufferPtr + WriteIndexOffset);
        _readIndexPtr = (uint*)(bufferPtr + ReadIndexOffset);
        _signalPtr = (int*)(bufferPtr + SignalOffset);
        _dataPtr = bufferPtr + HeaderSize;
    }

    /// <summary>
    /// Data portion size (excluding header).
    /// </summary>
    public int DataSize => _dataSize;

    /// <summary>
    /// Total buffer size including header.
    /// </summary>
    public int TotalSize => _totalSize;

    /// <summary>
    /// Get the current write index using atomic load.
    /// </summary>
    public uint GetWriteIndex()
    {
        return Interlocked.CompareExchange(ref *_writeIndexPtr, 0, 0);
    }

    /// <summary>
    /// Get the current read index using atomic load.
    /// </summary>
    public uint GetReadIndex()
    {
        return Interlocked.CompareExchange(ref *_readIndexPtr, 0, 0);
    }

    /// <summary>
    /// Get the number of bytes available to read.
    /// </summary>
    public int Available()
    {
        var writeIdx = GetWriteIndex();
        var readIdx = GetReadIndex();

        if (writeIdx >= readIdx)
            return (int)(writeIdx - readIdx);

        return _dataSize - (int)readIdx + (int)writeIdx;
    }

    /// <summary>
    /// Get the free space available for writing.
    /// </summary>
    public int FreeSpace()
    {
        return _dataSize - Available() - 1; // -1 to distinguish full from empty
    }

    /// <summary>
    /// Write data to the buffer.
    /// </summary>
    /// <param name="data">Data to write</param>
    /// <returns>True if write succeeded, false if buffer full</returns>
    public bool Write(ReadOnlySpan<byte> data)
    {
        if (data.Length > FreeSpace())
            return false;

        var writeIdx = GetWriteIndex();

        for (var i = 0; i < data.Length; i++)
        {
            _dataPtr[writeIdx] = data[i];
            writeIdx = (uint)((writeIdx + 1) % _dataSize);
        }

        // Update write index atomically
        Interlocked.Exchange(ref *_writeIndexPtr, writeIdx);

        // Signal that data is available
        Interlocked.Increment(ref *_signalPtr);

        return true;
    }

    /// <summary>
    /// Write a string as UTF-8 to the buffer.
    /// </summary>
    public bool WriteString(string str)
    {
        var bytes = Encoding.UTF8.GetBytes(str);
        return Write(bytes);
    }

    /// <summary>
    /// Write a length-prefixed string (for structured messages).
    /// </summary>
    public bool WriteLengthPrefixedString(string str)
    {
        var bytes = Encoding.UTF8.GetBytes(str);
        var lengthBytes = BitConverter.GetBytes(bytes.Length);

        if (bytes.Length + 4 > FreeSpace())
            return false;

        Write(lengthBytes);
        return Write(bytes);
    }

    /// <summary>
    /// Read data from the buffer.
    /// </summary>
    /// <param name="maxBytes">Maximum bytes to read</param>
    /// <returns>Data read (may be empty if nothing available)</returns>
    public byte[] Read(int maxBytes)
    {
        var avail = Available();
        if (avail == 0)
            return Array.Empty<byte>();

        var toRead = Math.Min(maxBytes, avail);
        var result = new byte[toRead];
        var readIdx = GetReadIndex();

        for (var i = 0; i < toRead; i++)
        {
            result[i] = _dataPtr[readIdx];
            readIdx = (uint)((readIdx + 1) % _dataSize);
        }

        // Update read index atomically
        Interlocked.Exchange(ref *_readIndexPtr, readIdx);

        return result;
    }

    /// <summary>
    /// Read all available data as a UTF-8 string.
    /// </summary>
    public string ReadString()
    {
        var data = Read(Available());
        if (data.Length == 0)
            return string.Empty;
        return Encoding.UTF8.GetString(data);
    }

    /// <summary>
    /// Read a single byte if available.
    /// </summary>
    /// <param name="value">The byte read</param>
    /// <returns>True if a byte was read</returns>
    public bool TryReadByte(out byte value)
    {
        if (Available() == 0)
        {
            value = 0;
            return false;
        }

        var readIdx = GetReadIndex();
        value = _dataPtr[readIdx];
        readIdx = (uint)((readIdx + 1) % _dataSize);
        Interlocked.Exchange(ref *_readIndexPtr, readIdx);
        return true;
    }

    /// <summary>
    /// Read exactly the specified number of bytes, blocking if necessary.
    /// </summary>
    public byte[] ReadExact(int count, CancellationToken cancellationToken = default)
    {
        var result = new byte[count];
        var offset = 0;

        while (offset < count)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (Available() > 0)
            {
                var chunk = Read(count - offset);
                Array.Copy(chunk, 0, result, offset, chunk.Length);
                offset += chunk.Length;
            }
            else
            {
                // Sleep to yield the thread properly
                Thread.Sleep(1);
            }
        }

        return result;
    }

    /// <summary>
    /// Wait for data to become available.
    /// </summary>
    /// <param name="timeout">Timeout (-1 for infinite)</param>
    /// <returns>True if data is available</returns>
    public bool WaitForData(int timeoutMs = -1)
    {
        if (Available() > 0)
            return true;

        var spinWait = new SpinWait();
        var startTime = Environment.TickCount64;

        while (true)
        {
            if (Available() > 0)
                return true;

            if (timeoutMs >= 0)
            {
                var elapsed = Environment.TickCount64 - startTime;
                if (elapsed >= timeoutMs)
                    return false;
            }

            spinWait.SpinOnce();
        }
    }

    /// <summary>
    /// Reset the buffer (clear all data).
    /// </summary>
    public void Reset()
    {
        Interlocked.Exchange(ref *_writeIndexPtr, 0);
        Interlocked.Exchange(ref *_readIndexPtr, 0);
        Interlocked.Exchange(ref *_signalPtr, 0);
    }

    public void Dispose()
    {
        if (_disposed)
            return;

        _disposed = true;

        // Note: We don't free the memory here as it's owned by JS
        // The SharedArrayBuffer will be garbage collected when JS releases it
    }
}

/// <summary>
/// ConsoleKeyInfo reader for the input ring buffer.
/// Format: [keyCode: u8, keyChar: u16 (LE), modifiers: u8]
/// </summary>
public unsafe class KeyInfoReader
{
    private readonly SharedRingBuffer _buffer;

    public KeyInfoReader(SharedRingBuffer buffer)
    {
        _buffer = buffer;
    }

    /// <summary>
    /// Check if a key is available without blocking.
    /// </summary>
    public bool IsKeyAvailable()
    {
        return _buffer.Available() >= 4;
    }

    /// <summary>
    /// Read a ConsoleKeyInfo, blocking until available.
    /// </summary>
    public ConsoleKeyInfo ReadKey(CancellationToken cancellationToken = default)
    {
        // Wait for 4 bytes (key info packet)
        while (_buffer.Available() < 4)
        {
            cancellationToken.ThrowIfCancellationRequested();
            Thread.Sleep(10);
        }

        var data = _buffer.Read(4);

        // Check for special cancel key packet: [keyCode=0, keyChar=0x03, modifiers=0xFF]
        if (data[0] == 0 && data[1] == 0x03 && data[2] == 0x00 && data[3] == 0xFF)
        {
            throw new OperationCanceledException(cancellationToken);
        }

        var keyCode = (ConsoleKey)data[0];
        var keyChar = (char)(data[1] | (data[2] << 8));
        var modifiers = data[3];

        var shift = (modifiers & 1) != 0;
        var alt = (modifiers & 2) != 0;
        var ctrl = (modifiers & 4) != 0;

        return new ConsoleKeyInfo(keyChar, keyCode, shift, alt, ctrl);
    }

    /// <summary>
    /// Try to read a key without blocking.
    /// Throws OperationCanceledException if cancel packet is read.
    /// </summary>
    public bool TryReadKey(out ConsoleKeyInfo keyInfo)
    {
        if (_buffer.Available() < 4)
        {
            keyInfo = default;
            return false;
        }

        var data = _buffer.Read(4);

        // Check for special cancel key packet: [keyCode=0, keyChar=0x03, modifiers=0xFF]
        if (data[0] == 0 && data[1] == 0x03 && data[2] == 0x00 && data[3] == 0xFF)
        {
            throw new OperationCanceledException();
        }

        var keyCode = (ConsoleKey)data[0];
        var keyChar = (char)(data[1] | (data[2] << 8));
        var modifiers = data[3];

        var shift = (modifiers & 1) != 0;
        var alt = (modifiers & 2) != 0;
        var ctrl = (modifiers & 4) != 0;

        keyInfo = new ConsoleKeyInfo(keyChar, keyCode, shift, alt, ctrl);
        return true;
    }
}
