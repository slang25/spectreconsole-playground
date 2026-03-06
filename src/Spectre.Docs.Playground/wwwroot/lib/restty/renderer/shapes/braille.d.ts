import type { Color, RectData } from "./types";
/** Rasterize a Unicode Braille Pattern (U+2800-U+28FF) into rect dot instances. */
export declare function drawBraille(cp: number, x: number, y: number, cellW: number, cellH: number, color: Color, out: RectData): boolean;
