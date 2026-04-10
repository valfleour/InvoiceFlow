import { v4 as uuidv4 } from 'uuid';
import { Money } from '../../shared/value-objects/Money';
import { InvoiceLineItem, InvoiceLineItemProps } from './InvoiceLineItem';
import { InvoiceStatus } from '../value-objects/InvoiceStatus';
import { InvoiceStatusChange } from '../value-objects/InvoiceStatusChange';
import {
    InvoiceClientSnapshot,
    InvoiceIssueSnapshot,
    InvoiceIssuerSnapshot,
} from '../value-objects/InvoiceIssueSnapshot';
import {
    defaultInvoiceAutomation,
    defaultInvoiceConfiguration,
    defaultInvoiceIssuance,
    defaultInvoiceOrigin,
    defaultInvoiceOwnership,
    defaultInvoicePresentation,
    InvoiceAutomation,
    InvoiceConfiguration,
    InvoiceIssuance,
    InvoiceOrigin,
    InvoiceOwnership,
    InvoicePresentation,
} from '../value-objects/InvoiceContext';

export interface InvoiceProps {
    id?: string;
    workspaceId: string;
    ownerUserId: string;
    businessId: string;
    clientId: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date | null;
    status: InvoiceStatus;
    currency: string;
    lineItems: InvoiceLineItemProps[];
    extraFees?: number;
    notes?: string;
    terms?: string;
    amountPaid?: number;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
    deletedAt?: Date | null;
    deletedBy?: string | null;
    origin?: InvoiceOrigin;
    ownership?: InvoiceOwnership;
    issuance?: InvoiceIssuance;
    automation?: InvoiceAutomation;
    presentation?: InvoicePresentation;
    configuration?: InvoiceConfiguration;
    statusHistory?: InvoiceStatusChange[];
    issueSnapshot?: InvoiceIssueSnapshot | null;
    submittedAt?: Date | null;
    submittedBy?: string | null;
    issuedAt?: Date | null;
    issuedBy?: string | null;
    paidAt?: Date | null;
    cancelledAt?: Date | null;
    cancelledBy?: string | null;
    cancellationReason?: string | null;
    voidedAt?: Date | null;
    voidedBy?: string | null;
    voidReason?: string | null;
}

export class Invoice {
    public readonly id: string;
    public readonly workspaceId: string;
    public readonly ownerUserId: string;
    public readonly businessId: string;
    public readonly clientId: string;
    public invoiceNumber: string;
    public invoiceDate: Date;
    public dueDate: Date | null;
    public status: InvoiceStatus;
    public currency: string;
    public lineItems: InvoiceLineItem[];
    public extraFees: Money;
    public notes?: string;
    public terms?: string;
    private _amountPaid: Money;
    public createdAt: Date;
    public updatedAt: Date;
    public createdBy?: string | null;
    public updatedBy?: string | null;
    public deletedAt?: Date | null;
    public deletedBy?: string | null;
    public origin: InvoiceOrigin;
    public ownership: InvoiceOwnership;
    public issuance: InvoiceIssuance;
    public automation: InvoiceAutomation;
    public presentation: InvoicePresentation;
    public configuration: InvoiceConfiguration;
    public statusHistory: InvoiceStatusChange[];
    public issueSnapshot?: InvoiceIssueSnapshot | null;
    public submittedAt?: Date | null;
    public submittedBy?: string | null;
    public issuedAt?: Date | null;
    public issuedBy?: string | null;
    public paidAt?: Date | null;
    public cancelledAt?: Date | null;
    public cancelledBy?: string | null;
    public cancellationReason?: string | null;
    public voidedAt?: Date | null;
    public voidedBy?: string | null;
    public voidReason?: string | null;

