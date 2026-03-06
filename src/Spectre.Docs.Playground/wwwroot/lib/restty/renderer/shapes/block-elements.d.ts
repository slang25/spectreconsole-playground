import type { Color, RectData } from "./types";
/** Rasterize a Unicode Block Element (U+2580-U+259F) into rect instances. */
export declare function drawBlockElement(cp: number, x: number, y: number, cellW: number, cellH: number, color: Color, out: RectData): boolean;
