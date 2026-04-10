import test from 'node:test';
import assert from 'node:assert/strict';
import { InvoiceService } from './InvoiceService';
import { Invoice } from '../../domain/invoices/entities/Invoice';
import { InvoiceRepository } from '../../domain/invoices/repositories/InvoiceRepository';
import { Payment } from '../../domain/payments/entities/Payment';
import { PaymentRepository } from '../../domain/payments/repositories/PaymentRepository';
import { BusinessProfile, BusinessProfileProps } from '../../domain/business-profile/entities/BusinessProfile';
import { BusinessProfileRepository } from '../../domain/business-profile/repositories/BusinessProfileRepository';
import { Client, ClientProps } from '../../domain/clients/entities/Client';
import { ClientRepository } from '../../domain/clients/repositories/ClientRepository';
import { InvoiceProps } from '../../domain/invoices/entities/Invoice';
import {
    InvoiceCreationRequestRecord,
    InvoiceCreationRequestRepository,
    ReserveInvoiceCreationRequestResult,
} from '../../domain/invoices/repositories/InvoiceCreationRequestRepository';

class InMemoryInvoiceRepository implements InvoiceRepository {
    private readonly invoices = new Map<string, Invoice>();
    private draftSequence = 0;
    private finalSequence = 0;

    constructor(initialInvoices: Invoice[] = []) {
        for (const invoice of initialInvoices) {
            this.invoices.set(invoice.id, invoice);
        }
    }

    async findById(id: string, workspaceId: string): Promise<Invoice | null> {
        const invoice = this.invoices.get(id);
        if (!invoice || invoice.workspaceId !== workspaceId) {
            return null;
        }

        return invoice;
    }

    async findByBusinessId(businessId: string, workspaceId: string): Promise<Invoice[]> {
        return [...this.invoices.values()].filter(
            (invoice) => invoice.businessId === businessId && invoice.workspaceId === workspaceId
        );
    }

    async findOverdue(businessId: string, workspaceId: string): Promise<Invoice[]> {
        return [...this.invoices.values()].filter(
            (invoice) => invoice.businessId === businessId && invoice.workspaceId === workspaceId && invoice.status === 'Overdue'
        );
    }

    async existsByClientId(clientId: string, workspaceId: string): Promise<boolean> {
        return [...this.invoices.values()].some((invoice) => invoice.clientId === clientId && invoice.workspaceId === workspaceId);
    }

    async existsByBusinessId(businessId: string, workspaceId: string): Promise<boolean> {
        return [...this.invoices.values()].some((invoice) => invoice.businessId === businessId && invoice.workspaceId === workspaceId);
    }

    async save(invoice: Invoice): Promise<Invoice> {
        const stored = invoice.id
            ? invoice
            : Invoice.reconstitute({
                ...invoice.toSnapshot(),
                id: `invoice-${this.invoices.size + 1}`,
            });

        this.invoices.set(stored.id, stored);
        return stored;
    }

    async update(invoice: Invoice): Promise<Invoice> {
        this.invoices.set(invoice.id, invoice);
        return invoice;
    }

    async nextDraftInvoiceNumber(_businessId: string, _invoiceDate: Date): Promise<string> {
        this.draftSequence += 1;
        return `DRAFT-${String(this.draftSequence).padStart(4, '0')}`;
    }

    async nextInvoiceNumber(_businessId: string, _invoiceDate: Date): Promise<string> {
        this.finalSequence += 1;
        return `INV-${String(this.finalSequence).padStart(4, '0')}`;
    }

    async delete(id: string, workspaceId: string): Promise<void> {
        const invoice = this.invoices.get(id);
        if (invoice && invoice.workspaceId === workspaceId) {
            this.invoices.delete(id);
        }
    }
}

class InMemoryPaymentRepository implements PaymentRepository {
    private readonly payments = new Map<string, Payment>();

    constructor(initialPayments: Payment[] = []) {
        for (const payment of initialPayments) {
            this.payments.set(payment.id, payment);
        }
    }

    async findById(id: string, workspaceId: string): Promise<Payment | null> {
        const payment = this.payments.get(id);
        if (!payment || payment.workspaceId !== workspaceId) {
            return null;
        }

        return payment;
    }

