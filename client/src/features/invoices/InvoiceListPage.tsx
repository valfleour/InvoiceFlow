import Button from '@mui/material/Button';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useBusiness } from '../../app/context/BusinessContextStore';
import { INVOICE_BOARD_COLUMNS, INVOICE_STATUS_GROUPS } from '../../shared/constants';
import type { Invoice } from '../../shared/types';
import { getApiErrorMessage } from '../../shared/api';
import { DateRangePicker, type DateRangeValue } from '../../shared/components/DateRangePicker';
import { formatDate, formatMoney } from '../../shared/utils';
import {
    fetchInvoices,
} from './api';
import { fetchClients } from '../clients/api';
import type { Client } from '../../shared/types';
import {
    buildInvoiceDetailPath,
    buildInvoiceListPath,
    buildNewInvoicePath,
    isInvoiceGroup,
    rememberInvoiceGroup,
} from './navigation';

export function InvoiceListPage() {
    const { business } = useBusiness();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState('');

    useEffect(() => {
        let ignore = false;

        async function load() {
            if (!business) {
                setInvoices([]);
                setClients([]);
                setPageError('');
                return;
            }

            setIsLoading(true);
            setPageError('');

            try {
                const [loadedInvoices, loadedClients] = await Promise.all([
                    fetchInvoices(business.id),
                    fetchClients(business.id),
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
                    setPageError(getApiErrorMessage(err, 'Unable to load invoices.'));
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

    const clientsById = useMemo(() => {
        return new Map(clients.map((client) => [client.id, client]));
    }, [clients]);

    const statusGroup = searchParams.get('group');
    const dateRange = useMemo<DateRangeValue>(() => ({
        startDate: searchParams.get('from') ?? '',
        endDate: searchParams.get('to') ?? '',
    }), [searchParams]);

    useEffect(() => {
        if (isInvoiceGroup(statusGroup)) {
            rememberInvoiceGroup(statusGroup);
        }
    }, [statusGroup]);

    if (!isInvoiceGroup(statusGroup)) {
        return <Navigate to={buildInvoiceListPath('non-active')} replace state={{ from: location }} />;
    }

    const visibleStatuses = useMemo(() => {
        if (statusGroup === 'non-active') {
            return new Set<string>(INVOICE_STATUS_GROUPS['non-active']);
        }

        return new Set<string>(INVOICE_STATUS_GROUPS.active);
    }, [statusGroup]);

    const visibleColumns = useMemo(() => {
        return INVOICE_BOARD_COLUMNS.filter((column) => visibleStatuses.has(column.key));
    }, [visibleStatuses]);
    const isDateFilterActive = Boolean(dateRange.startDate || dateRange.endDate);

    const filteredInvoices = useMemo(() => {
        if (!isDateFilterActive) {
            return invoices;
        }

        return invoices.filter((invoice) => {
            if (!invoice.issuedAt) {
                return false;
            }

            const invoiceTime = new Date(invoice.issuedAt).getTime();
            if (Number.isNaN(invoiceTime)) {
                return false;
            }

            if (dateRange.startDate) {
                const startTime = new Date(dateRange.startDate).getTime();
                if (!Number.isNaN(startTime) && invoiceTime < startTime) {
                    return false;
                }
            }

            if (dateRange.endDate) {
                const endTime = new Date(dateRange.endDate).getTime();
                if (!Number.isNaN(endTime) && invoiceTime > endTime + (24 * 60 * 60 * 1000) - 1) {
                    return false;
                }
            }

            return true;
        });
    }, [dateRange.endDate, dateRange.startDate, invoices, isDateFilterActive]);

    const invoicesByStatus = useMemo(() => {
        const grouped = new Map<string, Invoice[]>();

        for (const column of visibleColumns) {
            grouped.set(column.key, []);
        }

        for (const invoice of filteredInvoices) {
            if (!grouped.has(invoice.status)) {
                continue;
            }

            grouped.get(invoice.status)?.push(invoice);
        }

        return grouped;
    }, [filteredInvoices, visibleColumns]);

    const pageTitle = statusGroup === 'non-active'
        ? 'Invoices: Non-Active'
        : statusGroup === 'active'
            ? 'Invoices: Active'
            : 'Invoices';
    const boardStyle = {
        '--invoice-column-count': visibleColumns.length,
    } as CSSProperties;
    const hasClients = clients.length > 0;
    const hasInvoices = invoices.length > 0;
    const hasFilteredInvoices = filteredInvoices.length > 0;

    const handleDateRangeChange = (nextRange: DateRangeValue) => {
        const nextParams = new URLSearchParams(searchParams);

        if (nextRange.startDate) {
            nextParams.set('from', nextRange.startDate);
        } else {
            nextParams.delete('from');
        }

        if (nextRange.endDate) {
            nextParams.set('to', nextRange.endDate);
        } else {
            nextParams.delete('to');
        }

        setSearchParams(nextParams);
    };

    return (
        <div className="page invoice-list-page">
            <div className="page-header">
                <h1>{pageTitle}</h1>
                <div className="invoice-list-toolbar">
                    <DateRangePicker
                        label="Issued Date"
                        description="Filter invoice cards by issued date. Draft invoices without an issued date are excluded when a range is set."
                        value={dateRange}
                        onChange={handleDateRangeChange}
                    />
                    {business && hasClients ? (
                        <Button component={Link} to={buildNewInvoicePath(statusGroup)} variant="contained">
                            + New Invoice
                        </Button>
                    ) : (
                        <Button type="button" variant="contained" disabled>+ New Invoice</Button>
                    )}
                </div>
            </div>

            {business ? (
                !isLoading && !pageError && !hasInvoices ? (
                    <div className="empty-state-card">
                        <h2>No invoices yet</h2>
                        <p>
                            {hasClients
                                ? 'Create your first invoice to start tracking work across statuses.'
                                : 'Create a client first before creating your first invoice.'}
                        </p>
                        <div className="empty-state-actions">
                            {hasClients ? (
                                <Button component={Link} to={buildNewInvoicePath(statusGroup)} variant="contained">
                                    Create Invoice
                                </Button>
                            ) : (
                                <Button component={Link} to="/clients/new" variant="contained">
                                    Create Client
                                </Button>
                            )}
                        </div>
                    </div>
                ) : !isLoading && !pageError && !hasFilteredInvoices ? (
                    <div className="empty-state-card">
                        <h2>No invoices in this issued date range</h2>
                        <p>Try expanding or clearing the issued date filter to see more invoice records.</p>
                        <div className="empty-state-actions">
                            <Button type="button" variant="outlined" onClick={() => handleDateRangeChange({ startDate: '', endDate: '' })}>
                                Clear Date Filter
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="invoice-board-scroll">
                        <div className="invoice-board" style={boardStyle}>
                            {visibleColumns.map((column) => {
                                const columnInvoices = invoicesByStatus.get(column.key) ?? [];

                                return (
                                    <section key={column.key} className="invoice-column">
                                        <div className="invoice-column-header">
                                            <div>
                                                <h2>{column.title}</h2>
                                                <p>{columnInvoices.length} invoice{columnInvoices.length === 1 ? '' : 's'}</p>
                                            </div>
                                        </div>

                                        <div className="invoice-column-body">
                                            <div className="invoice-card-list">
                                                {columnInvoices.length > 0 ? (
                                                    columnInvoices.map((invoice) => (
                                                        <article key={invoice.id} className="invoice-card">
                                                            <div className="invoice-card-top">
                                                                <div className="invoice-card-heading">
                                                                    <Link
                                                                        to={buildInvoiceDetailPath(invoice.id, statusGroup)}
                                                                        className="invoice-card-number"
                                                                    >
                                                                        {invoice.invoiceNumber}
                                                                    </Link>
                                                                    <div className="invoice-card-client">
                                                                        {invoice.issueSnapshot?.client?.clientName
                                                                            ?? clientsById.get(invoice.clientId)?.clientName
                                                                            ?? invoice.clientId}
                                                                    </div>
                                                                </div>
                                                                <div className="invoice-card-actions">
                                                                    <Button
                                                                        component={Link}
                                                                        to={buildInvoiceDetailPath(invoice.id, statusGroup)}
                                                                        variant="contained"
                                                                        size="small"
                                                                        className="invoice-card-open-button"
                                                                    >
                                                                        Open
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="invoice-card-meta">
                                                                <span>
                                                                    {invoice.issuedAt ? 'Issued' : 'Created'}: {formatDate(
                                                                        invoice.issuedAt ?? invoice.invoiceDate,
                                                                        undefined,
                                                                        invoice.issuedAt ? 'No issued date' : '-'
                                                                    )}
                                                                </span>
                                                                <span>Due: {formatDate(invoice.dueDate, undefined, 'No due date')}</span>
                                                            </div>

                                                            <div className="invoice-card-amounts">
                                                                <div>
                                                                    <strong>Total</strong>
                                                                    <span>{formatMoney(invoice.grandTotal, invoice.currency)}</span>
                                                                </div>
                                                                <div>
                                                                    <strong>Balance</strong>
                                                                    <span>{formatMoney(invoice.balanceDue, invoice.currency)}</span>
                                                                </div>
                                                            </div>
                                                        </article>
                                                    ))
                                                ) : (
                                                    <div className="invoice-column-empty">
                                                        No {column.title.toLowerCase()} invoices yet.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                )
            ) : (
                <p>Select a business profile first.</p>
            )}

            {business && isLoading ? <p>Loading invoices...</p> : null}
            {business && pageError ? <div className="error-msg">{pageError}</div> : null}
        </div>
    );
}
