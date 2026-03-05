import type { ResttyShaderStage } from "./types";
export declare const RESTTY_SHADER_STAGE_UNIFORM_CAP = 8;
export declare function cloneShaderStage(stage: ResttyShaderStage): ResttyShaderStage;
export declare function cloneShaderStages(stages: ResttyShaderStage[]): ResttyShaderStage[];
export declare function normalizeShaderStage(stage: ResttyShaderStage): ResttyShaderStage;
export declare function normalizeShaderStages(stages: ResttyShaderStage[]): ResttyShaderStage[];
export declare function sortShaderStages(stages: ResttyShaderStage[]): ResttyShaderStage[];
export declare function packShaderStageUniforms(stage: ResttyShaderStage): Float32Array;
export declare function isShaderStageEnabledForBackend(stage: ResttyShaderStage, backend: "webgpu" | "webgl2"): boolean;
