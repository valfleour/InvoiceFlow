export interface InvoiceIssuerSnapshot {
    businessName: string;
    logoUrl?: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    email: string;
    phone: string;
    website?: string;
    taxId?: string;
    paymentInstructions?: string;
}

export interface InvoiceClientSnapshot {
    clientName: string;
    companyName?: string;
    billingAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    email: string;
    phone?: string;
    taxId?: string;
}

export interface InvoiceIssuedLineItemSnapshot {
    itemName: string;
    description?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    discountType: 'Percentage';
    discountPercent: number;
    taxPercent: number;
    taxes: Array<{
        code: string;
        name?: string;
        ratePercent: number;
        calculationType: 'Percentage';
    }>;
    lineTotal: number;
}

export interface InvoiceIssueSnapshot {
    issuer: InvoiceIssuerSnapshot;
    client: InvoiceClientSnapshot;
    lineItems: InvoiceIssuedLineItemSnapshot[];
    totals: {
        subtotal: number;
        discountTotal: number;
        taxTotal: number;
        extraFees: number;
        grandTotal: number;
        amountPaid: number;
        balanceDue: number;
    };
    capturedAt: Date;
}
