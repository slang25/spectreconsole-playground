import type { KittyPlacement, ResttyWasmExports } from "./types";
export declare function readKittyPlacements(exports: ResttyWasmExports, memory: WebAssembly.Memory, handle: number): KittyPlacement[];
