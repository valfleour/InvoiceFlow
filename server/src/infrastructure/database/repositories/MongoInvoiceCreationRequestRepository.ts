import {
    InvoiceCreationRequestRecord,
    InvoiceCreationRequestRepository,
    ReserveInvoiceCreationRequestResult,
} from '../../../domain/invoices/repositories/InvoiceCreationRequestRepository';
import { InvoiceCreationRequestModel } from '../schemas/InvoiceCreationRequestSchema';

export class MongoInvoiceCreationRequestRepository implements InvoiceCreationRequestRepository {
    async reserve(
        workspaceId: string,
        idempotencyKey: string,
        requestHash: string,
        expiresAt: Date
    ): Promise<ReserveInvoiceCreationRequestResult> {
        const normalizedKey = idempotencyKey.trim();

        try {
            const doc = await InvoiceCreationRequestModel.create({
                workspaceId,
                idempotencyKey: normalizedKey,
                requestHash,
                status: 'InProgress',
                invoiceId: null,
                expiresAt,
            });

            return {
                record: this.toRecord(doc.toObject()),
                created: true,
            };
        } catch (error) {
            const duplicateError = error as Error & { code?: number };

            if (duplicateError.code !== 11000) {
                throw error;
            }

            const existing = await InvoiceCreationRequestModel.findOne({ workspaceId, idempotencyKey: normalizedKey }).lean();

            if (!existing) {
                throw error;
            }

            return {
                record: this.toRecord(existing),
                created: false,
            };
        }
    }

    async complete(id: string, invoiceId: string): Promise<void> {
        await InvoiceCreationRequestModel.findByIdAndUpdate(id, {
            status: 'Completed',
            invoiceId,
        });
    }

    async release(id: string): Promise<void> {
        await InvoiceCreationRequestModel.findByIdAndDelete(id);
    }

    private toRecord(doc: any): InvoiceCreationRequestRecord {
        return {
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            idempotencyKey: doc.idempotencyKey,
            requestHash: doc.requestHash,
            status: doc.status,
            invoiceId: doc.invoiceId ? doc.invoiceId.toString() : null,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
            expiresAt: new Date(doc.expiresAt),
        };
    }
}