    async findByInvoiceId(invoiceId: string, workspaceId: string): Promise<Payment[]> {
        return [...this.payments.values()].filter(
            (payment) => payment.invoiceId === invoiceId && payment.workspaceId === workspaceId
        );
    }

    async findByInvoiceIds(invoiceIds: string[], workspaceId: string): Promise<Payment[]> {
        return [...this.payments.values()].filter(
            (payment) => invoiceIds.includes(payment.invoiceId) && payment.workspaceId === workspaceId
        );
    }

    async save(payment: Payment): Promise<Payment> {
        const stored = payment.id
            ? payment
            : Payment.reconstitute({
                id: `payment-${this.payments.size + 1}`,
                workspaceId: payment.workspaceId,
                ownerUserId: payment.ownerUserId,
                invoiceId: payment.invoiceId,
                businessId: payment.businessId,
                currency: payment.currency,
                paymentDate: payment.paymentDate,
                amount: payment.amount,
                method: payment.method,
                referenceNumber: payment.referenceNumber,
                note: payment.note,
                createdAt: payment.createdAt,
                createdBy: payment.createdBy,
                updatedAt: payment.updatedAt,
                updatedBy: payment.updatedBy,
                deletedAt: payment.deletedAt,
                deletedBy: payment.deletedBy,
            });

        this.payments.set(stored.id, stored);
        return stored;
    }
}

class InMemoryBusinessProfileRepository implements BusinessProfileRepository {
    private readonly profiles = new Map<string, BusinessProfile>();

    constructor(initialProfiles: BusinessProfile[] = []) {
        for (const profile of initialProfiles) {
            this.profiles.set(profile.id, profile);
        }
    }

    async findById(id: string, workspaceId: string): Promise<BusinessProfile | null> {
        const profile = this.profiles.get(id);
        if (!profile || profile.workspaceId !== workspaceId) {
            return null;
        }

        return profile;
    }

    async findAll(workspaceId: string): Promise<BusinessProfile[]> {
        return [...this.profiles.values()].filter((profile) => profile.workspaceId === workspaceId);
    }

    async save(profile: BusinessProfile): Promise<BusinessProfile> {
        this.profiles.set(profile.id, profile);
        return profile;
    }

    async update(profile: BusinessProfile): Promise<BusinessProfile> {
        this.profiles.set(profile.id, profile);
        return profile;
    }

    async delete(id: string, workspaceId: string): Promise<void> {
        const profile = this.profiles.get(id);
        if (profile && profile.workspaceId === workspaceId) {
            this.profiles.delete(id);
        }
    }
}

class InMemoryClientRepository implements ClientRepository {
    private readonly clients = new Map<string, Client>();

    constructor(initialClients: Client[] = []) {
        for (const client of initialClients) {
            this.clients.set(client.id, client);
        }
    }

    async findById(id: string, workspaceId: string): Promise<Client | null> {
        const client = this.clients.get(id);
        if (!client || client.workspaceId !== workspaceId) {
            return null;
        }

        return client;
    }

    async findByBusinessId(businessId: string, workspaceId: string): Promise<Client[]> {
        return [...this.clients.values()].filter(
            (client) => client.businessId === businessId && client.workspaceId === workspaceId
        );
    }

    async findByNormalizedIdentity(workspaceId: string, normalizedName: string, normalizedEmail: string): Promise<Client | null> {
        return [...this.clients.values()].find((client) =>
            client.workspaceId === workspaceId
            && client.clientName.trim().replace(/\s+/g, ' ').toLowerCase() === normalizedName
            && client.email.trim().toLowerCase() === normalizedEmail
        ) ?? null;
    }

    async save(client: Client): Promise<Client> {
        this.clients.set(client.id, client);
        return client;
    }

    async update(client: Client): Promise<Client> {
        this.clients.set(client.id, client);
        return client;
    }

    async delete(id: string, workspaceId: string): Promise<void> {
        const client = this.clients.get(id);
        if (client && client.workspaceId === workspaceId) {
            this.clients.delete(id);
        }
    }
}

