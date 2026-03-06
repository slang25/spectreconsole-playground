/** Rendering constraints for Nerd Font symbols (sizing, alignment, padding). */
export type NerdConstraint = {
    size?: "none" | "fit" | "cover" | "fit_cover1" | "stretch";
    align_horizontal?: "none" | "start" | "end" | "center" | "center1";
    align_vertical?: "none" | "start" | "end" | "center" | "center1";
    height?: "cell" | "icon";
    pad_left?: number;
    pad_right?: number;
    pad_top?: number;
    pad_bottom?: number;
    relative_width?: number;
    relative_height?: number;
    relative_x?: number;
    relative_y?: number;
    max_xy_ratio?: number;
    max_constraint_width?: number;
};
/** Codepoint range with associated rendering constraint. */
export type NerdConstraintRange = {
    start: number;
    end: number;
    constraint: NerdConstraint;
};
/** Nerd Font symbol rendering constraints by codepoint range. */
export declare const NERD_CONSTRAINTS: NerdConstraintRange[];
/** Binary search for the rendering constraint matching a Nerd Font codepoint, or null if none. */
export declare function getNerdConstraint(cp: number): NerdConstraint | null;
