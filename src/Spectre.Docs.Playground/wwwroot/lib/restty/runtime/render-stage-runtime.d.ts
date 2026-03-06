import type { CompiledWebGPUShaderStage, WebGPUStageTargets, CompiledWebGLShaderStage, WebGLStageTargets } from "./create-app-types";
import type { ResttyShaderStage } from "./types";
export declare function compileShaderStageProgram(options: {
    gl: WebGL2RenderingContext;
    stage: ResttyShaderStage;
    reportError: (stage: ResttyShaderStage, message: string) => void;
}): CompiledWebGLShaderStage | null;
export declare function createWebGLStageTexture(gl: WebGL2RenderingContext, width: number, height: number): WebGLTexture | null;
export declare function createWebGLStageFramebuffer(gl: WebGL2RenderingContext, texture: WebGLTexture): WebGLFramebuffer | null;
export declare function createWebGLStageTargets(gl: WebGL2RenderingContext, width: number, height: number): WebGLStageTargets | null;
export declare function compileShaderStagePipelineWebGPU(options: {
    device: GPUDevice;
    format: GPUTextureFormat;
    stage: ResttyShaderStage;
    reportError: (stage: ResttyShaderStage, message: string) => void;
}): CompiledWebGPUShaderStage | null;
export declare function createWebGPUStageTargets(device: GPUDevice, format: GPUTextureFormat, width: number, height: number): WebGPUStageTargets;
export declare function rebuildWebGPUStageBindGroups(device: GPUDevice, compiledStages: CompiledWebGPUShaderStage[], targets: WebGPUStageTargets): void;
