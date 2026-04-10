import { createHash } from 'crypto';
import { ClientRepository } from '../../domain/clients/repositories/ClientRepository';
import { BusinessProfileRepository } from '../../domain/business-profile/repositories/BusinessProfileRepository';
import { Invoice } from '../../domain/invoices/entities/Invoice';
import { InvoiceLineItemProps } from '../../domain/invoices/entities/InvoiceLineItem';
import { InvoiceCreationRequestRepository } from '../../domain/invoices/repositories/InvoiceCreationRequestRepository';
import { InvoiceRepository } from '../../domain/invoices/repositories/InvoiceRepository';
import { Payment } from '../../domain/payments/entities/Payment';
import { PaymentRepository } from '../../domain/payments/repositories/PaymentRepository';

export interface CreateInvoiceCommand {
    workspaceId: string;
    businessId: string;
    clientId: string;
    invoiceDate: string;
    dueDate?: string | null;
    currency: string;
    lineItems: InvoiceLineItemProps[];
    extraFees?: number;
    notes?: string;
    terms?: string;
    createdBy?: string;
    idempotencyKey?: string;
}

export interface UpdateDraftInvoiceCommand {
    invoiceDate?: string;
    dueDate?: string | null;
    currency?: string;
    lineItems?: InvoiceLineItemProps[];
    extraFees?: number;
    notes?: string;
    terms?: string;
    updatedBy?: string;
}

export interface RecordPaymentCommand {
    invoiceId: string;
    paymentDate: string;
    amount: number;
    method: string;
    referenceNumber?: string;
    note?: string;
    createdBy?: string;
}

export interface DuplicateInvoiceCommand {
    sourceInvoiceId: string;
    duplicatedBy?: string;
}

export interface VoidInvoiceCommand {
    invoiceId: string;
    reason: string;
    voidedBy?: string;
}

export class InvoiceService {
    private static readonly CREATE_INVOICE_IDEMPOTENCY_TTL_MS = 1000 * 60 * 60 * 24;

    constructor(
        private readonly invoiceRepo: InvoiceRepository,
        private readonly paymentRepo: PaymentRepository,
        private readonly businessProfileRepo: BusinessProfileRepository,
        private readonly clientRepo: ClientRepository,
        private readonly invoiceCreationRequestRepo: InvoiceCreationRequestRepository
    ) { }

    async createInvoice(ownerUserId: string, cmd: CreateInvoiceCommand): Promise<ReturnType<Invoice['toSnapshot']>> {
        const normalizedIdempotencyKey = cmd.idempotencyKey?.trim();

        if (normalizedIdempotencyKey) {
            return this.createInvoiceWithIdempotency(ownerUserId, cmd, normalizedIdempotencyKey);
        }

        return this.createInvoiceRecord(ownerUserId, cmd);
    }

    private async createInvoiceWithIdempotency(
        ownerUserId: string,
        cmd: CreateInvoiceCommand,
        idempotencyKey: string
    ): Promise<ReturnType<Invoice['toSnapshot']>> {
        const requestHash = hashInvoiceCreationRequest(ownerUserId, cmd);
        const reservation = await this.invoiceCreationRequestRepo.reserve(
            cmd.workspaceId,
            idempotencyKey,
            requestHash,
            new Date(Date.now() + InvoiceService.CREATE_INVOICE_IDEMPOTENCY_TTL_MS)
        );

        if (!reservation.created) {
            if (reservation.record.requestHash !== requestHash) {
                throw new Error('Idempotency key has already been used with a different invoice creation request');
            }
            if (reservation.record.status === 'Completed' && reservation.record.invoiceId) {
                const existingInvoice = await this.invoiceRepo.findById(reservation.record.invoiceId, cmd.workspaceId);
                if (existingInvoice) {
                    return existingInvoice.toSnapshot();
                }
            }

            throw new Error('An invoice creation request with this idempotency key is already in progress');
        }

        try {
            const snapshot = await this.createInvoiceRecord(ownerUserId, cmd);
            await this.invoiceCreationRequestRepo.complete(reservation.record.id, snapshot.id);
            return snapshot;
        } catch (error) {
            await this.invoiceCreationRequestRepo.release(reservation.record.id);
            throw error;
        }
    }

