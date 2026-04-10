import type { InvoiceLineItem } from '../../shared/types';

export interface LineItemForm {
    id?: string;
    itemName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxPercent: number;
}

export function createEmptyLineItem(): LineItemForm {
    return {
        itemName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0,
    };
}

export function createLineItemForm(item: InvoiceLineItem): LineItemForm {
    return {
        id: item.id,
        itemName: item.itemName,
        description: item.description || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
    };
}

export function calculateLineTotal(item: LineItemForm): number {
    const gross = item.quantity * item.unitPrice;
    const discount = gross * (item.discountPercent / 100);
    const net = gross - discount;
    const tax = net * (item.taxPercent / 100);
    return Math.round((net + tax) * 100) / 100;
}

export function calculateInvoiceTotals(lineItems: LineItemForm[], extraFees: number) {
    const subtotal = lineItems.reduce((sum, item) => {
        const gross = item.quantity * item.unitPrice;
        const discount = gross * (item.discountPercent / 100);
        return sum + (gross - discount);
    }, 0);

    const taxTotal = lineItems.reduce((sum, item) => {
        const gross = item.quantity * item.unitPrice;
        const discount = gross * (item.discountPercent / 100);
        const net = gross - discount;
        return sum + net * (item.taxPercent / 100);
    }, 0);

    return {
        subtotal,
        taxTotal,
        grandTotal: subtotal + taxTotal + extraFees,
    };
}
