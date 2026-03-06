import type { WebGLState, WebGPUState } from "../../renderer";
import type { WebGLTickDeps } from "./render-tick-webgl.types";
import type { RuntimeTickDeps } from "./render-tick-webgpu.types";
type RuntimeRenderTickDeps = RuntimeTickDeps & WebGLTickDeps;
export declare function createRuntimeRenderTicks(deps: RuntimeRenderTickDeps): {
    tickWebGPU: (state: WebGPUState) => void;
    tickWebGL: (state: WebGLState) => void;
};
export {};
