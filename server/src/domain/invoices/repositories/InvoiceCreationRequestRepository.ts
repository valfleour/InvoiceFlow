export interface InvoiceCreationRequestRecord {
    id: string;
    workspaceId: string;
    idempotencyKey: string;
    requestHash: string;
    status: 'InProgress' | 'Completed';
    invoiceId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

export interface ReserveInvoiceCreationRequestResult {
    record: InvoiceCreationRequestRecord;
    created: boolean;
}

export interface InvoiceCreationRequestRepository {
    reserve(
        workspaceId: string,
        idempotencyKey: string,
        requestHash: string,
        expiresAt: Date
    ): Promise<ReserveInvoiceCreationRequestResult>;
    complete(id: string, invoiceId: string): Promise<void>;
    release(id: string): Promise<void>;
}
