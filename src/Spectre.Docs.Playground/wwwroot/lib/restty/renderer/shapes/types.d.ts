/** RGBA color tuple with components in 0-1 range. */
export type Color = [number, number, number, number];
/** Flat array of rect instance data (x, y, w, h, r, g, b, a per rect). */
export type RectData = number[];
/**
 * Font metrics used for Nerd Font glyph constraint calculations.
 */
export type NerdMetrics = {
    /** Cell width in pixels. */
    cellWidth: number;
    /** Cell height in pixels. */
    cellHeight: number;
    /** Font face bounding-box width. */
    faceWidth: number;
    /** Font face bounding-box height. */
    faceHeight: number;
    /** Vertical offset of the font face within the cell. */
    faceY: number;
    /** Target icon height for multi-cell-width glyphs. */
    iconHeight: number;
    /** Target icon height for single-cell-width glyphs. */
    iconHeightSingle: number;
};
/** Positioned bounding box for a rendered glyph. */
export type GlyphBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/** Box-drawing line style: no line. */
export declare const BOX_STYLE_NONE = 0;
/** Box-drawing line style: thin/light stroke. */
export declare const BOX_STYLE_LIGHT = 1;
/** Box-drawing line style: thick/heavy stroke. */
export declare const BOX_STYLE_HEAVY = 2;
/** Box-drawing line style: double parallel strokes. */
export declare const BOX_STYLE_DOUBLE = 3;
