import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { currentUser } from '../../features/account/currentUser';
import {
    FALLBACK_LOCALE,
    FALLBACK_THEME,
    FALLBACK_TIME_ZONE,
    type SupportedLocaleCode,
    type SupportedThemeCode,
    type SupportedTimeZoneCode,
    resolveSupportedLocale,
    resolveSupportedTheme,
    resolveSupportedTimeZone,
} from '../../shared/localization';
import { setActiveIntlPreferences } from '../../shared/utils';

const ACCOUNT_SETTINGS_STORAGE_KEY = 'invoiceflow.account-settings';

export interface AccountSettings {
    name: string;
    locale: SupportedLocaleCode;
    timeZone: SupportedTimeZoneCode;
    theme: SupportedThemeCode;
}

interface AccountSettingsContextValue {
    settings: AccountSettings;
    updateSettings: (changes: Partial<AccountSettings>) => void;
    resetSettings: () => void;
}

function getBrowserLocale() {
    if (typeof navigator === 'undefined') {
        return FALLBACK_LOCALE;
    }

    return resolveSupportedLocale(navigator.language);
}

function getBrowserTimeZone() {
    if (typeof Intl === 'undefined') {
        return FALLBACK_TIME_ZONE;
    }

    return resolveSupportedTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

function sanitizeAccountSettings(value?: Partial<AccountSettings> | null): AccountSettings {
    return {
        name: value?.name?.trim() || currentUser.name,
        locale: resolveSupportedLocale(value?.locale),
        timeZone: resolveSupportedTimeZone(value?.timeZone),
        theme: resolveSupportedTheme(value?.theme),
    };
}

function getDefaultAccountSettings(): AccountSettings {
    return sanitizeAccountSettings({
        name: currentUser.name,
        locale: getBrowserLocale(),
        timeZone: getBrowserTimeZone(),
        theme: FALLBACK_THEME,
    });
}

function getStoredAccountSettings(): AccountSettings {
    const defaults = getDefaultAccountSettings();

    if (typeof window === 'undefined') {
        return defaults;
    }

    try {
        const storedValue = window.localStorage.getItem(ACCOUNT_SETTINGS_STORAGE_KEY);
        if (!storedValue) {
            return defaults;
        }

        const parsed = JSON.parse(storedValue) as Partial<AccountSettings>;
        return sanitizeAccountSettings({
            ...defaults,
            ...parsed,
        });
    } catch {
        return defaults;
    }
}

const AccountSettingsContext = createContext<AccountSettingsContextValue>({
    settings: getDefaultAccountSettings(),
    updateSettings: () => { },
    resetSettings: () => { },
});

export function AccountSettingsProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const [settings, setSettings] = useState<AccountSettings>(() => getStoredAccountSettings());

    useEffect(() => {
        if (!isAuthenticated || !user?.name) {
            return;
        }

        setSettings((current) => sanitizeAccountSettings({
            ...current,
            name: user.name,
        }));
    }, [isAuthenticated, user?.name]);

    useEffect(() => {
        document.documentElement.lang = settings.locale;
        document.documentElement.dataset.theme = settings.theme;
        document.documentElement.style.colorScheme = settings.theme;

        setActiveIntlPreferences({
            locale: settings.locale,
            timeZone: settings.timeZone,
        });

        window.localStorage.setItem(ACCOUNT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    }, [settings]);

    const value = useMemo<AccountSettingsContextValue>(() => ({
        settings,
        updateSettings: (changes) => {
            setSettings((current) => sanitizeAccountSettings({
                ...current,
                ...changes,
            }));
        },
        resetSettings: () => {
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(ACCOUNT_SETTINGS_STORAGE_KEY);
            }

            setSettings(getDefaultAccountSettings());
        },
    }), [settings]);

    return (
        <AccountSettingsContext.Provider value={value}>
            {children}
        </AccountSettingsContext.Provider>
    );
}

export function useAccountSettings() {
    return useContext(AccountSettingsContext);
}