class InMemoryInvoiceCreationRequestRepository implements InvoiceCreationRequestRepository {
    private readonly records = new Map<string, InvoiceCreationRequestRecord>();

    async reserve(
        workspaceId: string,
        idempotencyKey: string,
        requestHash: string,
        expiresAt: Date
    ): Promise<ReserveInvoiceCreationRequestResult> {
        const normalizedKey = idempotencyKey.trim();
        const existingRecord = [...this.records.values()].find((record) =>
            record.workspaceId === workspaceId && record.idempotencyKey === normalizedKey
        );

        if (existingRecord) {
            return { record: existingRecord, created: false };
        }

        const now = new Date();
        const record: InvoiceCreationRequestRecord = {
            id: `request-${this.records.size + 1}`,
            workspaceId,
            idempotencyKey: normalizedKey,
            requestHash,
            status: 'InProgress',
            invoiceId: null,
            createdAt: now,
            updatedAt: now,
            expiresAt,
        };
        this.records.set(record.id, record);
        return { record, created: true };
    }

    async complete(id: string, invoiceId: string): Promise<void> {
        const existingRecord = this.records.get(id);
        if (!existingRecord) {
            throw new Error('Invoice creation request not found');
        }

        this.records.set(id, {
            ...existingRecord,
            status: 'Completed',
            invoiceId,
            updatedAt: new Date(),
        });
    }

    async release(id: string): Promise<void> {
        this.records.delete(id);
    }
}

const ownerUserId = 'user-1';
const workspaceId = 'workspace-1';
const businessId = 'business-1';
const clientId = 'client-1';

function createBusinessProfile(overrides: Partial<BusinessProfileProps> = {}) {
    const base: BusinessProfileProps = {
        id: businessId,
        workspaceId,
        ownerUserId,
        isActive: true,
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
        defaultCurrency: 'USD',
        paymentInstructions: 'Pay within 14 days',
    };

    return BusinessProfile.reconstitute({ ...base, ...overrides });
}

function createClient(overrides: Partial<ClientProps> = {}) {
    const base: ClientProps = {
        id: clientId,
        workspaceId,
        ownerUserId,
        businessId,
        isActive: true,
        clientName: 'Jane Client',
        companyName: 'Client Co',
        billingAddress: {
            street: '2 Client Rd',
            city: 'Osaka',
            state: 'Osaka',
            postalCode: '530-0001',
            country: 'JP',
        },
        email: 'ap@client.test',
        phone: '+81-6-0000-0000',
    };

    return Client.reconstitute({ ...base, ...overrides });
}

function createDraftInvoice(overrides: Partial<InvoiceProps> = {}) {
    const invoiceDate = new Date('2026-04-01T00:00:00.000Z');
    const dueDate = new Date('2026-04-15T00:00:00.000Z');

    const base: InvoiceProps = {
        id: 'invoice-1',
        workspaceId,
        ownerUserId,
        businessId,
        clientId,
        invoiceNumber: 'DRAFT-0001',
        invoiceDate,
        dueDate,
        status: 'Draft',
        currency: 'USD',
        lineItems: [
            {
                id: 'line-1',
                itemName: 'Design retainer',
                quantity: 2,
                unitPrice: 150,
                discountPercent: 10,
                taxPercent: 8,
            },
        ],
        extraFees: 25,
        amountPaid: 0,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-04-01T00:00:00.000Z'),
        createdBy: 'seed',
        updatedBy: 'seed',
    };

    return Invoice.reconstitute({ ...base, ...overrides });
}

function createIssuedInvoice(overrides: Partial<InvoiceProps> = {}) {
    const invoice = createDraftInvoice(overrides);
    invoice.issue(
        'INV-0099',
        {
            businessName: 'Acme Studio',
            logoUrl: 'https://acme.test/logo.png',
            address: {
                street: '1 Main St',
                city: 'Tokyo',
                state: 'Tokyo',
                postalCode: '100-0001',
                country: 'JP',
            },
            email: 'billing@acme.test',
            phone: '+81-3-0000-0000',
            website: 'https://acme.test',
            taxId: 'TAX-001',
            paymentInstructions: 'Pay within 14 days',
        },
        {
            clientName: 'Jane Client',
            companyName: 'Client Co',
            billingAddress: {
                street: '2 Client Rd',
                city: 'Osaka',
                state: 'Osaka',
                postalCode: '530-0001',
                country: 'JP',
            },
            email: 'ap@client.test',
            phone: '+81-6-0000-0000',
            taxId: 'CLI-001',
        },
        'issuer-1'
    );

    return invoice;
}

