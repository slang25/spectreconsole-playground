export declare function openLink(uri: string): void;
export declare function sourceLabelFromUrl(url: string, index: number): string;
export declare function sourceBufferFromView(view: ArrayBufferView): ArrayBuffer;
export declare function normalizeNewlines(text: string): string;
export declare function fitTextTailToWidth(text: string, maxWidthPx: number, measureWidthPx: (value: string) => number): {
    text: string;
    offset: number;
    widthPx: number;
};
