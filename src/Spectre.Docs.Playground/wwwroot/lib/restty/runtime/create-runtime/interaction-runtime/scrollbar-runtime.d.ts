import { type OverlayScrollbarLayout } from "../../overlay-scrollbar";
import type { RuntimeGridState, RuntimeLinkState, RuntimeScrollbarState, RuntimeSelectionState } from "./types";
import type { ResttyWasm, ResttyWasmExports } from "../../../wasm";
export type CreateScrollbarRuntimeOptions = {
    showOverlayScrollbar: boolean;
    scrollbarState: RuntimeScrollbarState;
    selectionState: RuntimeSelectionState;
    linkState: RuntimeLinkState;
    getCanvas: () => HTMLCanvasElement;
    getCurrentDpr: () => number;
    getGridState: () => RuntimeGridState;
    getWasmReady: () => boolean;
    getWasm: () => ResttyWasm | null;
    getWasmHandle: () => number;
    getWasmExports: () => ResttyWasmExports | null;
    updateLinkHover: (cell: null) => void;
    markNeedsRender: () => void;
};
export type ScrollbarRuntime = {
    noteScrollActivity: () => void;
    scrollViewportByLines: (lines: number) => void;
    setViewportScrollOffset: (nextOffset: number) => void;
    pointerToCanvasPx: (event: PointerEvent) => {
        x: number;
        y: number;
    };
    getOverlayScrollbarLayout: () => OverlayScrollbarLayout | null;
    appendOverlayScrollbar: (overlayData: number[], total: number, offset: number, len: number) => void;
};
export declare function createScrollbarRuntime(options: CreateScrollbarRuntimeOptions): ScrollbarRuntime;
