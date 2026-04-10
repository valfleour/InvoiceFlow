import { Invoice } from '../../../domain/invoices/entities/Invoice';
import { InvoiceRepository } from '../../../domain/invoices/repositories/InvoiceRepository';
import { InvoiceCounterModel } from '../schemas/InvoiceCounterSchema';
import { InvoiceModel } from '../schemas/InvoiceSchema';

export class MongoInvoiceRepository implements InvoiceRepository {
    async findById(id: string, workspaceId: string): Promise<Invoice | null> {
        const doc = await InvoiceModel.findOne({ _id: id, workspaceId, deletedAt: null }).lean();
        if (!doc) return null;
        return this.toDomain(doc);
    }

    async findByBusinessId(businessId: string, workspaceId: string): Promise<Invoice[]> {
        const docs = await InvoiceModel.find({ businessId, workspaceId, deletedAt: null })
            .sort({ createdAt: -1 })
            .lean();
        return docs.map((doc) => this.toDomain(doc));
    }

    async findOverdue(businessId: string, workspaceId: string): Promise<Invoice[]> {
        const now = new Date();
        const docs = await InvoiceModel.find({
            businessId,
            workspaceId,
            deletedAt: null,
            dueDate: { $lt: now },
            status: { $in: ['Submitted', 'Issued', 'PartiallyPaid'] },
            balanceDue: { $gt: 0 },
        }).lean();
        return docs.map((doc) => this.toDomain(doc));
    }

    async existsByClientId(clientId: string, workspaceId: string): Promise<boolean> {
        const count = await InvoiceModel.countDocuments({ clientId, workspaceId, deletedAt: null });
        return count > 0;
    }

    async existsByBusinessId(businessId: string, workspaceId: string): Promise<boolean> {
        const count = await InvoiceModel.countDocuments({ businessId, workspaceId, deletedAt: null });
        return count > 0;
    }

    async save(invoice: Invoice): Promise<Invoice> {
        const snapshot = invoice.toSnapshot();
        const doc = await InvoiceModel.create({
            ownerUserId: snapshot.ownerUserId,
            workspaceId: snapshot.workspaceId,
            businessId: snapshot.businessId,
            clientId: snapshot.clientId,
            invoiceNumber: snapshot.invoiceNumber,
            invoiceDate: snapshot.invoiceDate,
            dueDate: snapshot.dueDate,
            status: snapshot.status,
            currency: snapshot.currency,
            lineItems: snapshot.lineItems,
            subtotal: snapshot.subtotal,
            discountTotal: snapshot.discountTotal,
            taxTotal: snapshot.taxTotal,
            extraFees: snapshot.extraFees,
            grandTotal: snapshot.grandTotal,
            amountPaid: snapshot.amountPaid,
            balanceDue: snapshot.balanceDue,
            notes: snapshot.notes,
            terms: snapshot.terms,
            createdBy: snapshot.createdBy,
            updatedBy: snapshot.updatedBy,
            deletedAt: snapshot.deletedAt,
            deletedBy: snapshot.deletedBy,
            origin: snapshot.origin,
            ownership: {
                ...snapshot.ownership,
                primaryBusinessId: snapshot.ownership.primaryBusinessId,
                associatedBusinessIds: snapshot.ownership.associatedBusinessIds,
            },
            issuance: snapshot.issuance,
            automation: snapshot.automation,
            presentation: snapshot.presentation,
            configuration: snapshot.configuration,
            statusHistory: snapshot.statusHistory,
            issueSnapshot: snapshot.issueSnapshot ?? undefined,
            submittedAt: snapshot.submittedAt,
            submittedBy: snapshot.submittedBy,
            issuedAt: snapshot.issuedAt,
            issuedBy: snapshot.issuedBy,
            paidAt: snapshot.paidAt,
            cancelledAt: snapshot.cancelledAt,
            cancelledBy: snapshot.cancelledBy,
            cancellationReason: snapshot.cancellationReason,
            voidedAt: snapshot.voidedAt,
            voidedBy: snapshot.voidedBy,
            voidReason: snapshot.voidReason,
        });
        return this.toDomain(doc.toObject());
    }

