import test from 'node:test';
import assert from 'node:assert/strict';
import { Invoice } from './Invoice';
import { InvoiceProps } from './Invoice';

function validInvoiceProps() {
    return {
        workspaceId: 'workspace-1',
        ownerUserId: 'workspace-1',
        businessId: 'business-1',
        clientId: 'client-1',
        invoiceNumber: 'DRAFT-2099-0001',
        invoiceDate: new Date('2099-04-01T00:00:00.000Z'),
        dueDate: new Date('2099-04-10T00:00:00.000Z'),
        currency: 'USD',
        lineItems: [
            {
                id: 'line-1',
                itemName: 'Retainer',
                quantity: 1,
                unitPrice: 100,
                discountPercent: 0,
                taxPercent: 10,
            },
        ],
        extraFees: 0,
        createdBy: 'user-1',
    };
}

test('Invoice.create requires a due date, at least one line item, and a due date on or after invoice date', () => {
    assert.throws(
        () => Invoice.create({ ...validInvoiceProps(), dueDate: null }),
        /Invoice due date is required/
    );

    assert.throws(
        () => Invoice.create({ ...validInvoiceProps(), lineItems: [] }),
        /Invoice must include at least one line item/
    );

    assert.throws(
        () =>
            Invoice.create({
                ...validInvoiceProps(),
                dueDate: new Date('2099-03-31T00:00:00.000Z'),
            }),
        /Invoice due date cannot be earlier than the invoice date/
    );
});

test('Invoice.removeLineItem does not allow a draft invoice to become empty', () => {
    const invoice = Invoice.create(validInvoiceProps());

    assert.throws(
        () => invoice.removeLineItem('line-1'),
        /Invoice must include at least one line item/
    );
});

test('Invoice.issue records submission audit fields and reconcilePayments records paidAt', () => {
    const invoice = Invoice.create(validInvoiceProps());

    invoice.issue(
        'INV-2026-0001',
        {
            businessName: 'Acme Studio',
            address: {
                street: '1 Main St',
                city: 'Tokyo',
                state: 'Tokyo',
                postalCode: '100-0001',
                country: 'JP',
            },
            email: 'billing@acme.test',
            phone: '+81-3-0000-0000',
        },
        {
            clientName: 'Jane Client',
            billingAddress: {
                street: '2 Client Rd',
                city: 'Osaka',
                state: 'Osaka',
                postalCode: '530-0001',
                country: 'JP',
            },
            email: 'ap@client.test',
        },
        'issuer-1'
    );

    assert.equal(invoice.status, 'Submitted');
    assert.equal(invoice.submittedBy, 'issuer-1');
    assert.ok(invoice.submittedAt);
    assert.equal(invoice.issuedBy, 'issuer-1');
    assert.ok(invoice.issuedAt);

    invoice.reconcilePayments(
        [{ amount: invoice.grandTotal.toAmount(), paymentDate: new Date('2026-04-02T00:00:00.000Z') }],
        'collector-1'
    );

    assert.equal(invoice.status, 'Paid');
    assert.ok(invoice.paidAt);
});

test('Invoice.create enforces the current required header fields', () => {
    assert.throws(
        () => Invoice.create({ ...validInvoiceProps(), workspaceId: '' }),
        /Invoice workspace is required/
    );
    assert.throws(
        () => Invoice.create({ ...validInvoiceProps(), clientId: '' }),
        /Invoice must have a client/
    );
    assert.throws(
        () => Invoice.create({ ...validInvoiceProps(), businessId: '' }),
        /Invoice must belong to a business/
    );
    assert.throws(
        () => Invoice.create({ ...validInvoiceProps(), currency: '' }),
        /Currency is required/
    );
});

