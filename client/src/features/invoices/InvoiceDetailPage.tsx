import Button from '@mui/material/Button';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import {
    cancelInvoice,
    downloadInvoicePdf,
    fetchInvoice,
    fetchPayments,
    issueInvoice,
    recordPayment,
    voidInvoice,
} from './api';
import type { Invoice, Payment } from '../../shared/types';
import { PAYMENT_METHODS } from '../../shared/constants';
import { ConfirmationDialog } from '../../shared/components/ConfirmationDialog';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { formatDate, formatMoney } from '../../shared/utils';
import { getApiErrorMessage } from '../../shared/api';
import {
    buildInvoiceEditPath,
    buildInvoiceListPath,
    resolveInvoiceGroup,
} from './navigation';

const initialPayForm = () => ({
    amount: 0,
    method: 'Bank Transfer',
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNumber: '',
    note: '',
});

export function InvoiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(() => Boolean(id));
    const [showPayment, setShowPayment] = useState(false);
    const [showIssueDialog, setShowIssueDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showVoidDialog, setShowVoidDialog] = useState(false);
    const [isIssuing, setIsIssuing] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isVoiding, setIsVoiding] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [payForm, setPayForm] = useState(initialPayForm);
    const [cancelReason, setCancelReason] = useState('');
    const [voidReason, setVoidReason] = useState('');
    const [error, setError] = useState('');
    const invoiceGroup = resolveInvoiceGroup(location.search);
    const invoiceListPath = buildInvoiceListPath(invoiceGroup);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            setInvoice(null);
            return;
        }
        const invoiceId = id;

        let ignore = false;

        async function load() {
            setIsLoading(true);
            setError('');

            try {
                const loadedInvoice = await fetchInvoice(invoiceId);

                if (ignore) {
                    return;
                }

                setInvoice(loadedInvoice);

                try {
                    const loadedPayments = await fetchPayments(invoiceId);

                    if (!ignore) {
                        setPayments(loadedPayments);
                    }
                } catch (err: unknown) {
                    if (!ignore) {
                        setPayments([]);
                        setError(getApiErrorMessage(err, 'Unable to load payment history.'));
                    }
                }
            } catch (err: unknown) {
                if (!ignore) {
                    setInvoice(null);
                    setPayments([]);
                    setError(getApiErrorMessage(err, 'Unable to load invoice.'));
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
    }, [id]);

    if (isLoading) {
        return <div className="page"><p>Loading...</p></div>;
    }

    if (!id) {
        return <div className="page"><p>Invoice not found.</p></div>;
    }

    if (!invoice) {
        return <div className="page"><p>{error || 'Invoice could not be loaded.'}</p></div>;
    }

    const openIssueDialog = () => {
        setError('');
        setShowIssueDialog(true);
    };

    const closeIssueDialog = () => {
        if (isIssuing) {
            return;
        }

        setShowIssueDialog(false);
    };

    const handleIssue = async () => {
        setError('');
        setIsIssuing(true);
        try {
            const updated = await issueInvoice(invoice.id);
            setInvoice(updated);
            setShowIssueDialog(false);
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to submit invoice.'));
        } finally {
            setIsIssuing(false);
        }
    };

    const openCancelDialog = () => {
        setError('');
        setCancelReason('');
        setShowCancelDialog(true);
    };

    const closeCancelDialog = () => {
        if (isCancelling) {
            return;
        }

        setShowCancelDialog(false);
        setCancelReason('');
    };

    const handleCancel = async () => {
        setError('');
        setIsCancelling(true);

        try {
            const updated = await cancelInvoice(invoice.id, cancelReason.trim());
            setInvoice(updated);
            setShowCancelDialog(false);
            setCancelReason('');
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to cancel invoice.'));
        } finally {
            setIsCancelling(false);
        }
    };

    const openVoidDialog = () => {
        setError('');
        setVoidReason('');
        setShowVoidDialog(true);
    };

    const closeVoidDialog = () => {
        if (isVoiding) {
            return;
        }

        setShowVoidDialog(false);
        setVoidReason('');
    };

    const handleVoid = async () => {
        setError('');
        setIsVoiding(true);

        try {
            const updated = await voidInvoice(invoice.id, voidReason.trim());
            setInvoice(updated);
            setShowVoidDialog(false);
            setVoidReason('');
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to void invoice.'));
        } finally {
            setIsVoiding(false);
        }
    };

    const openPaymentModal = () => {
        setError('');
        setPayForm({
            ...initialPayForm(),
            amount: invoice.balanceDue,
        });
        setShowPayment(true);
    };

    const handlePayment = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        try {
            const updated = await recordPayment(invoice.id, {
                paymentDate: payForm.paymentDate,
                amount: payForm.amount,
                method: payForm.method,
                referenceNumber: payForm.referenceNumber || undefined,
                note: payForm.note || undefined,
            });

            setInvoice(updated);
            setShowPayment(false);
            setPayForm(initialPayForm());
            setPayments(await fetchPayments(invoice.id));
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to record payment.'));
        }
    };

    const handleDownloadPdf = async () => {
        setError('');
        setIsDownloadingPdf(true);

        try {
            await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Unable to download the invoice PDF.'));
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    return (
        <div className="page invoice-detail-page">
            <PageHeader
                title={`Invoice ${invoice.invoiceNumber}`}
                backTo={invoiceListPath}
                backLabel="Back to Invoices"
                className="invoice-detail-header"
                actions={(
                    <>
                        {invoice.availableActions.editDraft ? (
                            <Button
                                component={Link}
                                to={buildInvoiceEditPath(invoice.id, invoiceGroup)}
                                variant="outlined"
                                size="small"
                            >
                                Edit
                            </Button>
                        ) : null}
                        {invoice.status === 'Draft' ? (
                            <Button
                                type="button"
                                variant="contained"
                                size="small"
                                onClick={openIssueDialog}
                                disabled={!invoice.availableActions.issue}
                            >
                                Submit Invoice
                            </Button>
                        ) : null}
                        {invoice.availableActions.recordPayment ? (
                            <Button
                                type="button"
                                variant="contained"
                                size="small"
                                onClick={openPaymentModal}
                            >
                                Record Payment
                            </Button>
                        ) : null}
                        {invoice.availableActions.cancel ? (
                            <Button
                                type="button"
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={openCancelDialog}
                            >
                                Cancel
                            </Button>
                        ) : null}
                        {invoice.availableActions.void ? (
                            <Button
                                type="button"
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={openVoidDialog}
                            >
                                Void
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            variant="outlined"
                            size="small"
                            disabled={isDownloadingPdf}
                            onClick={() => void handleDownloadPdf()}
                        >
                            {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
                        </Button>
                    </>
                )}
            />

            {error && <div className="error-msg">{error}</div>}

            <div className="invoice-detail-overview">
                <section className="invoice-detail-section">
                    <h3>Line Items</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Disc %</th>
                                <th>Tax %</th>
                                <th>Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.lineItems.map((lineItem) => (
                                <tr key={lineItem.id}>
                                    <td>
                                        {lineItem.itemName}
                                        {lineItem.description ? (
                                            <small style={{ display: 'block', color: '#666' }}>{lineItem.description}</small>
                                        ) : null}
                                    </td>
                                    <td>{lineItem.quantity}</td>
                                    <td>{formatMoney(lineItem.unitPrice, invoice.currency)}</td>
                                    <td>{lineItem.discountPercent}%</td>
                                    <td>{lineItem.taxPercent}%</td>
                                    <td>{formatMoney(lineItem.lineTotal, invoice.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <aside className="invoice-meta-card">
                    <h3>Overview</h3>
                    <div className="invoice-meta">
                        <div><strong>Status:</strong> <StatusBadge status={invoice.status} /></div>
                        <div><strong>Date:</strong> {formatDate(invoice.invoiceDate)}</div>
                        <div><strong>Due:</strong> {formatDate(invoice.dueDate, undefined, 'No due date')}</div>
                        <div><strong>Currency:</strong> {invoice.currency}</div>
                        {invoice.cancelledAt ? <div><strong>Cancelled:</strong> {formatDate(invoice.cancelledAt)}</div> : null}
                        {invoice.cancellationReason ? <div><strong>Cancellation Reason:</strong> {invoice.cancellationReason}</div> : null}
                        {invoice.voidedAt ? <div><strong>Voided:</strong> {formatDate(invoice.voidedAt)}</div> : null}
                        {invoice.voidReason ? <div><strong>Void Reason:</strong> {invoice.voidReason}</div> : null}
                    </div>

                    <div className="totals-summary">
                        <div>Subtotal: {formatMoney(invoice.subtotal, invoice.currency)}</div>
                        {invoice.discountTotal > 0 ? <div>Discounts: -{formatMoney(invoice.discountTotal, invoice.currency)}</div> : null}
                        <div>Tax: {formatMoney(invoice.taxTotal, invoice.currency)}</div>
                        {invoice.extraFees > 0 ? <div>Extra Fees: {formatMoney(invoice.extraFees, invoice.currency)}</div> : null}
                        <div className="grand-total">Grand Total: {formatMoney(invoice.grandTotal, invoice.currency)}</div>
                        <div>Amount Paid: {formatMoney(invoice.amountPaid, invoice.currency)}</div>
                        <div className="balance-due">Balance Due: {formatMoney(invoice.balanceDue, invoice.currency)}</div>
                    </div>
                </aside>
            </div>

            {invoice.notes || invoice.terms ? (
                <section className="invoice-detail-section invoice-detail-notes">
                    {invoice.notes ? (
                        <div className="invoice-detail-note-block">
                            <strong>Notes</strong>
                            <p>{invoice.notes}</p>
                        </div>
                    ) : null}
                    {invoice.terms ? (
                        <div className="invoice-detail-note-block">
                            <strong>Terms</strong>
                            <p>{invoice.terms}</p>
                        </div>
                    ) : null}
                </section>
            ) : null}

            {showPayment && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Record Payment</h3>
                        <form onSubmit={handlePayment} className="form">
                            <label>Amount *</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={payForm.amount}
                                onChange={(e) => setPayForm({ ...payForm, amount: parseFloat(e.target.value) || 0 })}
                                required
                            />

                            <label>Payment Method *</label>
                            <select value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
                            </select>

                            <label>Payment Date *</label>
                            <input
                                type="date"
                                value={payForm.paymentDate}
                                onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                                required
                            />

                            <label>Reference Number</label>
                            <input
                                value={payForm.referenceNumber}
                                onChange={(e) => setPayForm({ ...payForm, referenceNumber: e.target.value })}
                            />

                            <label>Note</label>
                            <textarea value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} />

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Record Payment</button>
                                <button type="button" className="btn" onClick={() => setShowPayment(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationDialog
                open={showIssueDialog}
                title="Submit Invoice"
                message={(
                    <p>
                        Submit <strong>{invoice.invoiceNumber}</strong>? This will assign the final invoice number and lock the core financial fields.
                    </p>
                )}
                confirmLabel="Submit Invoice"
                confirmingLabel="Submitting..."
                isSubmitting={isIssuing}
                onConfirm={handleIssue}
                onClose={closeIssueDialog}
            />

            <ConfirmationDialog
                open={showCancelDialog}
                title="Cancel Invoice"
                message={(
                    <div className="confirmation-dialog-copy">
                        <p>
                            Cancel <strong>{invoice.invoiceNumber}</strong>? This will mark the invoice as cancelled and lock it from further financial changes.
                        </p>
                        <label htmlFor="cancel-reason">Reason *</label>
                        <textarea
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(event) => setCancelReason(event.target.value)}
                            rows={3}
                        />
                    </div>
                )}
                confirmLabel="Cancel Invoice"
                confirmingLabel="Cancelling..."
                intent="danger"
                isSubmitting={isCancelling}
                confirmDisabled={cancelReason.trim().length === 0}
                onConfirm={handleCancel}
                onClose={closeCancelDialog}
            />

            <ConfirmationDialog
                open={showVoidDialog}
                title="Void Invoice"
                message={(
                    <div className="confirmation-dialog-copy">
                        <p>
                            Void <strong>{invoice.invoiceNumber}</strong>? This keeps the record but locks it permanently.
                        </p>
                        <label htmlFor="void-reason">Reason *</label>
                        <textarea
                            id="void-reason"
                            value={voidReason}
                            onChange={(event) => setVoidReason(event.target.value)}
                            rows={3}
                        />
                    </div>
                )}
                confirmLabel="Void Invoice"
                confirmingLabel="Voiding..."
                intent="danger"
                isSubmitting={isVoiding}
                confirmDisabled={voidReason.trim().length === 0}
                onConfirm={handleVoid}
                onClose={closeVoidDialog}
            />

            {payments.length > 0 && (
                <section className="invoice-detail-section">
                    <h3>Payment History</h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Reference</th>
                                <th>Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>{formatDate(payment.paymentDate)}</td>
                                    <td>{formatMoney(payment.amount, invoice.currency)}</td>
                                    <td>{payment.method}</td>
                                    <td>{payment.referenceNumber || '-'}</td>
                                    <td>{payment.note || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}
