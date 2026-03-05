import type { InputHandler } from "../../../input";
import type { RuntimeCell, RuntimeDesktopSelectionState, RuntimeGridState, RuntimeScrollbarDragState, RuntimeSelectionState, RuntimeTouchSelectionState } from "./types";
type CreatePointerAuxHandlersOptions = {
    inputHandler: InputHandler;
    shouldRoutePointerToAppMouse: (shiftKey: boolean) => boolean;
    scrollViewportByLines: (lines: number) => void;
    getWasmReady: () => boolean;
    getWasmHandle: () => number;
    getGridState: () => RuntimeGridState;
    updateLinkHover: (cell: RuntimeCell | null) => void;
    clearPendingDesktopSelection: () => void;
    clearPendingTouchSelection: () => void;
    isTouchPointer: (event: PointerEvent) => boolean;
    selectionState: RuntimeSelectionState;
    touchSelectionState: RuntimeTouchSelectionState;
    desktopSelectionState: RuntimeDesktopSelectionState;
    scrollbarDragState: RuntimeScrollbarDragState;
    updateCanvasCursor: () => void;
    markNeedsRender: () => void;
};
export type PointerAuxHandlers = {
    onPointerCancel: (event: PointerEvent) => void;
    onWheel: (event: WheelEvent) => void;
    onContextMenu: (event: MouseEvent) => void;
    onPointerLeave: () => void;
};
export declare function createPointerAuxHandlers(options: CreatePointerAuxHandlersOptions): PointerAuxHandlers;
export {};
