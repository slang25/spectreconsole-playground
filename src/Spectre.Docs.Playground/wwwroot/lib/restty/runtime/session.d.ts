import type { ResttyAppSession } from "./types";
/**
 * Create a new app session that lazily loads the WASM module and
 * initializes the WebGPU core on first use. Multiple panes can
 * share a single session to avoid duplicate resource loading.
 */
export declare function createResttyAppSession(): ResttyAppSession;
/** Return the global default session, creating it on first call. */
export declare function getDefaultResttyAppSession(): ResttyAppSession;
