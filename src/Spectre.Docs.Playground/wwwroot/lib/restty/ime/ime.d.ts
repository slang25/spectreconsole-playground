import type { ImeState, CursorPosition } from "./types";
/** Default CSS font stack used for IME preedit UI when terminal fonts are not directly available to CSS. */
export declare const DEFAULT_IME_FONT_FAMILY = "\"JetBrains Mono\",\"Fira Code\",\"SFMono-Regular\",\"Menlo\",\"Consolas\",\"Liberation Mono\",monospace";
/** Create a fresh IME state with no active composition. */
export declare function createImeState(): ImeState;
/** Set the preedit string on the IME state and sync it to the hidden input element. */
export declare function setPreedit(state: ImeState, text: string, imeInput?: HTMLInputElement | null): void;
/** Clear the preedit string, reset selection offsets, and empty the hidden input. */
export declare function clearPreedit(state: ImeState, imeInput?: HTMLInputElement | null): void;
/** Begin an IME composition session, marking the state as composing and setting initial preedit. */
export declare function startComposition(state: ImeState, data: string, imeInput?: HTMLInputElement | null): void;
/** Update the preedit text during an active composition without changing composing state. */
export declare function updateComposition(state: ImeState, data: string, imeInput?: HTMLInputElement | null): void;
/** End the composition session and return the committed preedit text. */
export declare function endComposition(state: ImeState): string;
/** Read the current selection range from the hidden input and sync it into the IME state. */
export declare function syncImeSelection(state: ImeState, imeInput: HTMLInputElement | null): void;
/** Reposition the hidden IME input element to align with the terminal cursor. */
export declare function updateImePosition(imeInput: HTMLInputElement | null, cursor: CursorPosition | null, cellW: number, cellH: number, dpr: number, canvasRect: DOMRect): void;
/** Resolve a visible IME anchor from cursor coordinates, clamped to current viewport bounds. */
export declare function resolveImeAnchor(cursor: {
    row: number;
    col: number;
    wideTail?: boolean;
} | null, cols: number, rows: number): CursorPosition | null;
/**
 * Sync hidden IME input typography with terminal sizing so OS preedit/candidate UI
 * uses the same visual scale as the terminal text.
 */
export declare function syncImeInputTypography(imeInput: HTMLInputElement | HTMLTextAreaElement | null, fontSizePt: number, fontFamily?: string): void;
/** Default RGBA background color for the preedit overlay. */
export declare const PREEDIT_BG: readonly [0.16, 0.16, 0.2, 0.9];
/** Default RGBA background color for the active (selected) preedit segment. */
export declare const PREEDIT_ACTIVE_BG: readonly [0.3, 0.32, 0.42, 0.95];
/** Default RGBA foreground color for preedit text. */
export declare const PREEDIT_FG: readonly [0.95, 0.95, 0.98, 1];
/** Default RGBA color for the preedit underline. */
export declare const PREEDIT_UL: readonly [0.7, 0.7, 0.8, 0.9];
/** Default RGBA color for the preedit caret. */
export declare const PREEDIT_CARET: readonly [0.95, 0.95, 0.98, 1];
