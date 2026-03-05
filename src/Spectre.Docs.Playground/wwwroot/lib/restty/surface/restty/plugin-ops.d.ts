import { type ResttyLifecycleHookPayload, type ResttyPlugin, type ResttyPluginEvents, type ResttyPluginInfo, type ResttyPluginLoadResult, type ResttyPluginManifestEntry, type ResttyPluginRegistry, type ResttyRenderHookPayload } from "../restty-plugin-types";
import { type ResttyPluginHostDeps } from "./plugin-dispatcher";
export declare class ResttyPluginOps {
    private readonly pluginRuntimes;
    private readonly pluginDiagnostics;
    private readonly dispatcher;
    constructor(deps: ResttyPluginHostDeps);
    use(plugin: ResttyPlugin, options?: unknown): Promise<void>;
    loadPlugins(manifest: ReadonlyArray<ResttyPluginManifestEntry>, registry: ResttyPluginRegistry): Promise<ResttyPluginLoadResult[]>;
    unuse(pluginId: string): boolean;
    plugins(): string[];
    pluginInfo(pluginId: string): ResttyPluginInfo | null;
    pluginInfo(): ResttyPluginInfo[];
    destroy(): void;
    applyInputInterceptors(paneId: number, text: string, source: string): string | null;
    applyOutputInterceptors(paneId: number, text: string, source: string): string | null;
    runLifecycleHooks(payload: ResttyLifecycleHookPayload): void;
    runRenderHooks(payload: ResttyRenderHookPayload): void;
    emitPluginEvent<E extends keyof ResttyPluginEvents>(event: E, payload: ResttyPluginEvents[E]): void;
    private setPluginLoadError;
    private updatePluginDiagnostic;
    private buildPluginInfo;
    private teardownPluginRuntime;
}
