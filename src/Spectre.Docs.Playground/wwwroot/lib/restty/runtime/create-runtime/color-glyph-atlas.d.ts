import type { FontAtlas } from "../../fonts";
import type { BuildColorEmojiAtlasWithCanvas } from "./font-runtime-helpers.types";
type CreateColorGlyphAtlasHelpersOptions = {
    pixelModeRgba: number;
    atlasToRGBA: (atlas: FontAtlas) => Uint8Array;
};
export declare function createColorGlyphAtlasHelpers(options: CreateColorGlyphAtlasHelpersOptions): {
    atlasBitmapToRGBA: (atlas: FontAtlas) => Uint8Array | null;
    buildColorEmojiAtlasWithCanvas: BuildColorEmojiAtlasWithCanvas;
};
export {};
