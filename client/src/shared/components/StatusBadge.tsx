import { INVOICE_STATUS_COLORS } from '../constants';

export function StatusBadge({ status }: { status: string }) {
    const color = INVOICE_STATUS_COLORS[status] || '#6b7280';
    const labelByStatus: Record<string, string> = {
        Draft: 'Drafted',
        Submitted: 'Submitted',
        PartiallyPaid: 'Partially Paid',
        Paid: 'Paid',
        Overdue: 'Overdue',
        Cancelled: 'Cancelled',
        Void: 'Void',
    };

    return (
        <span
            style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                backgroundColor: color,
            }}
        >
            {labelByStatus[status] || status}
        </span>
    );
}
