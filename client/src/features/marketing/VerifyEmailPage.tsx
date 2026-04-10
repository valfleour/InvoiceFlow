import Button from '@mui/material/Button';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmEmailVerificationRequest } from '../auth/api';
import { getApiErrorMessage } from '../../shared/api';
import logo from '../../assets/invoiceflow-logo.svg';

export function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token')?.trim() ?? '';
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const title = isLoading
        ? 'Checking your link.'
        : message
            ? 'Email confirmed.'
            : 'Verification issue.';
    const subtitle = isLoading
        ? 'We are validating your verification link now.'
        : message
            ? 'Your workspace account is verified and ready for sign in.'
            : 'This verification link could not be completed.';

    useEffect(() => {
        let cancelled = false;

        async function verifyEmail() {
            if (!token) {
                if (!cancelled) {
                    setError('This email verification link is invalid or missing a token.');
                    setIsLoading(false);
                }
                return;
            }

            try {
                const result = await confirmEmailVerificationRequest({ token });
                if (!cancelled) {
                    setMessage(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(getApiErrorMessage(err, 'Unable to verify your email.'));
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        void verifyEmail();

        return () => {
            cancelled = true;
        };
    }, [token]);

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
                    <section className="access-card signup-card-primary verification-card">
                        <span className="landing-kicker">Email verification</span>
                        <div className="signup-card-header verification-card-header">
                            <h1 className="signup-card-title verification-card-title">{title}</h1>
                            <p className="signup-card-subtitle verification-card-subtitle">
                                {subtitle}
                            </p>
                        </div>

                        {isLoading ? <p className="verification-card-status">Verifying your email...</p> : null}
                        {!isLoading && message ? <div className="access-feedback">{message}</div> : null}
                        {!isLoading && error ? <div className="error-msg">{error}</div> : null}

                        <div className="access-actions access-form-actions verification-card-actions">
                            <Button component={Link} to="/signin" variant="contained" size="large">
                                Go to Sign In
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