    private async createInvoiceRecord(ownerUserId: string, cmd: CreateInvoiceCommand): Promise<ReturnType<Invoice['toSnapshot']>> {
        const invoiceDate = new Date(cmd.invoiceDate);
        const dueDate = cmd.dueDate ? new Date(cmd.dueDate) : null;
        await this.assertBusinessAndClient(cmd.workspaceId, cmd.businessId, cmd.clientId);
        const draftInvoiceNumber = await this.invoiceRepo.nextDraftInvoiceNumber(cmd.workspaceId, invoiceDate);

        const invoice = Invoice.create({
            ownerUserId,
            workspaceId: cmd.workspaceId,
            businessId: cmd.businessId,
            clientId: cmd.clientId,
            invoiceNumber: draftInvoiceNumber,
            invoiceDate,
            dueDate,
            currency: cmd.currency,
            lineItems: cmd.lineItems,
            extraFees: cmd.extraFees,
            notes: cmd.notes,
            terms: cmd.terms,
            createdBy: cmd.createdBy,
        });
        const saved = await this.invoiceRepo.save(invoice);
        return saved.toSnapshot();
    }

    async getInvoice(workspaceId: string, id: string): Promise<ReturnType<Invoice['toSnapshot']> | null> {
        const invoice = await this.invoiceRepo.findById(id, workspaceId);
        if (!invoice) {
            return null;
        }

        const renumbered = await this.repairLegacyInvoiceNumber(invoice);
        const reconciled = await this.reconcileInvoicePaymentState(renumbered);
        return reconciled.toSnapshot();
    }

    async getInvoicesByBusiness(workspaceId: string, businessId: string): Promise<ReturnType<Invoice['toSnapshot']>[]> {
        const invoices = await this.invoiceRepo.findByBusinessId(businessId, workspaceId);
        const repaired = await Promise.all(invoices.map((invoice) => this.repairLegacyInvoiceNumber(invoice)));
        const reconciled = await this.reconcileInvoicesPaymentState(repaired);
        return reconciled.map((invoice) => invoice.toSnapshot());
    }

    async getOverdueInvoices(workspaceId: string, businessId: string): Promise<ReturnType<Invoice['toSnapshot']>[]> {
        const invoices = await this.invoiceRepo.findByBusinessId(businessId, workspaceId);
        const repaired = await Promise.all(invoices.map((invoice) => this.repairLegacyInvoiceNumber(invoice)));
        const reconciled = await this.reconcileInvoicesPaymentState(repaired);
        return reconciled
            .filter((invoice) => invoice.collectionState.isOutstanding && invoice.dueDate !== null && invoice.dueDate < new Date())
            .map((invoice) => invoice.toSnapshot());
    }

    async updateDraftInvoice(
        workspaceId: string,
        id: string,
        cmd: UpdateDraftInvoiceCommand
    ): Promise<ReturnType<Invoice['toSnapshot']>> {
        const invoice = await this.invoiceRepo.findById(id, workspaceId);
        if (!invoice) throw new Error(`Invoice ${id} not found`);

        invoice.updateDraft({
            invoiceDate: cmd.invoiceDate ? new Date(cmd.invoiceDate) : undefined,
            dueDate: cmd.dueDate === undefined ? undefined : (cmd.dueDate ? new Date(cmd.dueDate) : null),
            currency: cmd.currency,
            lineItems: cmd.lineItems,
            extraFees: cmd.extraFees,
            notes: cmd.notes,
            terms: cmd.terms,
            updatedBy: cmd.updatedBy,
        });

        const updated = await this.invoiceRepo.update(invoice);
        return updated.toSnapshot();
    }

    async issueInvoice(workspaceId: string, id: string, issuedBy?: string): Promise<ReturnType<Invoice['toSnapshot']>> {
        const invoice = await this.invoiceRepo.findById(id, workspaceId);
        if (!invoice) throw new Error(`Invoice ${id} not found`);

        const reconciled = await this.reconcileInvoicePaymentState(invoice);
        if (!reconciled.grandTotal.isPositive()) {
            throw new Error('Invoices with a zero or negative total cannot be submitted');
        }
        const { business, client } = await this.getBusinessAndClient(workspaceId, reconciled.businessId, reconciled.clientId);
        const finalInvoiceNumber = await this.invoiceRepo.nextInvoiceNumber(reconciled.workspaceId, reconciled.invoiceDate);

        reconciled.issue(
            finalInvoiceNumber,
            {
                businessName: business.businessName,
                logoUrl: business.logoUrl,
                address: business.address,
                email: business.email,
                phone: business.phone,
                website: business.website,
                taxId: business.taxId,
                paymentInstructions: business.paymentInstructions,
            },
            {
                clientName: client.clientName,
                companyName: client.companyName,
                billingAddress: client.billingAddress,
                email: client.email,
                phone: client.phone,
                taxId: client.taxId,
            },
            issuedBy
        );

        const updated = await this.invoiceRepo.update(reconciled);
        return updated.toSnapshot();
    }

