import type { Invoice } from '../../shared/types';
import {
    createEmptyLineItem,
    createLineItemForm,
} from './formModel';
import type { LineItemForm } from './formModel';

export interface InvoiceEditorValues {
    clientId: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    lineItems: LineItemForm[];
    extraFees: number;
    notes: string;
    terms: string;
}

export function createCreateInvoiceValues(defaultCurrency: string): InvoiceEditorValues {
    return {
        clientId: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        currency: defaultCurrency,
        lineItems: [createEmptyLineItem()],
        extraFees: 0,
        notes: '',
        terms: '',
    };
}

export function createEditInvoiceValues(invoice: Invoice): InvoiceEditorValues {
    return {
        clientId: invoice.clientId,
        invoiceDate: invoice.invoiceDate.slice(0, 10),
        dueDate: invoice.dueDate?.slice(0, 10) ?? '',
        currency: invoice.currency,
        lineItems: invoice.lineItems.map(createLineItemForm),
        extraFees: invoice.extraFees,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
    };
}
