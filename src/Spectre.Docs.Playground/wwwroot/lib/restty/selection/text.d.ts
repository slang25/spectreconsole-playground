import type { SelectionState } from "./types";
/** Callback that returns the text content of a cell by flat grid index. */
export type CellTextGetter = (idx: number) => string;
/**
 * Extract the selected text as a newline-separated string, with trailing
 * whitespace trimmed from each line.
 */
export declare function getSelectionText(state: SelectionState, rows: number, cols: number, getCellText: CellTextGetter): string;
