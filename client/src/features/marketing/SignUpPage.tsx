import Button from '@mui/material/Button';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { useAccountSettings } from '../../app/context/AccountSettingsContext';
import { requestEmailVerificationRequest } from '../auth/api';
import { getApiErrorMessage } from '../../shared/api';
import logo from '../../assets/invoiceflow-logo.svg';

const RESEND_COOLDOWN_SECONDS = 60;

export function SignUpPage() {
    const location = useLocation();
    const { isAuthenticated, signUp } = useAuth();
    const { updateSettings } = useAccountSettings();
    const redirectTo = location.state?.from?.pathname ?? '/dashboard';
    const [formValues, setFormValues] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof typeof formValues, string>>>({});
    const [submitError, setSubmitError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [verificationEmail, setVerificationEmail] = useState('');
    const [isVerificationSubmitting, setIsVerificationSubmitting] = useState(false);
    const [resendCooldownEndsAt, setResendCooldownEndsAt] = useState<number | null>(null);
    const [resendCooldownSecondsLeft, setResendCooldownSecondsLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!resendCooldownEndsAt) {
            setResendCooldownSecondsLeft(0);
            return;
        }

        function syncCooldown() {
            const endsAt = resendCooldownEndsAt;
            if (!endsAt) {
                setResendCooldownSecondsLeft(0);
                return;
            }
            const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
            setResendCooldownSecondsLeft(secondsLeft);
            if (secondsLeft === 0) {
                setResendCooldownEndsAt(null);
            }
        }

        syncCooldown();
        const interval = window.setInterval(syncCooldown, 1000);
        return () => window.clearInterval(interval);
    }, [resendCooldownEndsAt]);

    function handleFieldChange(field: keyof typeof formValues, value: string) {
        setFormValues((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const nextErrors = { ...current };
            delete nextErrors[field];
            return nextErrors;
        });
    }

    function validateForm() {
        const nextErrors: Partial<Record<keyof typeof formValues, string>> = {};
        const normalizedName = formValues.name.trim();
        const normalizedEmail = formValues.email.trim();

        if (!normalizedName) {
            nextErrors.name = 'Enter your full name.';
        }

        if (!normalizedEmail) {
            nextErrors.email = 'Enter your email address.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            nextErrors.email = 'Enter a valid email address.';
        }

        if (!formValues.password) {
            nextErrors.password = 'Create a password.';
        } else if (formValues.password.length < 8) {
            nextErrors.password = 'Use at least 8 characters.';
        }

        if (!formValues.confirmPassword) {
            nextErrors.confirmPassword = 'Confirm your password.';
        } else if (formValues.password !== formValues.confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match.';
        }

        return nextErrors;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitError('');
        setSuccessMessage('');

        const nextErrors = validateForm();
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        const name = formValues.name.trim().replace(/\s+/g, ' ');
        const email = formValues.email.trim().toLowerCase();

        setIsSubmitting(true);

        try {
            const result = await signUp({ name, email, password: formValues.password });
            updateSettings({ name });
            setSuccessMessage(result.message);
            setVerificationEmail(result.email);
            setResendCooldownEndsAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
            setFormValues({
                name: '',
                email,
                password: '',
                confirmPassword: '',
            });
        } catch (err) {
            setSubmitError(getApiErrorMessage(err, 'Unable to create your account.'));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResendVerification() {
        if (!verificationEmail) {
            return;
        }

        setSubmitError('');
        setIsVerificationSubmitting(true);

        try {
            const message = await requestEmailVerificationRequest({ email: verificationEmail });
            setSuccessMessage(message);
            setResendCooldownEndsAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
        } catch (err) {
            setSubmitError(getApiErrorMessage(err, 'Unable to send a new verification email.'));
        } finally {
            setIsVerificationSubmitting(false);
        }
    }

    if (isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    return (
        <div className="access-page">
            <div className="access-shell">
                <Link to="/" className="landing-brand access-brand">
                    <img src={logo} alt="InvoiceFlow logo" className="landing-brand-logo" />
                    <div className="landing-brand-copy">
                        <strong>InvoiceFlow</strong>
                        <span>Billing workspace</span>
                    </div>
                </Link>

                <div className="signup-layout">
                    <section className="access-card signup-card-primary">
                        <span className="landing-kicker">Sign up</span>
                        <div className="signup-card-header">
                            <h1 className="signup-card-title">Create your workspace.</h1>
                            <p className="signup-card-subtitle">
                                Create your account to open a dedicated workspace where your business profiles, clients,
                                invoices, and payments stay organized in one place.
                            </p>
                        </div>

                        <form className="access-form" onSubmit={handleSubmit} noValidate>
                            <div className="access-form-grid">
                                <div className="access-field access-field-full">
                                    <label htmlFor="signup-name">Full name</label>
                                    <input
                                        id="signup-name"
                                        className={`access-input${errors.name ? ' access-input-error' : ''}`}
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Avery Stone"
                                        value={formValues.name}
                                        onChange={(event) => handleFieldChange('name', event.target.value)}
                                    />
                                    <span className="access-field-error" aria-live="polite">{errors.name ?? ''}</span>
                                </div>

                                <div className="access-field access-field-full">
                                    <label htmlFor="signup-email">Email address</label>
                                    <input
                                        id="signup-email"
                                        className={`access-input${errors.email ? ' access-input-error' : ''}`}
                                        type="email"
                                        autoComplete="email"
                                        placeholder="name@company.com"
                                        value={formValues.email}
                                        onChange={(event) => handleFieldChange('email', event.target.value)}
                                    />
                                    <span className="access-field-error" aria-live="polite">{errors.email ?? ''}</span>
                                </div>

                                <div className="access-field">
                                    <label htmlFor="signup-password">Password</label>
                                    <input
                                        id="signup-password"
                                        className={`access-input${errors.password ? ' access-input-error' : ''}`}
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="At least 8 characters"
                                        value={formValues.password}
                                        onChange={(event) => handleFieldChange('password', event.target.value)}
                                    />
                                    <span className="access-field-error" aria-live="polite">{errors.password ?? ''}</span>
                                </div>

                                <div className="access-field">
                                    <label htmlFor="signup-confirm-password">Confirm password</label>
                                    <input
                                        id="signup-confirm-password"
                                        className={`access-input${errors.confirmPassword ? ' access-input-error' : ''}`}
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Re-enter password"
                                        value={formValues.confirmPassword}
                                        onChange={(event) => handleFieldChange('confirmPassword', event.target.value)}
                                    />
                                    <span className="access-field-error" aria-live="polite">{errors.confirmPassword ?? ''}</span>
                                </div>
                            </div>

                            <p className="access-password-hint">
                                Use the email you want tied to this workspace. Your password must be at least 8 characters.
                            </p>

                            {submitError ? <div className="error-msg">{submitError}</div> : null}
                            {successMessage ? <div className="access-feedback">{successMessage}</div> : null}

                            {verificationEmail ? (
                                <div className="access-secondary-panel">
                                    <p className="access-secondary-copy">
                                        Need another verification link for <strong>{verificationEmail}</strong>?
                                    </p>
                                    <div className="access-inline-action-row">
                                        <Button
                                            type="button"
                                            variant="text"
                                            size="small"
                                            className="access-inline-action"
                                            onClick={() => void handleResendVerification()}
                                            disabled={isSubmitting || isVerificationSubmitting || resendCooldownSecondsLeft > 0}
                                        >
                                            {isVerificationSubmitting
                                                ? 'Sending verification...'
                                                : resendCooldownSecondsLeft > 0
                                                    ? `Resend in ${resendCooldownSecondsLeft}s`
                                                    : 'Resend verification email'}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            <div className="access-actions access-form-actions signup-form-actions">
                                <Button component={Link} to="/" variant="outlined" size="large" disabled={isSubmitting}>
                                    Back to Landing Page
                                </Button>
                                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                </Button>
                            </div>
                        </form>

                        <p className="access-note">
                            Already have a workspace? <Link to="/signin">Sign in instead</Link>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
