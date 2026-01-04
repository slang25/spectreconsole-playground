/**
 * SharedArrayBuffer-based ring buffer for lock-free communication between C# and JS.
 * Completely bypasses Blazor JS interop for terminal I/O.
 *
 * Memory Layout:
 * - Offset 0-3:   Write index (Uint32)
 * - Offset 4-7:   Read index (Uint32)
 * - Offset 8-11:  Signal counter (Int32) - for Atomics.notify/wait
 * - Offset 12+:   Data buffer
 */

const HEADER_SIZE = 12;
const WRITE_INDEX_OFFSET = 0;
const READ_INDEX_OFFSET = 4;
const SIGNAL_OFFSET = 8;

export class RingBuffer {
    /**
     * @param {SharedArrayBuffer} buffer - The shared buffer
     * @param {number} dataSize - Size of the data portion (buffer.byteLength - HEADER_SIZE)
     */
    constructor(buffer) {
        this.buffer = buffer;
        this.dataSize = buffer.byteLength - HEADER_SIZE;
        this.uint32View = new Uint32Array(buffer, 0, 3);
        this.int32View = new Int32Array(buffer, 0, 3);
        this.dataView = new Uint8Array(buffer, HEADER_SIZE);
    }

    /**
     * Get the current write index
     */
    getWriteIndex() {
        return Atomics.load(this.uint32View, WRITE_INDEX_OFFSET / 4);
    }

    /**
     * Get the current read index
     */
    getReadIndex() {
        return Atomics.load(this.uint32View, READ_INDEX_OFFSET / 4);
    }

    /**
     * Get available bytes to read
     */
    available() {
        const writeIdx = this.getWriteIndex();
        const readIdx = this.getReadIndex();
        if (writeIdx >= readIdx) {
            return writeIdx - readIdx;
        }
        return this.dataSize - readIdx + writeIdx;
    }

    /**
     * Get free space for writing
     */
    freeSpace() {
        return this.dataSize - this.available() - 1; // -1 to distinguish full from empty
    }

    /**
     * Write data to the buffer (for JS -> C# communication, e.g., keyboard input)
     * @param {Uint8Array} data - Data to write
     * @returns {boolean} - True if write succeeded, false if buffer full
     */
    write(data) {
        if (data.length > this.freeSpace()) {
            return false; // Buffer full
        }

        let writeIdx = this.getWriteIndex();

        for (let i = 0; i < data.length; i++) {
            this.dataView[writeIdx] = data[i];
            writeIdx = (writeIdx + 1) % this.dataSize;
        }

        // Update write index atomically
        Atomics.store(this.uint32View, WRITE_INDEX_OFFSET / 4, writeIdx);

        // Signal that data is available
        Atomics.add(this.int32View, SIGNAL_OFFSET / 4, 1);
        Atomics.notify(this.int32View, SIGNAL_OFFSET / 4);

        return true;
    }

    /**
     * Write a string as UTF-8 to the buffer
     * @param {string} str - String to write
     * @returns {boolean} - True if write succeeded
     */
    writeString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);

        // Write length prefix (4 bytes, little-endian)
        const lengthBytes = new Uint8Array(4);
        const lengthView = new DataView(lengthBytes.buffer);
        lengthView.setUint32(0, data.length, true);

        if (data.length + 4 > this.freeSpace()) {
            return false;
        }

        // Write length then data
        this.write(lengthBytes);
        return this.write(data);
    }

    /**
     * Read data from the buffer (for JS reading C# output)
     * @param {number} maxBytes - Maximum bytes to read
     * @returns {Uint8Array} - Data read (may be empty if nothing available)
     */
    read(maxBytes) {
        const avail = this.available();
        if (avail === 0) {
            return new Uint8Array(0);
        }

        const toRead = Math.min(maxBytes, avail);
        const result = new Uint8Array(toRead);
        let readIdx = this.getReadIndex();

        for (let i = 0; i < toRead; i++) {
            result[i] = this.dataView[readIdx];
            readIdx = (readIdx + 1) % this.dataSize;
        }

        // Update read index atomically
        Atomics.store(this.uint32View, READ_INDEX_OFFSET / 4, readIdx);

        return result;
    }

    /**
     * Read all available data as a UTF-8 string
     * @returns {string} - Decoded string
     */
    readString() {
        const data = this.read(this.available());
        if (data.length === 0) return '';
        const decoder = new TextDecoder();
        return decoder.decode(data);
    }

    /**
     * Read a length-prefixed string (for reading from C#)
     * @returns {string|null} - String if complete message available, null otherwise
     */
    readLengthPrefixedString() {
        if (this.available() < 4) return null;

        // Peek at length without consuming
        let readIdx = this.getReadIndex();
        const lengthBytes = new Uint8Array(4);
        for (let i = 0; i < 4; i++) {
            lengthBytes[i] = this.dataView[(readIdx + i) % this.dataSize];
        }
        const lengthView = new DataView(lengthBytes.buffer);
        const length = lengthView.getUint32(0, true);

        if (this.available() < 4 + length) return null;

        // Consume length
        this.read(4);

        // Read string data
        const data = this.read(length);
        const decoder = new TextDecoder();
        return decoder.decode(data);
    }

    /**
     * Wait for data to become available (blocking - use in worker only)
     * @param {number} timeoutMs - Timeout in milliseconds (-1 for infinite)
     * @returns {string} - 'ok', 'timed-out', or 'not-equal'
     */
    waitForData(timeoutMs = -1) {
        const currentSignal = Atomics.load(this.int32View, SIGNAL_OFFSET / 4);
        if (this.available() > 0) {
            return 'ok';
        }
        const result = Atomics.wait(this.int32View, SIGNAL_OFFSET / 4, currentSignal, timeoutMs);
        return result;
    }

    /**
     * Reset the buffer (clear all data)
     */
    reset() {
        Atomics.store(this.uint32View, WRITE_INDEX_OFFSET / 4, 0);
        Atomics.store(this.uint32View, READ_INDEX_OFFSET / 4, 0);
        Atomics.store(this.int32View, SIGNAL_OFFSET / 4, 0);
    }
}

