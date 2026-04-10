import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { useAccountSettings } from '../../app/context/AccountSettingsContext';
import { PageHeader } from '../../shared/components/PageHeader';
import { getLocaleLabel, getThemeLabel, getTimeZoneLabel } from '../../shared/localization';

export function AccountPreferencesPage() {
    const { settings } = useAccountSettings();

    return (
        <div className="page account-page">
            <PageHeader
                title="Account Preferences"
                backTo="/account"
                backLabel="Back to My Account"
                actions={(
                    <Button component={Link} to="/account" variant="contained">
                        Open My Account
                    </Button>
                )}
            />
            <p className="subtitle">
                Current saved regional preferences for {settings.name}.
            </p>

            <section className="account-panel">
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
                </div>
            </section>
        </div>
    );
}
