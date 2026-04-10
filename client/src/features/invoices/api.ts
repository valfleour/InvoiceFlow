import api from '../../shared/api';
import type { Invoice, Payment } from '../../shared/types';

function normalizeInvoice(invoice: Invoice): Invoice {
    const amountPaid = invoice.amountPaid ?? 0;
    const balanceDue = invoice.balanceDue ?? Math.max((invoice.grandTotal ?? 0) - amountPaid, 0);
    const rawStatus = invoice.status as string | undefined;
    const status = rawStatus === 'Issued' ? 'Submitted' : ((rawStatus ?? 'Draft') as Invoice['status']);
    const dueDate = invoice.dueDate ?? null;
    const issueSnapshot = invoice.issueSnapshot?.issuer
        && invoice.issueSnapshot?.client
        && invoice.issueSnapshot?.totals
        ? {
            ...invoice.issueSnapshot,
            lineItems: invoice.issueSnapshot.lineItems ?? [],
        }
        : null;

    return {
        ...invoice,
        origin: invoice.origin ?? {
            kind: 'Manual',
            sourceDocumentId: null,
            sourceDocumentNumber: null,
        },
        ownership: invoice.ownership ?? {
            mode: 'SingleBusiness',
            primaryBusinessId: invoice.businessId,
            associatedBusinessIds: [invoice.businessId],
        },
        issuance: invoice.issuance ?? {
            mode: 'Manual',
            approvalState: 'NotRequired',
            requestedAt: null,
            approvedAt: null,
            rejectedAt: null,
            approvedBy: null,
            rejectedBy: null,
        },
        automation: invoice.automation ?? {
            recurrenceScheduleId: null,
            reminderPolicyId: null,
            portalAccess: 'NotConfigured',
        },
        presentation: invoice.presentation ?? {
            templateId: null,
        },
        configuration: invoice.configuration ?? {
            currencyCode: invoice.currency,
            taxMode: 'LineTaxes',
            taxRulesetId: null,
            jurisdictionCode: null,
        },
        amountPaid,
        balanceDue,
        lineItems: (invoice.lineItems ?? []).map((lineItem) => ({
            ...lineItem,
            taxes: lineItem.taxes ?? [],
        })),
        dueDate,
        availableActions: invoice.availableActions ?? {
            editDraft: status === 'Draft',
            requestApproval: false,
            issue: status === 'Draft' && (invoice.lineItems?.length ?? 0) > 0,
            recordPayment: ['Submitted', 'PartiallyPaid', 'Overdue'].includes(status) && balanceDue > 0,
            cancel: ['Submitted', 'Overdue'].includes(status) && amountPaid === 0,
            deleteDraft: status === 'Draft' && amountPaid === 0,
            duplicate: true,
            void: status === 'Draft' && amountPaid === 0,
            downloadPdf: true,
        },
        collectionState: invoice.collectionState ?? {
            isPaidInFull: balanceDue === 0,
            isOutstanding: balanceDue > 0 && !['Cancelled', 'Void', 'Paid'].includes(status),
            acceptsPayment: ['Submitted', 'PartiallyPaid', 'Overdue'].includes(status) && balanceDue > 0,
            isFinalized: ['Paid', 'Cancelled', 'Void'].includes(status),
        },
        issueSnapshot,
    };
}

export async function fetchInvoices(businessId: string): Promise<Invoice[]> {
    const { data } = await api.get(`/invoices?businessId=${businessId}`);
    return data.map(normalizeInvoice);
}

export async function fetchInvoice(id: string): Promise<Invoice> {
    const { data } = await api.get(`/invoices/${id}`);
    return normalizeInvoice(data);
}

export async function createInvoice(payload: {
    businessId: string;
    clientId: string;
    invoiceDate: string;
    dueDate?: string | null;
    currency: string;
    lineItems: Array<{
        itemName: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        discountPercent?: number;
        taxPercent?: number;
        taxes?: Array<{
            code: string;
            name?: string;
            ratePercent: number;
        }>;
    }>;
    extraFees?: number;
    notes?: string;
    terms?: string;
}): Promise<Invoice> {
    const { data } = await api.post('/invoices', payload);
    return normalizeInvoice(data);
}

export async function updateDraftInvoice(
    id: string,
    payload: {
        invoiceDate?: string;
        dueDate?: string | null;
        currency?: string;
        lineItems?: Array<{
            id?: string;
            itemName: string;
            description?: string;
            quantity: number;
            unitPrice: number;
            discountPercent?: number;
            taxPercent?: number;
            taxes?: Array<{
                code: string;
                name?: string;
                ratePercent: number;
            }>;
        }>;
        extraFees?: number;
        notes?: string;
        terms?: string;
    }
): Promise<Invoice> {
    const { data } = await api.patch(`/invoices/${id}/draft`, payload);
    return normalizeInvoice(data);
}

export async function issueInvoice(id: string): Promise<Invoice> {
    const { data } = await api.post(`/invoices/${id}/issue`);
    return normalizeInvoice(data);
}

export async function duplicateInvoice(id: string): Promise<Invoice> {
    const { data } = await api.post(`/invoices/${id}/duplicate`);
    return normalizeInvoice(data);
}

export async function cancelInvoice(id: string, reason: string): Promise<Invoice> {
    const { data } = await api.post(`/invoices/${id}/cancel`, { reason });
    return normalizeInvoice(data);
}

export async function voidInvoice(id: string, reason: string): Promise<Invoice> {
    const { data } = await api.post(`/invoices/${id}/void`, { reason });
    return normalizeInvoice(data);
}

export async function deleteInvoice(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
}

export async function recordPayment(
    invoiceId: string,
    payload: {
        paymentDate: string;
        amount: number;
        method: string;
        referenceNumber?: string;
        note?: string;
    }
): Promise<Invoice> {
    const { data } = await api.post(`/invoices/${invoiceId}/payments`, payload);
    return normalizeInvoice(data);
}

export async function fetchPayments(invoiceId: string): Promise<Payment[]> {
    const { data } = await api.get(`/invoices/${invoiceId}/payments`);
    return data;
}

export async function downloadInvoicePdf(invoiceId: string, invoiceNumber: string): Promise<void> {
    const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
}
