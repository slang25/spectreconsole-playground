import type { DesktopNotification } from "../input";
import { type CreateResttyAppPaneManagerOptions, type ResttyManagedAppPane, type ResttyManagedPaneStyleOptions, type ResttyPaneAppOptionsInput } from "./pane-app-manager";
import type { ResttyPaneManager, ResttyPaneSplitDirection } from "./panes-types";
import type { ResttyFontSource, ResttyShaderStage } from "../runtime/types";
import { ResttyPaneHandle } from "./restty-pane-handle";
import { ResttyActivePaneApi } from "./restty/active-pane-api";
import { type ResttyPluginInfo, type ResttyPluginManifestEntry, type ResttyPluginRegistry, type ResttyPluginLoadResult, type ResttyRenderStageHandle, type ResttyPlugin } from "./restty-plugin-types";
export { ResttyPaneHandle } from "./restty-pane-handle";
export type { ResttyPaneApi } from "./restty-pane-handle";
export { RESTTY_PLUGIN_API_VERSION } from "./restty-plugin-types";
export type { ResttyPluginApiRange, ResttyPluginRequires, ResttyPluginInfo, ResttyPluginManifestEntry, ResttyPluginRegistryEntry, ResttyPluginRegistry, ResttyPluginLoadStatus, ResttyPluginLoadResult, ResttyPluginEvents, ResttyPluginDisposable, ResttyPluginCleanup, ResttyInputInterceptorPayload, ResttyOutputInterceptorPayload, ResttyInputInterceptor, ResttyOutputInterceptor, ResttyLifecycleHookPayload, ResttyLifecycleHook, ResttyRenderHookPayload, ResttyRenderHook, ResttyInterceptorOptions, ResttyRenderStageHandle, ResttyPluginContext, ResttyPlugin, } from "./restty-plugin-types";
/**
 * Top-level configuration for creating a Restty instance.
 */
export type ResttyOptions = Omit<CreateResttyAppPaneManagerOptions, "appOptions"> & {
    /** Per-pane app options, static or factory. */
    appOptions?: CreateResttyAppPaneManagerOptions["appOptions"];
    /** Font sources applied to every pane. */
    fontSources?: ResttyPaneAppOptionsInput["fontSources"];
    /** Global shader stages synchronized to all panes. */
    shaderStages?: ResttyShaderStage[];
    /** Global handler for desktop notifications emitted by any pane. */
    onDesktopNotification?: (notification: DesktopNotification & {
        paneId: number;
    }) => void;
    /** Whether to create the first pane automatically (default true). */
    createInitialPane?: boolean | {
        focus?: boolean;
    };
};
/**
 * Main entry point for the restty terminal widget. Manages a set of
 * split panes, each running its own terminal app, and exposes
 * convenience methods that operate on the active pane.
 */
export declare class Restty extends ResttyActivePaneApi {
    readonly paneManager: ResttyPaneManager<ResttyManagedAppPane>;
    private fontSources;
    private readonly shaderOps;
    private readonly pluginOps;
    constructor(options: ResttyOptions);
    getPanes(): ResttyManagedAppPane[];
    getPaneById(id: number): ResttyManagedAppPane | null;
    getActivePane(): ResttyManagedAppPane | null;
    getFocusedPane(): ResttyManagedAppPane | null;
    panes(): ResttyPaneHandle[];
    pane(id: number): ResttyPaneHandle | null;
    activePane(): ResttyPaneHandle | null;
    focusedPane(): ResttyPaneHandle | null;
    forEachPane(visitor: (pane: ResttyPaneHandle) => void): void;
    setFontSources(sources: ResttyFontSource[]): Promise<void>;
    setShaderStages(stages: ResttyShaderStage[]): void;
    getShaderStages(): ResttyShaderStage[];
    addShaderStage(stage: ResttyShaderStage): ResttyRenderStageHandle;
    removeShaderStage(id: string): boolean;
    createInitialPane(options?: {
        focus?: boolean;
    }): ResttyManagedAppPane;
    splitActivePane(direction: ResttyPaneSplitDirection): ResttyManagedAppPane | null;
    splitPane(id: number, direction: ResttyPaneSplitDirection): ResttyManagedAppPane | null;
    closePane(id: number): boolean;
    getPaneStyleOptions(): Readonly<Required<ResttyManagedPaneStyleOptions>>;
    setPaneStyleOptions(options: ResttyManagedPaneStyleOptions): void;
    setActivePane(id: number, options?: {
        focus?: boolean;
    }): void;
    markPaneFocused(id: number, options?: {
        focus?: boolean;
    }): void;
    requestLayoutSync(): void;
    hideContextMenu(): void;
    use(plugin: ResttyPlugin, options?: unknown): Promise<void>;
    loadPlugins(manifest: ReadonlyArray<ResttyPluginManifestEntry>, registry: ResttyPluginRegistry): Promise<ResttyPluginLoadResult[]>;
    unuse(pluginId: string): boolean;
    plugins(): string[];
    pluginInfo(pluginId: string): ResttyPluginInfo | null;
    pluginInfo(): ResttyPluginInfo[];
    destroy(): void;
    connectPty(url?: string): void;
    disconnectPty(): void;
    resize(cols: number, rows: number): void;
    focus(): void;
    blur(): void;
    private paneLookup;
    private lifecycleHooks;
    private lifecycleAndPluginHooks;
    protected requireActivePaneHandle(): ResttyPaneHandle;
    private runLifecycleHooks;
    private runRenderHooks;
    private emitPluginEvent;
}
/** Create a new Restty instance with the given options. */
export declare function createRestty(options: ResttyOptions): Restty;
