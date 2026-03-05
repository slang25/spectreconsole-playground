import type { ResttyPaneStyleOptions } from "./panes-types";
/** Default style options for pane layout and appearance. */
export declare const DEFAULT_RESTTY_PANE_STYLE_OPTIONS: Required<ResttyPaneStyleOptions>;
/** Validates and normalizes pane style options, clamping numeric values to safe ranges and applying defaults. */
export declare function normalizePaneStyleOptions(options: ResttyPaneStyleOptions): Required<ResttyPaneStyleOptions>;
/** Injects the pane stylesheet into the document if not already present. */
export declare function ensureResttyPaneStylesDocument(doc: Document): void;
/** Applies pane style options to a root element via CSS custom properties. */
export declare function applyPaneStyleOptionsToRoot(root: HTMLElement, options: Readonly<Required<ResttyPaneStyleOptions>>): void;
/** Removes pane style class and custom properties from a root element. */
export declare function clearPaneStyleOptionsFromRoot(root: HTMLElement): void;
