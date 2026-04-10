import mongoose, { Schema, Document } from 'mongoose';

export interface InvoiceDocument extends Document {
    workspaceId: string;
    ownerUserId: string;
    businessId: mongoose.Types.ObjectId;
    clientId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date | null;
    status: string;
    currency: string;
    lineItems: Array<{
        id: string;
        itemName: string;
        description?: string;
        unit?: string;
        quantity: number;
        unitPrice: number;
        discountType: string;
        discountPercent: number;
        taxPercent: number;
        taxes?: Array<{
            code: string;
            name?: string;
            ratePercent: number;
            calculationType?: string;
        }>;
        lineTotal: number;
    }>;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    extraFees: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
    notes?: string;
    terms?: string;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    deletedBy?: string | null;
    origin?: {
        kind: string;
        sourceDocumentId?: string | null;
        sourceDocumentNumber?: string | null;
    };
    ownership?: {
        mode: string;
        primaryBusinessId: mongoose.Types.ObjectId;
        associatedBusinessIds: mongoose.Types.ObjectId[];
    };
    issuance?: {
        mode: string;
        approvalState: string;
        requestedAt?: Date | null;
        approvedAt?: Date | null;
        rejectedAt?: Date | null;
        approvedBy?: string | null;
        rejectedBy?: string | null;
    };
    automation?: {
        recurrenceScheduleId?: string | null;
        reminderPolicyId?: string | null;
        portalAccess: string;
    };
    presentation?: {
        templateId?: string | null;
    };
    configuration?: {
        currencyCode: string;
        taxMode: string;
        taxRulesetId?: string | null;
        jurisdictionCode?: string | null;
    };
    statusHistory?: Array<{
        fromStatus?: string | null;
        toStatus: string;
        reason: string;
        changedAt: Date;
        changedBy?: string | null;
    }>;
    issueSnapshot?: {
        issuer: {
            businessName: string;
            logoUrl?: string;
            address: { street: string; city: string; state: string; postalCode: string; country: string };
            email: string;
            phone: string;
            website?: string;
            taxId?: string;
            paymentInstructions?: string;
        };
        client: {
            clientName: string;
            companyName?: string;
            billingAddress: { street: string; city: string; state: string; postalCode: string; country: string };
            email: string;
            phone?: string;
            taxId?: string;
        };
        lineItems: Array<{
            itemName: string;
            description?: string;
            unit?: string;
            quantity: number;
            unitPrice: number;
            discountType: string;
            discountPercent: number;
            taxPercent: number;
            taxes: Array<{
                code: string;
                name?: string;
                ratePercent: number;
                calculationType: string;
            }>;
            lineTotal: number;
        }>;
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
    };
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

const TaxSubSchema = new Schema(
    {
        code: { type: String, required: true },
        name: { type: String },
        ratePercent: { type: Number, required: true, min: 0, max: 100 },
        calculationType: { type: String, required: true, default: 'Percentage' },
    },
    { _id: false }
);

const LineItemSubSchema = new Schema(
    {
        id: { type: String, required: true },
        itemName: { type: String, required: true },
        description: { type: String },
        unit: { type: String },
        quantity: { type: Number, required: true, min: 0 },
        unitPrice: { type: Number, required: true, min: 0 },
        discountType: { type: String, required: true, default: 'Percentage' },
        discountPercent: { type: Number, required: true, min: 0, max: 100 },
        taxPercent: { type: Number, required: true, min: 0, max: 100 },
        taxes: { type: [TaxSubSchema], default: [] },
        lineTotal: { type: Number, required: true },
    },
    { _id: false }
);

const IssueSnapshotLineItemSubSchema = new Schema(
    {
        itemName: { type: String, required: true },
        description: { type: String },
        unit: { type: String },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        discountType: { type: String, required: true },
        discountPercent: { type: Number, required: true },
        taxPercent: { type: Number, required: true },
        taxes: { type: [TaxSubSchema], default: [] },
        lineTotal: { type: Number, required: true },
    },
    { _id: false }
);

const IssueSnapshotSubSchema = new Schema(
    {
        issuer: {
            businessName: { type: String },
            address: {
                street: { type: String },
                city: { type: String },
                state: { type: String },
                postalCode: { type: String },
                country: { type: String },
            },
            email: { type: String },
            phone: { type: String },
            logoUrl: { type: String },
            website: { type: String },
            taxId: { type: String },
            paymentInstructions: { type: String },
        },
        client: {
            clientName: { type: String },
            companyName: { type: String },
            billingAddress: {
                street: { type: String },
                city: { type: String },
                state: { type: String },
                postalCode: { type: String },
                country: { type: String },
            },
            email: { type: String },
            phone: { type: String },
            taxId: { type: String },
        },
        lineItems: {
            type: [IssueSnapshotLineItemSubSchema],
            default: [],
        },
        totals: {
            subtotal: { type: Number },
            discountTotal: { type: Number },
            taxTotal: { type: Number },
            extraFees: { type: Number },
            grandTotal: { type: Number },
            amountPaid: { type: Number },
            balanceDue: { type: Number },
        },
        capturedAt: { type: Date },
    },
    { _id: false }
);

const InvoiceSchema = new Schema<InvoiceDocument>(
    {
        ownerUserId: { type: String, required: true, index: true },
        workspaceId: { type: String, required: true, index: true },
        businessId: { type: Schema.Types.ObjectId, required: true, index: true },
        clientId: { type: Schema.Types.ObjectId, required: true, index: true },
        invoiceNumber: { type: String, required: true },
        invoiceDate: { type: Date, required: true },
        dueDate: { type: Date, default: null },
        status: {
            type: String,
            required: true,
            enum: ['Draft', 'Submitted', 'Issued', 'PartiallyPaid', 'Paid', 'Overdue', 'Cancelled', 'Void'],
            default: 'Draft',
        },
        currency: { type: String, required: true, default: 'USD' },
        lineItems: { type: [LineItemSubSchema], default: [] },
        subtotal: { type: Number, required: true, default: 0 },
        discountTotal: { type: Number, required: true, default: 0 },
        taxTotal: { type: Number, required: true, default: 0 },
        extraFees: { type: Number, required: true, default: 0 },
        grandTotal: { type: Number, required: true, default: 0 },
        amountPaid: { type: Number, required: true, default: 0 },
        balanceDue: { type: Number, required: true, default: 0 },
        notes: { type: String },
        terms: { type: String },
        createdBy: { type: String, default: null },
        updatedBy: { type: String, default: null },
        deletedAt: { type: Date, default: null, index: true },
        deletedBy: { type: String, default: null },
        origin: {
            kind: { type: String, required: true, default: 'Manual' },
            sourceDocumentId: { type: String, default: null },
            sourceDocumentNumber: { type: String, default: null },
        },
        ownership: {
            mode: { type: String, required: true, default: 'SingleBusiness' },
            primaryBusinessId: { type: Schema.Types.ObjectId, required: true },
            associatedBusinessIds: { type: [Schema.Types.ObjectId], default: [] },
        },
        issuance: {
            mode: { type: String, required: true, default: 'Manual' },
            approvalState: { type: String, required: true, default: 'NotRequired' },
            requestedAt: { type: Date, default: null },
            approvedAt: { type: Date, default: null },
            rejectedAt: { type: Date, default: null },
            approvedBy: { type: String, default: null },
            rejectedBy: { type: String, default: null },
        },
        automation: {
            recurrenceScheduleId: { type: String, default: null },
            reminderPolicyId: { type: String, default: null },
            portalAccess: { type: String, required: true, default: 'NotConfigured' },
        },
        presentation: {
            templateId: { type: String, default: null },
        },
        configuration: {
            currencyCode: { type: String, required: true, default: 'USD' },
            taxMode: { type: String, required: true, default: 'LineTaxes' },
            taxRulesetId: { type: String, default: null },
            jurisdictionCode: { type: String, default: null },
        },
        statusHistory: {
            type: [{
                fromStatus: { type: String, default: null },
                toStatus: { type: String, required: true },
                reason: { type: String, required: true },
                changedAt: { type: Date, required: true },
                changedBy: { type: String, default: null },
            }],
            default: [],
        },
        issueSnapshot: {
            type: IssueSnapshotSubSchema,
            default: undefined,
        },
        submittedAt: { type: Date, default: null },
        submittedBy: { type: String, default: null },
        issuedAt: { type: Date, default: null },
        issuedBy: { type: String, default: null },
        paidAt: { type: Date, default: null },
        cancelledAt: { type: Date, default: null },
        cancelledBy: { type: String, default: null },
        cancellationReason: { type: String, default: null },
        voidedAt: { type: Date, default: null },
        voidedBy: { type: String, default: null },
        voidReason: { type: String, default: null },
    },
    { timestamps: true }
);

// Invoice numbers should not be reused inside the same business scope.
InvoiceSchema.index({ workspaceId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ workspaceId: 1, clientId: 1, deletedAt: 1 });
InvoiceSchema.index({ workspaceId: 1, status: 1, deletedAt: 1 });
InvoiceSchema.index({ workspaceId: 1, dueDate: 1, deletedAt: 1 });
InvoiceSchema.index({ workspaceId: 1, createdAt: -1, deletedAt: 1 });

export const InvoiceModel = mongoose.model<InvoiceDocument>('Invoice', InvoiceSchema);
