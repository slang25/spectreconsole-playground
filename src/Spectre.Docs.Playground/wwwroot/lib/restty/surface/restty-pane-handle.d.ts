import type { InputHandler, MouseMode } from "../input";
import type { GhosttyTheme } from "../theme";
import type { ResttyManagedAppPane } from "./pane-app-manager";
import type { ResttyShaderStage } from "../runtime/types";
/**
 * Public API surface exposed by each pane handle.
 */
export type ResttyPaneApi = {
    id: number;
    setRenderer: (value: "auto" | "webgpu" | "webgl2") => void;
    setPaused: (value: boolean) => void;
    togglePause: () => void;
    setFontSize: (value: number) => void;
    applyTheme: (theme: GhosttyTheme, sourceLabel?: string) => void;
    resetTheme: () => void;
    sendInput: (text: string, source?: string) => void;
    sendKeyInput: (text: string, source?: string) => void;
    clearScreen: () => void;
    connectPty: (url?: string) => void;
    disconnectPty: () => void;
    isPtyConnected: () => boolean;
    setMouseMode: (value: MouseMode) => void;
    getMouseStatus: () => ReturnType<InputHandler["getMouseStatus"]>;
    copySelectionToClipboard: () => Promise<boolean>;
    pasteFromClipboard: () => Promise<boolean>;
    dumpAtlasForCodepoint: (cp: number) => void;
    resize: (cols: number, rows: number) => void;
    focus: () => void;
    blur: () => void;
    updateSize: (force?: boolean) => void;
    getBackend: () => string;
    setShaderStages: (stages: ResttyShaderStage[]) => void;
    getShaderStages: () => ResttyShaderStage[];
    getRawPane: () => ResttyManagedAppPane;
};
/**
 * Thin wrapper around a managed pane that delegates calls to the
 * underlying app. Resolves the pane lazily so it stays valid across
 * layout changes.
 */
export declare class ResttyPaneHandle implements ResttyPaneApi {
    private readonly resolvePane;
    constructor(resolvePane: () => ResttyManagedAppPane);
    get id(): number;
    setRenderer(value: "auto" | "webgpu" | "webgl2"): void;
    setPaused(value: boolean): void;
    togglePause(): void;
    setFontSize(value: number): void;
    applyTheme(theme: GhosttyTheme, sourceLabel?: string): void;
    resetTheme(): void;
    sendInput(text: string, source?: string): void;
    sendKeyInput(text: string, source?: string): void;
    clearScreen(): void;
    connectPty(url?: string): void;
    disconnectPty(): void;
    isPtyConnected(): boolean;
    setMouseMode(value: MouseMode): void;
    getMouseStatus(): ReturnType<InputHandler["getMouseStatus"]>;
    copySelectionToClipboard(): Promise<boolean>;
    pasteFromClipboard(): Promise<boolean>;
    dumpAtlasForCodepoint(cp: number): void;
    resize(cols: number, rows: number): void;
    focus(): void;
    blur(): void;
    updateSize(force?: boolean): void;
    getBackend(): string;
    setShaderStages(stages: ResttyShaderStage[]): void;
    getShaderStages(): ResttyShaderStage[];
    getRawPane(): ResttyManagedAppPane;
}
