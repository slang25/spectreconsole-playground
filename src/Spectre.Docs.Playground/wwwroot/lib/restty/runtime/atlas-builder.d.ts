import type { Font, FontAtlas, FontEntry, FontSizeMode } from "../fonts";
import type { AtlasOptions, GlyphRasterizeOptions, Matrix2D, Matrix3x3, RasterizedGlyph } from "text-shaper";
/**
 * Metadata for constrained glyph rendering.
 * - cp: Unicode code point
 * - constraintWidth: target cell width constraint
 * - variable: whether glyph can render at multiple widths
 * - widths: set of all required cell widths for this glyph
 */
export type GlyphConstraintMeta = {
    cp: number;
    constraintWidth: number;
    variable?: boolean;
    widths?: Set<number>;
};
/**
 * Context for constraint-based atlas building, primarily for Nerd Fonts symbol alignment.
 * - cellW: cell width in pixels
 * - cellH: cell height in pixels
 * - yPad: vertical padding
 * - baselineOffset: baseline offset adjustment
 * - baselineAdjust: additional baseline adjustment
 * - fontScale: scale factor for font rendering
 * - nerdMetrics: Nerd Fonts specific layout metrics
 * - fontEntry: reference to font entry object
 */
export type AtlasConstraintContext = {
    cellW: number;
    cellH: number;
    yPad: number;
    baselineOffset: number;
    baselineAdjust: number;
    fontScale: number;
    nerdMetrics: {
        cellWidth: number;
        cellHeight: number;
        faceWidth: number;
        faceHeight: number;
        faceY: number;
        iconHeight: number;
        iconHeightSingle: number;
    };
    fontEntry: FontEntry;
};
type RasterizeGlyphTransformOptions = GlyphRasterizeOptions & {
    offsetX26?: number;
    offsetY26?: number;
};
type RasterizeGlyphFn = (font: Font, glyphId: number, fontSize: number, options?: GlyphRasterizeOptions) => RasterizedGlyph | null;
type RasterizeGlyphWithTransformFn = (font: Font, glyphId: number, fontSize: number, matrix: Matrix2D | Matrix3x3, options?: RasterizeGlyphTransformOptions) => RasterizedGlyph | null;
type BuildGlyphAtlasWithConstraintsOptions = {
    font: Font;
    glyphIds: number[];
    fontSize: number;
    sizeMode: FontSizeMode;
    padding: number;
    maxWidth: number;
    maxHeight: number;
    pixelMode: number;
    hinting: boolean;
    hintTarget?: AtlasOptions["hintTarget"];
    rasterizeGlyph?: RasterizeGlyphFn;
    rasterizeGlyphWithTransform?: RasterizeGlyphWithTransformFn;
    glyphMeta?: Map<number, GlyphConstraintMeta>;
    constraintContext?: AtlasConstraintContext;
};
type BuildGlyphAtlasWithConstraintsResult = {
    atlas: FontAtlas | null;
    constrainedGlyphWidths?: Map<number, number> | null;
};
type BuildColorEmojiAtlasWithCanvasOptions = {
    font: Font;
    fontEntry: FontEntry;
    glyphIds: number[];
    fontSize: number;
    sizeMode: FontSizeMode;
    padding: number;
    maxWidth: number;
    maxHeight: number;
    pixelMode: number;
};
type BuildAtlasDeps = {
    fontScaleOverrides: Array<{
        match: RegExp;
        scale: number;
    }>;
    sizeMode: FontSizeMode;
    isSymbolFont: (entry: FontEntry | null | undefined) => boolean;
    fontScaleOverride: (entry: FontEntry | null | undefined, overrides: Array<{
        match: RegExp;
        scale: number;
    }>) => number;
    resolveGlyphPixelMode: (entry: FontEntry) => number;
    atlasBitmapToRGBA: (atlas: FontAtlas) => Uint8Array | null;
    padAtlasRGBA: (rgba: Uint8Array, atlas: FontAtlas, padding: number) => Uint8Array;
    buildAtlas: (font: Font, glyphIds: number[], options: AtlasOptions) => FontAtlas;
    buildGlyphAtlasWithConstraints: (options: BuildGlyphAtlasWithConstraintsOptions) => BuildGlyphAtlasWithConstraintsResult | null;
    buildColorEmojiAtlasWithCanvas: (options: BuildColorEmojiAtlasWithCanvasOptions) => {
        atlas: FontAtlas;
    } | null;
    rasterizeGlyph?: RasterizeGlyphFn;
    rasterizeGlyphWithTransform?: RasterizeGlyphWithTransformFn;
    hinting: boolean;
    hintTarget?: AtlasOptions["hintTarget"];
    nerdConstraintSignature: (glyphMeta: Map<number, GlyphConstraintMeta> | undefined, constraintContext: AtlasConstraintContext | null | undefined) => string;
    constants: {
        atlasPadding: number;
        symbolAtlasPadding: number;
        symbolAtlasMaxSize: number;
        defaultAtlasMaxSize: number;
        pixelModeRgbaValue: number;
    };
    resolvePreferNearest: (params: {
        fontIndex: number;
        isSymbol: boolean;
        atlasScale: number;
    }) => boolean;
};
/**
 * Parameters for font atlas building.
 * - entry: font entry containing the font object and cached atlas
 * - neededGlyphIds: set of glyph IDs required in the atlas
 * - glyphMeta: optional constraint metadata for symbol font glyphs
 * - fontSizePx: base font size in pixels
 * - atlasScale: scaling factor for high-DPI rendering
 * - fontIndex: index in the font fallback chain (0 = primary font)
 * - constraintContext: optional constraint context for symbol alignment
 * - deps: external dependencies for atlas building
 */
export type BuildFontAtlasParams = {
    entry: FontEntry;
    neededGlyphIds: Set<number>;
    glyphMeta?: Map<number, GlyphConstraintMeta>;
    fontSizePx: number;
    atlasScale: number;
    fontIndex: number;
    constraintContext?: AtlasConstraintContext | null;
    deps: BuildAtlasDeps;
};
/**
 * Result from font atlas building.
 * - rebuilt: true if a new atlas was generated
 * - atlas: the atlas object containing glyph metrics and bitmap
 * - rgba: RGBA pixel data ready for WebGL upload
 * - colorGlyphs: set of glyph IDs that are color emoji
 * - preferNearest: whether to use nearest-neighbor texture filtering
 */
export type BuildFontAtlasResult = {
    rebuilt: boolean;
    atlas: FontAtlas | null;
    rgba: Uint8Array | null;
    colorGlyphs?: Set<number>;
    preferNearest: boolean;
};
/** Builds or reuses a font atlas, detecting when rebuild is needed based on glyph requirements, size changes, or constraint updates. */
export declare function buildFontAtlasIfNeeded(params: BuildFontAtlasParams): BuildFontAtlasResult;
export {};
