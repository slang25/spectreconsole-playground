import type { FallbackFontSource } from "../types";
/** Fetch a font file from a URL and return its ArrayBuffer, or null on failure. */
export declare function tryFetchFontBuffer(url: string): Promise<ArrayBuffer | null>;
/** Query locally installed fonts via the Local Font Access API and return the first match, or null. */
export declare function tryLocalFontBuffer(matchers: string[]): Promise<ArrayBuffer | null>;
/**
 * Load the primary font buffer, trying local Nerd Font matchers first,
 * then a remote fallback URL, then broader local font matchers. Throws
 * if all sources fail.
 */
export declare function loadPrimaryFontBuffer(localMatchers: string[], fallbackUrl: string, fallbackLocalMatchers: string[]): Promise<ArrayBuffer>;
/** Load fallback font buffers from a list of sources, trying remote URLs then local matchers. */
export declare function loadFallbackFontBuffers(sources: FallbackFontSource[]): Promise<{
    name: string;
    buffer: ArrayBuffer;
}[]>;
