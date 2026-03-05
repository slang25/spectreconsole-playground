import type { ResttyPaneContextMenuOptions, ResttyPaneDefinition, ResttyPaneManager } from "./panes-types";
/**
 * Context menu controller for pane right-click interactions.
 * - element: the menu DOM node
 * - isOpen: returns true if menu is currently visible
 * - containsTarget: checks if an event target is inside the menu
 * - show: displays the menu at client coordinates for a given pane
 * - hide: hides the menu
 * - destroy: removes the menu from the DOM
 */
export type PaneContextMenuController<TPane extends ResttyPaneDefinition> = {
    element: HTMLDivElement;
    isOpen: () => boolean;
    containsTarget: (target: EventTarget | null) => boolean;
    show: (pane: TPane, clientX: number, clientY: number, manager: ResttyPaneManager<TPane>) => void;
    hide: () => void;
    destroy: () => void;
};
/** Creates a context menu controller that renders menu items, handles positioning within viewport bounds, and manages click-to-hide behavior. */
export declare function createPaneContextMenuController<TPane extends ResttyPaneDefinition>(options: {
    contextMenu: ResttyPaneContextMenuOptions<TPane>;
    doc: Document;
    win: Window;
}): PaneContextMenuController<TPane>;
