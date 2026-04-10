import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import type { Invoice } from '../../shared/types';
import { getApiErrorMessage } from '../../shared/api';
import { fetchInvoice, updateDraftInvoice } from './api';
import {
    createEditInvoiceValues,
    type InvoiceEditorValues,
} from './invoiceEditorValues';
import { InvoiceEditorForm } from './InvoiceEditorForm';
import {
    buildInvoiceDetailPath,
    resolveInvoiceGroup,
} from './navigation';

export function EditInvoicePage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(() => Boolean(id));
    const [error, setError] = useState('');
    const invoiceGroup = resolveInvoiceGroup(location.search);

    useEffect(() => {
        if (!id) {
            return;
        }
        const invoiceId = id;

        let ignore = false;

        async function load() {
            setIsLoading(true);
            setError('');

            try {
                const loadedInvoice = await fetchInvoice(invoiceId);

                if (!ignore) {
                    setInvoice(loadedInvoice);
                }
            } catch (err: unknown) {
                if (!ignore) {
                    setError(getApiErrorMessage(err, 'Unable to load invoice.'));
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void load();

        return () => {
            ignore = true;
        };
    }, [id]);

    if (isLoading) {
        return <div className="page"><p>Loading...</p></div>;
    }

    if (!id) {
        return <div className="page"><p>Invoice not found.</p></div>;
    }

    if (!invoice) {
        return <div className="page"><p>{error || 'Invoice could not be loaded.'}</p></div>;
    }

    if (!invoice.availableActions.editDraft) {
        return <div className="page"><p>This invoice cannot be edited in its current workflow state.</p></div>;
    }

    const handleSubmit = async (values: InvoiceEditorValues) => {
        setError('');

        try {
            await updateDraftInvoice(invoice.id, {
                invoiceDate: values.invoiceDate,
                dueDate: values.dueDate || null,
                currency: values.currency,
                lineItems: values.lineItems.map((lineItem) => ({
                    id: lineItem.id,
                    itemName: lineItem.itemName,
                    description: lineItem.description || undefined,
                    quantity: lineItem.quantity,
                    unitPrice: lineItem.unitPrice,
                    discountPercent: lineItem.discountPercent,
                    taxPercent: lineItem.taxPercent,
                })),
                extraFees: values.extraFees,
                notes: values.notes || undefined,
                terms: values.terms || undefined,
            });

            navigate(buildInvoiceDetailPath(invoice.id, invoiceGroup));
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to update invoice.'));
        }
    };

    return (
        <div className="page invoice-editor-page">
            <PageHeader
                title={`Edit Invoice ${invoice.invoiceNumber}`}
                backTo={buildInvoiceDetailPath(invoice.id, invoiceGroup)}
            />
            <InvoiceEditorForm
                initialValue={createEditInvoiceValues(invoice)}
                submitLabel="Save Changes"
                error={error}
                onSubmit={handleSubmit}
                onCancel={() => navigate(buildInvoiceDetailPath(invoice.id, invoiceGroup))}
            />
        </div>
    );
}
