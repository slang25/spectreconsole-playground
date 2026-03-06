import type { WebGLState } from "../../renderer";
import type { WebGLTickContext, WebGLTickDeps } from "./render-tick-webgl.types";
export type { WebGLTickContext } from "./render-tick-webgl.types";
export declare function buildWebGLTickContext(deps: WebGLTickDeps, state: WebGLState): WebGLTickContext | null;
