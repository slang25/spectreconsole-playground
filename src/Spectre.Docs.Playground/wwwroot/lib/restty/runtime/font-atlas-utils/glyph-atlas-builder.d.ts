import { type Font, type FontAtlas, type FontSizeMode } from "../../fonts";
import type { GlyphConstraintMeta, AtlasConstraintContext } from "../atlas-builder";
import type { GlyphRasterizeOptions, Matrix2D, Matrix3x3, RasterizedGlyph } from "text-shaper";
export type RasterizeGlyphTransformOptions = GlyphRasterizeOptions & {
    offsetX26?: number;
    offsetY26?: number;
};
export type RasterizeGlyphFn = (font: Font, glyphId: number, fontSize: number, options?: GlyphRasterizeOptions) => RasterizedGlyph | null;
export type RasterizeGlyphWithTransformFn = (font: Font, glyphId: number, fontSize: number, matrix: Matrix2D | Matrix3x3, options?: RasterizeGlyphTransformOptions) => RasterizedGlyph | null;
export type BuildGlyphAtlasWithConstraintsOptions = {
    font: Font;
    glyphIds: number[];
    fontSize: number;
    sizeMode: FontSizeMode;
    padding: number;
    maxWidth: number;
    maxHeight: number;
    pixelMode: number;
    hinting: boolean;
    hintTarget?: GlyphRasterizeOptions["hintTarget"];
    rasterizeGlyph?: RasterizeGlyphFn;
    rasterizeGlyphWithTransform?: RasterizeGlyphWithTransformFn;
    glyphMeta?: Map<number, GlyphConstraintMeta>;
    constraintContext?: AtlasConstraintContext;
};
export type BuildGlyphAtlasWithConstraintsResult = {
    atlas: FontAtlas | null;
    constrainedGlyphWidths: Map<number, number> | null;
};
export declare function buildGlyphAtlasWithConstraints(options: BuildGlyphAtlasWithConstraintsOptions): BuildGlyphAtlasWithConstraintsResult;
