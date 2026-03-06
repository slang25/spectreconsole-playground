import type { CursorInfo, RenderPtrs, ResttyWasmExports, WasmAbi } from "./types";
export declare function resolveWasmAbi(exports: ResttyWasmExports): WasmAbi | null;
export declare function unpackCursor(buffer: ArrayBufferLike, ptr: number): CursorInfo | null;
export declare function readRenderInfo(exports: ResttyWasmExports, handle: number): RenderPtrs | null;
export declare function readRenderPtrs(exports: ResttyWasmExports, handle: number): RenderPtrs;
export declare function readCellPtrs(exports: ResttyWasmExports, handle: number): RenderPtrs;
export declare function readRenderStatePtrs(abi: WasmAbi, exports: ResttyWasmExports, handle: number): RenderPtrs | null;