test('Invoice calculates subtotal, discount, tax, and grand total deterministically', () => {
    const props = validInvoiceProps();
    props.lineItems = [
        {
            id: 'line-1',
            itemName: 'Retainer',
            quantity: 2,
            unitPrice: 99.99,
            discountPercent: 10,
            taxPercent: 8,
        },
        {
            id: 'line-2',
            itemName: 'Hosting',
            quantity: 1,
            unitPrice: 49.95,
            discountPercent: 0,
            taxPercent: 0,
        },
    ];
    props.extraFees = 12.34;

    const invoice = Invoice.create(props);
    const reordered = Invoice.create({
        ...props,
        lineItems: [...props.lineItems].reverse(),
    });

    assert.equal(invoice.subtotal.toAmount(), 229.93);
    assert.equal(invoice.discountTotal.toAmount(), 20);
    assert.equal(invoice.taxTotal.toAmount(), 14.4);
    assert.equal(invoice.grandTotal.toAmount(), 256.67);
    assert.equal(reordered.subtotal.toAmount(), invoice.subtotal.toAmount());
    assert.equal(reordered.discountTotal.toAmount(), invoice.discountTotal.toAmount());
    assert.equal(reordered.taxTotal.toAmount(), invoice.taxTotal.toAmount());
    assert.equal(reordered.grandTotal.toAmount(), invoice.grandTotal.toAmount());
});

test('Invoice.issue only allows Draft to Submitted and freezes draft editing afterward', () => {
    const invoice = Invoice.create(validInvoiceProps());

    invoice.issue(
        'INV-2026-0002',
        {
            businessName: 'Acme Studio',
            address: {
                street: '1 Main St',
                city: 'Tokyo',
                state: 'Tokyo',
                postalCode: '100-0001',
                country: 'JP',
            },
            email: 'billing@acme.test',
            phone: '+81-3-0000-0000',
        },
        {
            clientName: 'Jane Client',
            billingAddress: {
                street: '2 Client Rd',
                city: 'Osaka',
                state: 'Osaka',
                postalCode: '530-0001',
                country: 'JP',
            },
            email: 'ap@client.test',
        },
        'issuer-2'
    );

    assert.equal(invoice.status, 'Submitted');
    assert.equal(invoice.invoiceNumber, 'INV-2026-0002');
    assert.ok(invoice.submittedAt);
    assert.equal(invoice.submittedBy, 'issuer-2');

    assert.throws(
        () => invoice.updateDraft({ notes: 'Should fail' }),
        /cannot be edited/
    );
    assert.throws(
        () => invoice.issue(
            'INV-2026-0003',
            {
                businessName: 'Acme Studio',
                address: {
                    street: '1 Main St',
                    city: 'Tokyo',
                    state: 'Tokyo',
                    postalCode: '100-0001',
                    country: 'JP',
                },
                email: 'billing@acme.test',
                phone: '+81-3-0000-0000',
            },
            {
                clientName: 'Jane Client',
                billingAddress: {
                    street: '2 Client Rd',
                    city: 'Osaka',
                    state: 'Osaka',
                    postalCode: '530-0001',
                    country: 'JP',
                },
                email: 'ap@client.test',
            },
            'issuer-3'
        ),
        /is not ready to be issued/
    );
    assert.equal(invoice.invoiceNumber, 'INV-2026-0002');
});

test('Invoice payment reconciliation follows the current Submitted -> PartiallyPaid -> Paid workflow', () => {
    const invoice = issueInvoice(validInvoiceProps());

    invoice.assertPaymentCanBeRecorded(50);
    invoice.reconcilePayments([{ amount: 50, paymentDate: new Date('2099-04-05T00:00:00.000Z') }], 'collector-1');
    assert.equal(invoice.status, 'PartiallyPaid');
    assert.equal(invoice.amountPaid.toAmount(), 50);
    assert.equal(invoice.balanceDue.toAmount(), 60);

    invoice.assertPaymentCanBeRecorded(60);
    invoice.reconcilePayments([
        { amount: 50, paymentDate: new Date('2099-04-05T00:00:00.000Z') },
        { amount: 60, paymentDate: new Date('2099-04-06T00:00:00.000Z') },
    ], 'collector-2');
    assert.equal(invoice.status, 'Paid');
    assert.equal(invoice.balanceDue.toAmount(), 0);
    assert.ok(invoice.paidAt);
});

