import type { RenderState, RenderViewCache, ResttyWasmExports, WasmAbi } from "./types";
export declare function readRenderState(abi: WasmAbi, exports: ResttyWasmExports, memory: WebAssembly.Memory, handle: number, cache: RenderViewCache): RenderState | null;
