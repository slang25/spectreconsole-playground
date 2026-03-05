import type { ResttyShaderStage } from "../runtime/types";
import type { ResttyInterceptorOptions, ResttyPlugin, ResttyPluginEvents, ResttyPluginInfo, ResttyPluginRequires } from "./restty-plugin-types";
export type ResttyPluginRuntimeDisposerKind = "event" | "input-interceptor" | "output-interceptor" | "lifecycle-hook" | "render-hook" | "render-stage";
export type ResttyPluginRuntimeDisposer = {
    kind: ResttyPluginRuntimeDisposerKind;
    active: boolean;
    dispose: () => void;
};
export type ResttyPluginRuntime = {
    plugin: ResttyPlugin;
    cleanup: (() => void) | null;
    activatedAt: number;
    options: unknown;
    disposers: Array<ResttyPluginRuntimeDisposer>;
};
export type ResttyPluginDiagnostic = {
    id: string;
    version: string | null;
    apiVersion: number | null;
    requires: ResttyPluginRequires | null;
    active: boolean;
    activatedAt: number | null;
    lastError: string | null;
};
export type ResttyRegisteredInterceptor<T extends (payload: unknown) => unknown> = {
    id: number;
    pluginId: string;
    priority: number;
    order: number;
    interceptor: T;
};
export type ResttyManagedShaderStage = {
    id: string;
    stage: ResttyShaderStage;
    order: number;
    ownerPluginId: string | null;
};
export type ResttyInterceptorSeq = {
    nextId: number;
    nextOrder: number;
};
export declare function registerPluginInterceptor<T extends (payload: unknown) => unknown>(bucket: Array<ResttyRegisteredInterceptor<T>>, pluginId: string, interceptor: T, options: ResttyInterceptorOptions | undefined, seq: ResttyInterceptorSeq): {
    dispose: () => void;
    nextId: number;
    nextOrder: number;
};
export declare function applyPluginInterceptors<TPayload extends {
    text: string;
}>(bucket: Array<ResttyRegisteredInterceptor<(payload: TPayload) => string | null | void>>, kind: "input" | "output", payload: TPayload): string | null;
export declare function runPluginHooks<TPayload>(bucket: Array<ResttyRegisteredInterceptor<(payload: TPayload) => void>>, kind: "lifecycle" | "render", payload: TPayload): void;
export declare function attachRuntimeDisposer(runtime: ResttyPluginRuntime, kind: ResttyPluginRuntimeDisposerKind, dispose: () => void): () => void;
export declare function teardownPluginRuntime(runtime: ResttyPluginRuntime): void;
export declare function setPluginLoadError(pluginDiagnostics: Map<string, ResttyPluginDiagnostic>, pluginId: string, message: string): void;
export declare function patchPluginDiagnostic(pluginDiagnostics: Map<string, ResttyPluginDiagnostic>, pluginId: string, patch: Partial<Pick<ResttyPluginDiagnostic, "active" | "activatedAt" | "lastError">>): void;
export declare function buildPluginInfo(pluginId: string, pluginDiagnostics: Map<string, ResttyPluginDiagnostic>, pluginRuntimes: Map<string, ResttyPluginRuntime>): ResttyPluginInfo | null;
export declare function onPluginEvent<E extends keyof ResttyPluginEvents>(pluginListeners: Map<keyof ResttyPluginEvents, Set<(payload: unknown) => void>>, event: E, listener: (payload: ResttyPluginEvents[E]) => void): () => void;
export declare function emitPluginEvent<E extends keyof ResttyPluginEvents>(pluginListeners: Map<keyof ResttyPluginEvents, Set<(payload: unknown) => void>>, event: E, payload: ResttyPluginEvents[E]): void;
