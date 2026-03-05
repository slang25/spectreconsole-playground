import type { CreateRuntimeDebugToolsOptions } from "./types";
export declare function createSetupDebugExpose(options: CreateRuntimeDebugToolsOptions, diagnoseCodepoint: (cp: number) => void): () => void;
