import Button from '@mui/material/Button';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { CancelButton } from '../../shared/components/CancelButton';
import { CurrencySelect } from '../../shared/components/CurrencySelect';
import { GreenSwitch } from '../../shared/components/GreenSwitch';
import { PageHeader } from '../../shared/components/PageHeader';
import type { Address } from '../../shared/types';
import { fetchBusinessProfile, updateBusinessProfile } from './api';
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

export function EditBusinessProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { business, setBusiness, reload } = useBusiness();
    const [form, setForm] = useState<BusinessProfileForm | null>(null);
    const [isLoading, setIsLoading] = useState(() => Boolean(id));
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (!id) {
            return;
        }
        const businessId = id;

        let ignore = false;

        async function load() {
            setIsLoading(true);
            setError('');

            try {
                const profile = await fetchBusinessProfile(businessId);

                if (ignore) {
                    return;
                }

                setForm({
                    isActive: profile.isActive,
                    businessName: profile.businessName,
                    email: profile.email,
                    phone: profile.phone,
                    website: profile.website || '',
                    taxId: profile.taxId || '',
                    defaultCurrency: profile.defaultCurrency,
                    paymentInstructions: profile.paymentInstructions || '',
                    address: { ...profile.address },
                });
            } catch (err: unknown) {
                if (!ignore) {
                    setError(getApiErrorMessage(err, 'Unable to load business profile.'));
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

    const getFieldError = (field: string) => fieldErrors[field]?.[0];

    const setAddr = (key: keyof Address, value: string) =>
        setForm((current) => current ? { ...current, address: { ...current.address, [key]: value } } : current);

    const normalizeForm = () => {
        if (!form) {
            return null;
        }

        return {
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
        };
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!id || !form) {
            return;
        }
        const businessId = id;

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
            const updated = await updateBusinessProfile(businessId, normalizeForm() ?? {});
            if (updated.isActive) {
                setBusiness(updated);
            } else if (business?.id === businessId) {
                setBusiness(null);
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

            setError(getApiErrorMessage(err, 'Unable to update business profile.'));
        }
    };

    if (isLoading) {
        return <div className="page"><p>Loading...</p></div>;
    }

    if (!id) {
        return <div className="page"><p>Business profile not found.</p></div>;
    }

    if (!form) {
        return <div className="page"><p>{error || 'Business profile could not be loaded.'}</p></div>;
    }

    return (
        <div className="page">
            <PageHeader title="Edit Business Profile" backTo="/businesses" />

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
                    <Button type="submit" variant="contained">Update</Button>
                </div>
            </form>
        </div>
    );
}
