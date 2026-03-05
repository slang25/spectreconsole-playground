import type { CreateRuntimeFontRuntimeHelpersOptions } from "./font-runtime-helpers.types";
export type { CreateRuntimeFontRuntimeHelpersOptions } from "./font-runtime-helpers.types";
export declare function createRuntimeFontRuntimeHelpers(options: CreateRuntimeFontRuntimeHelpersOptions): {
    ensureAtlasForFont: (device: GPUDevice, state: import("../../renderer").WebGPUState, entry: import("../../fonts").FontEntry, neededGlyphIds: Set<number>, fontSizePx: number, fontIndex: number, atlasScale: number, glyphMeta?: Map<number, import("../atlas-builder").GlyphConstraintMeta>, constraintContext?: import("../atlas-builder").AtlasConstraintContext | null) => boolean;
    computeCellMetrics: () => import("./font-runtime-helpers.types").CellMetrics | null;
    updateGrid: () => void;
    shapeClusterWithFont: (entry: import("../../fonts").FontEntry, text: string) => import("../../fonts").ShapedCluster;
    noteColorGlyphText: (entry: import("../../fonts").FontEntry, text: string, shaped: {
        glyphs: Array<{
            glyphId: number;
        }>;
    }) => void;
    fontHasGlyph: (font: import("../../fonts").Font, ch: string) => boolean;
    pickFontIndexForText: (text: string, expectedSpan?: number, stylePreference?: string) => number;
};
