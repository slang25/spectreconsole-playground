import { Terminal, FitAddon, init } from '/lib/ghostty-web/ghostty-web.js';

// Initialize ghostty WASM
await init();

window.terminalInterop = {
    terminals: new Map(),

    _createInputProcessor: function(dotNetRef) {
        const queue = [];
        let processing = false;

        async function processQueue() {
            if (processing || queue.length === 0) return;
            processing = true;

            while (queue.length > 0) {
                const item = queue.shift();
                try {
                    if (item.type === 'input') {
                        await dotNetRef.invokeMethodAsync('OnTerminalInput', item.data);
                    } else if (item.type === 'key') {
                        await dotNetRef.invokeMethodAsync('OnTerminalKey', item.data);
                    }
                } catch (e) {
                    console.warn('Input processing error:', e.message);
                }
            }

            processing = false;
        }

        return {
            enqueueInput: function(data) {
                queue.push({ type: 'input', data });
                processQueue();
            },
            enqueueKey: function(data) {
                queue.push({ type: 'key', data });
                processQueue();
            }
        };
    },

    init: async function (elementId, dotNetRef) {
        const container = document.getElementById(elementId);
        if (!container) {
            console.error('Terminal container not found:', elementId);
            return null;
        }

        const terminalId = 'term_' + Date.now();

        try {
            const term = new Terminal({
                cursorBlink: false,
                cursorStyle: 'block',
                cursorInactiveStyle: 'outline',
                fontSize: 18,
                fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
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

            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(container);

            // Defer fit to allow layout to stabilize
            setTimeout(() => fitAddon.fit(), 100);

            // Resize handling
            const handleResize = () => {
                try {
                    fitAddon.fit();
                } catch (e) {
                    console.warn('Resize fit error:', e);
                }
            };

            const resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(container);
            window.addEventListener('resize', handleResize);

            // Input processor for sequential keystroke handling
            const inputProcessor = this._createInputProcessor(dotNetRef);

            // Handle keyboard input - regular characters
            term.onData(data => {
                if (data === '\x03') {
                    dotNetRef.invokeMethodAsync('OnCtrlC');
                    return;
                }

                if (data.startsWith('\x1b') ||
                    data === '\r' || data === '\n' ||
                    data === '\b' || data === '\x7f' ||
                    data === '\t') {
                    return;
                }

                inputProcessor.enqueueInput(data);
            });

            // Handle special keys
            term.onKey(e => {
                const domEvent = e.domEvent || {};
                const code = domEvent.code || '';

                const isSpecialKey = code.startsWith('Arrow') ||
                    code === 'Enter' || code === 'NumpadEnter' ||
                    code === 'Backspace' || code === 'Delete' ||
                    code === 'Tab' || code === 'Escape' ||
                    code === 'Home' || code === 'End' ||
                    code === 'PageUp' || code === 'PageDown' ||
                    code === 'Insert' ||
                    e.key.startsWith('\x1b');

                if (!isSpecialKey) return;

                inputProcessor.enqueueKey({
                    key: e.key,
                    domEvent: {
                        key: domEvent.key || '',
                        code: code,
                        ctrlKey: domEvent.ctrlKey || false,
                        altKey: domEvent.altKey || false,
                        shiftKey: domEvent.shiftKey || false
                    }
                });
            });

            const entry = {
                term,
                fitAddon,
                inputProcessor,
                container,
                writeBuffer: '',
                writeScheduled: false,
                resizeObserver
            };
            this.terminals.set(terminalId, entry);
            return terminalId;
        } catch (e) {
            console.error('Failed to create terminal:', e);
            container.innerHTML = `<div style="color: #f44747; padding: 16px; font-family: monospace;">
                Terminal creation failed: ${e.message}<br>
                Please refresh the page to try again.
            </div>`;
            return null;
        }
    },

    write: function (terminalId, text) {
        const entry = this.terminals.get(terminalId);
        if (entry) {
            const normalizedText = text.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
            entry.writeBuffer += normalizedText;

            if (!entry.writeScheduled) {
                entry.writeScheduled = true;
                requestAnimationFrame(() => {
                    if (entry.writeBuffer) {
                        try {
                            entry.term.write(entry.writeBuffer);
                        } catch (e) {
                            if (!e.message?.includes('offset is out of bounds')) {
                                console.warn('Terminal write error:', e.message);
                            }
                        }
                        entry.writeBuffer = '';
                    }
                    entry.writeScheduled = false;
                });
            }
        }
    },

    writeLine: function (terminalId, text) {
        this.write(terminalId, text + '\n');
    },

    clear: function (terminalId) {
        const entry = this.terminals.get(terminalId);
        if (entry) {
            if (entry.writeBuffer) {
                try {
                    entry.term.write(entry.writeBuffer);
                } catch (e) {}
                entry.writeBuffer = '';
                entry.writeScheduled = false;
            }
            entry.term.clear();
            entry.term.reset();
        }
    },

    focus: function (terminalId) {
        const entry = this.terminals.get(terminalId);
        if (entry) {
            entry.term.focus();
        }
    },

    setFocused: function (terminalId, focused) {
        const entry = this.terminals.get(terminalId);
        if (entry && entry.container) {
            const frame = entry.container.closest('.terminal-frame');
            const target = frame || entry.container;
            if (focused) {
                target.classList.add('terminal-focused');
                entry.term.options.cursorBlink = true;
                entry.container.classList.remove('cursor-inactive');
            } else {
                target.classList.remove('terminal-focused');
                entry.term.options.cursorBlink = false;
                entry.container.classList.add('cursor-inactive');
            }
        }
    },

    getSize: function (terminalId) {
        const entry = this.terminals.get(terminalId);
        if (entry) {
            return { cols: entry.term.cols, rows: entry.term.rows };
        }
        return { cols: 80, rows: 24 };
    },

    setCursorPosition: function (terminalId, x, y) {
        const entry = this.terminals.get(terminalId);
        if (entry) {
            entry.term.write(`\x1b[${y + 1};${x + 1}H`);
        }
    },

    dispose: function (terminalId) {
        const entry = this.terminals.get(terminalId);
        if (entry) {
            if (entry.resizeObserver) {
                entry.resizeObserver.disconnect();
            }
            entry.term.dispose();
            this.terminals.delete(terminalId);
        }
    }
};
