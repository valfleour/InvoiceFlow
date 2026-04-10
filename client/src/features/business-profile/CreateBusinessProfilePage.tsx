import Button from '@mui/material/Button';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { createBusinessProfile } from './api';
import { CurrencySelect } from '../../shared/components/CurrencySelect';
import { GreenSwitch } from '../../shared/components/GreenSwitch';
import { CancelButton } from '../../shared/components/CancelButton';
import { PageHeader } from '../../shared/components/PageHeader';
import type { Address } from '../../shared/types';
import { getApiErrorMessage, getValidationErrors } from '../../shared/api';

type BusinessProfileForm = {
    isActive: boolean;
    businessName: string;
    email: string;
    phone: string;
    website: string;
    taxId: string;
    defaultCurrency: string;
    paymentInstructions: string;
    address: Address;
};

const emptyForm: BusinessProfileForm = {
    isActive: true,
    businessName: '',
    email: '',
    phone: '',
    website: '',
    taxId: '',
    defaultCurrency: 'USD',
    paymentInstructions: '',
    address: { street: '', city: '', state: '', postalCode: '', country: '' },
};

export function CreateBusinessProfilePage() {
    const navigate = useNavigate();
    const { setBusiness, reload } = useBusiness();
    const [form, setForm] = useState<BusinessProfileForm>(emptyForm);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    const getFieldError = (field: string) => fieldErrors[field]?.[0];

    const setAddr = (key: keyof Address, value: string) =>
        setForm((current) => ({ ...current, address: { ...current.address, [key]: value } }));

    const normalizeForm = () => ({
        isActive: form.isActive,
        businessName: form.businessName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim() || undefined,
        taxId: form.taxId.trim() || undefined,
        defaultCurrency: form.defaultCurrency.trim(),
        paymentInstructions: form.paymentInstructions.trim() || undefined,
        address: {
            street: form.address.street.trim(),
            city: form.address.city.trim(),
            state: form.address.state.trim(),
            postalCode: form.address.postalCode.trim(),
            country: form.address.country.trim(),
        },
    });

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setFieldErrors({});

        const localErrors: Record<string, string[]> = {};
        if (!form.businessName.trim()) {
            localErrors.businessName = ['Business name is required.'];
        }
        if (!form.email.trim()) {
            localErrors.email = ['Email is required.'];
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            localErrors.email = ['Enter a valid email address.'];
        }
        if (form.taxId.trim() && !/^[A-Za-z0-9][A-Za-z0-9\-/_ ]{1,38}[A-Za-z0-9]$/.test(form.taxId.trim())) {
            localErrors.taxId = ['Tax ID can contain letters, numbers, spaces, hyphens, slashes, and underscores only.'];
        }

        if (Object.keys(localErrors).length > 0) {
            setFieldErrors(localErrors);
            setError('Please fix the highlighted fields.');
            return;
        }

        try {
            const created = await createBusinessProfile(normalizeForm());
            if (created.isActive) {
                setBusiness(created);
            }
            reload();
            navigate('/businesses');
        } catch (err: unknown) {
            const details = getValidationErrors(err);
            if (details) {
                setFieldErrors(details);
                setError('Please fix the highlighted fields.');
                return;
            }

            setError(getApiErrorMessage(err, 'Unable to create business profile.'));
        }
    };

    return (
        <div className="page">
            <PageHeader title="Create Business Profile" backTo="/businesses" />

            {error ? <div className="error-msg">{error}</div> : null}

            <form onSubmit={handleSubmit} className="form">
                <div className="toggle-row">
                    <GreenSwitch
                        checked={form.isActive}
                        onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                        ariaLabel="business active status"
                        label={form.isActive ? 'Active Business' : 'Inactive Business'}
                    />
                </div>

                <label>Business Name *</label>
                <input
                    className={getFieldError('businessName') ? 'input-error' : undefined}
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    aria-invalid={Boolean(getFieldError('businessName'))}
                    required
                />
                {getFieldError('businessName') && <div className="field-error">{getFieldError('businessName')}</div>}

                <label>Email *</label>
                <input
                    className={getFieldError('email') ? 'input-error' : undefined}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    aria-invalid={Boolean(getFieldError('email'))}
                    required
                />
                {getFieldError('email') && <div className="field-error">{getFieldError('email')}</div>}

                <label>Phone *</label>
                <input
                    className={getFieldError('phone') ? 'input-error' : undefined}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    aria-invalid={Boolean(getFieldError('phone'))}
                    required
                />
                {getFieldError('phone') && <div className="field-error">{getFieldError('phone')}</div>}

                <label>Website</label>
                <input
                    className={getFieldError('website') ? 'input-error' : undefined}
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    aria-invalid={Boolean(getFieldError('website'))}
                />
                {getFieldError('website') && <div className="field-error">{getFieldError('website')}</div>}

                <label>Tax ID</label>
                <input
                    className={getFieldError('taxId') ? 'input-error' : undefined}
                    value={form.taxId}
                    onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                    aria-invalid={Boolean(getFieldError('taxId'))}
                />
                {getFieldError('taxId') && <div className="field-error">{getFieldError('taxId')}</div>}

                <label>Default Currency</label>
                <CurrencySelect
                    className={getFieldError('defaultCurrency') ? 'input-error' : undefined}
                    value={form.defaultCurrency}
                    onChange={(value) => setForm({ ...form, defaultCurrency: value })}
                    ariaInvalid={Boolean(getFieldError('defaultCurrency'))}
                />
                {getFieldError('defaultCurrency') && <div className="field-error">{getFieldError('defaultCurrency')}</div>}

                <label>Payment Instructions</label>
                <textarea value={form.paymentInstructions} onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })} />

                <fieldset className="fieldset">
                    <legend>Address</legend>
                    <label>Street *</label>
                    <input
                        className={getFieldError('address.street') ? 'input-error' : undefined}
                        value={form.address.street}
                        onChange={(e) => setAddr('street', e.target.value)}
                        aria-invalid={Boolean(getFieldError('address.street'))}
                        required
                    />
                    {getFieldError('address.street') && <div className="field-error">{getFieldError('address.street')}</div>}
                    <label>City *</label>
                    <input
                        className={getFieldError('address.city') ? 'input-error' : undefined}
                        value={form.address.city}
                        onChange={(e) => setAddr('city', e.target.value)}
                        aria-invalid={Boolean(getFieldError('address.city'))}
                        required
                    />
                    {getFieldError('address.city') && <div className="field-error">{getFieldError('address.city')}</div>}
                    <label>State *</label>
                    <input
                        className={getFieldError('address.state') ? 'input-error' : undefined}
                        value={form.address.state}
                        onChange={(e) => setAddr('state', e.target.value)}
                        aria-invalid={Boolean(getFieldError('address.state'))}
                        required
                    />
                    {getFieldError('address.state') && <div className="field-error">{getFieldError('address.state')}</div>}
                    <label>Postal Code *</label>
                    <input
                        className={getFieldError('address.postalCode') ? 'input-error' : undefined}
                        value={form.address.postalCode}
                        onChange={(e) => setAddr('postalCode', e.target.value)}
                        aria-invalid={Boolean(getFieldError('address.postalCode'))}
                        required
                    />
                    {getFieldError('address.postalCode') && <div className="field-error">{getFieldError('address.postalCode')}</div>}
                    <label>Country *</label>
                    <input
                        className={getFieldError('address.country') ? 'input-error' : undefined}
                        value={form.address.country}
                        onChange={(e) => setAddr('country', e.target.value)}
                        aria-invalid={Boolean(getFieldError('address.country'))}
                        required
                    />
                    {getFieldError('address.country') && <div className="field-error">{getFieldError('address.country')}</div>}
                </fieldset>

                <div className="form-actions">
                    <CancelButton onClick={() => navigate('/businesses')} />
                    <Button type="submit" variant="contained">Create</Button>
                </div>
            </form>
        </div>
    );
}
