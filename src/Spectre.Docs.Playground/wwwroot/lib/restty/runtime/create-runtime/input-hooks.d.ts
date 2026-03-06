import type { ResttyAppInputPayload } from "../types";
type RuntimeInputHook = ((payload: ResttyAppInputPayload) => string | null | void) | null | undefined;
export type CreateRuntimeInputHooksOptions = {
    beforeInputHook?: RuntimeInputHook;
    beforeRenderOutputHook?: RuntimeInputHook;
};
export type RuntimeInputHooks = {
    runBeforeInputHook: (text: string, source: string) => string | null;
    runBeforeRenderOutputHook: (text: string, source: string) => string | null;
};
export declare function createRuntimeInputHooks(options: CreateRuntimeInputHooksOptions): RuntimeInputHooks;
export {};