/**
 * Create a SharedArrayBuffer for a ring buffer
 * @param {number} dataSize - Size of the data portion
 * @returns {SharedArrayBuffer}
 */
export function createRingBuffer(dataSize) {
    const buffer = new SharedArrayBuffer(HEADER_SIZE + dataSize);
    return buffer;
}

/**
 * Terminal I/O manager using SharedArrayBuffer ring buffers.
 * Handles bidirectional communication between JS terminal and C# Spectre.Console.
 */
export class TerminalIO {
    constructor(outputBufferSize = 64 * 1024, inputBufferSize = 4 * 1024) {
        // Output: C# writes, JS reads (for terminal display)
        this.outputBuffer = createRingBuffer(outputBufferSize);
        this.outputRing = new RingBuffer(this.outputBuffer);

        // Input: JS writes, C# reads (for keyboard input)
        this.inputBuffer = createRingBuffer(inputBufferSize);
        this.inputRing = new RingBuffer(this.inputBuffer);

        this._pollHandle = null;
        this._onOutput = null;
    }

    /**
     * Get the SharedArrayBuffers to pass to C#
     */
    getBuffers() {
        return {
            outputBuffer: this.outputBuffer,
            inputBuffer: this.inputBuffer
        };
    }

    /**
     * Start polling for output from C# and call the callback
     * @param {function(string)} onOutput - Callback for output data
     * @param {number} pollIntervalMs - Poll interval in milliseconds
     */
    startOutputPoll(onOutput, pollIntervalMs = 16) {
        this._onOutput = onOutput;

        const poll = () => {
            const data = this.outputRing.readString();
            if (data.length > 0 && this._onOutput) {
                this._onOutput(data);
            }
            this._pollHandle = setTimeout(poll, pollIntervalMs);
        };

        poll();
    }

    /**
     * Stop polling for output
     */
    stopOutputPoll() {
        if (this._pollHandle) {
            clearTimeout(this._pollHandle);
            this._pollHandle = null;
        }
    }

    /**
     * Write keyboard input to be read by C#
     * @param {string} data - Key data (could be character or escape sequence)
     */
    writeInput(data) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        this.inputRing.write(bytes);
    }

    /**
     * Write a ConsoleKeyInfo-like structure to input buffer
     * Format: [keyCode: u8, keyChar: u16 (LE), modifiers: u8]
     * modifiers: bit 0 = shift, bit 1 = alt, bit 2 = ctrl
     */
    writeKeyInfo(keyCode, keyChar, shift, alt, ctrl) {
        const data = new Uint8Array(4);
        data[0] = keyCode;
        data[1] = keyChar & 0xFF;
        data[2] = (keyChar >> 8) & 0xFF;
        data[3] = (shift ? 1 : 0) | (alt ? 2 : 0) | (ctrl ? 4 : 0);
        this.inputRing.write(data);
    }

    /**
     * Reset both buffers
     */
    reset() {
        this.outputRing.reset();
        this.inputRing.reset();
    }

    /**
     * Dispose resources
     */
    dispose() {
        this.stopOutputPoll();
    }
}

// Export for use as ES module
export default { RingBuffer, createRingBuffer, TerminalIO };
