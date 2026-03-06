export declare const DEFAULT_MAX_SCROLLBACK_BYTES = 10000000;
export declare const MAX_MAX_SCROLLBACK_BYTES = 256000000;
type MaxScrollbackOptions = {
    maxScrollbackBytes?: number;
    maxScrollback?: number;
};
export declare function normalizeMaxScrollbackBytes(value: number | undefined): number;
export declare function resolveMaxScrollbackBytes(options: MaxScrollbackOptions): number;
export {};