    private constructor(props: InvoiceProps, items: InvoiceLineItem[]) {
        this.id = props.id ?? '';
        this.workspaceId = props.workspaceId;
        this.ownerUserId = props.ownerUserId;
        this.businessId = props.businessId;
        this.clientId = props.clientId;
        this.invoiceNumber = props.invoiceNumber;
        this.invoiceDate = props.invoiceDate;
        this.dueDate = props.dueDate ?? null;
        this.status = props.status;
        this.currency = props.currency;
        this.lineItems = items;
        this.extraFees = Money.fromAmount(props.extraFees ?? 0, props.currency);
        this.notes = props.notes;
        this.terms = props.terms;
        this._amountPaid = Money.fromAmount(props.amountPaid ?? 0, props.currency);
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
        this.createdBy = props.createdBy ?? null;
        this.updatedBy = props.updatedBy ?? props.createdBy ?? null;
        this.deletedAt = props.deletedAt ?? null;
        this.deletedBy = props.deletedBy ?? null;
        this.origin = props.origin ?? defaultInvoiceOrigin();
        this.ownership = props.ownership ?? defaultInvoiceOwnership(props.businessId);
        this.issuance = props.issuance ?? defaultInvoiceIssuance();
        this.automation = props.automation ?? defaultInvoiceAutomation();
        this.presentation = props.presentation ?? defaultInvoicePresentation();
        this.configuration = props.configuration ?? defaultInvoiceConfiguration(props.currency);
        this.statusHistory = props.statusHistory ?? [];
        this.issueSnapshot = props.issueSnapshot ?? null;
        this.submittedAt = props.submittedAt ?? props.issuedAt ?? null;
        this.submittedBy = props.submittedBy ?? props.issuedBy ?? null;
        this.issuedAt = props.issuedAt ?? null;
        this.issuedBy = props.issuedBy ?? null;
        this.paidAt = props.paidAt ?? null;
        this.cancelledAt = props.cancelledAt ?? null;
        this.cancelledBy = props.cancelledBy ?? null;
        this.cancellationReason = props.cancellationReason ?? null;
        this.voidedAt = props.voidedAt ?? null;
        this.voidedBy = props.voidedBy ?? null;
        this.voidReason = props.voidReason ?? null;
    }

    static create(props: Omit<InvoiceProps, 'status'>): Invoice {
        if (!props.workspaceId) throw new Error('Invoice workspace is required');
        if (!props.ownerUserId) throw new Error('Invoice owner is required');
        if (!props.businessId) throw new Error('Invoice must belong to a business');
        if (!props.clientId) throw new Error('Invoice must have a client');
        if (!props.invoiceNumber) throw new Error('Invoice number is required');
        if (!props.invoiceDate) throw new Error('Invoice date is required');
        if (!props.dueDate) throw new Error('Invoice due date is required');
        if (!props.currency) throw new Error('Currency is required');
        if ((props.extraFees ?? 0) < 0) throw new Error('Extra fees cannot be negative');
        if (props.lineItems.length === 0) throw new Error('Invoice must include at least one line item');
        if (props.dueDate.getTime() < props.invoiceDate.getTime()) {
            throw new Error('Invoice due date cannot be earlier than the invoice date');
        }

        const items = props.lineItems.map((lineItem) =>
            InvoiceLineItem.create({ ...lineItem, id: lineItem.id || uuidv4(), currency: props.currency })
        );
        items.forEach((item) => item.validate());

        return new Invoice(
            {
                ...props,
                status: 'Draft',
                statusHistory: [
                    {
                        fromStatus: null,
                        toStatus: 'Draft',
                        reason: 'InvoiceCreated',
                        changedAt: new Date(),
                        changedBy: props.createdBy ?? null,
                    },
                ],
            },
            items
        );
    }

    static reconstitute(props: InvoiceProps): Invoice {
        const items = props.lineItems.map((lineItem) =>
            InvoiceLineItem.reconstitute({ ...lineItem, currency: props.currency })
        );
        return new Invoice(props, items);
    }

    get subtotal(): Money {
        return this.lineItems.reduce(
            (sum, item) => sum.add(item.netAmount),
            Money.zero(this.currency)
        );
    }

    get discountTotal(): Money {
        return this.lineItems.reduce(
            (sum, item) => sum.add(item.discountAmount),
            Money.zero(this.currency)
        );
    }

    get taxTotal(): Money {
        return this.lineItems.reduce(
            (sum, item) => sum.add(item.taxAmount),
            Money.zero(this.currency)
        );
    }

    get grandTotal(): Money {
        return this.subtotal.add(this.taxTotal).add(this.extraFees);
    }

    get amountPaid(): Money {
        return this._amountPaid;
    }

    get balanceDue(): Money {
        return this.grandTotal.subtract(this._amountPaid);
    }

