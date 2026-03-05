import type { CreateRuntimeDebugToolsOptions } from "./debug-tools/types";
export type { CreateRuntimeDebugToolsOptions } from "./debug-tools/types";
export declare function createRuntimeDebugTools(options: CreateRuntimeDebugToolsOptions): {
    dumpAtlasForCodepoint: (cp: number) => void;
    setupDebugExpose: () => void;
};