function createService(dependencies?: {
    invoiceRepo?: InvoiceRepository;
    paymentRepo?: PaymentRepository;
    businessProfileRepo?: BusinessProfileRepository;
    clientRepo?: ClientRepository;
    invoiceCreationRequestRepo?: InvoiceCreationRequestRepository;
}) {
    return new InvoiceService(
        dependencies?.invoiceRepo ?? new InMemoryInvoiceRepository(),
        dependencies?.paymentRepo ?? new InMemoryPaymentRepository(),
        dependencies?.businessProfileRepo ?? new InMemoryBusinessProfileRepository([createBusinessProfile()]),
        dependencies?.clientRepo ?? new InMemoryClientRepository([createClient()]),
        dependencies?.invoiceCreationRequestRepo ?? new InMemoryInvoiceCreationRequestRepository()
    );
}

test('createInvoice rejects clients that belong to a different business', async () => {
    const service = createService({
        clientRepo: new InMemoryClientRepository([
            createClient({
                businessId: 'business-2',
            }),
        ]),
    });

    await assert.rejects(
        service.createInvoice(ownerUserId, {
            workspaceId,
            businessId,
            clientId,
            invoiceDate: '2026-04-01',
            dueDate: '2026-04-15',
            currency: 'USD',
            lineItems: [
                {
                    id: 'line-1',
                    itemName: 'Design retainer',
                    quantity: 1,
                    unitPrice: 100,
                    discountPercent: 0,
                    taxPercent: 10,
                },
            ],
        }),
        /Invoice client must belong to the same business/
    );
});

test('createInvoice creates a draft invoice with the current required fields and workflow defaults', async () => {
    const service = createService();

    const created = await service.createInvoice(ownerUserId, {
        workspaceId,
        businessId,
        clientId,
        invoiceDate: '2026-04-01',
        dueDate: '2026-04-15',
        currency: 'USD',
        lineItems: [
            {
                id: 'line-1',
                itemName: 'Design retainer',
                quantity: 1,
                unitPrice: 100,
                discountPercent: 0,
                taxPercent: 10,
            },
        ],
    });

    assert.equal(created.status, 'Draft');
    assert.equal(created.workspaceId, workspaceId);
    assert.equal(created.clientId, clientId);
    assert.equal(created.invoiceNumber, 'DRAFT-0001');
});

test('createInvoice rejects missing required invoice fields through domain validation', async () => {
    const service = createService();

    await assert.rejects(
        service.createInvoice(ownerUserId, {
            workspaceId,
            businessId,
            clientId,
            invoiceDate: '2026-04-01',
            dueDate: null,
            currency: 'USD',
            lineItems: [
                {
                    id: 'line-1',
                    itemName: 'Design retainer',
                    quantity: 1,
                    unitPrice: 100,
                    discountPercent: 0,
                    taxPercent: 10,
                },
            ],
        }),
        /Invoice due date is required/
    );

    await assert.rejects(
        service.createInvoice(ownerUserId, {
            workspaceId,
            businessId,
            clientId,
            invoiceDate: '2026-04-01',
            dueDate: '2026-03-31',
            currency: 'USD',
            lineItems: [
                {
                    id: 'line-1',
                    itemName: 'Design retainer',
                    quantity: 1,
                    unitPrice: 100,
                    discountPercent: 0,
                    taxPercent: 10,
                },
            ],
        }),
        /Invoice due date cannot be earlier than the invoice date/
    );

    await assert.rejects(
        service.createInvoice(ownerUserId, {
            workspaceId,
            businessId,
            clientId,
            invoiceDate: '2026-04-01',
            dueDate: '2026-04-15',
            currency: '',
            lineItems: [
                {
                    id: 'line-1',
                    itemName: 'Design retainer',
                    quantity: 1,
                    unitPrice: 100,
                    discountPercent: 0,
                    taxPercent: 10,
                },
            ],
        }),
        /Currency is required/
    );

    await assert.rejects(
        service.createInvoice(ownerUserId, {
            workspaceId,
            businessId,
            clientId,
            invoiceDate: '2026-04-01',
            dueDate: '2026-04-15',
            currency: 'USD',
            lineItems: [],
        }),
        /Invoice must include at least one line item/
    );
});

