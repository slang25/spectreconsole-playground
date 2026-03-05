/** Copy text to the system clipboard, with a legacy execCommand fallback. */
export declare function copyToClipboard(text: string): Promise<boolean>;
/** Read text from the system clipboard, returning null on failure. */
export declare function pasteFromClipboard(): Promise<string | null>;
