export type ResttyPluginApiRangeLike = {
    min: number;
    max?: number;
};
export type ResttyPluginRequiresLike = {
    pluginApi?: number | ResttyPluginApiRangeLike;
};
export type ResttyPluginLike = {
    id: string;
    version?: string;
    apiVersion?: number;
    requires?: ResttyPluginRequiresLike;
};
export type ResttyPluginCleanupLike = void | (() => void) | {
    dispose: () => void;
};
export declare function errorToMessage(error: unknown): string;
export declare function normalizePluginMetadata<T extends ResttyPluginLike>(plugin: T, pluginId: string): T;
export declare function assertPluginCompatibility(pluginId: string, plugin: ResttyPluginLike, pluginApiVersion: number): void;
export declare function lookupPluginRegistryEntry<T>(registry: ReadonlyMap<string, T> | Record<string, T>, pluginId: string): T | null;
export declare function resolvePluginRegistryEntry<T>(entry: T | (() => T | Promise<T>)): Promise<T>;
export declare function normalizePluginCleanup(cleanup: ResttyPluginCleanupLike): (() => void) | null;
