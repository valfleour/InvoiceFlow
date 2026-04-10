export type InvoiceGroup = 'non-active' | 'active';

const LAST_INVOICE_GROUP_KEY = 'invoiceflow:last-invoice-group';
export const DEFAULT_INVOICE_GROUP: InvoiceGroup = 'non-active';

export function isInvoiceGroup(value: string | null): value is InvoiceGroup {
    return value === 'non-active' || value === 'active';
}

export function getInvoiceGroupFromSearch(search: string): InvoiceGroup | null {
    const params = new URLSearchParams(search);
    const group = params.get('group');

    return isInvoiceGroup(group) ? group : null;
}

export function getRememberedInvoiceGroup(): InvoiceGroup {
    if (typeof window === 'undefined') {
        return DEFAULT_INVOICE_GROUP;
    }

    const storedGroup = window.sessionStorage.getItem(LAST_INVOICE_GROUP_KEY);
    return isInvoiceGroup(storedGroup) ? storedGroup : DEFAULT_INVOICE_GROUP;
}

export function rememberInvoiceGroup(group: InvoiceGroup) {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(LAST_INVOICE_GROUP_KEY, group);
}

export function resolveInvoiceGroup(search: string): InvoiceGroup {
    return getInvoiceGroupFromSearch(search) ?? getRememberedInvoiceGroup();
}

export function buildInvoiceListPath(group: InvoiceGroup): string {
    return `/invoices?group=${group}`;
}

export function buildNewInvoicePath(group: InvoiceGroup): string {
    return `/invoices/new?group=${group}`;
}

export function buildInvoiceDetailPath(invoiceId: string, group: InvoiceGroup): string {
    return `/invoices/${invoiceId}?group=${group}`;
}

export function buildInvoiceEditPath(invoiceId: string, group: InvoiceGroup): string {
    return `/invoices/${invoiceId}/edit?group=${group}`;
}
