import { type ResttyLifecycleHookPayload, type ResttyPluginContext, type ResttyPluginEvents, type ResttyRenderHookPayload, type ResttyRenderStageHandle } from "../restty-plugin-types";
import { type ResttyPluginRuntime } from "../restty-plugin-runtime";
import type { ResttyShaderStage } from "../../runtime/types";
import type { ResttyPaneHandle } from "../restty-pane-handle";
import type { Restty } from "../restty";
export type ResttyPluginHostDeps = {
    restty: Restty;
    panes: () => ResttyPaneHandle[];
    pane: (id: number) => ResttyPaneHandle | null;
    activePane: () => ResttyPaneHandle | null;
    focusedPane: () => ResttyPaneHandle | null;
    addRenderStage: (stage: ResttyShaderStage, ownerPluginId: string | null) => ResttyRenderStageHandle;
};
export declare class ResttyPluginDispatcher {
    private readonly deps;
    private readonly pluginListeners;
    private readonly inputInterceptors;
    private readonly outputInterceptors;
    private readonly lifecycleHooks;
    private readonly renderHooks;
    private nextInterceptorId;
    private nextInterceptorOrder;
    constructor(deps: ResttyPluginHostDeps);
    createPluginContext(runtime: ResttyPluginRuntime): ResttyPluginContext;
    applyInputInterceptors(paneId: number, text: string, source: string): string | null;
    applyOutputInterceptors(paneId: number, text: string, source: string): string | null;
    runLifecycleHooks(payload: ResttyLifecycleHookPayload): void;
    runRenderHooks(payload: ResttyRenderHookPayload): void;
    emitPluginEvent<E extends keyof ResttyPluginEvents>(event: E, payload: ResttyPluginEvents[E]): void;
    private attachRuntimeDisposer;
    private addInputInterceptor;
    private addOutputInterceptor;
    private addLifecycleHook;
    private addRenderHook;
    private registerInterceptor;
    private applyInterceptors;
    private runHooks;
    private onPluginEvent;
}
