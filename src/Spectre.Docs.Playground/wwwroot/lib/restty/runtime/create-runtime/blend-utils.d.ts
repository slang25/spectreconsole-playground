import type { Color } from "../../renderer";
export type AlphaBlendingMode = "native" | "linear" | "linear-corrected";
export declare function srgbChannelToLinear(channel: number): number;
export declare function srgbToLinearColor(color: Color): Color;
export declare function resolveBlendFlags(alphaBlending: AlphaBlendingMode, backendType: "webgpu" | "webgl2", state?: {
    srgbSwapchain?: boolean;
}): {
    useLinearBlending: boolean;
    useLinearCorrection: boolean;
};
export declare function floatsToRgb(color: number[]): [number, number, number];