    async update(invoice: Invoice): Promise<Invoice> {
        const snapshot = invoice.toSnapshot();
        await InvoiceModel.findOneAndUpdate({ _id: invoice.id, workspaceId: invoice.workspaceId, deletedAt: null }, {
            invoiceNumber: snapshot.invoiceNumber,
            invoiceDate: snapshot.invoiceDate,
            dueDate: snapshot.dueDate,
            status: snapshot.status,
            currency: snapshot.currency,
            lineItems: snapshot.lineItems,
            subtotal: snapshot.subtotal,
            discountTotal: snapshot.discountTotal,
            taxTotal: snapshot.taxTotal,
            extraFees: snapshot.extraFees,
            grandTotal: snapshot.grandTotal,
            amountPaid: snapshot.amountPaid,
            balanceDue: snapshot.balanceDue,
            notes: snapshot.notes,
            terms: snapshot.terms,
            updatedBy: snapshot.updatedBy,
            updatedAt: snapshot.updatedAt,
            deletedAt: snapshot.deletedAt,
            deletedBy: snapshot.deletedBy,
            origin: snapshot.origin,
            ownership: snapshot.ownership,
            issuance: snapshot.issuance,
            automation: snapshot.automation,
            presentation: snapshot.presentation,
            configuration: snapshot.configuration,
            statusHistory: snapshot.statusHistory,
            issueSnapshot: snapshot.issueSnapshot,
            submittedAt: snapshot.submittedAt,
            submittedBy: snapshot.submittedBy,
            issuedAt: snapshot.issuedAt,
            issuedBy: snapshot.issuedBy,
            paidAt: snapshot.paidAt,
            cancelledAt: snapshot.cancelledAt,
            cancelledBy: snapshot.cancelledBy,
            cancellationReason: snapshot.cancellationReason,
            voidedAt: snapshot.voidedAt,
            voidedBy: snapshot.voidedBy,
            voidReason: snapshot.voidReason,
        });
        return invoice;
    }

    async nextInvoiceNumber(workspaceId: string, invoiceDate: Date): Promise<string> {
        const counter = await InvoiceCounterModel.findOneAndUpdate(
            { workspaceId },
            { $inc: { nextSequence: 1 } },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        ).lean();

        return `INV-${invoiceDate.getUTCFullYear()}-${String(counter.nextSequence).padStart(4, '0')}`;
    }

    async nextDraftInvoiceNumber(workspaceId: string, invoiceDate: Date): Promise<string> {
        const counter = await InvoiceCounterModel.findOneAndUpdate(
            { workspaceId },
            { $inc: { nextDraftSequence: 1 } },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        ).lean();

        return `DRAFT-${invoiceDate.getUTCFullYear()}-${String(counter.nextDraftSequence).padStart(4, '0')}`;
    }

    async delete(id: string, workspaceId: string, deletedBy?: string): Promise<void> {
        const now = new Date();

        await InvoiceModel.findOneAndUpdate(
            { _id: id, workspaceId, deletedAt: null },
            {
                deletedAt: now,
                deletedBy: deletedBy ?? null,
                updatedAt: now,
                updatedBy: deletedBy ?? null,
            }
        );
    }

