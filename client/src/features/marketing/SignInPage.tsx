import Button from '@mui/material/Button';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { forgotPasswordRequest, requestEmailVerificationRequest } from '../auth/api';
import { getApiErrorMessage } from '../../shared/api';
import logo from '../../assets/invoiceflow-logo.svg';

const RESEND_COOLDOWN_SECONDS = 60;

export function SignInPage() {
    const location = useLocation();
    const { isAuthenticated, signIn } = useAuth();
    const [formValues, setFormValues] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState('');
    const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
    const [verificationMessage, setVerificationMessage] = useState(
        () => location.state?.resetSuccessMessage ?? ''
    );
    const [showResendVerification, setShowResendVerification] = useState(false);
    const [resendEmail, setResendEmail] = useState('');
    const [resendCooldownEndsAt, setResendCooldownEndsAt] = useState<number | null>(null);
    const [resendCooldownSecondsLeft, setResendCooldownSecondsLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResetSubmitting, setIsResetSubmitting] = useState(false);
    const [isVerificationSubmitting, setIsVerificationSubmitting] = useState(false);

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

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setVerificationMessage('');
        setShowResendVerification(false);
        setIsSubmitting(true);

        try {
            await signIn(formValues);
        } catch (err) {
            const nextError = getApiErrorMessage(err, 'Unable to sign in.');
            if (nextError.includes('Email verification is required before signing in')) {
                setError('Your account is not verified.');
                setShowResendVerification(true);
                setResendEmail(formValues.email.trim().toLowerCase());
            } else {
                setError(nextError);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResendVerification() {
        const email = resendEmail || formValues.email.trim().toLowerCase();

        setError('');
        setVerificationMessage('');

        if (!email) {
            setError('Enter your email address first, then request a new verification link.');
            return;
        }

        setIsVerificationSubmitting(true);

        try {
            const message = await requestEmailVerificationRequest({ email });
            setVerificationMessage(message);
            setResendCooldownEndsAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to send a new verification email.'));
        } finally {
            setIsVerificationSubmitting(false);
        }
    }

    async function handleForgotPassword() {
        const email = formValues.email.trim().toLowerCase();

        setForgotPasswordError('');
        setForgotPasswordMessage('');

        if (!email) {
            setForgotPasswordError('Enter your email address first, then try again.');
            return;
        }

        setIsResetSubmitting(true);

        try {
            const message = await forgotPasswordRequest({ email });
            setForgotPasswordMessage(message);
        } catch (err) {
            setForgotPasswordError(getApiErrorMessage(err, 'Unable to start password reset.'));
        } finally {
            setIsResetSubmitting(false);
        }
    }

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
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
                        <span className="landing-kicker">Sign in</span>
                        <div className="signup-card-header">
                            <h1 className="signup-card-title">Welcome back.</h1>
                            <p className="signup-card-subtitle">
                                Sign in to return to your private billing workspace and continue managing your clients,
                                invoices, and payment activity.
                            </p>
                        </div>

                        <form className="access-form" onSubmit={handleSubmit} noValidate>
                        <div className="access-form-grid">
                            <div className="access-field access-field-full">
                                <label htmlFor="signin-email">Email address</label>
                                <input
                                    id="signin-email"
                                    className="access-input"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="name@company.com"
                                    value={formValues.email}
                                    onChange={(event) => {
                                        setForgotPasswordError('');
                                        setForgotPasswordMessage('');
                                        setShowResendVerification(false);
                                        setFormValues((current) => ({ ...current, email: event.target.value }));
                                    }}
                                />
                                <span className="access-field-error" aria-live="polite" />
                            </div>

                            <div className="access-field access-field-full">
                                <label htmlFor="signin-password">Password</label>
                                <input
                                    id="signin-password"
                                    className="access-input"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={formValues.password}
                                    onChange={(event) => {
                                        setShowResendVerification(false);
                                        setFormValues((current) => ({ ...current, password: event.target.value }));
                                    }}
                                />
                                <div className="access-inline-action-row">
                                    <Button
                                        type="button"
                                        variant="text"
                                        size="small"
                                        className="access-inline-action"
                                        onClick={() => void handleForgotPassword()}
                                        disabled={isSubmitting || isResetSubmitting}
                                    >
                                        {isResetSubmitting ? 'Sending...' : 'Forgot password?'}
                                    </Button>
                                </div>
                                <span className="access-field-error" aria-live="polite" />
                            </div>
                        </div>

                        {error ? <div className="error-msg">{error}</div> : null}
                        {forgotPasswordError ? <div className="error-msg">{forgotPasswordError}</div> : null}
                        {forgotPasswordMessage ? <div className="access-feedback">{forgotPasswordMessage}</div> : null}
                        {verificationMessage ? <div className="access-feedback">{verificationMessage}</div> : null}

                        <div className="access-actions access-form-actions signup-form-actions">
                            <Button component={Link} to="/" variant="outlined" size="large" disabled={isSubmitting}>
                                Back to Landing Page
                            </Button>
                            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                {isSubmitting ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </div>

                        {showResendVerification ? (
                            <div className="access-secondary-panel">
                                <p className="access-secondary-copy">
                                    Your account is not verified yet. Request a fresh verification email to unlock sign in.
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
                        </form>

                        <p className="access-note">
                            Don&apos;t have a workspace yet? <Link to="/signup">Create an account</Link>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
