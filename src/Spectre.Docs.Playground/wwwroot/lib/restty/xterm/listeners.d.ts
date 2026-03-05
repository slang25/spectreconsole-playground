export type Listener<T> = (payload: T) => void;
export declare function addListener<T>(bucket: Set<Listener<T>>, listener: Listener<T>): {
    dispose: () => void;
};
export declare function emitWithGuard<T>(bucket: Set<Listener<T>>, payload: T, label: "onData" | "onResize"): void;
