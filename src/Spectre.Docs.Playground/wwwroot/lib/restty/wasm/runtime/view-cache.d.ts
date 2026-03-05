import type { RenderViewCache, TypedArrayCtor, ViewEntry } from "./types";
export declare function makeViewEntry<T extends ArrayBufferView>(): ViewEntry<T>;
export declare function makeRenderViewCache(): RenderViewCache;
export declare function getCachedView<T extends ArrayBufferView>(entry: ViewEntry<T>, buffer: ArrayBufferLike, ptr: number, len: number, Ctor: TypedArrayCtor<T>): T | null;
