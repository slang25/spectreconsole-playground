import { type Restty, type ResttyOptions } from "./surface/restty";
export type IDisposable = {
    dispose: () => void;
};
export type TerminalResizeEvent = {
    cols: number;
    rows: number;
};
/**
 * Subset of xterm.js addon contract supported by the restty compatibility layer.
 */
export type TerminalAddon = {
    activate: (terminal: Terminal) => void;
    dispose: () => void;
};
/**
 * Options for the xterm compatibility terminal.
 *
 * `root` is intentionally omitted because xterm-style flow mounts via `open(element)`.
 * Additional unknown keys are accepted for migration ergonomics and kept in
 * the terminal option bag, but are not forwarded to restty internals.
 */
export type TerminalOptions = Omit<ResttyOptions, "root"> & {
    cols?: number;
    rows?: number;
    [key: string]: unknown;
};
/**
 * xterm.js-style compatibility wrapper backed by `Restty`.
 *
 * This intentionally implements a focused subset needed for migration.
 */
export declare class Terminal {
    private readonly resttyOptionsBase;
    private readonly userAppOptions;
    private readonly addons;
    private readonly pendingOutput;
    private readonly dataListeners;
    private readonly resizeListeners;
    private readonly optionValues;
    private resttyInstance;
    private elementRef;
    private disposed;
    private opened;
    private pendingSize;
    cols: number;
    rows: number;
    constructor(options?: TerminalOptions);
    /** Mounted root passed to `open`, null before mount/dispose. */
    get element(): HTMLElement | null;
    /** Underlying restty instance after `open`, null otherwise. */
    get restty(): Restty | null;
    /** xterm-like option bag (compat-focused subset). */
    get options(): Record<string, unknown>;
    set options(next: Record<string, unknown>);
    open(parent: HTMLElement): void;
    write(data: string, callback?: () => void): void;
    writeln(data?: string, callback?: () => void): void;
    resize(cols: number, rows: number): void;
    focus(): void;
    blur(): void;
    clear(): void;
    reset(): void;
    onData(listener: (data: string) => void): IDisposable;
    onResize(listener: (size: TerminalResizeEvent) => void): IDisposable;
    setOption(key: string, value: unknown): void;
    getOption(key: string): unknown;
    loadAddon(addon: TerminalAddon): void;
    dispose(): void;
    private ensureUsable;
    private applyOptions;
}
