import type { ResttyManagedAppPane, ResttyManagedPaneStyleOptions } from "../pane-app-manager";
import type { ResttyPaneManager, ResttyPaneSplitDirection } from "../panes-types";
import { ResttyPaneHandle } from "../restty-pane-handle";
import type { ResttyLifecycleHookPayload, ResttyPluginEvents } from "../restty-plugin-types";
type ResttyPaneLookup = {
    getPanes: () => ResttyManagedAppPane[];
    getPaneById: (id: number) => ResttyManagedAppPane | null;
    getActivePane: () => ResttyManagedAppPane | null;
    getFocusedPane: () => ResttyManagedAppPane | null;
};
type ResttyLifecycleEmitter = {
    runLifecycleHooks: (payload: ResttyLifecycleHookPayload) => void;
    emitPluginEvent: <E extends keyof ResttyPluginEvents>(event: E, payload: ResttyPluginEvents[E]) => void;
};
export declare function requirePaneById(getPaneById: (id: number) => ResttyManagedAppPane | null, id: number): ResttyManagedAppPane;
export declare function makePaneHandle(getPaneById: (id: number) => ResttyManagedAppPane | null, id: number): ResttyPaneHandle;
export declare function requireActivePaneHandle(lookup: Pick<ResttyPaneLookup, "getActivePane" | "getPaneById">): ResttyPaneHandle;
export declare function panes(lookup: Pick<ResttyPaneLookup, "getPanes" | "getPaneById">): ResttyPaneHandle[];
export declare function pane(lookup: Pick<ResttyPaneLookup, "getPaneById">, id: number): ResttyPaneHandle | null;
export declare function activePane(lookup: Pick<ResttyPaneLookup, "getActivePane" | "getPaneById">): ResttyPaneHandle | null;
export declare function focusedPane(lookup: Pick<ResttyPaneLookup, "getFocusedPane" | "getPaneById">): ResttyPaneHandle | null;
export declare function forEachPane(lookup: Pick<ResttyPaneLookup, "getPanes" | "getPaneById">, visitor: (pane: ResttyPaneHandle) => void): void;
export declare function createInitialPane(paneManager: ResttyPaneManager<ResttyManagedAppPane>, hooks: Pick<ResttyLifecycleEmitter, "runLifecycleHooks">, options?: {
    focus?: boolean;
}): ResttyManagedAppPane;
export declare function splitActivePane(paneManager: ResttyPaneManager<ResttyManagedAppPane>, lookup: Pick<ResttyPaneLookup, "getActivePane">, hooks: Pick<ResttyLifecycleEmitter, "runLifecycleHooks">, direction: ResttyPaneSplitDirection): ResttyManagedAppPane | null;
export declare function splitPane(paneManager: ResttyPaneManager<ResttyManagedAppPane>, hooks: Pick<ResttyLifecycleEmitter, "runLifecycleHooks">, id: number, direction: ResttyPaneSplitDirection): ResttyManagedAppPane | null;
export declare function closePane(paneManager: ResttyPaneManager<ResttyManagedAppPane>, hooks: Pick<ResttyLifecycleEmitter, "runLifecycleHooks">, id: number): boolean;
export declare function setActivePane(paneManager: ResttyPaneManager<ResttyManagedAppPane>, lookup: Pick<ResttyPaneLookup, "getActivePane">, hooks: Pick<ResttyLifecycleEmitter, "runLifecycleHooks">, id: number, options?: {
    focus?: boolean;
}): void;
export declare function markPaneFocused(paneManager: ResttyPaneManager<ResttyManagedAppPane>, lookup: Pick<ResttyPaneLookup, "getFocusedPane">, hooks: Pick<ResttyLifecycleEmitter, "runLifecycleHooks">, id: number, options?: {
    focus?: boolean;
}): void;
export declare function connectPty(lookup: Pick<ResttyPaneLookup, "getActivePane" | "getPaneById">, hooks: Pick<ResttyLifecycleEmitter, "runLifecycleHooks">, url?: string): void;
export declare function disconnectPty(lookup: Pick<ResttyPaneLookup, "getActivePane" | "getPaneById">, hooks: Pick<ResttyLifecycleEmitter, "runLifecycleHooks">): void;
export declare function resize(lookup: Pick<ResttyPaneLookup, "getActivePane" | "getPaneById">, hooks: ResttyLifecycleEmitter, cols: number, rows: number): void;
export declare function focus(lookup: Pick<ResttyPaneLookup, "getActivePane" | "getPaneById">, hooks: ResttyLifecycleEmitter): void;
export declare function blur(lookup: Pick<ResttyPaneLookup, "getActivePane" | "getPaneById">, hooks: ResttyLifecycleEmitter): void;
export declare function getPaneStyleOptions(paneManager: ResttyPaneManager<ResttyManagedAppPane>): Readonly<Required<ResttyManagedPaneStyleOptions>>;
export declare function setPaneStyleOptions(paneManager: ResttyPaneManager<ResttyManagedAppPane>, options: ResttyManagedPaneStyleOptions): void;
export {};