    private toDomain(doc: any): Invoice {
        const hasCompleteIssueSnapshot = Boolean(
            doc.issueSnapshot
            && doc.issueSnapshot.issuer
            && doc.issueSnapshot.client
            && doc.issueSnapshot.totals
            && doc.issueSnapshot.capturedAt
        );

        return Invoice.reconstitute({
            id: doc._id.toString(),
            workspaceId: doc.workspaceId,
            ownerUserId: doc.ownerUserId,
            businessId: doc.businessId.toString(),
            clientId: doc.clientId.toString(),
            invoiceNumber: doc.invoiceNumber,
            invoiceDate: new Date(doc.invoiceDate),
            dueDate: doc.dueDate ? new Date(doc.dueDate) : null,
            status: doc.status === 'Issued' ? 'Submitted' : doc.status,
            currency: doc.currency,
            lineItems: doc.lineItems.map((li: any) => ({
                id: li.id,
                itemName: li.itemName,
                description: li.description,
                unit: li.unit,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                discountType: li.discountType,
                discountPercent: li.discountPercent,
                taxPercent: li.taxPercent,
                taxes: li.taxes,
            })),
            extraFees: doc.extraFees,
            amountPaid: doc.amountPaid,
            notes: doc.notes,
            terms: doc.terms,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
            createdBy: doc.createdBy,
            updatedBy: doc.updatedBy,
            deletedAt: doc.deletedAt ? new Date(doc.deletedAt) : null,
            deletedBy: doc.deletedBy,
            origin: doc.origin ? {
                kind: doc.origin.kind,
                sourceDocumentId: doc.origin.sourceDocumentId,
                sourceDocumentNumber: doc.origin.sourceDocumentNumber,
            } : undefined,
            ownership: doc.ownership ? {
                mode: doc.ownership.mode,
                primaryBusinessId: doc.ownership.primaryBusinessId.toString(),
                associatedBusinessIds: doc.ownership.associatedBusinessIds.map((id: any) => id.toString()),
            } : undefined,
            issuance: doc.issuance ? {
                mode: doc.issuance.mode,
                approvalState: doc.issuance.approvalState,
                requestedAt: doc.issuance.requestedAt ? new Date(doc.issuance.requestedAt) : null,
                approvedAt: doc.issuance.approvedAt ? new Date(doc.issuance.approvedAt) : null,
                rejectedAt: doc.issuance.rejectedAt ? new Date(doc.issuance.rejectedAt) : null,
                approvedBy: doc.issuance.approvedBy,
                rejectedBy: doc.issuance.rejectedBy,
            } : undefined,
            automation: doc.automation ? {
                recurrenceScheduleId: doc.automation.recurrenceScheduleId,
                reminderPolicyId: doc.automation.reminderPolicyId,
                portalAccess: doc.automation.portalAccess,
            } : undefined,
            presentation: doc.presentation ? {
                templateId: doc.presentation.templateId,
            } : undefined,
            configuration: doc.configuration ? {
                currencyCode: doc.configuration.currencyCode,
                taxMode: doc.configuration.taxMode,
                taxRulesetId: doc.configuration.taxRulesetId,
                jurisdictionCode: doc.configuration.jurisdictionCode,
            } : undefined,
            statusHistory: doc.statusHistory?.map((entry: any) => ({
                fromStatus: entry.fromStatus,
                toStatus: entry.toStatus,
                reason: entry.reason,
                changedAt: new Date(entry.changedAt),
                changedBy: entry.changedBy,
            })) ?? [],
            issueSnapshot: hasCompleteIssueSnapshot ? {
                issuer: doc.issueSnapshot.issuer,
                client: doc.issueSnapshot.client,
                lineItems: doc.issueSnapshot.lineItems ?? [],
                totals: doc.issueSnapshot.totals,
                capturedAt: new Date(doc.issueSnapshot.capturedAt),
            } : null,
            submittedAt: doc.submittedAt ? new Date(doc.submittedAt) : (doc.issuedAt ? new Date(doc.issuedAt) : null),
            submittedBy: doc.submittedBy ?? doc.issuedBy ?? null,
            issuedAt: doc.issuedAt ? new Date(doc.issuedAt) : null,
            issuedBy: doc.issuedBy,
            paidAt: doc.paidAt ? new Date(doc.paidAt) : null,
            cancelledAt: doc.cancelledAt ? new Date(doc.cancelledAt) : null,
            cancelledBy: doc.cancelledBy,
            cancellationReason: doc.cancellationReason,
            voidedAt: doc.voidedAt ? new Date(doc.voidedAt) : null,
            voidedBy: doc.voidedBy,
            voidReason: doc.voidReason,
        });
    }
}
