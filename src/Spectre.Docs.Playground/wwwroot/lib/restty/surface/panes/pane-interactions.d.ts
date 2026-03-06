import type { PaneContextMenuController } from "../panes-context-menu";
import type { ResttyPaneContextMenuOptions, ResttyPaneDefinition, ResttyPaneManager } from "../panes-types";
export declare function createPaneInteractions<TPane extends ResttyPaneDefinition>(options: {
    contextMenu: ResttyPaneContextMenuOptions<TPane> | null | undefined;
    contextMenuController: PaneContextMenuController<TPane> | null;
    getManager: () => ResttyPaneManager<TPane>;
    markPaneFocused: (id: number) => void;
}): {
    bindPaneInteractions: (pane: TPane) => void;
    cleanupPaneInteractions: (id: number) => void;
};
