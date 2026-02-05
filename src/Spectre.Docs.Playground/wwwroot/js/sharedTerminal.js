/**
 * WASM heap memory-based terminal I/O for Spectre.Console Playground.
 * Completely bypasses Blazor JS interop for terminal communication.
 *
 * Memory is allocated by C# from the WASM heap and shared with JS via pointers.
 */

import { Terminal, FitAddon, init } from '/lib/ghostty-web/ghostty-web.js';

// Lazy initialization - don't block module loading with top-level await
// as this can cause deadlocks with Blazor WASM runtime
let initPromise = null;
let initError = null;
let initComplete = false;

/**
 * Initialize ghostty WASM lazily (on first terminal start).
 * This avoids blocking module import which can deadlock with Blazor WASM.
 */
async function ensureInitialized() {
    if (initComplete) {
        return !initError;
    }

    if (!initPromise) {
        initPromise = (async () => {
            try {
                console.log('[sharedTerminal] Initializing ghostty WASM...');
                const wasmInitPromise = init();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Ghostty WASM initialization timed out after 30 seconds')), 30000)
                );
                await Promise.race([wasmInitPromise, timeoutPromise]);
                console.log('[sharedTerminal] Ghostty WASM initialized successfully');
                initComplete = true;
                return true;
            } catch (err) {
                initError = err;
                initComplete = true;
                console.error('[sharedTerminal] Failed to initialize ghostty WASM:', err);
                return false;
            }
        })();
    }

    return initPromise;
}

// Constants matching C# SharedTerminalIO
const HEADER_SIZE = 12;
const WRITE_INDEX_OFFSET = 0;
const READ_INDEX_OFFSET = 4;
const SIGNAL_OFFSET = 8;

// Global state
let outputPtr = 0;
let outputSize = 0;
let inputPtr = 0;
let inputSize = 0;
let terminal = null;
let fitAddon = null;
let pollHandle = null;
let resizeObserver = null;
let containerElement = null;
let isTerminalFocused = false;
let isExecutionRunning = false;
/**
 * Request cancellation (called when Ctrl+C is pressed).
 * This calls the C# exported RequestCancellationAsync method.
 */
async function requestCancellation() {
    try {
        const runtime = globalThis.getDotnetRuntime(0);
        const { getAssemblyExports } = runtime;
        const exports = await getAssemblyExports("Spectre.Docs.Playground");
        if (exports?.Spectre?.Docs?.Playground?.Services?.SharedTerminalIO) {
            await exports.Spectre.Docs.Playground.Services.SharedTerminalIO.RequestCancellationAsync();
        }
    } catch {
        // Ignore errors - user can use Stop button as fallback
    }
}

/**
 * Update cursor blink state based on focus AND execution state.
 * Cursor only blinks when terminal is focused AND execution is running.
 */
function updateCursorBlink() {
    if (!terminal?.renderer?.setCursorBlink) return;
    const shouldBlink = isTerminalFocused && isExecutionRunning;
    terminal.renderer.setCursorBlink(shouldBlink);
}

/**
 * Set whether execution is currently running.
 * Called from C# when execution starts/stops.
 */
export function setExecutionRunning(running) {
    isExecutionRunning = running;
    updateCursorBlink();
}

/**
 * Get the WASM heap memory view.
 * This accesses the .NET WASM linear memory.
 */
function getHeap() {
    // In .NET WASM, the heap is exposed via Module.HEAPU8
    // The dotnet runtime exposes it differently
    if (typeof Module !== 'undefined' && Module.HEAPU8) {
        return Module.HEAPU8;
    }
    // For .NET 7+ with dotnet.js
    if (typeof getDotnetRuntime === 'function') {
        const runtime = getDotnetRuntime(0);
        if (runtime && runtime.Module && runtime.Module.HEAPU8) {
            return runtime.Module.HEAPU8;
        }
    }
    // Try globalThis
    if (globalThis.Module && globalThis.Module.HEAPU8) {
        return globalThis.Module.HEAPU8;
    }
    // Try dotnet object (newer .NET versions)
    if (typeof dotnet !== 'undefined') {
        // .NET 8+ exposes memory differently
        if (dotnet.instance && dotnet.instance.exports && dotnet.instance.exports.memory) {
            return new Uint8Array(dotnet.instance.exports.memory.buffer);
        }
    }
    // Try window.DOTNET
    if (window.DOTNET && window.DOTNET.runtime) {
        const mem = window.DOTNET.runtime.Module?.HEAPU8;
        if (mem) return mem;
    }
    console.error('[sharedTerminal] Cannot find WASM heap');
    return null;
}

