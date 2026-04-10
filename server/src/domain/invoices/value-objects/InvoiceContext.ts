export const InvoiceOriginKinds = [
    'Manual',
    'Quotation',
    'RecurringSchedule',
    'Template',
    'InvoiceDuplicate',
] as const;

export type InvoiceOriginKind = (typeof InvoiceOriginKinds)[number];

export interface InvoiceOrigin {
    kind: InvoiceOriginKind;
    sourceDocumentId?: string | null;
    sourceDocumentNumber?: string | null;
}

export const InvoiceOwnershipModes = [
    'SingleBusiness',
    'SharedOwnership',
] as const;

export type InvoiceOwnershipMode = (typeof InvoiceOwnershipModes)[number];

export interface InvoiceOwnership {
    mode: InvoiceOwnershipMode;
    primaryBusinessId: string;
    associatedBusinessIds: string[];
}

export const InvoiceApprovalStates = [
    'NotRequired',
    'NotRequested',
    'PendingApproval',
    'Approved',
    'Rejected',
] as const;

export type InvoiceApprovalState = (typeof InvoiceApprovalStates)[number];

export const InvoiceIssuanceModes = [
    'Manual',
    'ApprovalRequired',
] as const;

export type InvoiceIssuanceMode = (typeof InvoiceIssuanceModes)[number];

export interface InvoiceIssuance {
    mode: InvoiceIssuanceMode;
    approvalState: InvoiceApprovalState;
    requestedAt?: Date | null;
    approvedAt?: Date | null;
    rejectedAt?: Date | null;
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

export function defaultInvoiceOrigin(): InvoiceOrigin {
    return {
        kind: 'Manual',
        sourceDocumentId: null,
        sourceDocumentNumber: null,
    };
}

export function defaultInvoiceOwnership(businessId: string): InvoiceOwnership {
    return {
        mode: 'SingleBusiness',
        primaryBusinessId: businessId,
        associatedBusinessIds: [businessId],
    };
}

export function defaultInvoiceIssuance(mode: InvoiceIssuanceMode = 'Manual'): InvoiceIssuance {
    return {
        mode,
        approvalState: mode === 'ApprovalRequired' ? 'NotRequested' : 'NotRequired',
        requestedAt: null,
        approvedAt: null,
        rejectedAt: null,
        approvedBy: null,
        rejectedBy: null,
    };
}

export function defaultInvoiceAutomation(): InvoiceAutomation {
    return {
        recurrenceScheduleId: null,
        reminderPolicyId: null,
        portalAccess: 'NotConfigured',
    };
}

export function defaultInvoicePresentation(): InvoicePresentation {
    return {
        templateId: null,
    };
}

export function defaultInvoiceConfiguration(currencyCode: string): InvoiceConfiguration {
    return {
        currencyCode,
        taxMode: 'LineTaxes',
        taxRulesetId: null,
        jurisdictionCode: null,
    };
}
