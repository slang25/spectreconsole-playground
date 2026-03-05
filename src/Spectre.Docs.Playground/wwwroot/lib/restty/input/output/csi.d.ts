import type { CursorPosition, WindowOp } from "../types";
export type OutputModeState = {
    bracketedPaste: boolean;
    focusReporting: boolean;
    synchronizedOutput: boolean;
};
export type WindowMetrics = {
    rows: number;
    cols: number;
    widthPx: number;
    heightPx: number;
    cellWidthPx: number;
    cellHeightPx: number;
};
export declare function deriveAltScreen(seq: string, current: boolean): boolean;
/**
 * Apply tracked private mode flags. Returns true when one of the tracked
 * modes was handled.
 */
export declare function applyTrackedPrivateModes(seq: string, state: OutputModeState): boolean;
export type WindowOpHandlers = {
    sendReply: (data: string) => void;
    getWindowMetrics?: () => WindowMetrics;
    onWindowOp?: (op: WindowOp) => void;
};
/** Handle XTWINOPS queries and window manipulation hooks. */
export declare function handleWindowOpSequence(seq: string, handlers: WindowOpHandlers): boolean;
export type CoreCsiHandlers = {
    sendReply: (data: string) => void;
    getCursorPosition: () => CursorPosition;
};
/** Handle core CSI queries intercepted by OutputFilter. */
export declare function handleCoreCsiSequence(seq: string, handlers: CoreCsiHandlers): boolean;
