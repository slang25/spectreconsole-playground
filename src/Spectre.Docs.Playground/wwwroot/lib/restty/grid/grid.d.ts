import type { CellMetrics, GridConfig, GridState } from "./types";
/**
 * Font metrics interface used to measure glyph dimensions and compute cell sizes.
 */
export type FontMetricsProvider = {
    /** Return the scale factor for a given pixel size and sizing mode. */
    scaleForSize(sizePx: number, sizeMode?: "em" | "height"): number;
    /** Look up the glyph ID for a character, or null/undefined if missing. */
    glyphIdForChar(char: string): number | undefined | null;
    /** Return the advance width of a glyph in font units. */
    advanceWidth(glyphId: number): number;
    /** Font ascender in font units. */
    readonly ascender: number;
    /** Font descender in font units (typically negative). */
    readonly descender?: number;
    /** Explicit font height in font units, if available. */
    readonly height?: number;
    /** Units per em of the font. */
    readonly unitsPerEm: number;
    /** Legacy alias accepted for compatibility with older font objects. */
    readonly upem?: number;
};
/** Result of shaping a text cluster, containing its advance width. */
export type ShapeResult = {
    advance: number;
};
/** Resolve the font height in font units, falling back to ascender-descender or units-per-em. */
export declare function fontHeightUnits(font: FontMetricsProvider): number;
/**
 * Compute cell width, height, and baseline from font metrics, grid config,
 * and device pixel ratio. Returns null if the font is unavailable.
 */
export declare function computeCellMetrics(font: FontMetricsProvider, config: GridConfig, dpr: number, shapeCluster: (text: string) => ShapeResult): CellMetrics | null;
/** Create a zeroed-out grid state with default values. */
export declare function createGridState(): GridState;
/**
 * Recompute grid dimensions from cell metrics and canvas size.
 * Mutates state in place and returns whether cols/rows/metrics changed.
 */
export declare function updateGridState(state: GridState, metrics: CellMetrics, canvasWidth: number, canvasHeight: number): {
    changed: boolean;
    cols: number;
    rows: number;
};
/** Clamp a number to the inclusive [min, max] range. */
export declare function clamp(value: number, min: number, max: number): number;
