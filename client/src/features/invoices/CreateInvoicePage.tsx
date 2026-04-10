import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { PageHeader } from '../../shared/components/PageHeader';
import { getApiErrorMessage } from '../../shared/api';
import { fetchClients } from '../clients/api';
import type { Client } from '../../shared/types';
import { createInvoice } from './api';
import {
    createCreateInvoiceValues,
    type InvoiceEditorValues,
} from './invoiceEditorValues';
import { InvoiceEditorForm } from './InvoiceEditorForm';
import {
    buildInvoiceDetailPath,
    buildInvoiceListPath,
    resolveInvoiceGroup,
} from './navigation';

export function CreateInvoicePage() {
    const { business } = useBusiness();
    const location = useLocation();
    const navigate = useNavigate();
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [error, setError] = useState('');
    const invoiceGroup = resolveInvoiceGroup(location.search);
    const invoiceListPath = buildInvoiceListPath(invoiceGroup);
    const selectableClients = clients.filter((client) => client.isActive);

    useEffect(() => {
        if (!business) {
            return;
        }
        const businessId = business.id;

        let ignore = false;

        async function loadClients() {
            setIsLoadingClients(true);
            setError('');

            try {
                const loadedClients = await fetchClients(businessId);

                if (!ignore) {
                    setClients(loadedClients);
                }
            } catch (err: unknown) {
                if (!ignore) {
                    setClients([]);
                    setError(getApiErrorMessage(err, 'Unable to load clients for invoicing.'));
                }
            } finally {
                if (!ignore) {
                    setIsLoadingClients(false);
                }
            }
        }

        void loadClients();

        return () => {
            ignore = true;
        };
    }, [business]);

    if (!business) {
        return <div className="page"><p>Select a business profile first.</p></div>;
    }

    if (isLoadingClients) {
        return <div className="page"><p>Loading clients...</p></div>;
    }

    if (selectableClients.length === 0) {
        return (
            <div className="page">
                <PageHeader title="Create Invoice" backTo={invoiceListPath} />
                {error ? <div className="error-msg">{error}</div> : null}
                <div className="empty-state-card">
                    <h2>No active clients available</h2>
                    <p>Create or reactivate a client before creating an invoice for this business.</p>
                    <div className="empty-state-actions">
                        <Button variant="contained" onClick={() => navigate('/clients/new')}>
                            Create Client
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (values: InvoiceEditorValues) => {
        setError('');

        try {
            const invoice = await createInvoice({
                businessId: business.id,
                clientId: values.clientId,
                invoiceDate: values.invoiceDate,
                dueDate: values.dueDate || null,
                currency: values.currency,
                lineItems: values.lineItems.map((lineItem) => ({
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
            setError(getApiErrorMessage(err, 'Unable to create invoice.'));
        }
    };

    return (
        <div className="page invoice-editor-page">
            <PageHeader title="Create Invoice" backTo={invoiceListPath} />
            <InvoiceEditorForm
                initialValue={createCreateInvoiceValues(business.defaultCurrency)}
                clients={selectableClients}
                showClientField
                submitLabel="Create Invoice"
                error={error}
                onSubmit={handleSubmit}
                onCancel={() => navigate(invoiceListPath)}
            />
        </div>
    );
}
