/** Create the initial resize tracking state with default values. */
export declare function createResizeState(): {
    active: boolean;
    lastAt: number;
    cols: number;
    rows: number;
    dpr: number;
};
/** Create the initial scrollbar position state with default values. */
export declare function createScrollbarState(): {
    lastInputAt: number;
    lastTotal: number;
    lastOffset: number;
    lastLen: number;
};
