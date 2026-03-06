import type { CreateDefaultResttyPaneContextMenuItemsOptions, ResttyPaneContextMenuItem, ResttyPaneWithApp } from "../panes-types";
/** Return the platform-appropriate shortcut modifier label ("Cmd" on macOS, "Ctrl" elsewhere). */
export declare function getResttyShortcutModifierLabel(): "Cmd" | "Ctrl";
/**
 * Build the standard right-click context menu items for a pane
 * (copy, paste, split, close, clear, PTY toggle, pause toggle).
 */
export declare function createDefaultResttyPaneContextMenuItems<TPane extends ResttyPaneWithApp>(options: CreateDefaultResttyPaneContextMenuItemsOptions<TPane>): Array<ResttyPaneContextMenuItem | "separator">;
