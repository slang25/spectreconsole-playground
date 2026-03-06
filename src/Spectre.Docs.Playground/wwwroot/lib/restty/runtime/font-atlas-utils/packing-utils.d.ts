export declare function nextPowerOf2(n: number): number;
export declare function packGlyphs(sizes: Array<{
    width: number;
    height: number;
}>, maxWidth: number, maxHeight: number): {
    width: number;
    height: number;
    placements: {
        x: number;
        y: number;
        placed: boolean;
    }[];
};
