import type { Color, RectData } from "./types";
/** Return a new color with its alpha channel multiplied by the given factor. */
export declare function applyAlpha(color: Color, alpha: number): Color;
/** Append a rect instance (position, size, color) to the output array. */
export declare function pushRect(out: RectData, x: number, y: number, w: number, h: number, color: Color): void;
/** Append a rect snapped to pixel boundaries (floor origin, ceil extent). */
export declare function pushRectSnapped(out: RectData, x: number, y: number, w: number, h: number, color: Color): void;
/** Append a rect with rounded position and at-least-1px dimensions for box drawing. */
export declare function pushRectBox(out: RectData, x: number, y: number, w: number, h: number, color: Color): void;