test('Invoice payment validation rejects Draft payments and overpayments with explicit messages', () => {
    const draftInvoice = Invoice.create(validInvoiceProps());

    assert.throws(
        () => draftInvoice.assertPaymentCanBeRecorded(10),
        /Cannot record payment on a Draft invoice/
    );

    const invoice = issueInvoice(validInvoiceProps());
    assert.throws(
        () => invoice.assertPaymentCanBeRecorded(110.01),
        /Overpayment is not allowed/
    );
});

test('Invoice overdue state is derived from due date for unpaid and partially paid invoices', () => {
    const overdueInvoice = Invoice.reconstitute({
        ...issueInvoice({
            ...validInvoiceProps(),
            invoiceDate: new Date('2000-03-20T00:00:00.000Z'),
            dueDate: new Date('2000-04-01T00:00:00.000Z'),
        }).toSnapshot(),
        status: 'Submitted',
    } as InvoiceProps);

    overdueInvoice.reconcilePayments([], 'system');
    assert.equal(overdueInvoice.status, 'Overdue');

    overdueInvoice.reconcilePayments(
        [{ amount: 10, paymentDate: new Date('2026-04-02T00:00:00.000Z') }],
        'collector-1'
    );
    assert.equal(overdueInvoice.status, 'Overdue');
});

test('Invoice cancellation and voiding apply audit fields and block further financial changes', () => {
    const cancellableInvoice = issueInvoice(validInvoiceProps());
    cancellableInvoice.cancel('Customer request', 'manager-1');

    assert.equal(cancellableInvoice.status, 'Cancelled');
    assert.equal(cancellableInvoice.cancelledBy, 'manager-1');
    assert.ok(cancellableInvoice.cancelledAt);
    assert.throws(
        () => cancellableInvoice.assertPaymentCanBeRecorded(10),
        /Cannot record payment on a Cancelled invoice/
    );
    assert.throws(
        () => cancellableInvoice.updateDraft({ notes: 'Should fail' }),
        /cannot be edited/
    );

    const voidInvoice = Invoice.create(validInvoiceProps());
    voidInvoice.voidInvoice('Entered in error', 'manager-2');
    assert.equal(voidInvoice.status, 'Void');
    assert.equal(voidInvoice.voidedBy, 'manager-2');
    assert.ok(voidInvoice.voidedAt);
    assert.throws(
        () => voidInvoice.assertPaymentCanBeRecorded(10),
        /Cannot record payment on a Void invoice/
    );
});

test('Invoice rejects invalid cancellation and void transitions with explicit messages', () => {
    const partiallyPaidInvoice = issueInvoice(validInvoiceProps());
    partiallyPaidInvoice.reconcilePayments([{ amount: 10, paymentDate: new Date('2099-04-05T00:00:00.000Z') }], 'collector-1');

    assert.throws(
        () => partiallyPaidInvoice.cancel('Should fail', 'manager-1'),
        /Only Submitted or Overdue invoices without payments can be cancelled/
    );

    const paidInvoice = issueInvoice(validInvoiceProps());
    paidInvoice.reconcilePayments([{ amount: paidInvoice.grandTotal.toAmount(), paymentDate: new Date('2099-04-05T00:00:00.000Z') }], 'collector-1');
    assert.throws(
        () => paidInvoice.cancel('Should fail', 'manager-1'),
        /Cannot cancel a fully paid invoice/
    );
    assert.throws(
        () => paidInvoice.voidInvoice('Should fail', 'manager-1'),
        /Only Draft invoices without payments can be voided/
    );
});

function issueInvoice(props = validInvoiceProps()) {
    const invoice = Invoice.create(props);
    invoice.issue(
        'INV-2026-0001',
        {
            businessName: 'Acme Studio',
            address: {
                street: '1 Main St',
                city: 'Tokyo',
                state: 'Tokyo',
                postalCode: '100-0001',
                country: 'JP',
            },
            email: 'billing@acme.test',
            phone: '+81-3-0000-0000',
        },
        {
            clientName: 'Jane Client',
            billingAddress: {
                street: '2 Client Rd',
                city: 'Osaka',
                state: 'Osaka',
                postalCode: '530-0001',
                country: 'JP',
            },
            email: 'ap@client.test',
        },
        'issuer-1'
    );
    return invoice;
}
