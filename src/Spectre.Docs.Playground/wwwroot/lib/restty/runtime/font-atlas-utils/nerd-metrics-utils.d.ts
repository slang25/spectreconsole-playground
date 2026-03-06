import type { Font } from "../../fonts";
import type { GlyphConstraintMeta, AtlasConstraintContext } from "../atlas-builder";
export declare function resolveFontScaleForAtlas(font: Font | null | undefined, fontSize: number, sizeMode?: "em" | "height" | null): number;
export declare function fontCapHeightUnits(font: Font | null | undefined): number;
export declare function buildNerdMetrics(cellW: number, cellH: number, lineHeight: number, primaryFont: Font | null | undefined, primaryScale: number, iconScale: number): {
    cellWidth: number;
    cellHeight: number;
    faceWidth: number;
    faceHeight: number;
    faceY: number;
    iconHeight: number;
    iconHeightSingle: number;
};
export declare function nerdConstraintSignature(glyphMeta?: Map<number, GlyphConstraintMeta>, constraintContext?: AtlasConstraintContext | null): string;
export declare function tightenNerdConstraintBox(box: {
    x: number;
    y: number;
    width: number;
    height: number;
}, constraint: import("../../fonts").NerdConstraint | null): {
    x: number;
    y: number;
    width: number;
    height: number;
};