    get availableActions() {
        return {
            editDraft: this.canEditDraft(),
            requestApproval: this.canRequestApproval(),
            issue: this.canIssueNow(),
            recordPayment: this.canRecordPayment(),
            cancel: this.canCancel(),
            deleteDraft: this.canDeleteDraft(),
            duplicate: this.canDuplicate(),
            void: this.canVoid(),
            downloadPdf: true,
        };
    }

    get collectionState() {
        return {
            isPaidInFull: this.balanceDue.isZero(),
            isOutstanding: this.balanceDue.isPositive() && this.canRecordPayment(),
            acceptsPayment: this.canRecordPayment(),
            isFinalized: ['Paid', 'Cancelled', 'Void'].includes(this.status),
        };
    }

    addLineItem(props: InvoiceLineItemProps): void {
        this.assertEditable();
        const item = InvoiceLineItem.create({
            ...props,
            id: props.id || uuidv4(),
            currency: this.currency,
        });
        item.validate();
        this.lineItems.push(item);
        this.updatedAt = new Date();
    }

    removeLineItem(itemId: string): void {
        this.assertEditable();
        if (this.lineItems.length === 1) {
            throw new Error('Invoice must include at least one line item');
        }
        const idx = this.lineItems.findIndex((lineItem) => lineItem.id === itemId);
        if (idx === -1) throw new Error(`Line item ${itemId} not found`);
        this.lineItems.splice(idx, 1);
        this.updatedAt = new Date();
    }

    updateDraft(changes: {
        invoiceDate?: Date;
        dueDate?: Date | null;
        notes?: string;
        terms?: string;
        extraFees?: number;
        lineItems?: InvoiceLineItemProps[];
        currency?: string;
        updatedBy?: string;
    }): void {
        this.assertEditable();

        if (changes.invoiceDate) this.invoiceDate = changes.invoiceDate;
        if (Object.prototype.hasOwnProperty.call(changes, 'dueDate')) {
            this.dueDate = changes.dueDate ?? null;
        }
        if (changes.notes !== undefined) this.notes = changes.notes;
        if (changes.terms !== undefined) this.terms = changes.terms;
        if (changes.currency && changes.currency !== this.currency) {
            if (!this._amountPaid.isZero()) {
                throw new Error('Invoice currency cannot change after payments exist');
            }
            this.currency = changes.currency;
            this.extraFees = Money.fromAmount(this.extraFees.toAmount(), this.currency);
            this._amountPaid = Money.fromAmount(this._amountPaid.toAmount(), this.currency);
            this.configuration = {
                ...this.configuration,
                currencyCode: this.currency,
            };
        }
        if (changes.extraFees !== undefined) {
            if (changes.extraFees < 0) {
                throw new Error('Extra fees cannot be negative');
            }
            this.extraFees = Money.fromAmount(changes.extraFees, this.currency);
        }
        if (changes.lineItems) {
            if (changes.lineItems.length === 0) {
                throw new Error('Invoice must include at least one line item');
            }
            this.lineItems = changes.lineItems.map((lineItem) => {
                const item = InvoiceLineItem.create({
                    ...lineItem,
                    id: lineItem.id || uuidv4(),
                    currency: this.currency,
                });
                item.validate();
                return item;
            });
        }
        if (!this.dueDate) {
            throw new Error('Invoice due date is required');
        }
        if (this.dueDate.getTime() < this.invoiceDate.getTime()) {
            throw new Error('Invoice due date cannot be earlier than the invoice date');
        }

        this.updatedBy = changes.updatedBy;
        this.updatedAt = new Date();
    }

