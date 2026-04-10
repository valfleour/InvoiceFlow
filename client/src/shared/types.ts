export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface AuditFields {
    createdAt: string;
    createdBy?: string | null;
    updatedAt: string;
    updatedBy?: string | null;
    deletedAt?: string | null;
    deletedBy?: string | null;
}

export interface BusinessProfile extends AuditFields {
    id: string;
    isActive: boolean;
    businessName: string;
    logoUrl?: string;
    address: Address;
    email: string;
    phone: string;
    website?: string;
    taxId?: string;
    defaultCurrency: string;
    paymentInstructions?: string;
}

export interface Client extends AuditFields {
    id: string;
    businessId: string;
    isActive: boolean;
    clientName: string;
    companyName?: string;
    billingAddress: Address;
    email: string;
    phone?: string;
    taxId?: string;
    notes?: string;
}

export interface InvoiceLineTax {
    code: string;
    name?: string;
    ratePercent: number;
    calculationType?: 'Percentage';
}

export interface InvoiceOrigin {
    kind: 'Manual' | 'Quotation' | 'RecurringSchedule' | 'Template' | 'InvoiceDuplicate';
    sourceDocumentId?: string | null;
    sourceDocumentNumber?: string | null;
}

export interface InvoiceOwnership {
    mode: 'SingleBusiness' | 'SharedOwnership';
    primaryBusinessId: string;
    associatedBusinessIds: string[];
}

export interface InvoiceIssuance {
    mode: 'Manual' | 'ApprovalRequired';
    approvalState: 'NotRequired' | 'NotRequested' | 'PendingApproval' | 'Approved' | 'Rejected';
    requestedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    approvedBy?: string | null;
    rejectedBy?: string | null;
}

export interface InvoiceAutomation {
    recurrenceScheduleId?: string | null;
    reminderPolicyId?: string | null;
    portalAccess: 'NotConfigured' | 'Enabled';
}

export interface InvoicePresentation {
    templateId?: string | null;
}

export interface InvoiceConfiguration {
    currencyCode: string;
    taxMode: 'LineTaxes';
    taxRulesetId?: string | null;
    jurisdictionCode?: string | null;
}

export interface InvoiceAvailableActions {
    editDraft: boolean;
    requestApproval: boolean;
    issue: boolean;
    recordPayment: boolean;
    cancel: boolean;
    deleteDraft?: boolean;
    duplicate?: boolean;
    void?: boolean;
    downloadPdf: boolean;
}

export interface InvoiceCollectionState {
    isPaidInFull: boolean;
    isOutstanding: boolean;
    acceptsPayment: boolean;
    isFinalized: boolean;
}

export type InvoiceStatus =
    | 'Draft'
    | 'Submitted'
    | 'PartiallyPaid'
    | 'Paid'
    | 'Overdue'
    | 'Cancelled'
    | 'Void';

export interface InvoiceLineItem {
    id: string;
    itemName: string;
    description?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    discountType?: 'Percentage';
    discountPercent: number;
    taxPercent: number;
    taxes?: InvoiceLineTax[];
    lineTotal: number;
}

export interface InvoiceIssueSnapshot {
    issuer: {
        businessName: string;
        address: Address;
        email: string;
        phone: string;
        website?: string;
        taxId?: string;
        paymentInstructions?: string;
    };
    client: {
        clientName: string;
        companyName?: string;
        billingAddress: Address;
        email: string;
        phone?: string;
        taxId?: string;
    };
    lineItems: InvoiceLineItem[];
    totals: {
        subtotal: number;
        discountTotal: number;
        taxTotal: number;
        extraFees: number;
        grandTotal: number;
        amountPaid: number;
        balanceDue: number;
    };
    capturedAt: string;
}

export interface Invoice extends AuditFields {
    id: string;
    businessId: string;
    clientId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string | null;
    status: InvoiceStatus;
    currency: string;
    lineItems: InvoiceLineItem[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    extraFees: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
    notes?: string;
    terms?: string;
    origin: InvoiceOrigin;
    ownership: InvoiceOwnership;
    issuance: InvoiceIssuance;
    automation: InvoiceAutomation;
    presentation: InvoicePresentation;
    configuration: InvoiceConfiguration;
    availableActions: InvoiceAvailableActions;
    collectionState: InvoiceCollectionState;
    issueSnapshot?: InvoiceIssueSnapshot | null;
    issuedAt?: string | null;
    issuedBy?: string | null;
    cancelledAt?: string | null;
    cancelledBy?: string | null;
    cancellationReason?: string | null;
    voidedAt?: string | null;
    voidedBy?: string | null;
    voidReason?: string | null;
}

export interface Payment extends AuditFields {
    id: string;
    invoiceId: string;
    businessId: string;
    currency?: string;
    paymentDate: string;
    amount: number;
    method: string;
    referenceNumber?: string;
    note?: string;
}
