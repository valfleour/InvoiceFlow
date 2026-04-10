export const InvoiceStatuses = [
    'Draft',
    'Submitted',
    'PartiallyPaid',
    'Paid',
    'Overdue',
    'Cancelled',
    'Void',
] as const;

export type InvoiceStatus = (typeof InvoiceStatuses)[number];
