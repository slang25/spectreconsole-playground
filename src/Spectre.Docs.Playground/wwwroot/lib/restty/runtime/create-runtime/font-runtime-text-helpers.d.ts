import { type Font, type FontEntry, type FontManagerState } from "../../fonts";
import type { GlyphBufferToShapedGlyphsFn, ShapeFn, UnicodeBufferCtor } from "./font-runtime-helpers.types";
type CreateFontRuntimeTextHelpersOptions = {
    fontState: FontManagerState;
    glyphShapeCacheLimit: number;
    fontPickCacheLimit: number;
    UnicodeBuffer: UnicodeBufferCtor;
    shape: ShapeFn;
    glyphBufferToShapedGlyphs: GlyphBufferToShapedGlyphsFn;
};
export declare function createFontRuntimeTextHelpers(options: CreateFontRuntimeTextHelpersOptions): {
    shapeClusterWithFont: (entry: FontEntry, text: string) => import("../../fonts").ShapedCluster;
    noteColorGlyphText: (entry: FontEntry, text: string, shaped: {
        glyphs: Array<{
            glyphId: number;
        }>;
    }) => void;
    fontHasGlyph: (font: Font, ch: string) => boolean;
    pickFontIndexForText: (text: string, expectedSpan?: number, stylePreference?: string) => number;
};
export {};
