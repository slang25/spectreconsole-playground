export type ResttyPastePayload = {
    kind: "text";
    text: string;
};
export declare function readPastePayloadFromDataTransfer(dataTransfer: DataTransfer | null | undefined): ResttyPastePayload | null;
