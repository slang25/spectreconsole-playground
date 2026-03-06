import type { InputHandlerConfig } from "../types";
/**
 * Standard sequences used by terminal emulators.
 */
export declare const sequences: {
    enter: string;
    backspace: string;
    delete: string;
    tab: string;
    shiftTab: string;
    escape: string;
};
export declare const DEFAULT_CONFIG: Required<InputHandlerConfig>;
