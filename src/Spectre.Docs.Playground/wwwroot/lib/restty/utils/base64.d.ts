/**
 * Decode base64 text into bytes. Throws when no decoder is available in
 * the current runtime.
 */
export declare function decodeBase64Bytes(text: string): Uint8Array;
/**
 * Encode bytes to base64 text. Throws when no encoder is available in the
 * current runtime.
 */
export declare function encodeBase64Bytes(bytes: Uint8Array): string;
/** Decode base64 text payloads to UTF-8 text, returning empty text on errors. */
export declare function decodeBase64Text(text: string): string;
