import type { FontAtlasBitmap } from "../../fonts";
export declare function bitmapBytesPerPixel(pixelMode: number): number;
export declare function createAtlasBitmap(width: number, height: number, pixelMode: FontAtlasBitmap["pixelMode"]): FontAtlasBitmap;
export declare function cloneBitmap(bitmap: FontAtlasBitmap | null | undefined, defaultPixelMode?: FontAtlasBitmap["pixelMode"]): FontAtlasBitmap;
export declare function copyBitmapToAtlas(src: FontAtlasBitmap, dst: FontAtlasBitmap, dstX: number, dstY: number): void;
