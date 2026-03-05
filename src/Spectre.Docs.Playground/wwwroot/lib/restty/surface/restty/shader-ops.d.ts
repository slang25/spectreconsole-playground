import type { ResttyManagedAppPane } from "../pane-app-manager";
import type { ResttyRenderStageHandle } from "../restty-plugin-types";
import type { ResttyShaderStage } from "../../runtime/types";
type ResttyShaderOpsDeps = {
    getPanes: () => ResttyManagedAppPane[];
    getPaneById: (id: number) => ResttyManagedAppPane | null;
};
export declare class ResttyShaderOps {
    private readonly paneBaseShaderStages;
    private readonly globalShaderStages;
    private nextShaderStageOrder;
    private readonly deps;
    constructor(deps: ResttyShaderOpsDeps, shaderStages?: ResttyShaderStage[]);
    setShaderStages(stages: ResttyShaderStage[]): void;
    getShaderStages(): ResttyShaderStage[];
    addShaderStage(stage: ResttyShaderStage): ResttyRenderStageHandle;
    addManagedShaderStage(stage: ResttyShaderStage, ownerPluginId: string | null): ResttyRenderStageHandle;
    removeShaderStage(id: string): boolean;
    normalizePaneShaderStages(stages: ResttyShaderStage[] | undefined, paneId: number): ResttyShaderStage[];
    setPaneBaseShaderStages(paneId: number, stages: ResttyShaderStage[]): void;
    removePaneBaseShaderStages(paneId: number): void;
    buildMergedShaderStages(baseStages: ResttyShaderStage[]): ResttyShaderStage[];
    syncPaneShaderStages(paneId?: number): void;
    clear(): void;
    private listGlobalShaderStages;
}
export {};