    issue(finalInvoiceNumber: string, issuer: InvoiceIssuerSnapshot, client: InvoiceClientSnapshot, issuedBy?: string): void {
        if (!this.canIssueNow()) {
            throw new Error(`Invoice ${this.invoiceNumber} is not ready to be issued.`);
        }
        if (!finalInvoiceNumber || finalInvoiceNumber.trim().length === 0) {
            throw new Error('Final invoice number is required when issuing an invoice');
        }

        const capturedAt = new Date();
        this.invoiceNumber = finalInvoiceNumber;
        this.issueSnapshot = {
            issuer,
            client,
            lineItems: this.lineItems.map((lineItem) => ({
                itemName: lineItem.itemName,
                description: lineItem.description,
                unit: lineItem.unit,
                quantity: lineItem.quantity,
                unitPrice: lineItem.unitPrice.toAmount(),
                discountType: lineItem.discountType,
                discountPercent: lineItem.discountPercent,
                taxPercent: lineItem.taxPercent,
                taxes: lineItem.taxes.map((tax) => ({
                    code: tax.code,
                    name: tax.name,
                    ratePercent: tax.ratePercent,
                    calculationType: tax.calculationType ?? 'Percentage',
                })),
                lineTotal: lineItem.lineTotal.toAmount(),
            })),
            totals: {
                subtotal: this.subtotal.toAmount(),
                discountTotal: this.discountTotal.toAmount(),
                taxTotal: this.taxTotal.toAmount(),
                extraFees: this.extraFees.toAmount(),
                grandTotal: this.grandTotal.toAmount(),
                amountPaid: this.amountPaid.toAmount(),
                balanceDue: this.balanceDue.toAmount(),
            },
            capturedAt,
        };
        this.submittedAt = capturedAt;
        this.submittedBy = issuedBy ?? null;
        this.issuedAt = capturedAt;
        this.issuedBy = issuedBy ?? null;
        this.transitionTo(
            this.isPastDueOn(capturedAt) ? 'Overdue' : 'Submitted',
            'InvoiceSubmitted',
            issuedBy ?? this.updatedBy
        );
    }

    duplicate(newInvoiceNumber: string, duplicatedAt: Date, duplicatedBy?: string): Invoice {
        const duplicateDueDate = this.dueDate
            ? new Date(duplicatedAt.getTime() + Math.max(this.dueDate.getTime() - this.invoiceDate.getTime(), 0))
            : null;

        return Invoice.create({
            ownerUserId: this.ownerUserId,
            workspaceId: this.workspaceId,
            businessId: this.businessId,
            clientId: this.clientId,
            invoiceNumber: newInvoiceNumber,
            invoiceDate: duplicatedAt,
            dueDate: duplicateDueDate,
            currency: this.currency,
            lineItems: this.lineItems.map((lineItem) => ({
                id: '',
                itemName: lineItem.itemName,
                description: lineItem.description,
                unit: lineItem.unit,
                quantity: lineItem.quantity,
                unitPrice: lineItem.unitPrice.toAmount(),
                discountType: lineItem.discountType,
                discountPercent: lineItem.discountPercent,
                taxes: lineItem.taxes,
            })),
            extraFees: this.extraFees.toAmount(),
            notes: this.notes,
            terms: this.terms,
            createdBy: duplicatedBy,
            origin: {
                kind: 'InvoiceDuplicate',
                sourceDocumentId: this.id,
                sourceDocumentNumber: this.invoiceNumber,
            },
            ownership: this.ownership,
            automation: {
                ...this.automation,
                recurrenceScheduleId: null,
                reminderPolicyId: null,
            },
            presentation: this.presentation,
            configuration: this.configuration,
        });
    }

    requestIssuanceApproval(requestedBy?: string): void {
        if (this.issuance.mode !== 'ApprovalRequired') {
            throw new Error('This invoice does not require issuance approval');
        }
        if (this.status !== 'Draft') {
            throw new Error('Only Draft invoices can enter issuance approval');
        }
        if (this.issuance.approvalState === 'PendingApproval') {
            throw new Error('Invoice is already awaiting approval');
        }

        this.issuance = {
            ...this.issuance,
            approvalState: 'PendingApproval',
            requestedAt: new Date(),
            approvedAt: null,
            rejectedAt: null,
            approvedBy: null,
            rejectedBy: null,
        };
        this.updatedBy = requestedBy ?? this.updatedBy;
        this.updatedAt = new Date();
    }

    approveIssuance(approvedBy?: string): void {
        if (this.issuance.mode !== 'ApprovalRequired') {
            throw new Error('This invoice does not require issuance approval');
        }
        if (this.issuance.approvalState !== 'PendingApproval') {
            throw new Error('Invoice must be pending approval before it can be approved');
        }

        this.issuance = {
            ...this.issuance,
            approvalState: 'Approved',
            approvedAt: new Date(),
            rejectedAt: null,
            approvedBy: approvedBy ?? null,
            rejectedBy: null,
        };
        this.updatedBy = approvedBy ?? this.updatedBy;
        this.updatedAt = new Date();
    }

