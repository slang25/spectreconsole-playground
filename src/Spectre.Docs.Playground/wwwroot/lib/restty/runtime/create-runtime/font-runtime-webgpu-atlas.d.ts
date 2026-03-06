import { type FontEntry, type FontManagerState } from "../../fonts";
import type { WebGPUState } from "../../renderer";
import { type AtlasConstraintContext, type GlyphConstraintMeta } from "../atlas-builder";
import type { ResttyFontHintTarget } from "../types";
import type { AtlasBitmapToRGBA, BuildAtlasFn, BuildColorEmojiAtlasWithCanvas, PadAtlasRGBAFn, RasterizeGlyphFn, RasterizeGlyphWithTransformFn, ResolveGlyphPixelMode } from "./font-runtime-helpers.types";
type CreateRuntimeWebGPUAtlasHelpersOptions = {
    fontState: FontManagerState;
    getFontHinting: () => boolean;
    getFontHintTarget: () => ResttyFontHintTarget;
    fontScaleOverrides: Array<{
        match: RegExp;
        scale: number;
    }>;
    resolveGlyphPixelMode: ResolveGlyphPixelMode;
    atlasBitmapToRGBA: AtlasBitmapToRGBA;
    padAtlasRGBA: PadAtlasRGBAFn;
    buildAtlas: BuildAtlasFn;
    buildColorEmojiAtlasWithCanvas: BuildColorEmojiAtlasWithCanvas;
    rasterizeGlyph: RasterizeGlyphFn;
    rasterizeGlyphWithTransform: RasterizeGlyphWithTransformFn;
    pixelModeRgbaValue: number;
    atlasPadding: number;
    symbolAtlasPadding: number;
    symbolAtlasMaxSize: number;
};
export declare function createRuntimeWebGPUAtlasHelpers(options: CreateRuntimeWebGPUAtlasHelpersOptions): {
    ensureAtlasForFont: (device: GPUDevice, state: WebGPUState, entry: FontEntry, neededGlyphIds: Set<number>, fontSizePx: number, fontIndex: number, atlasScale: number, glyphMeta?: Map<number, GlyphConstraintMeta>, constraintContext?: AtlasConstraintContext | null) => boolean;
};
export {};
