/** Parse a DEC private mode set/reset sequence (CSI ? ... h/l) into mode codes and enabled state. */
export declare function parsePrivateModeSeq(seq: string): {
    codes: number[];
    enabled: boolean;
} | null;
/** Parse a window manipulation sequence (CSI ... t) into its numeric parameters. */
export declare function parseWindowOpSeq(seq: string): number[] | null;
/** Test whether a CSI sequence is a Device Attributes query (DA1/DA2/DA3). */
export declare function isDeviceAttributesQuery(seq: string): boolean;