test('createInvoice rejects cross-workspace client and business profile references', async () => {
    const service = createService({
        businessProfileRepo: new InMemoryBusinessProfileRepository([
            createBusinessProfile({
                workspaceId: 'workspace-2',
                id: businessId,
            }),
        ]),
        clientRepo: new InMemoryClientRepository([
            createClient({
                workspaceId: 'workspace-2',
                id: clientId,
            }),
        ]),
    });

    await assert.rejects(
        service.createInvoice(ownerUserId, {
            workspaceId,
            businessId,
            clientId,
            invoiceDate: '2026-04-01',
            dueDate: '2026-04-15',
            currency: 'USD',
            lineItems: [
                {
                    id: 'line-1',
                    itemName: 'Design retainer',
                    quantity: 1,
                    unitPrice: 100,
                    discountPercent: 0,
                    taxPercent: 10,
                },
            ],
        }),
        /Business profile business-1 not found/
    );
});

test('createInvoice rejects inactive clients for new invoices', async () => {
    const service = createService({
        clientRepo: new InMemoryClientRepository([
            createClient({
                isActive: false,
            }),
        ]),
    });

    await assert.rejects(
        service.createInvoice(ownerUserId, {
            workspaceId,
            businessId,
            clientId,
            invoiceDate: '2026-04-01',
            dueDate: '2026-04-15',
            currency: 'USD',
            lineItems: [
                {
                    id: 'line-1',
                    itemName: 'Design retainer',
                    quantity: 1,
                    unitPrice: 100,
                    discountPercent: 0,
                    taxPercent: 10,
                },
            ],
        }),
        /Inactive clients cannot be selected for new invoices/
    );
});

test('issueInvoice converts a draft number into a final number and captures business and client snapshots', async () => {
    const draftInvoice = createDraftInvoice();
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([draftInvoice]),
        businessProfileRepo: new InMemoryBusinessProfileRepository([
            createBusinessProfile({
                businessName: 'Acme Studio LLC',
                paymentInstructions: 'Transfer within 14 days',
            }),
        ]),
        clientRepo: new InMemoryClientRepository([
            createClient({
                clientName: 'Jane Buyer',
                companyName: 'Buyer Corp',
            }),
        ]),
    });

    const issued = await service.issueInvoice(workspaceId, draftInvoice.id, 'issuer-2');

    assert.equal(issued.status, 'Submitted');
    assert.equal(issued.invoiceNumber, 'INV-0001');
    assert.equal(issued.issuedBy, 'issuer-2');
    assert.ok(issued.issueSnapshot);
    assert.equal(issued.issueSnapshot?.issuer.businessName, 'Acme Studio LLC');
    assert.equal(issued.issueSnapshot?.issuer.logoUrl, undefined);
    assert.equal(issued.issueSnapshot?.issuer.paymentInstructions, 'Transfer within 14 days');
    assert.equal(issued.issueSnapshot?.client.clientName, 'Jane Buyer');
    assert.equal(issued.issueSnapshot?.client.companyName, 'Buyer Corp');
    assert.equal(issued.issueSnapshot?.totals.grandTotal, 316.6);
    assert.equal(issued.issueSnapshot?.totals.balanceDue, 316.6);
});

