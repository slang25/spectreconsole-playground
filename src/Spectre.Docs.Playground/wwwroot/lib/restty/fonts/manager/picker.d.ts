import type { FontManagerState } from "../types";
/**
 * Select the best font index from the manager's font list for rendering the
 * given text cluster, searching in fallback order similar to Ghostty.
 */
export declare function pickFontIndexForText(state: FontManagerState, text: string, expectedSpan: number): number;
