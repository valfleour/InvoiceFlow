import Button from '@mui/material/Button';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { fetchClients } from '../../features/clients/api';
import { fetchInvoices } from '../../features/invoices/api';
import {
    buildInvoiceDetailPath,
    buildInvoiceListPath,
    buildNewInvoicePath,
    getRememberedInvoiceGroup,
} from '../../features/invoices/navigation';
import { INVOICE_BOARD_COLUMNS } from '../../shared/constants';
import type { Client, Invoice } from '../../shared/types';
import { formatDate, formatMoney, formatNumber, sumAmountsByCurrency } from '../../shared/utils';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { getApiErrorMessage } from '../../shared/api';

function formatCurrencySummary(entries: Array<{ amount: number; currency: string }>, emptyLabel = 'None') {
    if (entries.length === 0) {
        return emptyLabel;
    }

    return entries.map(({ currency, amount }) => formatMoney(amount, currency)).join(' / ');
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function endOfRange(from: Date, days: number) {
    const until = new Date(from);
    until.setDate(until.getDate() + days);
    until.setHours(23, 59, 59, 999);
    return until;
}

export function DashboardPage() {
    const { business } = useBusiness();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const invoiceGroup = getRememberedInvoiceGroup();

    useEffect(() => {
        if (!business) {
            setInvoices([]);
            setClients([]);
            setError('');
            return;
        }

        const businessId = business.id;

        let ignore = false;

        async function load() {
            setIsLoading(true);
            setError('');

            try {
                const [loadedInvoices, loadedClients] = await Promise.all([
                    fetchInvoices(businessId),
                    fetchClients(businessId),
                ]);

                if (ignore) {
                    return;
                }

                setInvoices(loadedInvoices);
                setClients(loadedClients);
            } catch (err: unknown) {
                if (!ignore) {
                    setInvoices([]);
                    setClients([]);
                    setError(getApiErrorMessage(err, 'Unable to load dashboard analytics.'));
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        void load();

        return () => {
            ignore = true;
        };
    }, [business]);

    const clientsById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
    const statusLabels = useMemo(() => new Map(INVOICE_BOARD_COLUMNS.map((column) => [column.key, column.title])), []);

    if (!business) {
        return (
            <div className="page">
                <h1>Welcome to InvoiceFlow</h1>
                <p>
                    Get started by <Link to="/businesses">creating a Business Profile</Link>.
                </p>
            </div>
        );
    }

    const today = startOfToday();
    const nextWeek = endOfRange(today, 7);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const draftInvoices = invoices.filter((invoice) => invoice.status === 'Draft');
    const activeInvoices = invoices.filter((invoice) => ['Submitted', 'PartiallyPaid', 'Overdue', 'Paid'].includes(invoice.status));
    const closedInvoices = invoices.filter((invoice) => ['Paid', 'Cancelled', 'Void'].includes(invoice.status));
    const overdueInvoices = invoices.filter((invoice) => invoice.status === 'Overdue');
    const readyToSubmitCount = draftInvoices.filter((invoice) => invoice.availableActions.issue).length;
    const submittedThisMonth = invoices.filter((invoice) => {
        if (!invoice.issuedAt) {
            return false;
        }

        return new Date(invoice.issuedAt).getTime() >= monthStart.getTime();
    }).length;
    const dueSoonInvoices = invoices
        .filter((invoice) => {
            if (!invoice.dueDate || invoice.collectionState.isFinalized || !invoice.collectionState.isOutstanding) {
                return false;
            }

            const dueDate = new Date(invoice.dueDate);
            return dueDate.getTime() >= today.getTime() && dueDate.getTime() <= nextWeek.getTime();
        })
        .sort((a, b) => new Date(a.dueDate ?? '').getTime() - new Date(b.dueDate ?? '').getTime())
        .slice(0, 5);
    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8);

    const outstandingByCurrency = sumAmountsByCurrency(
        invoices
            .filter((invoice) => invoice.collectionState.isOutstanding)
            .map((invoice) => ({ amount: invoice.balanceDue, currency: invoice.currency }))
    );
    const paidByCurrency = sumAmountsByCurrency(
        invoices
            .filter((invoice) => invoice.status === 'Paid')
            .map((invoice) => ({ amount: invoice.grandTotal, currency: invoice.currency }))
    );
    const totalBilledByCurrency = sumAmountsByCurrency(
        invoices
            .filter((invoice) => ['Submitted', 'PartiallyPaid', 'Paid', 'Overdue', 'Cancelled'].includes(invoice.status))
            .map((invoice) => ({ amount: invoice.grandTotal, currency: invoice.currency }))
    );

    const statusRows = INVOICE_BOARD_COLUMNS.map((column) => {
        const count = invoices.filter((invoice) => invoice.status === column.key).length;
        const percent = invoices.length > 0 ? Math.round((count / invoices.length) * 100) : 0;

        return {
            key: column.key,
            label: statusLabels.get(column.key) ?? column.key,
            count,
            percent,
        };
    });

    return (
        <div className="page dashboard-page">
            <div className="dashboard-hero">
                <div>
                    <h1>Dashboard</h1>
                    <p className="subtitle">Business: {business.businessName}</p>
                </div>
                <div className="dashboard-hero-actions">
                    <Button component={Link} to={buildInvoiceListPath('active')} variant="outlined">
                        View Active Invoices
                    </Button>
                    <Button component={Link} to={buildNewInvoicePath(invoiceGroup)} variant="contained">
                        + New Invoice
                    </Button>
                </div>
            </div>

            {error ? <div className="error-msg">{error}</div> : null}
            {isLoading ? <p>Loading dashboard analytics...</p> : null}

            {!isLoading ? (
                <>
                    <div className="stats-grid dashboard-kpis">
                        <div className="stat-card stat-card-emphasis">
                            <div className="stat-label">Total Invoices</div>
                            <div className="stat-value">{formatNumber(invoices.length)}</div>
                            <div className="stat-note">{formatNumber(clients.length)} active client records</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Active Workflow</div>
                            <div className="stat-value">{formatNumber(activeInvoices.length)}</div>
                            <div className="stat-note">{formatNumber(draftInvoices.length)} drafts waiting in non-active</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Outstanding Balance</div>
                            <div className="stat-value stat-value-compact">{formatCurrencySummary(outstandingByCurrency)}</div>
                            <div className="stat-note">{formatNumber(overdueInvoices.length)} overdue invoice{overdueInvoices.length === 1 ? '' : 's'}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Paid Revenue</div>
                            <div className="stat-value stat-value-compact">{formatCurrencySummary(paidByCurrency)}</div>
                            <div className="stat-note">{formatNumber(closedInvoices.length)} closed invoice records</div>
                        </div>
                    </div>

                    <div className="dashboard-analytics-grid">
                        <section className="dashboard-panel">
                            <div className="dashboard-panel-header">
                                <h2>Workflow Analytics</h2>
                                <span>{submittedThisMonth} submitted this month</span>
                            </div>
                            <div className="dashboard-metric-grid">
                                <div className="dashboard-metric-card">
                                    <strong>{formatNumber(readyToSubmitCount)}</strong>
                                    <span>Drafts ready to submit</span>
                                </div>
                                <div className="dashboard-metric-card">
                                    <strong>{formatNumber(dueSoonInvoices.length)}</strong>
                                    <span>Due in the next 7 days</span>
                                </div>
                                <div className="dashboard-metric-card">
                                    <strong>{formatNumber(overdueInvoices.length)}</strong>
                                    <span>Need attention now</span>
                                </div>
                                <div className="dashboard-metric-card">
                                    <strong>{formatCurrencySummary(totalBilledByCurrency)}</strong>
                                    <span>Total billed in finalized workflow</span>
                                </div>
                            </div>
                        </section>

                        <section className="dashboard-panel">
                            <div className="dashboard-panel-header">
                                <h2>Status Breakdown</h2>
                                <span>{formatNumber(invoices.length)} total invoice{invoices.length === 1 ? '' : 's'}</span>
                            </div>
                            <div className="dashboard-status-list">
                                {statusRows.map((row) => (
                                    <div key={row.key} className="dashboard-status-row">
                                        <div className="dashboard-status-label">
                                            <StatusBadge status={row.key} />
                                            <span>{row.label}</span>
                                        </div>
                                        <div className="dashboard-status-bar">
                                            <div
                                                className="dashboard-status-bar-fill"
                                                style={{ width: `${row.percent}%` }}
                                            />
                                        </div>
                                        <div className="dashboard-status-value">
                                            {formatNumber(row.count)} ({formatNumber(row.percent)}%)
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="dashboard-content-grid">
                        <section className="dashboard-panel">
                            <div className="dashboard-panel-header">
                                <h2>Attention Queue</h2>
                                <span>Invoices that need action soon</span>
                            </div>
                            {dueSoonInvoices.length === 0 && overdueInvoices.length === 0 ? (
                                <p className="dashboard-empty">Nothing urgent right now.</p>
                            ) : (
                                <div className="dashboard-alert-list">
                                    {overdueInvoices.slice(0, 3).map((invoice) => (
                                        <Link
                                            key={invoice.id}
                                            to={buildInvoiceDetailPath(invoice.id, 'active')}
                                            className="dashboard-alert-card dashboard-alert-card-danger"
                                        >
                                            <div>
                                                <strong>{invoice.invoiceNumber}</strong>
                                                <span>{clientsById.get(invoice.clientId)?.clientName ?? invoice.clientId}</span>
                                            </div>
                                            <div>
                                                <span>Overdue</span>
                                                <strong>{formatMoney(invoice.balanceDue, invoice.currency)}</strong>
                                            </div>
                                        </Link>
                                    ))}
                                    {dueSoonInvoices.map((invoice) => (
                                        <Link
                                            key={invoice.id}
                                            to={buildInvoiceDetailPath(invoice.id, 'active')}
                                            className="dashboard-alert-card"
                                        >
                                            <div>
                                                <strong>{invoice.invoiceNumber}</strong>
                                                <span>{clientsById.get(invoice.clientId)?.clientName ?? invoice.clientId}</span>
                                            </div>
                                            <div>
                                                <span>Due {formatDate(invoice.dueDate)}</span>
                                                <strong>{formatMoney(invoice.balanceDue, invoice.currency)}</strong>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="dashboard-panel">
                            <div className="dashboard-panel-header">
                                <h2>Recent Invoices</h2>
                                <span>Latest workflow updates</span>
                            </div>
                            {recentInvoices.length === 0 ? (
                                <p className="dashboard-empty">
                                    No invoices yet. <Link to={buildNewInvoicePath(invoiceGroup)}>Create your first invoice</Link>.
                                </p>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Invoice</th>
                                            <th>Client</th>
                                            <th>Status</th>
                                            <th>Issued</th>
                                            <th>Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentInvoices.map((invoice) => (
                                            <tr key={invoice.id}>
                                                <td>
                                                    <Link
                                                        to={buildInvoiceDetailPath(
                                                            invoice.id,
                                                            ['Draft', 'Cancelled', 'Void'].includes(invoice.status) ? 'non-active' : 'active'
                                                        )}
                                                    >
                                                        {invoice.invoiceNumber}
                                                    </Link>
                                                </td>
                                                <td>{clientsById.get(invoice.clientId)?.clientName ?? invoice.clientId}</td>
                                                <td><StatusBadge status={invoice.status} /></td>
                                                <td>{formatDate(invoice.issuedAt ?? invoice.invoiceDate)}</td>
                                                <td>{formatMoney(invoice.balanceDue, invoice.currency)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
                    </div>
                </>
            ) : null}
        </div>
    );
}
