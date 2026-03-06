/** Test whether a codepoint falls in a Unicode Private Use Area. */
export declare function isPrivateUse(cp: number): boolean;
/** Test whether a codepoint is a space-like character (NUL, SP, or EN SPACE). */
export declare function isSpaceCp(cp: number): boolean;
/** Test whether a codepoint is in the Box Drawing block (U+2500-U+257F). */
export declare function isBoxDrawing(cp: number): boolean;
/** Test whether a codepoint is in the Block Elements block (U+2580-U+259F). */
export declare function isBlockElement(cp: number): boolean;
/** Test whether a codepoint is in the Legacy Computing Symbols blocks. */
export declare function isLegacyComputing(cp: number): boolean;
/** Test whether a codepoint is a Powerline symbol (U+E0B0-U+E0D7). */
export declare function isPowerline(cp: number): boolean;
/** Test whether a codepoint is in the Braille Patterns block (U+2800-U+28FF). */
export declare function isBraille(cp: number): boolean;
/** Test whether a codepoint is any GPU-drawable graphics element (box, block, legacy, powerline). */
export declare function isGraphicsElement(cp: number): boolean;
/** Test whether a codepoint is a symbol that may need special rendering (PUA or graphics). */
export declare function isSymbolCp(cp: number): boolean;