    assertPaymentCanBeRecorded(amount: number): void {
        if (amount <= 0) {
            throw new Error('Payment amount must be greater than zero');
        }
        if (this.status === 'Cancelled' || this.status === 'Void') {
            throw new Error(`Cannot record payment on a ${this.status} invoice`);
        }
        if (this.status === 'Draft') {
            throw new Error('Cannot record payment on a Draft invoice. Submit it first.');
        }
        if (this.balanceDue.isZero()) {
            throw new Error('Cannot record payment on an invoice with zero balance due');
        }

        const paymentMoney = Money.fromAmount(amount, this.currency);
        const newAmountPaid = this._amountPaid.add(paymentMoney);
        if (newAmountPaid.greaterThan(this.grandTotal)) {
            throw new Error(
                `Payment of ${amount} would exceed the grand total of ${this.grandTotal.toAmount()}. Overpayment is not allowed.`
            );
        }
    }

    reconcilePayments(
        payments: Array<{ amount: number; paymentDate: Date }>,
        updatedBy?: string
    ): boolean {
        const previousAmountPaid = this._amountPaid;
        const previousStatus = this.status;
        const totalPaid = payments.reduce(
            (sum, payment) => sum.add(Money.fromAmount(payment.amount, this.currency)),
            Money.zero(this.currency)
        );

        if ((this.status === 'Cancelled' || this.status === 'Void') && totalPaid.isPositive()) {
            throw new Error(`Invoice ${this.invoiceNumber} cannot remain ${this.status} with recorded payments.`);
        }
        if (totalPaid.greaterThan(this.grandTotal)) {
            throw new Error(`Recorded payments exceed invoice ${this.invoiceNumber} grand total.`);
        }

        this._amountPaid = totalPaid;

        const nextStatus = this.deriveStatusFromPayments();
        if (nextStatus !== this.status) {
            this.transitionTo(nextStatus, 'PaymentStateReconciled', updatedBy);
        } else if (!previousAmountPaid.equals(totalPaid)) {
            this.updatedBy = updatedBy ?? this.updatedBy;
            this.updatedAt = new Date();
        }

        return !previousAmountPaid.equals(this._amountPaid) || previousStatus !== this.status;
    }

    cancel(reason: string, cancelledBy?: string): void {
        if (this.status === 'Paid') {
            throw new Error('Cannot cancel a fully paid invoice');
        }
        if (this.status === 'Void') {
            throw new Error('Invoice is already void');
        }
        if (!this.canCancel()) {
            throw new Error('Only Submitted or Overdue invoices without payments can be cancelled');
        }
        if (!reason || reason.trim().length === 0) {
            throw new Error('Cancellation reason is required');
        }

        const changedBy = cancelledBy ?? this.updatedBy;
        this.cancelledAt = new Date();
        this.cancelledBy = changedBy ?? null;
        this.cancellationReason = reason.trim();
        this.transitionTo('Cancelled', 'InvoiceCancelled', changedBy);
    }

    voidInvoice(reason: string, voidedBy?: string): void {
        if (!this.canVoid()) {
            throw new Error('Only Draft invoices without payments can be voided');
        }
        if (!reason || reason.trim().length === 0) {
            throw new Error('Void reason is required');
        }

        const changedBy = voidedBy ?? this.updatedBy;
        this.voidedAt = new Date();
        this.voidedBy = changedBy ?? null;
        this.voidReason = reason.trim();
        this.transitionTo('Void', 'InvoiceVoided', changedBy);
    }

    private assertEditable(): void {
        if (!this.canEditDraft()) {
            throw new Error(
                `Invoice in status "${this.status}" cannot be edited in its current workflow state.`
            );
        }
    }

    private canEditDraft(): boolean {
        return this.status === 'Draft' && this.issuance.approvalState !== 'PendingApproval';
    }

    private canRequestApproval(): boolean {
        return this.status === 'Draft'
            && this.issuance.mode === 'ApprovalRequired'
            && this.issuance.approvalState !== 'PendingApproval';
    }

    private canIssueNow(): boolean {
        if (this.status !== 'Draft') {
            return false;
        }
        if (
            !this.clientId
            || !this.currency
            || Number.isNaN(this.invoiceDate.getTime())
            || this.dueDate === null
        ) {
            return false;
        }
        if (this.lineItems.length === 0 || this.grandTotal.isNegative()) {
            return false;
        }

        return this.issuance.mode === 'Manual'
            || this.issuance.approvalState === 'Approved'
            || this.issuance.approvalState === 'NotRequired';
    }

