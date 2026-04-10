import Button from '@mui/material/Button';
import { CancelButton } from '../../shared/components/CancelButton';
import { useState, type FocusEvent, type FormEvent } from 'react';
import { CurrencySelect } from '../../shared/components/CurrencySelect';
import type { Client } from '../../shared/types';
import { formatMoney } from '../../shared/utils';
import {
    calculateInvoiceTotals,
    calculateLineTotal,
    createEmptyLineItem,
} from './formModel';
import type { LineItemForm } from './formModel';
import type { InvoiceEditorValues } from './invoiceEditorValues';

interface InvoiceEditorFormProps {
    initialValue: InvoiceEditorValues;
    clients?: Client[];
    showClientField?: boolean;
    submitLabel: string;
    error?: string;
    onSubmit: (value: InvoiceEditorValues) => Promise<void> | void;
    onCancel: () => void;
}

export function InvoiceEditorForm({
    initialValue,
    clients = [],
    showClientField = false,
    submitLabel,
    error,
    onSubmit,
    onCancel,
}: InvoiceEditorFormProps) {
    const [form, setForm] = useState<InvoiceEditorValues>(initialValue);
    const { subtotal, taxTotal, grandTotal } = calculateInvoiceTotals(form.lineItems, form.extraFees);
    const clientError = showClientField && !form.clientId ? 'Select a client before submitting.' : '';
    const dueDateError = !form.dueDate
        ? 'Due date is required.'
        : form.invoiceDate && form.dueDate < form.invoiceDate
            ? 'Due date cannot be earlier than the invoice date.'
            : '';
    const lineItemErrors = form.lineItems.map((item) => {
        if (!item.itemName.trim()) {
            return 'Item name is required.';
        }
        if (!(item.quantity > 0)) {
            return 'Quantity must be greater than zero.';
        }
        if (Number(item.quantity.toFixed(3)) !== item.quantity) {
            return 'Quantity must use no more than 3 decimal places.';
        }
        if (item.unitPrice < 0) {
            return 'Unit price cannot be negative.';
        }
        if (Number(item.unitPrice.toFixed(2)) !== item.unitPrice) {
            return 'Unit price must use no more than 2 decimal places.';
        }
        if (item.discountPercent < 0 || item.discountPercent > 100) {
            return 'Discount must stay between 0 and 100.';
        }
        if (item.taxPercent < 0 || item.taxPercent > 100) {
            return 'Tax must stay between 0 and 100.';
        }

        return '';
    });
    const hasInvalidLineItems = lineItemErrors.some(Boolean);
    const submitDisabled = Boolean(clientError || dueDateError || hasInvalidLineItems || form.lineItems.length === 0);

    const handleZeroInputFocus = (event: FocusEvent<HTMLInputElement>) => {
        if (Number(event.target.value) === 0) {
            event.target.select();
        }
    };

    const updateItem = (index: number, changes: Partial<LineItemForm>) => {
        setForm((current) => ({
            ...current,
            lineItems: current.lineItems.map((item, itemIndex) => (
                itemIndex === index ? { ...item, ...changes } : item
            )),
        }));
    };

    const removeItem = (index: number) => {
        setForm((current) => ({
            ...current,
            lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        await onSubmit(form);
    };

    return (
        <>
            {error ? <div className="error-msg">{error}</div> : null}

            <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                    {showClientField ? (
                        <div>
                            <label>Client *</label>
                            <select
                                value={form.clientId}
                                onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
                                required
                            >
                                <option value="">Select a client</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.clientName}
                                        {client.companyName ? ` (${client.companyName})` : ''}
                                    </option>
                                ))}
                            </select>
                            {clientError ? <div className="field-error">{clientError}</div> : null}
                            {clients.length === 0 ? (
                                <div className="field-hint">Create a client first before issuing a new invoice.</div>
                            ) : null}
                        </div>
                    ) : null}
                    <div>
                        <label>Invoice Date *</label>
                        <input
                            type="date"
                            value={form.invoiceDate}
                            onChange={(event) => setForm((current) => ({ ...current, invoiceDate: event.target.value }))}
                            required
                        />
                    </div>
                    <div>
                        <label>Due Date *</label>
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                            required
                        />
                        {dueDateError ? <div className="field-error">{dueDateError}</div> : null}
                    </div>
                    <div>
                        <label>Currency *</label>
                        <CurrencySelect
                            value={form.currency}
                            onChange={(value) => setForm((current) => ({ ...current, currency: value }))}
                            required
                        />
                    </div>
                </div>

                <h3>Line Items</h3>
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Disc %</th>
                                <th>Tax %</th>
                                <th>Line Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {form.lineItems.map((item, index) => (
                                <tr key={item.id ?? index}>
                                    <td>
                                        <input
                                            value={item.itemName}
                                            onChange={(event) => updateItem(index, { itemName: event.target.value })}
                                            required
                                        />
                                    </td>
                                    <td>
                                        <input
                                            value={item.description}
                                            onChange={(event) => updateItem(index, { description: event.target.value })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            value={item.quantity}
                                            onChange={(event) => updateItem(index, { quantity: parseFloat(event.target.value) || 0 })}
                                            required
                                            style={{ width: 70 }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(event) => updateItem(index, { unitPrice: parseFloat(event.target.value) || 0 })}
                                            onFocus={handleZeroInputFocus}
                                            required
                                            style={{ width: 112 }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={item.discountPercent}
                                            onChange={(event) => updateItem(index, { discountPercent: parseFloat(event.target.value) || 0 })}
                                            onFocus={handleZeroInputFocus}
                                            style={{ width: 78 }}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={item.taxPercent}
                                            onChange={(event) => updateItem(index, { taxPercent: parseFloat(event.target.value) || 0 })}
                                            onFocus={handleZeroInputFocus}
                                            style={{ width: 78 }}
                                        />
                                    </td>
                                    <td>{formatMoney(calculateLineTotal(item), form.currency)}</td>
                                    <td>
                                        {form.lineItems.length > 1 ? (
                                            <Button
                                                type="button"
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                onClick={() => removeItem(index)}
                                            >
                                                Remove
                                            </Button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {lineItemErrors.some(Boolean) ? (
                    <div className="field-error">
                        {lineItemErrors.find(Boolean)}
                    </div>
                ) : null}

                <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    onClick={() => setForm((current) => ({
                        ...current,
                        lineItems: [...current.lineItems, createEmptyLineItem()],
                    }))}
                >
                    + Add Line Item
                </Button>

                <div className="form-row" style={{ marginTop: 16 }}>
                    <div>
                        <label>Extra Fees</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.extraFees}
                            onChange={(event) => setForm((current) => ({ ...current, extraFees: parseFloat(event.target.value) || 0 }))}
                        />
                    </div>
                </div>

                <div className="totals-summary">
                    <div>Subtotal: {formatMoney(subtotal, form.currency)}</div>
                    <div>Tax: {formatMoney(taxTotal, form.currency)}</div>
                    {form.extraFees > 0 ? <div>Extra Fees: {formatMoney(form.extraFees, form.currency)}</div> : null}
                    <div className="grand-total">Grand Total: {formatMoney(grandTotal, form.currency)}</div>
                </div>

                <label>Notes</label>
                <textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                />

                <label>Terms</label>
                <textarea
                    value={form.terms}
                    onChange={(event) => setForm((current) => ({ ...current, terms: event.target.value }))}
                />

                <div className="form-actions">
                    <CancelButton onClick={onCancel} />
                    <Button type="submit" variant="contained" disabled={submitDisabled}>
                        {submitLabel}
                    </Button>
                </div>
            </form>
        </>
    );
}
