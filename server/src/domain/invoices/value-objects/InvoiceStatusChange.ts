import type { InvoiceStatus } from './InvoiceStatus';

export interface InvoiceStatusChange {
    fromStatus: InvoiceStatus | null;
    toStatus: InvoiceStatus;
    reason: string;
    changedAt: Date;
    changedBy?: string | null;
}
