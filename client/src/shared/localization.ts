export const FALLBACK_LOCALE = 'en-US';
export const FALLBACK_TIME_ZONE = 'UTC';
export const FALLBACK_THEME = 'light';

export const SUPPORTED_LOCALES = [
    { code: 'en-US', label: 'English (United States)' },
    { code: 'en-GB', label: 'English (United Kingdom)' },
    { code: 'ja-JP', label: 'Japanese (Japan)' },
    { code: 'fil-PH', label: 'Filipino (Philippines)' },
] as const;

export const SUPPORTED_TIME_ZONES = [
    { code: 'UTC', label: 'UTC' },
    { code: 'America/Los_Angeles', label: 'America/Los_Angeles' },
    { code: 'America/New_York', label: 'America/New_York' },
    { code: 'Europe/London', label: 'Europe/London' },
    { code: 'Asia/Tokyo', label: 'Asia/Tokyo' },
    { code: 'Asia/Manila', label: 'Asia/Manila' },
] as const;

export const SUPPORTED_THEMES = [
    { code: 'light', label: 'Light' },
    { code: 'dark', label: 'Dark' },
] as const;

export type SupportedLocaleCode = typeof SUPPORTED_LOCALES[number]['code'];
export type SupportedTimeZoneCode = typeof SUPPORTED_TIME_ZONES[number]['code'];
export type SupportedThemeCode = typeof SUPPORTED_THEMES[number]['code'];

const supportedLocaleCodes = new Set<string>(SUPPORTED_LOCALES.map((locale) => locale.code));
const supportedTimeZoneCodes = new Set<string>(SUPPORTED_TIME_ZONES.map((timeZone) => timeZone.code));
const supportedThemeCodes = new Set<string>(SUPPORTED_THEMES.map((theme) => theme.code));

export function isSupportedLocale(value: string): value is SupportedLocaleCode {
    return supportedLocaleCodes.has(value);
}

export function isSupportedTimeZone(value: string): value is SupportedTimeZoneCode {
    return supportedTimeZoneCodes.has(value);
}

export function isSupportedTheme(value: string): value is SupportedThemeCode {
    return supportedThemeCodes.has(value);
}

export function resolveSupportedLocale(value?: string | null): SupportedLocaleCode {
    if (value && isSupportedLocale(value)) {
        return value;
    }

    return FALLBACK_LOCALE;
}

export function resolveSupportedTimeZone(value?: string | null): SupportedTimeZoneCode {
    if (value && isSupportedTimeZone(value)) {
        return value;
    }

    return FALLBACK_TIME_ZONE;
}

export function resolveSupportedTheme(value?: string | null): SupportedThemeCode {
    if (value && isSupportedTheme(value)) {
        return value;
    }

    return FALLBACK_THEME;
}

export function getLocaleLabel(locale: SupportedLocaleCode) {
    return SUPPORTED_LOCALES.find((option) => option.code === locale)?.label ?? locale;
}

export function getTimeZoneLabel(timeZone: SupportedTimeZoneCode) {
    return SUPPORTED_TIME_ZONES.find((option) => option.code === timeZone)?.label ?? timeZone;
}

export function getThemeLabel(theme: SupportedThemeCode) {
    return SUPPORTED_THEMES.find((option) => option.code === theme)?.label ?? theme;
}
