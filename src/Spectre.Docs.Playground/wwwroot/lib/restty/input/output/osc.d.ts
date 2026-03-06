import type { DesktopNotification } from "../types";
export type OscColorProvider = () => {
    fg?: [number, number, number];
    bg?: [number, number, number];
    cursor?: [number, number, number];
};
export type OscHandlers = {
    sendReply: (data: string) => void;
    getDefaultColors?: OscColorProvider;
    onClipboardWrite?: (text: string) => void | Promise<void>;
    onClipboardRead?: () => string | null | Promise<string | null>;
    onDesktopNotification?: (notification: DesktopNotification) => void;
};
/** Handle intercepted OSC queries and side effects. Returns true when handled. */
export declare function handleOscSequence(seq: string, handlers: OscHandlers): boolean;
