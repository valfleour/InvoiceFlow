import { FALLBACK_LOCALE, FALLBACK_TIME_ZONE } from './localization';

type IntlPreferences = {
    locale?: string;
    timeZone?: string;
};

let activeIntlPreferences: Required<IntlPreferences> = {
    locale: FALLBACK_LOCALE,
    timeZone: FALLBACK_TIME_ZONE,
};

function resolveIntlPreferences(overrides?: IntlPreferences) {
    return {
        locale: overrides?.locale ?? activeIntlPreferences.locale,
        timeZone: overrides?.timeZone ?? activeIntlPreferences.timeZone,
    };
}

function parseDateValue(value: Date | string) {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime())
            ? null
            : { value, timeZone: activeIntlPreferences.timeZone };
    }

    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        const [, year, month, day] = match;
        const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

        return Number.isNaN(parsed.getTime())
            ? null
            : { value: parsed, timeZone: 'UTC' };
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime())
        ? null
        : { value: parsed, timeZone: activeIntlPreferences.timeZone };
}

export function setActiveIntlPreferences(next: IntlPreferences) {
    activeIntlPreferences = {
        locale: next.locale ?? FALLBACK_LOCALE,
        timeZone: next.timeZone ?? FALLBACK_TIME_ZONE,
    };
}

export function formatNumber(value: number, locale?: string, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(resolveIntlPreferences({ locale }).locale, options).format(value);
}

export function formatMoney(amount: number, currency = 'USD', locale?: string): string {
    return new Intl.NumberFormat(resolveIntlPreferences({ locale }).locale, {
        style: 'currency',
        currency,
    }).format(amount);
}

export function formatDate(dateInput?: Date | string | null, locale?: string, emptyLabel = '-'): string {
    if (!dateInput) {
        return emptyLabel;
    }

    const parsed = parseDateValue(dateInput);
    if (!parsed) {
        return emptyLabel;
    }

    return new Intl.DateTimeFormat(resolveIntlPreferences({ locale }).locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: parsed.timeZone,
    }).format(parsed.value);
}

export function formatTime(dateInput?: Date | string | null, locale?: string, emptyLabel = '-'): string {
    if (!dateInput) {
        return emptyLabel;
    }

    const parsed = parseDateValue(dateInput);
    if (!parsed) {
        return emptyLabel;
    }

    const preferences = resolveIntlPreferences({ locale });

    return new Intl.DateTimeFormat(preferences.locale, {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: preferences.timeZone,
    }).format(parsed.value);
}

export function formatDateTime(dateInput?: Date | string | null, locale?: string, emptyLabel = '-'): string {
    if (!dateInput) {
        return emptyLabel;
    }

    const parsed = parseDateValue(dateInput);
    if (!parsed) {
        return emptyLabel;
    }

    const preferences = resolveIntlPreferences({ locale });

    return new Intl.DateTimeFormat(preferences.locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: preferences.timeZone,
    }).format(parsed.value);
}

export function sumAmountsByCurrency(entries: Array<{ amount: number; currency: string }>) {
    const totals = new Map<string, number>();

    for (const entry of entries) {
        totals.set(entry.currency, (totals.get(entry.currency) ?? 0) + entry.amount);
    }

    return Array.from(totals.entries()).map(([currency, amount]) => ({
        currency,
        amount,
    }));
}
