import type { DesktopNotification } from "../../input";
import type { CreateResttyAppPaneManagerOptions } from "../pane-app-manager";
import type { ResttyPluginEvents, ResttyRenderHookPayload } from "../restty-plugin-types";
import type { ResttyFontSource } from "../../runtime/types";
import type { ResttyPluginOps } from "./plugin-ops";
import type { ResttyShaderOps } from "./shader-ops";
type PaneManagerEventHandlers = Pick<CreateResttyAppPaneManagerOptions, "onPaneCreated" | "onPaneClosed" | "onPaneSplit" | "onActivePaneChange" | "onLayoutChanged">;
type MergedPaneAppOptionsDeps = {
    appOptions: CreateResttyAppPaneManagerOptions["appOptions"] | undefined;
    getFontSources: () => ResttyFontSource[] | undefined;
    onDesktopNotification?: (notification: DesktopNotification & {
        paneId: number;
    }) => void;
    shaderOps: Pick<ResttyShaderOps, "normalizePaneShaderStages" | "setPaneBaseShaderStages" | "buildMergedShaderStages">;
    pluginOps: Pick<ResttyPluginOps, "applyInputInterceptors" | "applyOutputInterceptors">;
    runRenderHooks: (payload: ResttyRenderHookPayload) => void;
};
type PaneManagerCallbacksDeps = PaneManagerEventHandlers & {
    shaderOps: Pick<ResttyShaderOps, "syncPaneShaderStages" | "removePaneBaseShaderStages">;
    emitPluginEvent: <E extends keyof ResttyPluginEvents>(event: E, payload: ResttyPluginEvents[E]) => void;
};
export declare function createMergedPaneAppOptions(deps: MergedPaneAppOptionsDeps): CreateResttyAppPaneManagerOptions["appOptions"];
export declare function createPaneManagerEventHandlers(deps: PaneManagerCallbacksDeps): PaneManagerEventHandlers;
export {};
