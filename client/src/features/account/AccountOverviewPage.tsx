import { useEffect, useRef, useState, type FormEvent } from 'react';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/context/AuthContext';
import { useAccountSettings } from '../../app/context/AccountSettingsContext';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { forgotPasswordRequest } from '../auth/api';
import { getApiErrorMessage } from '../../shared/api';
import { ConfirmationDialog } from '../../shared/components/ConfirmationDialog';
import { PageHeader } from '../../shared/components/PageHeader';
import {
    SUPPORTED_LOCALES,
    SUPPORTED_THEMES,
    SUPPORTED_TIME_ZONES,
    getLocaleLabel,
    getThemeLabel,
    getTimeZoneLabel,
} from '../../shared/localization';
import { formatNumber } from '../../shared/utils';
import { currentUser, getUserInitials } from './currentUser';

export function AccountOverviewPage() {
    const navigate = useNavigate();
    const { signOut, user, updateProfile } = useAuth();
    const { settings, updateSettings, resetSettings } = useAccountSettings();
    const { business, businesses } = useBusiness();
    const [draft, setDraft] = useState(settings);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditOpening, setIsEditOpening] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [passwordResetMessage, setPasswordResetMessage] = useState('');
    const [saveErrorMessage, setSaveErrorMessage] = useState('');
    const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
    const editOpeningTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isEditing) {
            setDraft(settings);
        }
    }, [isEditing, settings]);

    useEffect(() => (
        () => {
            if (editOpeningTimerRef.current !== null) {
                window.clearTimeout(editOpeningTimerRef.current);
            }
        }
    ), []);

    const initials = getUserInitials(settings.name);
    const accessibleBusinessCount = businesses.length;
    const selectedBusinessName = business?.businessName ?? 'No business selected';
    const accountEmail = user?.email ?? currentUser.email;

    function clearEditOpeningState() {
        if (editOpeningTimerRef.current !== null) {
            window.clearTimeout(editOpeningTimerRef.current);
            editOpeningTimerRef.current = null;
        }

        setIsEditOpening(false);
    }

    function handleEditStart() {
        clearEditOpeningState();
        setDraft(settings);
        setPasswordResetMessage('');
        setSaveErrorMessage('');
        setSaveSuccessMessage('');
        setIsEditOpening(true);
        setIsEditing(true);
        editOpeningTimerRef.current = window.setTimeout(() => {
            setIsEditOpening(false);
            editOpeningTimerRef.current = null;
        }, 250);
    }

    function handleEditCancel() {
        clearEditOpeningState();
        setDraft(settings);
        setPasswordResetMessage('');
        setSaveErrorMessage('');
        setIsEditing(false);
    }

    async function handleSave(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isEditOpening) {
            return;
        }

        const normalizedName = draft.name.trim().replace(/\s+/g, ' ');

        if (!normalizedName) {
            setSaveErrorMessage('Name is required.');
            return;
        }

        setIsSaving(true);
        setSaveErrorMessage('');

        try {
            await updateProfile({ name: normalizedName });
            clearEditOpeningState();
            updateSettings({
                ...draft,
                name: normalizedName,
            });
            setSaveSuccessMessage('Account details updated.');
            setPasswordResetMessage('');
            setIsEditing(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to update account details.';
            setSaveErrorMessage(message);
            return;
        } finally {
            setIsSaving(false);
        }

        setPasswordResetMessage('');
    }

    function handleDraftChange(field: 'name' | 'locale' | 'timeZone' | 'theme', value: string) {
        setDraft((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleResetPassword() {
        setPasswordResetMessage('');
        setSaveErrorMessage('');
        setIsResettingPassword(true);

        try {
            const message = await forgotPasswordRequest({ email: accountEmail });
            setPasswordResetMessage(message);
        } catch (error) {
            setSaveErrorMessage(getApiErrorMessage(error, 'Unable to send password reset link.'));
        } finally {
            setIsResettingPassword(false);
        }
    }

    function handleLogout() {
        signOut();
        resetSettings();
        setShowLogoutDialog(false);
        navigate('/');
    }

    return (
        <div className="page account-page">
            <PageHeader
                title="My Account"
                actions={isEditing ? (
                    <>
                        <Button type="button" variant="outlined" onClick={handleEditCancel}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="account-settings-form"
                            variant="contained"
                            disabled={isSaving || isEditOpening}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button type="button" variant="outlined" color="error" onClick={() => setShowLogoutDialog(true)}>
                            Log Out
                        </Button>
                        <Button type="button" variant="contained" onClick={handleEditStart}>
                            Edit
                        </Button>
                    </>
                )}
            />
            <p className="subtitle">
                A dedicated space for the signed-in user account details and workspace context.
            </p>

            <div className="account-grid">
                <section className="account-panel account-panel-wide">
                    <div className="account-identity">
                        <div className="account-avatar-large" aria-hidden="true">{initials}</div>
                        <div className="account-identity-copy">
                            <span className="account-eyebrow">User account</span>
                            <h2>{settings.name}</h2>
                            <p>{accountEmail}</p>
                        </div>
                    </div>

                    <div className="account-meta-grid">
                        <div className="account-meta-item">
                            <span className="account-meta-label">Role</span>
                            <strong>{currentUser.role}</strong>
                        </div>
                        <div className="account-meta-item">
                            <span className="account-meta-label">Selected business</span>
                            <strong>{selectedBusinessName}</strong>
                        </div>
                        <div className="account-meta-item">
                            <span className="account-meta-label">Accessible businesses</span>
                            <strong>{formatNumber(accessibleBusinessCount)}</strong>
                        </div>
                        <div className="account-meta-item">
                            <span className="account-meta-label">Status</span>
                            <strong>Active</strong>
                        </div>
                    </div>
                </section>

                <section className="account-panel account-panel-wide">
                    <div className="account-panel-heading">
                        <h2>Account settings</h2>
                        <span>Manage your personal defaults</span>
                    </div>

                    {isEditing ? (
                        <form id="account-settings-form" className="form account-settings-form" onSubmit={handleSave}>
                            <div className="account-settings-grid">
                                <div className="account-settings-field">
                                    <label htmlFor="account-name">Name</label>
                                    <input
                                        id="account-name"
                                        value={draft.name}
                                        onChange={(event) => handleDraftChange('name', event.target.value)}
                                    />
                                </div>

                                <div className="account-settings-field">
                                    <label htmlFor="account-locale">Locale</label>
                                    <select
                                        id="account-locale"
                                        value={draft.locale}
                                        onChange={(event) => handleDraftChange('locale', event.target.value)}
                                    >
                                        {SUPPORTED_LOCALES.map((locale) => (
                                            <option key={locale.code} value={locale.code}>
                                                {locale.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="account-settings-field">
                                    <label htmlFor="account-timezone">Time zone</label>
                                    <select
                                        id="account-timezone"
                                        value={draft.timeZone}
                                        onChange={(event) => handleDraftChange('timeZone', event.target.value)}
                                    >
                                        {SUPPORTED_TIME_ZONES.map((timeZone) => (
                                            <option key={timeZone.code} value={timeZone.code}>
                                                {timeZone.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="account-settings-field">
                                    <label htmlFor="account-theme">Theme</label>
                                    <select
                                        id="account-theme"
                                        value={draft.theme}
                                        onChange={(event) => handleDraftChange('theme', event.target.value)}
                                    >
                                        {SUPPORTED_THEMES.map((theme) => (
                                            <option key={theme.code} value={theme.code}>
                                                {theme.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="account-password-actions">
                                <div>
                                    <strong>Reset Password</strong>
                                    <p>Send a password reset link to {accountEmail}.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={() => void handleResetPassword()}
                                    disabled={isResettingPassword}
                                >
                                    {isResettingPassword ? 'Sending...' : 'Send Reset Link'}
                                </Button>
                            </div>

                            {passwordResetMessage ? (
                                <div className="account-status-message">{passwordResetMessage}</div>
                            ) : null}

                            {saveErrorMessage ? (
                                <div className="account-status-message error-msg">{saveErrorMessage}</div>
                            ) : null}
                        </form>
                    ) : (
                        <div className="account-meta-grid">
                            <div className="account-meta-item">
                                <span className="account-meta-label">Name</span>
                                <strong>{settings.name}</strong>
                            </div>
                            <div className="account-meta-item">
                                <span className="account-meta-label">Locale</span>
                                <strong>{getLocaleLabel(settings.locale)}</strong>
                                <p className="account-meta-copy">{settings.locale}</p>
                            </div>
                            <div className="account-meta-item">
                                <span className="account-meta-label">Time zone</span>
                                <strong>{getTimeZoneLabel(settings.timeZone)}</strong>
                            </div>
                            <div className="account-meta-item">
                                <span className="account-meta-label">Theme</span>
                                <strong>{getThemeLabel(settings.theme)}</strong>
                            </div>
                            <div className="account-meta-item account-meta-item-wide">
                                <span className="account-meta-label">Reset Password</span>
                                <strong>{accountEmail}</strong>
                                <p className="account-meta-copy">Use Edit to send a password reset link.</p>
                            </div>
                        </div>
                    )}

                    {!isEditing && saveSuccessMessage ? (
                        <div className="account-status-message">{saveSuccessMessage}</div>
                    ) : null}
                </section>
            </div>

            <ConfirmationDialog
                open={showLogoutDialog}
                title="Log Out"
                message={(
                    <p>
                        Log out <strong>{settings.name}</strong>? This client-side preview will clear saved account preferences and return to the landing page.
                    </p>
                )}
                confirmLabel="Log Out"
                confirmingLabel="Logging Out..."
                intent="danger"
                onConfirm={handleLogout}
                onClose={() => setShowLogoutDialog(false)}
            />
        </div>
    );
}