/**
 * Ring buffer reader/writer using WASM heap memory.
 */
class HeapRingBuffer {
    constructor(ptr, size) {
        this.ptr = ptr;
        this.totalSize = size;
        this.dataSize = size - HEADER_SIZE;
    }

    getWriteIndex() {
        const heap = getHeap();
        if (!heap) return 0;
        // Read uint32 little-endian
        return heap[this.ptr] | (heap[this.ptr + 1] << 8) |
               (heap[this.ptr + 2] << 16) | (heap[this.ptr + 3] << 24);
    }

    getReadIndex() {
        const heap = getHeap();
        if (!heap) return 0;
        const offset = this.ptr + READ_INDEX_OFFSET;
        return heap[offset] | (heap[offset + 1] << 8) |
               (heap[offset + 2] << 16) | (heap[offset + 3] << 24);
    }

    setWriteIndex(value) {
        const heap = getHeap();
        if (!heap) return;
        heap[this.ptr] = value & 0xFF;
        heap[this.ptr + 1] = (value >> 8) & 0xFF;
        heap[this.ptr + 2] = (value >> 16) & 0xFF;
        heap[this.ptr + 3] = (value >> 24) & 0xFF;
    }

    setReadIndex(value) {
        const heap = getHeap();
        if (!heap) return;
        const offset = this.ptr + READ_INDEX_OFFSET;
        heap[offset] = value & 0xFF;
        heap[offset + 1] = (value >> 8) & 0xFF;
        heap[offset + 2] = (value >> 16) & 0xFF;
        heap[offset + 3] = (value >> 24) & 0xFF;
    }

    incrementSignal() {
        const heap = getHeap();
        if (!heap) return;
        const offset = this.ptr + SIGNAL_OFFSET;
        let value = heap[offset] | (heap[offset + 1] << 8) |
                    (heap[offset + 2] << 16) | (heap[offset + 3] << 24);
        value++;
        heap[offset] = value & 0xFF;
        heap[offset + 1] = (value >> 8) & 0xFF;
        heap[offset + 2] = (value >> 16) & 0xFF;
        heap[offset + 3] = (value >> 24) & 0xFF;
    }

    available() {
        const writeIdx = this.getWriteIndex();
        const readIdx = this.getReadIndex();
        if (writeIdx >= readIdx) {
            return writeIdx - readIdx;
        }
        return this.dataSize - readIdx + writeIdx;
    }

    freeSpace() {
        return this.dataSize - this.available() - 1;
    }

    write(data) {
        if (data.length > this.freeSpace()) {
            return false;
        }

        const heap = getHeap();
        if (!heap) return false;

        let writeIdx = this.getWriteIndex();
        const dataStart = this.ptr + HEADER_SIZE;

        for (let i = 0; i < data.length; i++) {
            heap[dataStart + writeIdx] = data[i];
            writeIdx = (writeIdx + 1) % this.dataSize;
        }

        this.setWriteIndex(writeIdx);
        this.incrementSignal();
        return true;
    }

    read(maxBytes) {
        const avail = this.available();
        if (avail === 0) {
            return new Uint8Array(0);
        }

        const heap = getHeap();
        if (!heap) return new Uint8Array(0);

        const toRead = Math.min(maxBytes, avail);
        const result = new Uint8Array(toRead);
        let readIdx = this.getReadIndex();
        const dataStart = this.ptr + HEADER_SIZE;

        for (let i = 0; i < toRead; i++) {
            result[i] = heap[dataStart + readIdx];
            readIdx = (readIdx + 1) % this.dataSize;
        }

        this.setReadIndex(readIdx);
        return result;
    }

    readString() {
        const data = this.read(this.available());
        if (data.length === 0) return '';
        const decoder = new TextDecoder();
        return decoder.decode(data);
    }

    reset() {
        this.setWriteIndex(0);
        this.setReadIndex(0);
        const heap = getHeap();
        if (heap) {
            const offset = this.ptr + SIGNAL_OFFSET;
            heap[offset] = 0;
            heap[offset + 1] = 0;
            heap[offset + 2] = 0;
            heap[offset + 3] = 0;
        }
    }
}

// Ring buffer instances
let outputRing = null;
let inputRing = null;

