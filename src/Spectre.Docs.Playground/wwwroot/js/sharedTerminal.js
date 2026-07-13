/**
 * Terminal UI for the Spectre.Console Playground.
 *
 * Renders program output with ghostty-web and feeds keyboard input to the
 * executor worker. All run-time I/O flows through SharedArrayBuffer ring
 * buffers owned by js/executor.js — no .NET interop is involved while user
 * code is executing, and the page's Blazor runtime stays single-threaded.
 */

import { Terminal, FitAddon, init } from '/lib/ghostty-web/ghostty-web.js';
import * as executor from './executor.js';

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

// Global state
let terminal = null;
let fitAddon = null;
let pollHandle = null;
let resizeObserver = null;
let containerElement = null;
let isTerminalFocused = false;
let isExecutionRunning = false;

// Streaming decoder so multi-byte UTF-8 sequences split across ring reads
// decode correctly.
const outputDecoder = new TextDecoder();

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
 * Run a compiled user assembly on the executor worker.
 * Called from C# (ExecutionService).
 */
export async function runOnExecutor(assemblyBytes, cols, rows) {
    await executor.run(assemblyBytes, cols, rows);
}

/**
 * Cancel the current execution (Stop button or Ctrl+C).
 */
export function cancelExecution() {
    executor.cancel();
}

/**
 * Reset execution I/O for a fresh run.
 */
export function resetExecution() {
    executor.resetIO();
}

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

    // Handle keyboard input - write directly to the executor's input ring
    terminal.onData(data => {
        // Handle Ctrl+C specially - request cancellation (pure JS, no .NET roundtrip)
        if (data === '\x03') {
            executor.cancel();
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
            executor.writeKeyPacket(keyInfo.key, keyInfo.char, keyInfo.shift, false, false);
        }
    });

    // Handle special keys
    terminal.onKey(e => {
        const domEvent = e.domEvent || {};
        const code = domEvent.code || '';

        const keyInfo = parseKeyEvent(code, e.key, domEvent);
        if (keyInfo) {
            executor.writeKeyPacket(keyInfo.key, keyInfo.char, keyInfo.shift, keyInfo.alt, keyInfo.ctrl);
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

    // Show a notice when a stuck run had to be hard-killed.
    executor.onHardKill(() => {
        writeTerminal('\r\n\x1b[33mExecution stopped.\x1b[0m\r\n');
    });

    // Start polling for output from the executor
    startOutputPoll();

    // Warm up the executor worker in the background so the first Run doesn't
    // pay the runtime download + boot cost.
    executor.ensureStarted().catch(err =>
        console.warn('[sharedTerminal] Executor prefetch failed (will retry on first run):', err?.message));

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
 * Start polling for output from the executor's ring buffer.
 */
function startOutputPoll() {
    const poll = () => {
        if (terminal) {
            const data = executor.readOutput();
            if (data.length > 0) {
                const text = outputDecoder.decode(data, { stream: true });
                // Normalize line endings
                const normalized = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
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
    executor.resetIO();
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
 * Write directly to the terminal (welcome animation, host-side messages).
 */
export function writeTerminal(text) {
    if (terminal) {
        // Normalize line endings for the terminal
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
 * Get the terminal buffer as plain text (debugging / end-to-end tests).
 */
export function getTerminalText() {
    if (!terminal) {
        return '';
    }
    terminal.selectAll();
    const text = terminal.getSelection();
    terminal.clearSelection?.();
    return text;
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
}

// Make functions available globally for C# JSImport
globalThis.sharedTerminal = {
    startTerminal,
    stopTerminal,
    clearTerminal,
    focusTerminal,
    writeTerminal,
    getTerminalSize,
    getTerminalText,
    setExecutionRunning,
    runOnExecutor,
    cancelExecution,
    resetExecution,
    dispose
};

export default {
    startTerminal,
    stopTerminal,
    clearTerminal,
    focusTerminal,
    writeTerminal,
    getTerminalSize,
    getTerminalText,
    setExecutionRunning,
    runOnExecutor,
    cancelExecution,
    resetExecution,
    dispose
};
