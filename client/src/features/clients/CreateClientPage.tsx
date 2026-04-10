import Button from '@mui/material/Button';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { CancelButton } from '../../shared/components/CancelButton';
import { GreenSwitch } from '../../shared/components/GreenSwitch';
import { PageHeader } from '../../shared/components/PageHeader';
import type { Address, Client } from '../../shared/types';
import { getApiErrorMessage } from '../../shared/api';
import { createClient, fetchClients } from './api';

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

const emptyForm: ClientForm = {
    isActive: true,
    clientName: '',
    companyName: '',
    email: '',
    phone: '',
    taxId: '',
    notes: '',
    billingAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
};

export function CreateClientPage() {
    const navigate = useNavigate();
    const { business } = useBusiness();
    const [form, setForm] = useState<ClientForm>(emptyForm);
    const [existingClients, setExistingClients] = useState<Client[]>([]);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<'clientName' | 'email', string>>>({});

    useEffect(() => {
        if (!business) {
            setExistingClients([]);
            return;
        }
        const businessId = business.id;

        let ignore = false;

        async function loadClients() {
            try {
                const clients = await fetchClients(businessId);
                if (!ignore) {
                    setExistingClients(clients);
                }
            } catch {
                if (!ignore) {
                    setExistingClients([]);
                }
            }
        }

        void loadClients();

        return () => {
            ignore = true;
        };
    }, [business]);

    const duplicateCandidate = useMemo(() => {
        const normalizedName = normalizeClientName(form.clientName);
        const normalizedEmail = normalizeEmail(form.email);

        if (!normalizedName || !normalizedEmail) {
            return null;
        }

        return existingClients.find((client) =>
            normalizeClientName(client.clientName) === normalizedName
            && normalizeEmail(client.email) === normalizedEmail
        ) ?? null;
    }, [existingClients, form.clientName, form.email]);

    const setAddr = (key: keyof Address, value: string) => {
        setForm((current) => ({
            ...current,
            billingAddress: {
                ...current.billingAddress,
                [key]: value,
            },
        }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
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
            if (!business) {
                setError('Select a business profile first.');
                return;
            }

            await createClient({ ...form, businessId: business.id });
            navigate('/clients');
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to create client.'));
        }
    };

    if (!business) {
        return <div className="page"><p>Select a business profile first.</p></div>;
    }

    return (
        <div className="page">
            <PageHeader title="Create Client" backTo="/clients" />

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
                {duplicateCandidate ? (
                    <div className="field-hint">
                        Possible duplicate: {duplicateCandidate.clientName}
                        {duplicateCandidate.companyName ? ` (${duplicateCandidate.companyName})` : ''} already uses this email.
                    </div>
                ) : null}

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
                    <Button type="submit" variant="contained">Create</Button>
                </div>
            </form>
        </div>
    );
}

function normalizeClientName(value: string) {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
}
