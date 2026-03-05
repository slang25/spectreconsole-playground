import type { ResttyPaneDefinition, ResttyPaneSplitDirection } from "../panes-types";
export declare function findClosestPaneToRect<TPane extends ResttyPaneDefinition>(sourceRect: DOMRectReadOnly | null, panes: Iterable<TPane>): TPane | null;
export declare function collapseSplitAncestors(start: HTMLElement | null): void;
export declare function createSplitDividerFactory(options: {
    minPaneSize: number;
    requestLayoutSync: () => void;
}): {
    createSplitDivider: (direction: ResttyPaneSplitDirection) => HTMLDivElement;
};
