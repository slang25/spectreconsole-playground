import { type GhosttyTheme } from "./ghostty";
import { type BuiltinThemeName } from "./builtin-themes";
/** String literal union of all builtin theme names. */
export type ResttyBuiltinThemeName = BuiltinThemeName;
/** Return an array of all builtin theme names. */
export declare function listBuiltinThemeNames(): ResttyBuiltinThemeName[];
/** Check if a string is a valid builtin theme name. */
export declare function isBuiltinThemeName(name: string): name is ResttyBuiltinThemeName;
/** Get the raw source text for a builtin theme by name. */
export declare function getBuiltinThemeSource(name: string): string | null;
/** Get the parsed theme object for a builtin theme by name (cached). */
export declare function getBuiltinTheme(name: string): GhosttyTheme | null;