test('recordPayment persists the payment and reconciles the invoice to PartiallyPaid', async () => {
    const issuedInvoice = createIssuedInvoice();
    const invoiceRepo = new InMemoryInvoiceRepository([issuedInvoice]);
    const paymentRepo = new InMemoryPaymentRepository();
    const service = createService({
        invoiceRepo,
        paymentRepo,
    });

    const updated = await service.recordPayment(workspaceId, {
        invoiceId: issuedInvoice.id,
        paymentDate: '2026-04-10',
        amount: 100,
        method: 'Bank Transfer',
        referenceNumber: 'TXN-001',
        note: 'Deposit',
        createdBy: 'collector-1',
    });

    assert.equal(updated.status, 'PartiallyPaid');
    assert.equal(updated.amountPaid, 100);
    assert.equal(updated.balanceDue, 216.6);

    const savedPayments = await paymentRepo.findByInvoiceId(issuedInvoice.id, workspaceId);
    assert.equal(savedPayments.length, 1);
    assert.equal(savedPayments[0].businessId, businessId);
    assert.equal(savedPayments[0].currency, 'USD');
    assert.equal(savedPayments[0].method, 'Bank Transfer');
});

test('recordPayment accepts exact remaining balance and marks the invoice as Paid', async () => {
    const issuedInvoice = createIssuedInvoice();
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([issuedInvoice]),
        paymentRepo: new InMemoryPaymentRepository(),
    });

    const updated = await service.recordPayment(workspaceId, {
        invoiceId: issuedInvoice.id,
        paymentDate: '2026-04-10',
        amount: issuedInvoice.grandTotal.toAmount(),
        method: 'Bank Transfer',
        referenceNumber: 'TXN-PAID',
        createdBy: 'collector-1',
    });

    assert.equal(updated.status, 'Paid');
    assert.equal(updated.balanceDue, 0);
    assert.ok(updated.paidAt);
});

test('recordPayment rejects draft, cancelled, and void invoices based on the current workflow policy', async () => {
    const draftInvoice = createDraftInvoice();
    const cancelledInvoice = createIssuedInvoice({ id: 'invoice-2', invoiceNumber: 'DRAFT-0002' });
    cancelledInvoice.cancel('Customer request', 'manager-1');
    const voidInvoice = createDraftInvoice({ id: 'invoice-3', invoiceNumber: 'DRAFT-0003' });
    voidInvoice.voidInvoice('Entered in error', 'manager-2');
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([draftInvoice, cancelledInvoice, voidInvoice]),
        paymentRepo: new InMemoryPaymentRepository(),
    });

    await assert.rejects(
        service.recordPayment(workspaceId, {
            invoiceId: draftInvoice.id,
            paymentDate: '2026-04-10',
            amount: 10,
            method: 'Bank Transfer',
        }),
        /Cannot record payment on a Draft invoice/
    );
    await assert.rejects(
        service.recordPayment(workspaceId, {
            invoiceId: cancelledInvoice.id,
            paymentDate: '2026-04-10',
            amount: 10,
            method: 'Bank Transfer',
        }),
        /Cannot record payment on a Cancelled invoice/
    );
    await assert.rejects(
        service.recordPayment(workspaceId, {
            invoiceId: voidInvoice.id,
            paymentDate: '2026-04-10',
            amount: 10,
            method: 'Bank Transfer',
        }),
        /Cannot record payment on a Void invoice/
    );
});

test('recordPayment rejects duplicate payment reference numbers for the same invoice', async () => {
    const issuedInvoice = createIssuedInvoice();
    const existingPayment = Payment.reconstitute({
        id: 'payment-1',
        workspaceId,
        ownerUserId,
        invoiceId: issuedInvoice.id,
        businessId,
        currency: 'USD',
        paymentDate: new Date('2026-04-09T00:00:00.000Z'),
        amount: 50,
        method: 'Bank Transfer',
        referenceNumber: 'TXN-001',
        createdAt: new Date('2026-04-09T00:00:00.000Z'),
        updatedAt: new Date('2026-04-09T00:00:00.000Z'),
    });
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([issuedInvoice]),
        paymentRepo: new InMemoryPaymentRepository([existingPayment]),
    });

    await assert.rejects(
        service.recordPayment(workspaceId, {
            invoiceId: issuedInvoice.id,
            paymentDate: '2026-04-10',
            amount: 25,
            method: 'Bank Transfer',
            referenceNumber: 'TXN-001',
            createdBy: 'collector-2',
        }),
        /Duplicate payment reference numbers are not allowed/
    );
});

