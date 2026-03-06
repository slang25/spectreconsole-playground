/**
 * WASM heap memory-based terminal I/O for Spectre.Console Playground.
 * Completely bypasses Blazor JS interop for terminal communication.
 *
 * Memory is allocated by C# from the WASM heap and shared with JS via pointers.
 */

import { Restty, parseGhosttyTheme } from '/lib/restty/restty.js';

// Constants matching C# SharedTerminalIO
const HEADER_SIZE = 12;
const READ_INDEX_OFFSET = 4;
const SIGNAL_OFFSET = 8;

// Global state
let outputPtr = 0;
let outputSize = 0;
let inputPtr = 0;
let inputSize = 0;
let restty = null;
let pollHandle = null;
let containerElement = null;
let terminalCols = 80;
let terminalRows = 24;

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
 * Set whether execution is currently running.
 * Called from C# when execution starts/stops.
 */
export function setExecutionRunning(_running) {
    // No-op: restty handles cursor rendering internally
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
 * Theme definition in Ghostty config format (One Dark Pro-like colors).
 */
const TERMINAL_THEME = parseGhosttyTheme(`
foreground = #abb2bf
background = #1e1e1e
cursor-color = #d4d4d4
cursor-text = #1e1e1e
palette = 0=#282c34
palette = 1=#e06c75
palette = 2=#98c379
palette = 3=#e5c07b
palette = 4=#61afef
palette = 5=#c678dd
palette = 6=#56b6c2
palette = 7=#abb2bf
palette = 8=#5c6370
palette = 9=#e06c75
palette = 10=#98c379
palette = 11=#e5c07b
palette = 12=#61afef
palette = 13=#c678dd
palette = 14=#56b6c2
palette = 15=#ffffff
`);

/**
 * Start the terminal in the specified container.
 */
export async function startTerminal(containerId) {
    containerElement = document.getElementById(containerId);
    if (!containerElement) {
        console.error('[sharedTerminal] Container not found:', containerId);
        return;
    }

    // Wait for terminal to report its first size (WASM + fonts loaded)
    let resolveReady;
    const readyPromise = new Promise(resolve => { resolveReady = resolve; });
    let readyResolved = false;

    // Create restty terminal instance
    restty = new Restty({
        root: containerElement,
        defaultContextMenu: false,
        shortcuts: false,
        paneStyles: {
            paneBackground: '#1e1e1e',
            splitBackground: '#1e1e1e',
            inactivePaneOpacity: 1,
            activePaneOpacity: 1,
        },
        appOptions: {
            fontSize: 24,
            fontPreset: 'none',
            fontSources: [
                {
                    type: 'url',
                    url: 'https://cdn.jsdelivr.net/gh/ryanoasis/nerd-fonts@v3.4.0/patched-fonts/JetBrainsMono/Ligatures/Regular/JetBrainsMonoNerdFont-Regular.ttf',
                    label: 'JetBrainsMono NF Regular',
                },
                {
                    type: 'url',
                    url: 'https://cdn.jsdelivr.net/gh/ryanoasis/nerd-fonts@v3.4.0/patched-fonts/JetBrainsMono/Ligatures/Bold/JetBrainsMonoNerdFont-Bold.ttf',
                    label: 'JetBrainsMono NF Bold',
                },
                {
                    type: 'url',
                    url: 'https://cdn.jsdelivr.net/gh/ryanoasis/nerd-fonts@v3.4.0/patched-fonts/JetBrainsMono/Ligatures/Italic/JetBrainsMonoNerdFont-Italic.ttf',
                    label: 'JetBrainsMono NF Italic',
                },
                {
                    type: 'url',
                    url: 'https://cdn.jsdelivr.net/gh/ryanoasis/nerd-fonts@v3.4.0/patched-fonts/JetBrainsMono/Ligatures/BoldItalic/JetBrainsMonoNerdFont-BoldItalic.ttf',
                    label: 'JetBrainsMono NF BoldItalic',
                },
                {
                    type: 'local',
                    matchers: ['jetbrains mono nerd font', 'jetbrainsmono nf'],
                    label: 'Local JetBrainsMono NF',
                },
            ],
            maxScrollbackBytes: 1000 * 200, // ~1000 lines
            callbacks: {
                onTermSize: (cols, rows) => {
                    terminalCols = cols;
                    terminalRows = rows;
                    if (!readyResolved) {
                        readyResolved = true;
                        resolveReady();
                    }
                },
            },
            beforeInput: ({ text, source }) => {
                if (source !== 'pty') {
                    handleUserInput(text);
                    return null; // Suppress restty's normal input processing
                }
                return text;
            },
        },
    });

    // Wait for terminal to be ready (WASM loaded, fonts parsed, size calculated)
    // with a timeout fallback so we don't block forever
    await Promise.race([
        readyPromise,
        new Promise(resolve => setTimeout(resolve, 5000)),
    ]);

    // Apply theme after WASM renderer is initialized so background color takes effect
    restty.applyTheme(TERMINAL_THEME, 'inline');

    // Force a size recalculation after everything is ready
    restty.updateSize(true);

    // Handle focus/blur events
    const activePane = restty.getActivePane();
    const imeInput = activePane?.imeInput;
    const frame = containerElement.closest('.terminal-frame');

    const updateFocusState = (focused) => {
        const target = frame || containerElement;
        if (focused) {
            target.classList.add('terminal-focused');
        } else {
            target.classList.remove('terminal-focused');
        }
    };

    if (imeInput) {
        imeInput.addEventListener('focus', () => updateFocusState(true));
        imeInput.addEventListener('blur', () => updateFocusState(false));
    }

    // Start polling for output from C#
    startOutputPoll();

    console.log('[sharedTerminal] Terminal started');
}

/**
 * Handle user keyboard input from restty's beforeInput hook.
 * Converts text/escape sequences to ConsoleKeyInfo and writes to input ring buffer.
 */
function handleUserInput(data) {
    // Handle Ctrl+C
    if (data === '\x03') {
        requestCancellation();
        return;
    }

    // Handle escape sequences (CSI and SS3)
    if (data.startsWith('\x1b')) {
        const keyInfo = parseEscapeSequence(data);
        if (keyInfo) {
            writeKeyInfo(keyInfo.key, keyInfo.char, keyInfo.shift, keyInfo.alt, keyInfo.ctrl);
        }
        return;
    }

    // Handle special single-char keys
    switch (data) {
        case '\r':
        case '\n':
            writeKeyInfo(ConsoleKey.Enter, 13, false, false, false);
            return;
        case '\b':
        case '\x7f':
            writeKeyInfo(ConsoleKey.Backspace, 8, false, false, false);
            return;
        case '\t':
            writeKeyInfo(ConsoleKey.Tab, 9, false, false, false);
            return;
        case ' ':
            writeKeyInfo(ConsoleKey.Spacebar, 32, false, false, false);
            return;
    }

    // Handle regular characters (could be multiple for paste)
    for (const char of data) {
        const keyInfo = parseCharToKeyInfo(char);
        writeKeyInfo(keyInfo.key, keyInfo.char, keyInfo.shift, false, false);
    }
}

/**
 * Parse an escape sequence to ConsoleKey info.
 * Handles CSI sequences (\x1b[...) and SS3 sequences (\x1bO...).
 */
function parseEscapeSequence(data) {
    // CSI sequences: \x1b[ optionally with params and modifier
    const csiMatch = data.match(/^\x1b\[(?:(\d+)(?:;(\d+))?)?([A-Z~])/);
    if (csiMatch) {
        const param1 = parseInt(csiMatch[1] || '1');
        const modifier = parseInt(csiMatch[2] || '1');
        const final = csiMatch[3];

        // Modifier encoding: value = 1 + (shift ? 1 : 0) + (alt ? 2 : 0) + (ctrl ? 4 : 0)
        const modBits = modifier - 1;
        const shift = !!(modBits & 1);
        const alt = !!(modBits & 2);
        const ctrl = !!(modBits & 4);

        switch (final) {
            case 'A': return { key: ConsoleKey.UpArrow, char: 0, shift, alt, ctrl };
            case 'B': return { key: ConsoleKey.DownArrow, char: 0, shift, alt, ctrl };
            case 'C': return { key: ConsoleKey.RightArrow, char: 0, shift, alt, ctrl };
            case 'D': return { key: ConsoleKey.LeftArrow, char: 0, shift, alt, ctrl };
            case 'H': return { key: ConsoleKey.Home, char: 0, shift, alt, ctrl };
            case 'F': return { key: ConsoleKey.End, char: 0, shift, alt, ctrl };
            case '~':
                switch (param1) {
                    case 1: return { key: ConsoleKey.Home, char: 0, shift, alt, ctrl };
                    case 2: return { key: ConsoleKey.Insert, char: 0, shift, alt, ctrl };
                    case 3: return { key: ConsoleKey.Delete, char: 0, shift, alt, ctrl };
                    case 4: return { key: ConsoleKey.End, char: 0, shift, alt, ctrl };
                    case 5: return { key: ConsoleKey.PageUp, char: 0, shift, alt, ctrl };
                    case 6: return { key: ConsoleKey.PageDown, char: 0, shift, alt, ctrl };
                }
        }
    }

    // SS3 sequences: \x1bO...
    const ss3Match = data.match(/^\x1bO([A-Z])/);
    if (ss3Match) {
        switch (ss3Match[1]) {
            case 'A': return { key: ConsoleKey.UpArrow, char: 0, shift: false, alt: false, ctrl: false };
            case 'B': return { key: ConsoleKey.DownArrow, char: 0, shift: false, alt: false, ctrl: false };
            case 'C': return { key: ConsoleKey.RightArrow, char: 0, shift: false, alt: false, ctrl: false };
            case 'D': return { key: ConsoleKey.LeftArrow, char: 0, shift: false, alt: false, ctrl: false };
            case 'H': return { key: ConsoleKey.Home, char: 0, shift: false, alt: false, ctrl: false };
            case 'F': return { key: ConsoleKey.End, char: 0, shift: false, alt: false, ctrl: false };
        }
    }

    return null;
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
        if (outputRing && restty) {
            const data = outputRing.readString();
            if (data.length > 0) {
                // Normalize line endings
                const normalized = data.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
                restty.sendInput(normalized, 'pty');
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
    if (restty) {
        restty.clearScreen();
        // Send VT reset sequence
        restty.sendInput('\x1bc', 'pty');
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
    if (restty) {
        restty.focus();
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
    if (restty) {
        // Normalize line endings
        const normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
        restty.sendInput(normalized, 'pty');
    }
}

/**
 * Get the terminal size.
 */
export function getTerminalSize() {
    return { cols: terminalCols, rows: terminalRows };
}

/**
 * Dispose resources.
 */
export function dispose() {
    stopTerminal();

    if (restty) {
        restty.destroy();
        restty = null;
    }

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
