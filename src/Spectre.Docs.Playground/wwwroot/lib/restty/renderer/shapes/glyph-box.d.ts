import type { NerdConstraint } from "../../fonts/nerd-constraints";
import type { GlyphBox, NerdMetrics } from "./types";
/**
 * Apply a Nerd Font constraint to a glyph bounding box, adjusting size and
 * alignment to fit within the cell according to the constraint rules.
 */
export declare function constrainGlyphBox(glyph: GlyphBox, constraint: NerdConstraint, metrics: NerdMetrics, constraintWidth: number): GlyphBox;
