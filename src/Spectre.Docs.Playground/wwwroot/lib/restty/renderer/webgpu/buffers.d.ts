import type { WebGLState, WebGPUState } from "../types";
/** Grow a WebGPU instance buffer if the required byte length exceeds current capacity. */
export declare function ensureInstanceBuffer(state: WebGPUState, kind: "rect" | "glyph", byteLength: number): void;
/** Re-configure the WebGPU canvas context with the current device and format. */
export declare function configureContext(state: WebGPUState): void;
/** Grow a WebGL instance buffer if the required byte length exceeds current capacity. */
export declare function ensureGLInstanceBuffer(state: WebGLState, kind: "rect" | "glyph", byteLength: number): void;
