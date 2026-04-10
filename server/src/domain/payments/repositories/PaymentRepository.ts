import { Payment } from '../entities/Payment';

export interface PaymentRepository {
    findById(id: string, workspaceId: string): Promise<Payment | null>;
    findByInvoiceId(invoiceId: string, workspaceId: string): Promise<Payment[]>;
    findByInvoiceIds(invoiceIds: string[], workspaceId: string): Promise<Payment[]>;
    save(payment: Payment): Promise<Payment>;
}
