import type { InputHandler, MouseMode } from "../../input";
import type { GhosttyTheme } from "../../theme";
import type { ResttyPaneHandle } from "../restty-pane-handle";
export declare abstract class ResttyActivePaneApi {
    protected abstract requireActivePaneHandle(): ResttyPaneHandle;
    isPtyConnected(): boolean;
    setRenderer(value: "auto" | "webgpu" | "webgl2"): void;
    setPaused(value: boolean): void;
    togglePause(): void;
    setFontSize(value: number): void;
    applyTheme(theme: GhosttyTheme, sourceLabel?: string): void;
    resetTheme(): void;
    sendInput(text: string, source?: string): void;
    sendKeyInput(text: string, source?: string): void;
    clearScreen(): void;
    setMouseMode(value: MouseMode): void;
    getMouseStatus(): ReturnType<InputHandler["getMouseStatus"]>;
    copySelectionToClipboard(): Promise<boolean>;
    pasteFromClipboard(): Promise<boolean>;
    dumpAtlasForCodepoint(cp: number): void;
    updateSize(force?: boolean): void;
    getBackend(): string;
}
