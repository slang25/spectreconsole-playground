/** True when cp is a Ghostty "graphics element" handled specially in renderer logic. */
export declare function isGraphicsElementCodepoint(cp: number): boolean;
/** True when cp is in Ghostty's generated is_symbol lookup table. */
export declare function isGhosttySymbolCodepoint(cp: number): boolean;
/** Symbol-like codepoint for renderer constraint/fit behavior. */
export declare function isSymbolLikeCodepoint(cp: number): boolean;
