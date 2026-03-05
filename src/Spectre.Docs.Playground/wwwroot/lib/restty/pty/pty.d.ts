import type { PtyCallbacks, PtyConnectionState, PtyConnectOptions, PtyResizeMeta, PtyTransport } from "./types";
/** Decode a binary WebSocket frame into a UTF-8 string using a streaming TextDecoder. */
export declare function decodePtyBinary(decoder: TextDecoder, payload: ArrayBuffer | Uint8Array, stream?: boolean): string;
/** Create a fresh idle PTY connection state. */
export declare function createPtyConnection(): PtyConnectionState;
/**
 * Open a WebSocket connection to a PTY server. Returns false if the
 * connection is already active or the URL is empty.
 */
export declare function connectPty(state: PtyConnectionState, options: Pick<PtyConnectOptions, "url" | "cols" | "rows">, callbacks: PtyCallbacks): boolean;
/** Gracefully close the PTY WebSocket connection and reset state to idle. */
export declare function disconnectPty(state: PtyConnectionState): void;
/** Send terminal input data to the PTY server. Returns false if the socket is not open. */
export declare function sendPtyInput(state: PtyConnectionState, data: string): boolean;
/** Send a resize notification to the PTY server. Returns false if the socket is not open. */
export declare function sendPtyResize(state: PtyConnectionState, cols: number, rows: number, meta?: PtyResizeMeta): boolean;
/** Check whether the PTY WebSocket is currently open and connected. */
export declare function isPtyConnected(state: PtyConnectionState): boolean;
/** Create a PtyTransport backed by a WebSocket connection. */
export declare function createWebSocketPtyTransport(state?: PtyConnectionState): PtyTransport;