test('deleteInvoice refuses to remove drafts once payments are linked to them', async () => {
    const draftInvoice = createDraftInvoice();
    const payment = Payment.reconstitute({
        id: 'payment-1',
        workspaceId,
        ownerUserId,
        invoiceId: draftInvoice.id,
        businessId,
        currency: 'USD',
        paymentDate: new Date('2026-04-10T00:00:00.000Z'),
        amount: 25,
        method: 'Card',
        createdAt: new Date('2026-04-10T00:00:00.000Z'),
        updatedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([draftInvoice]),
        paymentRepo: new InMemoryPaymentRepository([payment]),
    });

    await assert.rejects(
        service.deleteInvoice(workspaceId, draftInvoice.id, 'deleter-1'),
        /Invoices with recorded payments cannot be deleted/
    );
});

test('cancelInvoice and voidInvoice apply the current policy and audit metadata', async () => {
    const submittedInvoice = createIssuedInvoice();
    const draftInvoice = createDraftInvoice({ id: 'invoice-2', invoiceNumber: 'DRAFT-0002' });
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([submittedInvoice, draftInvoice]),
        paymentRepo: new InMemoryPaymentRepository(),
    });

    const cancelled = await service.cancelInvoice(workspaceId, submittedInvoice.id, 'Customer request', 'manager-1');
    assert.equal(cancelled.status, 'Cancelled');
    assert.equal(cancelled.cancelledBy, 'manager-1');
    assert.ok(cancelled.cancelledAt);

    const voided = await service.voidInvoice(workspaceId, {
        invoiceId: draftInvoice.id,
        reason: 'Entered in error',
        voidedBy: 'manager-2',
    });
    assert.equal(voided.status, 'Void');
    assert.equal(voided.voidedBy, 'manager-2');
    assert.ok(voided.voidedAt);
});

test('cancelInvoice rejects invoices that already have recorded payments', async () => {
    const partiallyPaidInvoice = createIssuedInvoice();
    const payment = Payment.reconstitute({
        id: 'payment-1',
        workspaceId,
        ownerUserId,
        invoiceId: partiallyPaidInvoice.id,
        businessId,
        currency: 'USD',
        paymentDate: new Date('2026-04-10T00:00:00.000Z'),
        amount: 50,
        method: 'Bank Transfer',
        createdAt: new Date('2026-04-10T00:00:00.000Z'),
        updatedAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([partiallyPaidInvoice]),
        paymentRepo: new InMemoryPaymentRepository([payment]),
    });

    await assert.rejects(
        service.cancelInvoice(workspaceId, partiallyPaidInvoice.id, 'Should fail', 'manager-1'),
        /Only Submitted or Overdue invoices without payments can be cancelled/
    );
});

test('getInvoicesByBusiness returns only invoices from the requested workspace', async () => {
    const workspaceTwoInvoice = createDraftInvoice({
        id: 'invoice-2',
        workspaceId: 'workspace-2',
        ownerUserId: 'user-2',
        businessId,
        clientId,
    });
    const workspaceOneInvoice = createDraftInvoice();
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([workspaceOneInvoice, workspaceTwoInvoice]),
    });

    const workspaceOneInvoices = await service.getInvoicesByBusiness(workspaceId, businessId);
    const workspaceTwoInvoices = await service.getInvoicesByBusiness('workspace-2', businessId);

    assert.equal(workspaceOneInvoices.length, 1);
    assert.equal(workspaceOneInvoices[0].workspaceId, workspaceId);
    assert.equal(workspaceTwoInvoices.length, 1);
    assert.equal(workspaceTwoInvoices[0].workspaceId, 'workspace-2');
});

