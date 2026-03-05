import type { InputHandler } from "../../../input";
import type { RuntimeCell, RuntimeDesktopSelectionState, RuntimeLinkState, RuntimeScrollbarDragState, RuntimeSelectionState, RuntimeTouchSelectionState } from "./types";
type CreatePointerUpHandlerOptions = {
    inputHandler: InputHandler;
    sendKeyInput: (text: string) => void;
    openLink: (url: string) => void;
    scrollbarDragState: RuntimeScrollbarDragState;
    isTouchPointer: (event: PointerEvent) => boolean;
    touchSelectionState: RuntimeTouchSelectionState;
    selectionState: RuntimeSelectionState;
    normalizeSelectionCell: (cell: RuntimeCell) => RuntimeCell;
    positionToCell: (event: {
        clientX: number;
        clientY: number;
    }) => RuntimeCell;
    clearPendingTouchSelection: () => void;
    clearPendingDesktopSelection: () => void;
    desktopSelectionState: RuntimeDesktopSelectionState;
    clearSelection: () => void;
    updateCanvasCursor: () => void;
    markNeedsRender: () => void;
    shouldRoutePointerToAppMouse: (shiftKey: boolean) => boolean;
    linkState: RuntimeLinkState;
    updateLinkHover: (cell: RuntimeCell | null) => void;
};
export declare function createPointerUpHandler(options: CreatePointerUpHandlerOptions): (event: PointerEvent) => void;
export {};
