import type { WebGPUState, WebGLState } from "../../renderer";
import type { CompiledWebGPUShaderStage, WebGPUStageTargets, CompiledWebGLShaderStage, WebGLStageTargets } from "../create-app-types";
import type { ResttyShaderStage } from "../types";
export type CreateShaderStageRuntimeOptions = {
    appendLog: (line: string) => void;
    getCanvasSize: () => {
        width: number;
        height: number;
    };
    getActiveWebGLState: () => WebGLState | null;
    onShaderStagesChanged: () => void;
};
export type ShaderStageRuntime = {
    setShaderStages: (stages: ResttyShaderStage[]) => void;
    getShaderStages: () => ResttyShaderStage[];
    isShaderStagesDirty: () => boolean;
    setShaderStagesDirty: (value: boolean) => void;
    getCompiledWebGPUShaderStages: () => CompiledWebGPUShaderStage[];
    getCompiledWebGLShaderStages: () => CompiledWebGLShaderStage[];
    clearWebGPUShaderStages: () => void;
    clearWebGLShaderStages: (state?: WebGLState | null) => void;
    destroyWebGPUStageTargets: () => void;
    destroyWebGLStageTargets: (state?: WebGLState | null) => void;
    ensureWebGPUStageTargets: (state: WebGPUState) => WebGPUStageTargets | null;
    ensureWebGLStageTargets: (state: WebGLState) => WebGLStageTargets | null;
    rebuildWebGPUShaderStages: (state: WebGPUState) => void;
    rebuildWebGLShaderStages: (state: WebGLState) => void;
};
export declare function createShaderStageRuntime(options: CreateShaderStageRuntimeOptions): ShaderStageRuntime;
