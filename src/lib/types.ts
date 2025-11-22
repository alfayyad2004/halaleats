export type UnrecognizedProduct = {
    id: string;
    barcode: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
    reviewed: boolean;
    productName?: string;
    ingredients?: string;
    submittedByEmail?: string;
};