/**
 * ConsoleKey enum values (matching .NET ConsoleKey)
 */
const ConsoleKey = {
    None: 0,
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Escape: 27,
    Spacebar: 32,
    PageUp: 33,
    PageDown: 34,
    End: 35,
    Home: 36,
    LeftArrow: 37,
    UpArrow: 38,
    RightArrow: 39,
    DownArrow: 40,
    Insert: 45,
    Delete: 46,
    D0: 48, D1: 49, D2: 50, D3: 51, D4: 52,
    D5: 53, D6: 54, D7: 55, D8: 56, D9: 57,
    A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72,
    I: 73, J: 74, K: 75, L: 76, M: 77, N: 78, O: 79, P: 80,
    Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88,
    Y: 89, Z: 90,
    NoName: 0
};

/**
 * Register buffer pointers from C#.
 * Called by C# after allocating memory from the WASM heap.
 */
export function registerBuffers(outPtr, outSize, inPtr, inSize) {
    outputPtr = outPtr;
    outputSize = outSize;
    inputPtr = inPtr;
    inputSize = inSize;

    outputRing = new HeapRingBuffer(outputPtr, outputSize);
    inputRing = new HeapRingBuffer(inputPtr, inputSize);
}

/**
 * Start the terminal in the specified container.
 * This is now async to allow lazy initialization of ghostty WASM.
 */
export async function startTerminal(containerId) {
    // Lazy init ghostty WASM on first use
    const initSuccess = await ensureInitialized();
    if (!initSuccess) {
        console.error('[sharedTerminal] Cannot start terminal - initialization failed:', initError);
        return;
    }

    containerElement = document.getElementById(containerId);
    if (!containerElement) {
        console.error('[sharedTerminal] Container not found:', containerId);
        return;
    }

    // Create ghostty terminal
    terminal = new Terminal({
        cursorBlink: false,
        cursorStyle: 'block',
        cursorInactiveStyle: 'outline',
        fontSize: 18,
        fontFamily: '"JetBrainsMono NF", Monaco, Menlo, "Courier New", monospace',
        theme: {
            background: '#1e1e1e',
            foreground: '#abb2bf',
            cursor: '#d4d4d4',
            cursorAccent: '#1e1e1e',
            black: '#282c34',
            red: '#e06c75',
            green: '#98c379',
            yellow: '#e5c07b',
            blue: '#61afef',
            magenta: '#c678dd',
            cyan: '#56b6c2',
            white: '#abb2bf',
            brightBlack: '#5c6370',
            brightRed: '#e06c75',
            brightGreen: '#98c379',
            brightYellow: '#e5c07b',
            brightBlue: '#61afef',
            brightMagenta: '#c678dd',
            brightCyan: '#56b6c2',
            brightWhite: '#ffffff'
        },
        scrollback: 1000
    });

    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerElement);

    // Wait for JetBrainsMono NF font to load before measuring
    await document.fonts.load('14px "JetBrainsMono NF"');
    terminal.loadFonts();

    // Fit after a brief delay
    setTimeout(() => fitAddon.fit(), 100);

    // Handle resize
    const handleResize = () => {
        try {
            fitAddon.fit();
        } catch (e) {
            console.warn('[sharedTerminal] Resize fit error:', e);
        }
    };

    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerElement);
    window.addEventListener('resize', handleResize);

    // Handle keyboard input - write directly to SharedArrayBuffer
    terminal.onData(data => {
        // Handle Ctrl+C specially - request cancellation
        if (data === '\x03') {
            requestCancellation();
            return;
        }

        // Skip keys that are handled by onKey to avoid duplicates
        // This includes escape sequences, control characters, and space
        if (data.startsWith('\x1b') ||
            data === '\r' || data === '\n' ||
            data === '\b' || data === '\x7f' ||
            data === '\t' || data === ' ') {
            return;
        }

        // Write regular characters
        for (const char of data) {
            const keyInfo = parseCharToKeyInfo(char);
            writeKeyInfo(keyInfo.key, keyInfo.char, keyInfo.shift, false, false);
        }
    });

    // Handle special keys
    terminal.onKey(e => {
        const domEvent = e.domEvent || {};
        const code = domEvent.code || '';

        const keyInfo = parseKeyEvent(code, e.key, domEvent);
        if (keyInfo) {
            writeKeyInfo(keyInfo.key, keyInfo.char, keyInfo.shift, keyInfo.alt, keyInfo.ctrl);
        }
    });

    // Handle focus/blur events for terminal styling
    const frame = containerElement.closest('.terminal-frame');
    const updateFocusState = (focused) => {
        isTerminalFocused = focused;
        const target = frame || containerElement;
        if (focused) {
            target.classList.add('terminal-focused');
        } else {
            target.classList.remove('terminal-focused');
        }
        // Cursor blinks only when terminal is focused AND execution is running
        updateCursorBlink();
    };

    // Listen for focus events on the terminal's textarea
    if (terminal.textarea) {
        terminal.textarea.addEventListener('focus', () => updateFocusState(true));
        terminal.textarea.addEventListener('blur', () => updateFocusState(false));
    }

    // The container is contenteditable which steals focus from the textarea.
    // When container gets focus, redirect it to the textarea.
    containerElement.addEventListener('focusin', (e) => {
        if (e.target === containerElement && terminal.textarea) {
            terminal.textarea.focus();
        }
    });

    // Start polling for output from C#
    startOutputPoll();

    console.log('[sharedTerminal] Terminal started');
}

