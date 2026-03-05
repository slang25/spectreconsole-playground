import type { CellPosition, SelectionRange, SelectionState } from "./types";
/** Create an empty, inactive selection state. */
export declare function createSelectionState(): SelectionState;
/** Reset the selection state, deactivating any active selection. */
export declare function clearSelection(state: SelectionState): void;
/** Begin a new selection at the given cell, entering drag mode. */
export declare function startSelection(state: SelectionState, cell: CellPosition): void;
/** Extend the active selection to a new focus cell while dragging. */
export declare function updateSelection(state: SelectionState, cell: CellPosition): void;
/**
 * Finish a drag selection at the given cell. Returns true if a non-empty
 * selection was created, or false if anchor and focus are the same cell.
 */
export declare function endSelection(state: SelectionState, cell: CellPosition): boolean;
/**
 * Return the selected column range for a given row, or null if the row
 * is outside the selection.
 */
export declare function selectionForRow(state: SelectionState, row: number, cols: number): SelectionRange | null;
/**
 * Clamp a cell position to the grid bounds and snap wide-character
 * continuation cells back to the leading cell.
 */
export declare function normalizeSelectionCell(cell: CellPosition | null, rows: number, cols: number, wideFlags?: Uint8Array | null): CellPosition | null;
/** Convert client pixel coordinates to a grid cell position. */
export declare function positionToCell(clientX: number, clientY: number, canvasRect: DOMRect, dpr: number, cellW: number, cellH: number, cols: number, rows: number, canvasWidth?: number, canvasHeight?: number): CellPosition;
