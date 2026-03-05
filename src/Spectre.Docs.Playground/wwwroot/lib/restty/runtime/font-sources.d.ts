import type { ResttyFontPreset, ResttyFontSource } from "./types";
/** Local-first default font fallback chain with CDN fallback for JetBrains Mono, Nerd symbols, emoji, and CJK support. */
export declare const DEFAULT_FONT_SOURCES: ResttyFontSource[];
/** Validates user-provided font sources or returns defaults based on preset (none returns empty array, otherwise default CDN fonts). */
export declare function normalizeFontSources(sources: ResttyFontSource[] | undefined, preset: ResttyFontPreset | undefined): ResttyFontSource[];
