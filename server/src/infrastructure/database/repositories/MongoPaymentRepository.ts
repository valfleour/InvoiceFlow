import { Payment } from '../../../domain/payments/entities/Payment';
import { PaymentRepository } from '../../../domain/payments/repositories/PaymentRepository';
import { PaymentModel } from '../schemas/PaymentSchema';

export class MongoPaymentRepository implements PaymentRepository {
    async findById(id: string, workspaceId: string): Promise<Payment | null> {
        const doc = await PaymentModel.findOne({ _id: id, workspaceId, deletedAt: null }).lean();
        if (!doc) return null;
        return Payment.reconstitute({
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            ownerUserId: doc.ownerUserId,
            invoiceId: doc.invoiceId.toString(),
            businessId: doc.businessId.toString(),
            currency: doc.currency,
            paymentDate: new Date(doc.paymentDate),
            amount: doc.amount,
            method: doc.method,
            referenceNumber: doc.referenceNumber,
            note: doc.note,
            createdAt: doc.createdAt,
            createdBy: doc.createdBy,
            updatedAt: doc.updatedAt,
            updatedBy: doc.updatedBy,
            deletedAt: doc.deletedAt,
            deletedBy: doc.deletedBy,
        });
    }

    async findByInvoiceId(invoiceId: string, workspaceId: string): Promise<Payment[]> {
        const docs = await PaymentModel.find({ invoiceId, workspaceId, deletedAt: null }).sort({ createdAt: -1 }).lean();
        return docs.map((doc) =>
            Payment.reconstitute({
                id: doc._id.toString(),
                workspaceId: doc.workspaceId,
                ownerUserId: doc.ownerUserId,
                invoiceId: doc.invoiceId.toString(),
                businessId: doc.businessId.toString(),
                currency: doc.currency,
                paymentDate: new Date(doc.paymentDate),
                amount: doc.amount,
                method: doc.method,
                referenceNumber: doc.referenceNumber,
                note: doc.note,
                createdAt: doc.createdAt,
                createdBy: doc.createdBy,
                updatedAt: doc.updatedAt,
                updatedBy: doc.updatedBy,
                deletedAt: doc.deletedAt,
                deletedBy: doc.deletedBy,
            })
        );
    }

    async findByInvoiceIds(invoiceIds: string[], workspaceId: string): Promise<Payment[]> {
        if (invoiceIds.length === 0) {
            return [];
        }

        const docs = await PaymentModel.find({
            invoiceId: { $in: invoiceIds },
            workspaceId,
            deletedAt: null,
        }).sort({ createdAt: -1 }).lean();

        return docs.map((doc) =>
            Payment.reconstitute({
                id: doc._id.toString(),
                workspaceId: doc.workspaceId,
                ownerUserId: doc.ownerUserId,
                invoiceId: doc.invoiceId.toString(),
                businessId: doc.businessId.toString(),
                currency: doc.currency,
                paymentDate: new Date(doc.paymentDate),
                amount: doc.amount,
                method: doc.method,
                referenceNumber: doc.referenceNumber,
                note: doc.note,
                createdAt: doc.createdAt,
                createdBy: doc.createdBy,
                updatedAt: doc.updatedAt,
                updatedBy: doc.updatedBy,
                deletedAt: doc.deletedAt,
                deletedBy: doc.deletedBy,
            })
        );
    }

    async save(payment: Payment): Promise<Payment> {
        const doc = await PaymentModel.create({
            ownerUserId: payment.ownerUserId,
            workspaceId: payment.workspaceId,
            invoiceId: payment.invoiceId,
            businessId: payment.businessId,
            currency: payment.currency,
            paymentDate: payment.paymentDate,
            amount: payment.amount,
            method: payment.method,
            referenceNumber: payment.referenceNumber,
            note: payment.note,
            createdBy: payment.createdBy,
            updatedBy: payment.updatedBy,
            deletedAt: payment.deletedAt,
            deletedBy: payment.deletedBy,
        });

        return Payment.reconstitute({
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            ownerUserId: doc.ownerUserId,
            invoiceId: doc.invoiceId.toString(),
            businessId: doc.businessId.toString(),
            currency: doc.currency,
            paymentDate: doc.paymentDate,
            amount: doc.amount,
            method: doc.method,
            referenceNumber: doc.referenceNumber,
            note: doc.note,
            createdAt: doc.createdAt,
            createdBy: doc.createdBy,
            updatedAt: doc.updatedAt,
            updatedBy: doc.updatedBy,
            deletedAt: doc.deletedAt,
            deletedBy: doc.deletedBy,
        });
    }
}