/**
 * Parse a character to ConsoleKey info
 */
function parseCharToKeyInfo(char) {
    const code = char.charCodeAt(0);

    if (char >= 'a' && char <= 'z') {
        return { key: ConsoleKey.A + (code - 97), char: code, shift: false };
    }
    if (char >= 'A' && char <= 'Z') {
        return { key: ConsoleKey.A + (code - 65), char: code, shift: true };
    }
    if (char >= '0' && char <= '9') {
        return { key: ConsoleKey.D0 + (code - 48), char: code, shift: false };
    }
    if (char === ' ') {
        return { key: ConsoleKey.Spacebar, char: 32, shift: false };
    }

    // For other characters, use NoName
    return { key: ConsoleKey.NoName, char: code, shift: false };
}

/**
 * Parse a key event to ConsoleKey info
 */
function parseKeyEvent(code, key, domEvent) {
    const shift = domEvent.shiftKey || false;
    const alt = domEvent.altKey || false;
    const ctrl = domEvent.ctrlKey || false;

    // By DOM code
    switch (code) {
        case 'ArrowUp': return { key: ConsoleKey.UpArrow, char: 0, shift, alt, ctrl };
        case 'ArrowDown': return { key: ConsoleKey.DownArrow, char: 0, shift, alt, ctrl };
        case 'ArrowLeft': return { key: ConsoleKey.LeftArrow, char: 0, shift, alt, ctrl };
        case 'ArrowRight': return { key: ConsoleKey.RightArrow, char: 0, shift, alt, ctrl };
        case 'Home': return { key: ConsoleKey.Home, char: 0, shift, alt, ctrl };
        case 'End': return { key: ConsoleKey.End, char: 0, shift, alt, ctrl };
        case 'PageUp': return { key: ConsoleKey.PageUp, char: 0, shift, alt, ctrl };
        case 'PageDown': return { key: ConsoleKey.PageDown, char: 0, shift, alt, ctrl };
        case 'Delete': return { key: ConsoleKey.Delete, char: 0, shift, alt, ctrl };
        case 'Insert': return { key: ConsoleKey.Insert, char: 0, shift, alt, ctrl };
        case 'Backspace': return { key: ConsoleKey.Backspace, char: 8, shift, alt, ctrl };
        case 'Enter':
        case 'NumpadEnter': return { key: ConsoleKey.Enter, char: 13, shift, alt, ctrl };
        case 'Tab': return { key: ConsoleKey.Tab, char: 9, shift, alt, ctrl };
        case 'Escape': return { key: ConsoleKey.Escape, char: 27, shift, alt, ctrl };
        case 'Space': return { key: ConsoleKey.Spacebar, char: 32, shift, alt, ctrl };
    }

    // By escape sequence
    switch (key) {
        case '\x1b[A':
        case '\x1bOA': return { key: ConsoleKey.UpArrow, char: 0, shift, alt, ctrl };
        case '\x1b[B':
        case '\x1bOB': return { key: ConsoleKey.DownArrow, char: 0, shift, alt, ctrl };
        case '\x1b[C':
        case '\x1bOC': return { key: ConsoleKey.RightArrow, char: 0, shift, alt, ctrl };
        case '\x1b[D':
        case '\x1bOD': return { key: ConsoleKey.LeftArrow, char: 0, shift, alt, ctrl };
        case '\x1b[H':
        case '\x1bOH':
        case '\x1b[1~': return { key: ConsoleKey.Home, char: 0, shift, alt, ctrl };
        case '\x1b[F':
        case '\x1bOF':
        case '\x1b[4~': return { key: ConsoleKey.End, char: 0, shift, alt, ctrl };
        case '\x1b[5~': return { key: ConsoleKey.PageUp, char: 0, shift, alt, ctrl };
        case '\x1b[6~': return { key: ConsoleKey.PageDown, char: 0, shift, alt, ctrl };
        case '\x1b[3~': return { key: ConsoleKey.Delete, char: 0, shift, alt, ctrl };
        case '\x1b[2~': return { key: ConsoleKey.Insert, char: 0, shift, alt, ctrl };
        case '\x7f':
        case '\b': return { key: ConsoleKey.Backspace, char: 8, shift, alt, ctrl };
        case '\r':
        case '\n': return { key: ConsoleKey.Enter, char: 13, shift, alt, ctrl };
        case '\t': return { key: ConsoleKey.Tab, char: 9, shift, alt, ctrl };
    }

    return null;
}