    async duplicateInvoice(workspaceId: string, cmd: DuplicateInvoiceCommand): Promise<ReturnType<Invoice['toSnapshot']>> {
        const source = await this.invoiceRepo.findById(cmd.sourceInvoiceId, workspaceId);
        if (!source) {
            throw new Error(`Invoice ${cmd.sourceInvoiceId} not found`);
        }

        const duplicatedAt = new Date();
        const draftInvoiceNumber = await this.invoiceRepo.nextDraftInvoiceNumber(source.workspaceId, duplicatedAt);
        const duplicate = source.duplicate(draftInvoiceNumber, duplicatedAt, cmd.duplicatedBy);
        const saved = await this.invoiceRepo.save(duplicate);
        return saved.toSnapshot();
    }

    async recordPayment(workspaceId: string, cmd: RecordPaymentCommand): Promise<ReturnType<Invoice['toSnapshot']>> {
        const invoice = await this.invoiceRepo.findById(cmd.invoiceId, workspaceId);
        if (!invoice) throw new Error(`Invoice ${cmd.invoiceId} not found`);

        const repairedInvoice = await this.repairLegacyInvoiceNumber(invoice);
        const payments = await this.paymentRepo.findByInvoiceId(cmd.invoiceId, workspaceId);
        const reconciledInvoice = await this.reconcileInvoicePaymentState(repairedInvoice, payments);
        reconciledInvoice.assertPaymentCanBeRecorded(cmd.amount);
        const normalizedReferenceNumber = cmd.referenceNumber?.trim();
        if (normalizedReferenceNumber && payments.some((payment) => payment.referenceNumber?.trim() === normalizedReferenceNumber)) {
            throw new Error('Duplicate payment reference numbers are not allowed for the same invoice');
        }

        const payment = Payment.create({
            ownerUserId: reconciledInvoice.ownerUserId,
            workspaceId,
            invoiceId: cmd.invoiceId,
            businessId: reconciledInvoice.businessId,
            currency: reconciledInvoice.currency,
            paymentDate: new Date(cmd.paymentDate),
            amount: cmd.amount,
            method: cmd.method,
            referenceNumber: cmd.referenceNumber,
            note: cmd.note,
            createdBy: cmd.createdBy,
        });
        const savedPayment = await this.paymentRepo.save(payment);

        reconciledInvoice.reconcilePayments(
            [
                ...payments.map((existingPayment) => ({
                    amount: existingPayment.amount,
                    paymentDate: existingPayment.paymentDate,
                })),
                {
                    amount: savedPayment.amount,
                    paymentDate: savedPayment.paymentDate,
                },
            ],
            cmd.createdBy
        );

        const updated = await this.invoiceRepo.update(reconciledInvoice);
        return updated.toSnapshot();
    }

    async cancelInvoice(workspaceId: string, id: string, reason: string, cancelledBy?: string): Promise<ReturnType<Invoice['toSnapshot']>> {
        const invoice = await this.invoiceRepo.findById(id, workspaceId);
        if (!invoice) throw new Error(`Invoice ${id} not found`);

        const reconciled = await this.reconcileInvoicePaymentState(invoice);
        reconciled.cancel(reason, cancelledBy);
        const updated = await this.invoiceRepo.update(reconciled);
        return updated.toSnapshot();
    }

    async voidInvoice(workspaceId: string, cmd: VoidInvoiceCommand): Promise<ReturnType<Invoice['toSnapshot']>> {
        const invoice = await this.invoiceRepo.findById(cmd.invoiceId, workspaceId);
        if (!invoice) throw new Error(`Invoice ${cmd.invoiceId} not found`);

        const reconciled = await this.reconcileInvoicePaymentState(invoice);
        reconciled.voidInvoice(cmd.reason, cmd.voidedBy);
        const updated = await this.invoiceRepo.update(reconciled);
        return updated.toSnapshot();
    }

    async getPaymentsByInvoice(workspaceId: string, invoiceId: string): Promise<Payment[]> {
        return this.paymentRepo.findByInvoiceId(invoiceId, workspaceId);
    }

    async deleteInvoice(workspaceId: string, id: string, deletedBy?: string): Promise<void> {
        const invoice = await this.invoiceRepo.findById(id, workspaceId);
        if (!invoice) {
            throw new Error(`Invoice ${id} not found`);
        }

        const payments = await this.paymentRepo.findByInvoiceId(id, workspaceId);
        if (payments.length > 0) {
            throw new Error('Invoices with recorded payments cannot be deleted');
        }
        if (invoice.status !== 'Draft') {
            throw new Error('Only Draft invoices can be deleted');
        }

        await this.invoiceRepo.delete(id, workspaceId, deletedBy);
    }

