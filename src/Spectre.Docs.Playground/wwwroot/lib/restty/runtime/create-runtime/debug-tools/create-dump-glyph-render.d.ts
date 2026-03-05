import type { CreateRuntimeDebugToolsOptions } from "./types";
export declare function createDumpGlyphRender(options: CreateRuntimeDebugToolsOptions): (cp: number, constraintWidth?: number) => Promise<ImageData>;
