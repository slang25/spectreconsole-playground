import type { CellPosition, CursorPosition, DesktopNotification, WindowOp } from "../types";
import type { MouseController } from "../mouse";
/**
 * Construction options for OutputFilter.
 */
export type OutputFilterOptions = {
    /** Provide the current 1-based cursor position for CPR replies. */
    getCursorPosition: () => CursorPosition;
    /** Sink for reply sequences (CPR, DA, OSC color queries). */
    sendReply: (data: string) => void;
    /** MouseController instance for delegating mouse mode toggling. */
    mouse: MouseController;
    /** Provide default colors for OSC 10/11/12 queries (RGB 0-255). */
    getDefaultColors?: () => {
        fg?: [number, number, number];
        bg?: [number, number, number];
        cursor?: [number, number, number];
    };
    /** Handler for OSC 52 clipboard write requests. */
    onClipboardWrite?: (text: string) => void | Promise<void>;
    /** Handler for OSC 52 clipboard read requests. */
    onClipboardRead?: () => string | null | Promise<string | null>;
    /** Handler for window manipulation sequences (CSI ... t). */
    onWindowOp?: (op: WindowOp) => void;
    /** Provider for XTWINOPS report queries (CSI 14/16/18 t). */
    getWindowMetrics?: () => {
        rows: number;
        cols: number;
        widthPx: number;
        heightPx: number;
        cellWidthPx: number;
        cellHeightPx: number;
    };
    /** Handler for desktop notifications (OSC 9 / OSC 777). */
    onDesktopNotification?: (notification: DesktopNotification) => void;
};
/**
 * Parses output for control queries (CPR/DA) and mouse mode toggles,
 * returning the sanitized output for rendering.
 */
export declare class OutputFilter {
    private remainder;
    private getCursorPosition;
    private sendReply;
    private mouse;
    private altScreen;
    private bracketedPaste;
    private focusReporting;
    private synchronizedOutput;
    private windowOpHandler?;
    private getWindowMetrics?;
    private clipboardWrite?;
    private clipboardRead?;
    private getDefaultColors?;
    private desktopNotificationHandler?;
    private promptState;
    private cursorHint;
    constructor(options: OutputFilterOptions);
    setCursorProvider(fn: () => CursorPosition): void;
    setReplySink(fn: (data: string) => void): void;
    setWindowOpHandler(fn: (op: WindowOp) => void): void;
    isAltScreen(): boolean;
    isBracketedPaste(): boolean;
    isFocusReporting(): boolean;
    isSynchronizedOutput(): boolean;
    isPromptClickEventsEnabled(): boolean;
    encodePromptClickEvent(cell: CellPosition): string;
    private observeOsc;
    private handleOsc;
    private handleModeSeq;
    private handleWindowOp;
    filter(output: string): string;
}
