import type { Color, RectData } from "./types";
/** Rasterize a Powerline glyph (U+E0B0-U+E0D7) into rect scanline instances. */
export declare function drawPowerline(cp: number, x: number, y: number, cellW: number, cellH: number, color: Color, out: RectData): boolean;
