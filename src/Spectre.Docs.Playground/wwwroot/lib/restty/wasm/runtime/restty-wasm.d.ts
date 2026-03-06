import type { KittyPlacement, RenderState, ResttyWasmExports, ResttyWasmOptions, WasmAbi } from "./types";
/** WASM terminal core runtime with memory management and typed array caching. */
export declare class ResttyWasm {
    readonly exports: ResttyWasmExports;
    readonly abi: WasmAbi;
    readonly memory: WebAssembly.Memory;
    private readonly renderViewCaches;
    private constructor();
    /** Load and instantiate the embedded WASM module. */
    static load(options?: ResttyWasmOptions): Promise<ResttyWasm>;
    /** Create a new terminal instance and return its handle. */
    create(cols: number, rows: number, maxScrollback: number): number;
    /** Destroy a terminal instance and free its resources. */
    destroy(handle: number): void;
    private getRenderViewCache;
    /** Resize the terminal grid. */
    resize(handle: number, cols: number, rows: number): void;
    /** Set pixel dimensions for Kitty graphics protocol. */
    setPixelSize(handle: number, widthPx: number, heightPx: number): void;
    /** Update internal render buffers after state changes. */
    renderUpdate(handle: number): void;
    /** Scroll the viewport by delta rows. */
    scrollViewport(handle: number, delta: number): void;
    /** Read and clear pending output replies from terminal. */
    drainOutput(handle: number): string;
    /** Get active Kitty keyboard protocol flags. */
    getKittyKeyboardFlags(handle: number): number;
    /** Get all active Kitty graphics placements. */
    getKittyPlacements(handle: number): KittyPlacement[];
    /** Write text to terminal for processing. */
    write(handle: number, text: string): void;
    /** Set default colors for terminal (RGB packed as 0xRRGGBB). */
    setDefaultColors(handle: number, fg: number, bg: number, cursor: number): void;
    /** Set terminal color palette (RGB triples). */
    setPalette(handle: number, colors: Uint8Array, count: number): void;
    /** Reset terminal palette to defaults. */
    resetPalette(handle: number): void;
    /** Get current render state with cached typed array views. */
    getRenderState(handle: number): RenderState | null;
}
/** Load and instantiate the embedded WASM module (convenience function). */
export declare function loadResttyWasm(options?: ResttyWasmOptions): Promise<ResttyWasm>;
