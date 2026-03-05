import { type FontEntry, type FontManagerState } from "../../fonts";
import type { WebGLState, WebGPUState } from "../../renderer";
import type { PtyTransport } from "../../pty";
import type { ResttyWasm } from "../../wasm";
import type { ResttyAppCallbacks } from "../types";
import type { CellMetrics, FontConfigRef, GridStateRef } from "./font-runtime-helpers.types";
type CreateFontRuntimeGridHelpersOptions = {
    fontState: FontManagerState;
    fontConfig: FontConfigRef;
    gridState: GridStateRef;
    callbacks?: ResttyAppCallbacks;
    gridEl: HTMLElement | null;
    cellEl: HTMLElement | null;
    getCanvas: () => HTMLCanvasElement;
    getCurrentDpr: () => number;
    getActiveState: () => WebGPUState | WebGLState | null;
    getWasmReady: () => boolean;
    getWasm: () => ResttyWasm | null;
    getWasmHandle: () => number;
    ptyTransport: PtyTransport;
    setNeedsRender: () => void;
    shapeClusterWithFont: (entry: FontEntry, text: string) => {
        advance: number;
    };
};
export declare function createFontRuntimeGridHelpers(options: CreateFontRuntimeGridHelpersOptions): {
    computeCellMetrics: () => CellMetrics | null;
    updateGrid: () => void;
};
export {};