/**
 * Write a ConsoleKeyInfo to the input buffer.
 * Format: [keyCode: u8, keyChar: u16 (LE), modifiers: u8]
 */
function writeKeyInfo(keyCode, keyChar, shift, alt, ctrl) {
    if (!inputRing) {
        return;
    }

    const data = new Uint8Array(4);
    data[0] = keyCode & 0xFF;
    data[1] = keyChar & 0xFF;
    data[2] = (keyChar >> 8) & 0xFF;
    data[3] = (shift ? 1 : 0) | (alt ? 2 : 0) | (ctrl ? 4 : 0);

    inputRing.write(data);
}

/**
 * Start polling for output from C# ring buffer.
 */
function startOutputPoll() {
    const poll = () => {
        if (outputRing && terminal) {
            const data = outputRing.readString();
            if (data.length > 0) {
                // Normalize line endings
                const normalized = data.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
                terminal.write(normalized);
            }
        }
        pollHandle = requestAnimationFrame(poll);
    };

    poll();
}

/**
 * Stop the terminal.
 */
export function stopTerminal() {
    if (pollHandle) {
        cancelAnimationFrame(pollHandle);
        pollHandle = null;
    }
}

/**
 * Clear the terminal.
 */
export function clearTerminal() {
    if (terminal) {
        terminal.clear();
        terminal.reset();
    }
    if (outputRing) {
        outputRing.reset();
    }
    if (inputRing) {
        inputRing.reset();
    }
}

/**
 * Focus the terminal.
 */
export function focusTerminal() {
    if (terminal) {
        terminal.focus();
    }
}

/**
 * Write a cancel key packet to the input buffer.
 * This wakes up any ReadKey waiting on the C# side.
 */
export function writeCancelKey() {
    if (!inputRing) return;
    // Special cancel key packet: [keyCode=0, keyChar=0x03 (ETX), modifiers=0xFF]
    const cancelPacket = new Uint8Array([0, 0x03, 0x00, 0xFF]);
    inputRing.write(cancelPacket);
}

/**
 * Write directly to the terminal (for welcome animation before SharedTerminalIO is ready).
 */
export function writeTerminal(text) {
    if (terminal) {
        // Normalize line endings for xterm
        const normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
        terminal.write(normalized);
    }
}

/**
 * Get the terminal size.
 */
export function getTerminalSize() {
    if (terminal) {
        return { cols: terminal.cols, rows: terminal.rows };
    }
    return { cols: 80, rows: 24 };
}

/**
 * Dispose resources.
 */
export function dispose() {
    stopTerminal();

    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

    if (terminal) {
        terminal.dispose();
        terminal = null;
    }

    outputBuffer = null;
    inputBuffer = null;
    outputRing = null;
    inputRing = null;
}

// Make functions available globally for C# JSImport
globalThis.sharedTerminal = {
    registerBuffers,
    startTerminal,
    stopTerminal,
    clearTerminal,
    focusTerminal,
    writeTerminal,
    getTerminalSize,
    writeCancelKey,
    setExecutionRunning,
    dispose
};

export default {
    registerBuffers,
    startTerminal,
    stopTerminal,
    clearTerminal,
    focusTerminal,
    writeTerminal,
    getTerminalSize,
    writeCancelKey,
    setExecutionRunning,
    dispose
};
