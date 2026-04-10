import { Invoice } from '../entities/Invoice';

export interface InvoiceRepository {
    findById(id: string, workspaceId: string): Promise<Invoice | null>;
    findByBusinessId(businessId: string, workspaceId: string): Promise<Invoice[]>;
    findOverdue(businessId: string, workspaceId: string): Promise<Invoice[]>;
    existsByClientId(clientId: string, workspaceId: string): Promise<boolean>;
    existsByBusinessId(businessId: string, workspaceId: string): Promise<boolean>;
    save(invoice: Invoice): Promise<Invoice>;
    update(invoice: Invoice): Promise<Invoice>;
    nextDraftInvoiceNumber(workspaceId: string, invoiceDate: Date): Promise<string>;
    nextInvoiceNumber(workspaceId: string, invoiceDate: Date): Promise<string>;
    delete(id: string, workspaceId: string, deletedBy?: string): Promise<void>;
}
