/** State for streaming Kitty file-based media rewriting (tracks remainder across chunks). */
export type KittyMediaRewriteState = {
    remainder?: string;
};
/** Callback to read file contents for Kitty file-based media payloads. */
export type KittyMediaReadFile = (path: string) => Uint8Array;
/** Rewrite Kitty file-based media sequences (f=...) to direct base64 payloads (t=d). */
export declare function rewriteKittyFileMediaToDirect(chunk: string, state: KittyMediaRewriteState, readFile: KittyMediaReadFile): string;
