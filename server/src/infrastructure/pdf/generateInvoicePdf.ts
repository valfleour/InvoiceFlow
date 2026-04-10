import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export interface InvoicePdfData {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date | string | null;
    status: string;
    currency: string;
    business: {
        businessName: string;
        address: { street: string; city: string; state: string; postalCode: string; country: string };
        email: string;
        phone: string;
        taxId?: string;
        paymentInstructions?: string;
    };
    client: {
        clientName: string;
        companyName?: string;
        billingAddress: { street: string; city: string; state: string; postalCode: string; country: string };
        email: string;
    };
    lineItems: Array<{
        itemName: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        discountPercent: number;
        taxPercent: number;
        lineTotal: number;
    }>;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    extraFees: number;
    grandTotal: number;
    amountPaid: number;
    balanceDue: number;
    notes?: string;
    terms?: string;
}

export function generateInvoicePdf(data: InvoicePdfData): PassThrough {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = new PassThrough();
    doc.pipe(stream);

    const fmt = (n: number) => `${data.currency} ${n.toFixed(2)}`;
    const fmtDate = (d?: Date | string | null) => {
        if (!d) {
            return 'No due date';
        }

        return new Date(d).toLocaleDateString('en-US');
    };

    // ─── Header ──────────────────────────────────────
    doc.fontSize(20).text(data.business.businessName, { align: 'left' });
    doc.fontSize(10)
        .text(data.business.address.street)
        .text(`${data.business.address.city}, ${data.business.address.state} ${data.business.address.postalCode}`)
        .text(data.business.address.country)
        .text(data.business.email)
        .text(data.business.phone);
    if (data.business.taxId) doc.text(`Tax ID: ${data.business.taxId}`);

    doc.moveDown();
    doc.fontSize(16).text('INVOICE', { align: 'right' });
    doc.fontSize(10)
        .text(`Invoice #: ${data.invoiceNumber}`, { align: 'right' })
        .text(`Date: ${fmtDate(data.invoiceDate)}`, { align: 'right' })
        .text(`Due Date: ${fmtDate(data.dueDate)}`, { align: 'right' })
        .text(`Status: ${data.status}`, { align: 'right' });

    doc.moveDown();

    // ─── Bill To ─────────────────────────────────────
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10)
        .text(data.client.clientName)
        .text(data.client.companyName || '')
        .text(data.client.billingAddress.street)
        .text(`${data.client.billingAddress.city}, ${data.client.billingAddress.state} ${data.client.billingAddress.postalCode}`)
        .text(data.client.billingAddress.country)
        .text(data.client.email);

    doc.moveDown();

    // ─── Line Items Table ────────────────────────────
    const tableTop = doc.y;
    const col = { item: 50, qty: 250, price: 300, disc: 370, tax: 420, total: 470 };

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item', col.item, tableTop);
    doc.text('Qty', col.qty, tableTop);
    doc.text('Price', col.price, tableTop);
    doc.text('Disc%', col.disc, tableTop);
    doc.text('Tax%', col.tax, tableTop);
    doc.text('Total', col.total, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 22;
    doc.font('Helvetica');
    for (const item of data.lineItems) {
        doc.text(item.itemName, col.item, y, { width: 190 });
        doc.text(String(item.quantity), col.qty, y);
        doc.text(fmt(item.unitPrice), col.price, y);
        doc.text(String(item.discountPercent), col.disc, y);
        doc.text(String(item.taxPercent), col.tax, y);
        doc.text(fmt(item.lineTotal), col.total, y);
        y += 18;
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
    }

    doc.moveTo(50, y).lineTo(545, y).stroke();
    y += 10;

    // ─── Totals ──────────────────────────────────────
    const totalsX = 380;
    const valX = 470;
    doc.font('Helvetica');
    doc.text('Subtotal:', totalsX, y); doc.text(fmt(data.subtotal), valX, y); y += 15;
    if (data.discountTotal > 0) {
        doc.text('Discount:', totalsX, y); doc.text(`-${fmt(data.discountTotal)}`, valX, y); y += 15;
    }
    doc.text('Tax:', totalsX, y); doc.text(fmt(data.taxTotal), valX, y); y += 15;
    if (data.extraFees > 0) {
        doc.text('Extra Fees:', totalsX, y); doc.text(fmt(data.extraFees), valX, y); y += 15;
    }
    doc.font('Helvetica-Bold');
    doc.text('Grand Total:', totalsX, y); doc.text(fmt(data.grandTotal), valX, y); y += 15;
    doc.text('Amount Paid:', totalsX, y); doc.text(fmt(data.amountPaid), valX, y); y += 15;
    doc.text('Balance Due:', totalsX, y); doc.text(fmt(data.balanceDue), valX, y); y += 25;

    // ─── Notes / Terms ──────────────────────────────
    doc.font('Helvetica');
    if (data.notes) {
        doc.fontSize(10).text('Notes:', 50, y, { underline: true });
        y += 15;
        doc.text(data.notes, 50, y, { width: 495 });
        y = doc.y + 10;
    }
    if (data.terms) {
        doc.text('Terms:', 50, y, { underline: true });
        y += 15;
        doc.text(data.terms, 50, y, { width: 495 });
        y = doc.y + 10;
    }
    if (data.business.paymentInstructions) {
        doc.text('Payment Instructions:', 50, y, { underline: true });
        y += 15;
        doc.text(data.business.paymentInstructions, 50, y, { width: 495 });
    }

    doc.end();
    return stream;
}
