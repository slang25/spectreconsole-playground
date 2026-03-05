import type { LifecycleThemeSizeDeps } from "./lifecycle-theme-size.types";
export declare function createRuntimeLifecycleThemeSize(deps: LifecycleThemeSizeDeps): {
    applyTheme: (theme: import("../..").GhosttyTheme | null | undefined, sourceLabel?: string) => void;
    resetTheme: () => void;
    replaceCanvas: () => void;
    updateSize: (force?: boolean) => void;
    resize: (cols: number, rows: number) => void;
    scheduleSizeUpdate: () => void;
    focusTypingInput: () => void;
    focus: () => void;
    blur: () => void;
    bindFocusEvents: () => void;
    bindAutoResizeEvents: () => void;
    cancelScheduledSizeUpdate: () => void;
    getActiveTheme: () => import("../..").GhosttyTheme | null;
};
