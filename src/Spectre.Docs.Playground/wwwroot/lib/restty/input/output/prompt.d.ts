export type PromptState = {
    semanticPromptSeen: boolean;
    promptClickEvents: boolean;
    promptInputActive: boolean;
    commandRunning: boolean;
};
export declare function createPromptState(): PromptState;
export declare function isPromptClickEventsEnabled(state: PromptState, altScreen: boolean): boolean;
export declare function observeSemanticPromptOsc(state: PromptState, action: string, options: string): void;
/** Observe OSC 133 prompt metadata and update prompt state. */
export declare function observeOscPromptState(state: PromptState, seq: string): void;