test('submitted invoice keeps issuer and client snapshots even if source records change later', async () => {
    const draftInvoice = createDraftInvoice();
    const businessProfile = createBusinessProfile({
        businessName: 'Initial Issuer',
        logoUrl: 'https://acme.test/initial-logo.png',
    });
    const client = createClient({
        clientName: 'Initial Client',
    });
    const businessRepo = new InMemoryBusinessProfileRepository([businessProfile]);
    const clientRepo = new InMemoryClientRepository([client]);
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([draftInvoice]),
        businessProfileRepo: businessRepo,
        clientRepo,
    });

    await service.issueInvoice(workspaceId, draftInvoice.id, 'issuer-3');
    businessProfile.update({ businessName: 'Edited Issuer', logoUrl: 'https://acme.test/edited-logo.png' });
    client.update({ clientName: 'Edited Client' });

    const snapshot = await service.getInvoice(workspaceId, draftInvoice.id);

    assert.equal(snapshot?.status, 'Submitted');
    assert.equal(snapshot?.issueSnapshot?.issuer.businessName, 'Initial Issuer');
    assert.equal(snapshot?.issueSnapshot?.issuer.logoUrl, 'https://acme.test/initial-logo.png');
    assert.equal(snapshot?.issueSnapshot?.client.clientName, 'Initial Client');
});

test('issueInvoice rejects invoices whose total is zero', async () => {
    const zeroTotalInvoice = createDraftInvoice({
        extraFees: 0,
        lineItems: [
            {
                id: 'line-1',
                itemName: 'Free work',
                quantity: 1,
                unitPrice: 0,
                discountPercent: 0,
                taxPercent: 0,
            },
        ],
    });
    const service = createService({
        invoiceRepo: new InMemoryInvoiceRepository([zeroTotalInvoice]),
    });

    await assert.rejects(
        service.issueInvoice(workspaceId, zeroTotalInvoice.id, 'issuer-4'),
        /zero or negative total cannot be submitted/
    );
});

test('createInvoice replays the original draft when the same idempotency key is retried with the same request', async () => {
    const invoiceRepo = new InMemoryInvoiceRepository();
    const service = createService({
        invoiceRepo,
        invoiceCreationRequestRepo: new InMemoryInvoiceCreationRequestRepository(),
    });

    const first = await service.createInvoice(ownerUserId, {
        workspaceId,
        businessId,
        clientId,
        invoiceDate: '2026-04-01',
        dueDate: '2026-04-15',
        currency: 'USD',
        lineItems: [
            {
                id: 'line-1',
                itemName: 'Design retainer',
                quantity: 1,
                unitPrice: 100,
                discountPercent: 0,
                taxPercent: 10,
            },
        ],
        idempotencyKey: 'retry-key-1',
    });
    const second = await service.createInvoice(ownerUserId, {
        workspaceId,
        businessId,
        clientId,
        invoiceDate: '2026-04-01',
        dueDate: '2026-04-15',
        currency: 'USD',
        lineItems: [
            {
                id: 'line-1',
                itemName: 'Design retainer',
                quantity: 1,
                unitPrice: 100,
                discountPercent: 0,
                taxPercent: 10,
            },
        ],
        idempotencyKey: 'retry-key-1',
    });

    assert.equal(first.id, second.id);
    assert.equal((await invoiceRepo.findByBusinessId(businessId, workspaceId)).length, 1);
});

test('createInvoice rejects reusing an idempotency key with a different request body', async () => {
    const service = createService({
        invoiceCreationRequestRepo: new InMemoryInvoiceCreationRequestRepository(),
    });

    await service.createInvoice(ownerUserId, {
        workspaceId,
        businessId,
        clientId,
        invoiceDate: '2026-04-01',
        dueDate: '2026-04-15',
        currency: 'USD',
        lineItems: [
            {
                id: 'line-1',
                itemName: 'Design retainer',
                quantity: 1,
                unitPrice: 100,
                discountPercent: 0,
                taxPercent: 10,
            },
        ],
        idempotencyKey: 'retry-key-2',
    });

    await assert.rejects(
        service.createInvoice(ownerUserId, {
            workspaceId,
            businessId,
            clientId,
            invoiceDate: '2026-04-01',
            dueDate: '2026-04-15',
            currency: 'USD',
            lineItems: [
                {
                    id: 'line-1',
                    itemName: 'Different line item',
                    quantity: 1,
                    unitPrice: 150,
                    discountPercent: 0,
                    taxPercent: 10,
                },
            ],
            idempotencyKey: 'retry-key-2',
        }),
        /Idempotency key has already been used with a different invoice creation request/
    );
});
