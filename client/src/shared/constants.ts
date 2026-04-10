export const DEFAULT_CURRENCY = 'USD';

export const CURRENCY_OPTIONS = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AUD', symbol: '$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'HKD', symbol: '$', name: 'Hong Kong Dollar' },
    { code: 'SGD', symbol: '$', name: 'Singapore Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
] as const;

export const COMMON_CURRENCIES = CURRENCY_OPTIONS.map((currency) => currency.code);

export const INVOICE_STATUS_COLORS: Record<string, string> = {
    Draft: '#6b7280',
    Submitted: '#2563eb',
    PartiallyPaid: '#f59e0b',
    Paid: '#16a34a',
    Overdue: '#dc2626',
    Cancelled: '#9333ea',
    Void: '#71717a',
};

export const PAYMENT_METHODS = [
    'Bank Transfer',
    'Cash',
    'Check',
    'Credit Card',
    'PayPal',
    'Other',
];

export const INVOICE_BOARD_COLUMNS = [
    { key: 'Draft', title: 'Drafted' },
    { key: 'Submitted', title: 'Submitted' },
    { key: 'PartiallyPaid', title: 'Partially Paid' },
    { key: 'Overdue', title: 'Overdue' },
    { key: 'Paid', title: 'Paid' },
    { key: 'Cancelled', title: 'Cancelled' },
    { key: 'Void', title: 'Void' },
] as const;

export const INVOICE_STATUS_GROUPS = {
    'non-active': ['Draft', 'Cancelled', 'Void'],
    active: ['Submitted', 'PartiallyPaid', 'Overdue', 'Paid'],
} as const;
