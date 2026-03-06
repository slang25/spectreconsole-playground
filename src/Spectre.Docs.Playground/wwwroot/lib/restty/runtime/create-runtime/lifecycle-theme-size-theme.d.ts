import { type GhosttyTheme } from "../../theme";
import type { LifecycleThemeSizeDeps } from "./lifecycle-theme-size.types";
export declare function createLifecycleThemeHandlers(deps: LifecycleThemeSizeDeps): {
    applyTheme: (theme: GhosttyTheme | null | undefined, sourceLabel?: string) => void;
    resetTheme: () => void;
};
