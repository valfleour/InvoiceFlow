import Button from '@mui/material/Button';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CancelButton } from '../../shared/components/CancelButton';
import { GreenSwitch } from '../../shared/components/GreenSwitch';
import { PageHeader } from '../../shared/components/PageHeader';
import type { Address, Client } from '../../shared/types';
import { getApiErrorMessage } from '../../shared/api';
import { fetchClient, updateClient } from './api';

type ClientForm = {
    isActive: boolean;
    clientName: string;
    companyName: string;
    email: string;
    phone: string;
    taxId: string;
    notes: string;
    billingAddress: Address;
};

export function EditClientPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form, setForm] = useState<ClientForm | null>(null);
    const [isLoading, setIsLoading] = useState(() => Boolean(id));
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<'clientName' | 'email', string>>>({});

    useEffect(() => {
        if (!id) {
            return;
        }
        const clientId = id;

        let ignore = false;

        async function load() {
            setIsLoading(true);
            setError('');

            try {
                const client: Client = await fetchClient(clientId);

                if (ignore) {
                    return;
                }

                setForm({
                    isActive: client.isActive,
                    clientName: client.clientName,
                    companyName: client.companyName || '',
                    email: client.email,
                    phone: client.phone || '',
                    taxId: client.taxId || '',
                    notes: client.notes || '',
                    billingAddress: { ...client.billingAddress },
                });
            } catch (err: unknown) {
                if (!ignore) {
                    setError(getApiErrorMessage(err, 'Unable to load client.'));
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

    const setAddr = (key: keyof Address, value: string) => {
        setForm((current) => current ? {
            ...current,
            billingAddress: {
                ...current.billingAddress,
                [key]: value,
            },
        } : current);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!id || !form) {
            return;
        }
        const clientId = id;

        setError('');
        setFieldErrors({});

        const nextFieldErrors: Partial<Record<'clientName' | 'email', string>> = {};
        if (!form.clientName.trim()) {
            nextFieldErrors.clientName = 'Client name is required.';
        }
        if (!form.email.trim()) {
            nextFieldErrors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            nextFieldErrors.email = 'Enter a valid email address.';
        }

        if (Object.keys(nextFieldErrors).length > 0) {
            setFieldErrors(nextFieldErrors);
            setError('Please fix the highlighted fields.');
            return;
        }

        try {
            await updateClient(clientId, form);
            navigate('/clients');
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to update client.'));
        }
    };

    if (isLoading) {
        return <div className="page"><p>Loading...</p></div>;
    }

    if (!id) {
        return <div className="page"><p>Client not found.</p></div>;
    }

    if (!form) {
        return <div className="page"><p>{error || 'Client could not be loaded.'}</p></div>;
    }

    return (
        <div className="page">
            <PageHeader title="Edit Client" backTo="/clients" />

            {error ? <div className="error-msg">{error}</div> : null}

            <form onSubmit={handleSubmit} className="form">
                <div className="toggle-row">
                    <GreenSwitch
                        checked={form.isActive}
                        onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                        ariaLabel="client active status"
                        label={form.isActive ? 'Active Client' : 'Inactive Client'}
                    />
                </div>

                <label>Client Name *</label>
                <input
                    className={fieldErrors.clientName ? 'input-error' : undefined}
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    aria-invalid={Boolean(fieldErrors.clientName)}
                    required
                />
                {fieldErrors.clientName ? <div className="field-error">{fieldErrors.clientName}</div> : null}

                <label>Company Name</label>
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />

                <label>Email *</label>
                <input
                    className={fieldErrors.email ? 'input-error' : undefined}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    aria-invalid={Boolean(fieldErrors.email)}
                    required
                />
                {fieldErrors.email ? <div className="field-error">{fieldErrors.email}</div> : null}

                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

                <label>Tax ID</label>
                <input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />

                <label>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

                <fieldset className="fieldset">
                    <legend>Billing Address</legend>
                    <label>Street *</label>
                    <input value={form.billingAddress.street} onChange={(e) => setAddr('street', e.target.value)} required />
                    <label>City *</label>
                    <input value={form.billingAddress.city} onChange={(e) => setAddr('city', e.target.value)} required />
                    <label>State *</label>
                    <input value={form.billingAddress.state} onChange={(e) => setAddr('state', e.target.value)} required />
                    <label>Postal Code *</label>
                    <input value={form.billingAddress.postalCode} onChange={(e) => setAddr('postalCode', e.target.value)} required />
                    <label>Country *</label>
                    <input value={form.billingAddress.country} onChange={(e) => setAddr('country', e.target.value)} required />
                </fieldset>

                <div className="form-actions">
                    <CancelButton onClick={() => navigate('/clients')} />
                    <Button type="submit" variant="contained">Update</Button>
                </div>
            </form>
        </div>
    );
}