    private async assertBusinessAndClient(workspaceId: string, businessId: string, clientId: string): Promise<void> {
        const { client } = await this.getBusinessAndClient(workspaceId, businessId, clientId);
        if (client.businessId !== businessId) {
            throw new Error('Invoice client must belong to the same business');
        }
        if (!client.isActive) {
            throw new Error('Inactive clients cannot be selected for new invoices');
        }
    }

    private async getBusinessAndClient(workspaceId: string, businessId: string, clientId: string) {
        const [business, client] = await Promise.all([
            this.businessProfileRepo.findById(businessId, workspaceId),
            this.clientRepo.findById(clientId, workspaceId),
        ]);

        if (!business) {
            throw new Error(`Business profile ${businessId} not found`);
        }
        if (!client) {
            throw new Error(`Client ${clientId} not found`);
        }

        return { business, client };
    }

    private async reconcileInvoicePaymentState(
        invoice: Invoice,
        existingPayments?: Payment[]
    ): Promise<Invoice> {
        const payments = existingPayments ?? await this.paymentRepo.findByInvoiceId(invoice.id, invoice.workspaceId);
        const changed = invoice.reconcilePayments(
            payments.map((payment) => ({
                amount: payment.amount,
                paymentDate: payment.paymentDate,
            }))
        );

        if (changed) {
            await this.invoiceRepo.update(invoice);
        }

        return invoice;
    }

    private async reconcileInvoicesPaymentState(invoices: Invoice[]): Promise<Invoice[]> {
        if (invoices.length === 0) {
            return invoices;
        }

        const payments = await this.paymentRepo.findByInvoiceIds(invoices.map((invoice) => invoice.id), invoices[0].workspaceId);
        const paymentsByInvoiceId = new Map<string, Payment[]>();

        for (const payment of payments) {
            const invoicePayments = paymentsByInvoiceId.get(payment.invoiceId) ?? [];
            invoicePayments.push(payment);
            paymentsByInvoiceId.set(payment.invoiceId, invoicePayments);
        }

        for (const invoice of invoices) {
            const invoicePayments = paymentsByInvoiceId.get(invoice.id) ?? [];
            const changed = invoice.reconcilePayments(
                invoicePayments.map((payment) => ({
                    amount: payment.amount,
                    paymentDate: payment.paymentDate,
                }))
            );

            if (changed) {
                await this.invoiceRepo.update(invoice);
            }
        }

        return invoices;
    }

    private async repairLegacyInvoiceNumber(invoice: Invoice): Promise<Invoice> {
        const requiresFinalInvoiceNumber = ['Submitted', 'PartiallyPaid', 'Paid', 'Overdue', 'Cancelled'].includes(invoice.status);

        if (!requiresFinalInvoiceNumber || !invoice.invoiceNumber.startsWith('DRAFT-')) {
            return invoice;
        }

        const finalInvoiceNumber = await this.invoiceRepo.nextInvoiceNumber(invoice.workspaceId, invoice.invoiceDate);
        invoice.invoiceNumber = finalInvoiceNumber;
        await this.invoiceRepo.update(invoice);
        return invoice;
    }
}

function hashInvoiceCreationRequest(ownerUserId: string, cmd: CreateInvoiceCommand): string {
    return createHash('sha256')
        .update(JSON.stringify({
            ownerUserId,
            workspaceId: cmd.workspaceId,
            businessId: cmd.businessId,
            clientId: cmd.clientId,
            invoiceDate: cmd.invoiceDate,
            dueDate: cmd.dueDate ?? null,
            currency: cmd.currency,
            lineItems: cmd.lineItems.map((lineItem) => ({
                id: lineItem.id ?? null,
                itemName: lineItem.itemName,
                description: lineItem.description ?? null,
                unit: lineItem.unit ?? null,
                quantity: lineItem.quantity,
                unitPrice: lineItem.unitPrice,
                discountType: lineItem.discountType ?? 'Percentage',
                discountPercent: lineItem.discountPercent,
                taxPercent: lineItem.taxPercent ?? null,
                taxes: lineItem.taxes ?? [],
            })),
            extraFees: cmd.extraFees ?? 0,
            notes: cmd.notes ?? null,
            terms: cmd.terms ?? null,
        }))
        .digest('hex');
}
