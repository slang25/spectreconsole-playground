import { type Color } from "../renderer";
export declare function drawUnderlineStyle(underlineData: number[], style: number, x: number, rowY: number, cellW: number, cellH: number, baseY: number, underlineOffsetPx: number, underlineThicknessPx: number, color: Color): void;
export declare function drawStrikethrough(underlineData: number[], x: number, rowY: number, cellW: number, cellH: number, color: Color): void;
export declare function drawOverline(underlineData: number[], x: number, rowY: number, cellW: number, color: Color): void;
