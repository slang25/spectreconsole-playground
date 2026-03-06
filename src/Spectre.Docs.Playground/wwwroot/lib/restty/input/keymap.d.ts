import type { InputHandlerConfig } from "./types";
import { sequences } from "./keymap/constants";
export { sequences };
/**
 * Encode a KeyboardEvent into a terminal byte sequence.
 */
export declare function encodeKeyEvent(event: KeyboardEvent, config?: InputHandlerConfig, kittyFlags?: number): string;
/**
 * Encode beforeinput events (IME/paste/backspace) into terminal sequences.
 */
export declare function encodeBeforeInput(event: InputEvent): string;
/**
 * Map input sequences to PTY expectations (e.g., DEL vs backspace).
 */
export declare function mapKeyForPty(seq: string): string;
