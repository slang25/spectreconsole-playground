import type { InputHandler, InputHandlerOptions } from "./types";
/**
 * Create a terminal input handler with key, IME, PTY, and mouse support.
 */
export declare function createInputHandler(options?: InputHandlerOptions): InputHandler;
export type { CellPosition, CursorPosition, InputHandler, InputHandlerConfig, InputHandlerOptions, MouseMode, MouseStatus, DesktopNotification, } from "./types";
