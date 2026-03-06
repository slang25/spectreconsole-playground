import type { FontAtlas, FontEntry } from "../../fonts";
export declare function atlasRegionToImageData(atlas: FontAtlas, x: number, y: number, width: number, height: number, pixelModeGray: number, pixelModeRgba: number): ImageData;
export declare function padAtlasRGBA(rgba: Uint8Array, atlas: FontAtlas, padding: number): Uint8Array;
export declare function resolveGlyphPixelMode(entry: FontEntry, pixelModeGray: number, pixelModeRgba: number, isColorEmojiFont: (entry: FontEntry) => boolean): number;
export declare function atlasBitmapToRGBA(atlas: FontAtlas, pixelModeRgba: number, atlasToRGBA: (atlas: FontAtlas) => Uint8Array): Uint8Array | null;