    private canRecordPayment(): boolean {
        return ['Submitted', 'PartiallyPaid', 'Overdue'].includes(this.status) && !this.balanceDue.isZero();
    }

    private canCancel(): boolean {
        return ['Submitted', 'Overdue'].includes(this.status) && this._amountPaid.isZero();
    }

    private canDeleteDraft(): boolean {
        return this.status === 'Draft' && this._amountPaid.isZero();
    }

    private canVoid(): boolean {
        return this.status === 'Draft' && this._amountPaid.isZero();
    }

    private canDuplicate(): boolean {
        return true;
    }

    private deriveStatusFromPayments(referenceDate = new Date()): InvoiceStatus {
        if (this.status === 'Cancelled' || this.status === 'Void') {
            return this.status;
        }
        if (this._amountPaid.isZero()) {
            if (this.status === 'Draft') {
                return 'Draft';
            }

            return this.isPastDueOn(referenceDate) ? 'Overdue' : 'Submitted';
        }
        if (this.balanceDue.isZero()) {
            return 'Paid';
        }

        return this.isPastDueOn(referenceDate) ? 'Overdue' : 'PartiallyPaid';
    }

    private isPastDueOn(referenceDate: Date): boolean {
        return this.dueDate !== null && this.dueDate.getTime() < referenceDate.getTime();
    }

    private transitionTo(nextStatus: InvoiceStatus, reason: string, changedBy?: string | null): void {
        if (this.status === nextStatus) {
            return;
        }

        const changedAt = new Date();
        this.statusHistory.push({
            fromStatus: this.status,
            toStatus: nextStatus,
            reason,
            changedAt,
            changedBy: changedBy ?? null,
        });
        if (nextStatus === 'Paid') {
            this.paidAt = changedAt;
        } else if (this.status === 'Paid') {
            this.paidAt = null;
        }
        this.status = nextStatus;
        this.updatedBy = changedBy ?? this.updatedBy;
        this.updatedAt = changedAt;
    }

    toSnapshot() {
        return {
            id: this.id,
            workspaceId: this.workspaceId,
            ownerUserId: this.ownerUserId,
            businessId: this.businessId,
            clientId: this.clientId,
            invoiceNumber: this.invoiceNumber,
            invoiceDate: this.invoiceDate,
            dueDate: this.dueDate,
            status: this.status,
            currency: this.currency,
            lineItems: this.lineItems.map((lineItem) => ({
                id: lineItem.id,
                itemName: lineItem.itemName,
                description: lineItem.description,
                unit: lineItem.unit,
                quantity: lineItem.quantity,
                unitPrice: lineItem.unitPrice.toAmount(),
                discountType: lineItem.discountType,
                discountPercent: lineItem.discountPercent,
                taxPercent: lineItem.taxPercent,
                taxes: lineItem.taxes,
                lineTotal: lineItem.lineTotal.toAmount(),
            })),
            subtotal: this.subtotal.toAmount(),
            discountTotal: this.discountTotal.toAmount(),
            taxTotal: this.taxTotal.toAmount(),
            extraFees: this.extraFees.toAmount(),
            grandTotal: this.grandTotal.toAmount(),
            amountPaid: this._amountPaid.toAmount(),
            balanceDue: this.balanceDue.toAmount(),
            notes: this.notes,
            terms: this.terms,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            deletedAt: this.deletedAt,
            deletedBy: this.deletedBy,
            origin: this.origin,
            ownership: this.ownership,
            issuance: this.issuance,
            automation: this.automation,
            presentation: this.presentation,
            configuration: this.configuration,
            availableActions: this.availableActions,
            collectionState: this.collectionState,
            statusHistory: this.statusHistory,
            issueSnapshot: this.issueSnapshot,
            submittedAt: this.submittedAt,
            submittedBy: this.submittedBy,
            issuedAt: this.issuedAt,
            issuedBy: this.issuedBy,
            paidAt: this.paidAt,
            cancelledAt: this.cancelledAt,
            cancelledBy: this.cancelledBy,
            cancellationReason: this.cancellationReason,
            voidedAt: this.voidedAt,
            voidedBy: this.voidedBy,
            voidReason: this.voidReason,
        };
    }
}
