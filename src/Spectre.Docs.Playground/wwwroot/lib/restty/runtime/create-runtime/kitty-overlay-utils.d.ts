import type { KittyPlacement } from "../../wasm";
export type KittyDecodedImageLike = {
    width: number;
    height: number;
};
export type KittySlice = {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
};
export declare function toKittySlice(placement: KittyPlacement, decoded: KittyDecodedImageLike, cellW: number, cellH: number): KittySlice | null;
