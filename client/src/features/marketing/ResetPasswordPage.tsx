import Button from '@mui/material/Button';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordRequest } from '../auth/api';
import { getApiErrorMessage } from '../../shared/api';
import logo from '../../assets/invoiceflow-logo.svg';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token')?.trim() ?? '';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');

        if (!token) {
            setError('This password reset link is invalid or missing a token.');
            return;
        }

        if (!password) {
            setError('Enter a new password.');
            return;
        }

        if (password.length < 8) {
            setError('Use at least 8 characters for your new password.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            const message = await resetPasswordRequest({ token, password });
            setPassword('');
            setConfirmPassword('');
            navigate('/signin', {
                replace: true,
                state: {
                    resetSuccessMessage: message,
                },
            });
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to reset password.'));
        } finally {
            setIsSubmitting(false);
        }
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
                        <span className="landing-kicker">Reset password</span>
                        <div className="signup-card-header">
                            <h1 className="signup-card-title">Choose a new password.</h1>
                            <p className="signup-card-subtitle">
                                Enter a new password for your workspace account, then head back to sign in.
                            </p>
                        </div>

                        <form className="access-form" onSubmit={handleSubmit} noValidate>
                            <div className="access-form-grid">
                                <div className="access-field access-field-full">
                                    <label htmlFor="reset-password">New password</label>
                                    <input
                                        id="reset-password"
                                        className="access-input"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="At least 8 characters"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                    />
                                </div>

                                <div className="access-field access-field-full">
                                    <label htmlFor="reset-password-confirm">Confirm new password</label>
                                    <input
                                        id="reset-password-confirm"
                                        className="access-input"
                                        type="password"
                                        autoComplete="new-password"
                                        placeholder="Re-enter your new password"
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                    />
                                </div>
                            </div>

                            {error ? <div className="error-msg">{error}</div> : null}
                            <div className="access-actions access-form-actions signup-form-actions">
                                <Button component={Link} to="/signin" variant="outlined" size="large" disabled={isSubmitting}>
                                    Back to Sign In
                                </Button>
                                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
