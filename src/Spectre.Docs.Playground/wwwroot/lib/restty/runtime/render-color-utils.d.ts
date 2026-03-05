import type { Color } from "../renderer";
export declare function decodePackedRGBA(color: number): Color;
export declare function decodeRGBAWithCache(bytes: Uint8Array, index: number, cache: Map<number, Color>): Color;
export declare function clamp01(value: number): number;
export declare function brighten(color: Color, amount: number): Color;
export declare function fade(color: Color, factor: number): Color;
