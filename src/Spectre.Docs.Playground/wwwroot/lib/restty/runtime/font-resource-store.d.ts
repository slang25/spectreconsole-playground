import type { ResttyFontResourceFace, ResttyFontResourceStore, ResttyFontSource } from "./types";
type ParsedFontFace = {
    font: ResttyFontResourceFace["font"];
    metadataLabel?: string;
    index?: number;
};
export type CreateResttyFontResourceStoreOptions = {
    now?: () => number;
    /** Max in-memory source-byte cache budget across unleased and leased entries. */
    maxSourceCacheBytes?: number;
    /** TTL for persistent URL-byte cache records. */
    urlCacheTtlMs?: number;
    /** Toggle persistent URL-byte cache (IndexedDB). */
    usePersistentUrlCache?: boolean;
    /** Override source loading (used by tests/mocks). */
    loadSourceBuffer?: (source: ResttyFontSource, sourceKey: string) => Promise<ArrayBuffer | null>;
    /** Override parse step (used by tests/mocks). */
    parseBuffer?: (buffer: ArrayBuffer, sourceKey: string) => Promise<ParsedFontFace[]>;
};
export declare function createResttyFontResourceStore(options?: CreateResttyFontResourceStoreOptions): ResttyFontResourceStore;
export {};
