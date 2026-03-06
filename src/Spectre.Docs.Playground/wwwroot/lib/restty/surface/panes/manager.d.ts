import type { CreateResttyPaneManagerOptions, ResttyPaneDefinition, ResttyPaneManager } from "../panes-types";
export declare function createResttyPaneManager<TPane extends ResttyPaneDefinition>(options: CreateResttyPaneManagerOptions<TPane>): ResttyPaneManager<TPane>;
