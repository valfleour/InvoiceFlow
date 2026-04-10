import test from 'node:test';
import assert from 'node:assert/strict';
import { InvoiceLineItem } from './InvoiceLineItem';

function createLineItem(overrides: Partial<Parameters<typeof InvoiceLineItem.create>[0]> = {}) {
    return InvoiceLineItem.create({
        id: 'line-1',
        itemName: 'Consulting',
        quantity: 3,
        unitPrice: 19.99,
        discountPercent: 12.5,
        taxPercent: 7.25,
        currency: 'USD',
        ...overrides,
    });
}

test('InvoiceLineItem.create accepts valid input and computes deterministic rounded money values', () => {
    const lineItem = createLineItem();

    assert.equal(lineItem.grossAmount.toAmount(), 59.97);
    assert.equal(lineItem.discountAmount.toAmount(), 7.5);
    assert.equal(lineItem.netAmount.toAmount(), 52.47);
    assert.equal(lineItem.taxAmount.toAmount(), 3.8);
    assert.equal(lineItem.lineTotal.toAmount(), 56.27);
});

test('InvoiceLineItem.create enforces the current required validation rules', () => {
    assert.throws(
        () => createLineItem({ itemName: '   ' }),
        /Line item name is required/
    );
    assert.throws(
        () => createLineItem({ quantity: 0 }),
        /Quantity must be greater than zero/
    );
    assert.throws(
        () => createLineItem({ quantity: -1 }),
        /Quantity must be greater than zero/
    );
    assert.throws(
        () => createLineItem({ unitPrice: -0.01 }),
        /Unit price cannot be negative/
    );
    assert.throws(
        () => createLineItem({ discountPercent: -1 }),
        /Discount percent must be between 0 and 100/
    );
    assert.throws(
        () => createLineItem({ taxPercent: -1 }),
        /Tax percent must be between 0 and 100/
    );
});

test('InvoiceLineItem.create allows zero-priced lines under the current pricing rule', () => {
    const freeLine = createLineItem({
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0,
    });

    freeLine.validate();
    assert.equal(freeLine.lineTotal.toAmount(), 0);
});

test('InvoiceLineItem.create enforces the configured decimal precision for quantity, price, discount, and tax', () => {
    assert.throws(
        () => createLineItem({ quantity: 1.2345 }),
        /Quantity must use no more than 3 decimal places/
    );
    assert.throws(
        () => createLineItem({ unitPrice: 19.999 }),
        /Unit price must use no more than 2 decimal places/
    );
    assert.throws(
        () => createLineItem({ discountPercent: 10.555 }),
        /Discount percent must use no more than 2 decimal places/
    );
    assert.throws(
        () => createLineItem({ taxes: [{ code: 'VAT', ratePercent: 7.255 }] }),
        /Tax percent must use no more than 2 decimal places/
    );
});
