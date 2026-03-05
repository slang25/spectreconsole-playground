import type { CursorInfo, RenderState, ResttyWasm, ResttyWasmExports } from "../../wasm";
import type { ResttyAppCallbacks } from "../types";
import type { RuntimeSelectionState } from "./interaction-runtime/types";
export type CreateRuntimeReportingOptions = {
    selectionState: RuntimeSelectionState;
    getLastRenderState: () => RenderState | null;
    getWasmReady: () => boolean;
    getWasm: () => ResttyWasm | null;
    getWasmHandle: () => number;
    getWasmExports: () => ResttyWasmExports | null;
    callbacks?: ResttyAppCallbacks;
    termSizeEl: HTMLElement | null;
    cursorPosEl: HTMLElement | null;
    dbgEl: HTMLElement | null;
    setCursorForCpr: (pos: {
        row: number;
        col: number;
    }) => void;
};
export declare function createRuntimeReporting(options: CreateRuntimeReportingOptions): {
    selectionForRow: (row: number, cols: number) => import("../../selection").SelectionRange;
    getSelectionText: () => string;
    getRenderState: () => RenderState | null;
    resolveCursorPosition: (cursor: CursorInfo | null) => {
        col: number;
        row: number;
        wideTail: boolean;
    };
    resolveCursorStyle: (cursor: CursorInfo | null, opts: {
        focused: boolean;
        preedit: boolean;
        blinkVisible: boolean;
    }) => number | null;
    reportTermSize: (cols: number, rows: number) => void;
    reportCursor: (cursorPos: {
        col: number;
        row: number;
    } | null) => void;
    reportDebugText: (text: string) => void;
};
