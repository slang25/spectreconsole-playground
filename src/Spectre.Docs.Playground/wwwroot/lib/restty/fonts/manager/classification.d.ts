import type { FontEntry, FontScaleOverride } from "../types";
/** Check whether a font entry is a symbol/icon font based on its label. */
export declare function isSymbolFont(entry: FontEntry | null | undefined): boolean;
/** Check whether a font entry is a Nerd Font symbols font. */
export declare function isNerdSymbolFont(entry: FontEntry | null | undefined): boolean;
/** Check whether a font entry is a color emoji font. */
export declare function isColorEmojiFont(entry: FontEntry | null | undefined): boolean;
/** Return the maximum cell span for a font (2 for CJK/emoji, 1 otherwise). */
export declare function fontMaxCellSpan(entry: FontEntry | null | undefined): number;
/** Return the scale multiplier for a font entry by matching its label against overrides. */
export declare function fontScaleOverride(entry: FontEntry | null | undefined, overrides?: FontScaleOverride[]): number;
/** Compute the atlas raster scale for a font, applying symbol atlas scaling for fallback symbol fonts. */
export declare function fontRasterScale(entry: FontEntry | null | undefined, fontIndex: number, maxSymbolAtlasScale: number, overrides?: FontScaleOverride[]): number;
