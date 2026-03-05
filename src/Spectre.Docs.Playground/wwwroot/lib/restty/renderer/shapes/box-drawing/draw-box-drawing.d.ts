import type { Color, RectData } from "../types";
/**
 * Rasterize a Unicode Box Drawing character (U+2500-U+257F) into rect instances.
 * Handles straight segments, dashed lines, rounded corners, and diagonal lines.
 */
export declare function drawBoxDrawing(cp: number, x: number, y: number, cellW: number, cellH: number, color: Color, out: RectData, boxThicknessPx?: number): boolean;
