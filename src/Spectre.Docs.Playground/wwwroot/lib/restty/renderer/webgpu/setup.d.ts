import type { WebGPUCoreState, WebGPUState } from "../types";
/** Initialize shared WebGPU core state (device, pipelines, vertex buffer) from a canvas. */
export declare function initWebGPUCore(canvas: HTMLCanvasElement): Promise<WebGPUCoreState | null>;
/**
 * Initialize a full WebGPU renderer state for a canvas, including context,
 * uniform buffer, and bind groups. Accepts an optional pre-initialized core.
 */
export declare function initWebGPU(canvas: HTMLCanvasElement, options?: {
    core?: WebGPUCoreState | null;
}): Promise<WebGPUState | null>;
