const path = require('path');
const { randomBytes, randomUUID, scryptSync } = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DEFAULT_PASSWORD = 'Password123!';

function round2(value) {
    return Math.round(value * 100) / 100;
}

function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function buildLineItem({
    itemName,
    description,
    quantity,
    unitPrice,
    discountPercent = 0,
    taxPercent = 0,
    unit = 'service',
}) {
    const grossAmount = round2(quantity * unitPrice);
    const discountAmount = round2(grossAmount * (discountPercent / 100));
    const netAmount = round2(grossAmount - discountAmount);
    const taxAmount = round2(netAmount * (taxPercent / 100));

    return {
        id: randomUUID(),
        itemName,
        description,
        unit,
        quantity,
        unitPrice,
        discountType: 'Percentage',
        discountPercent,
        taxPercent,
        taxes: taxPercent > 0 ? [{
            code: 'STANDARD',
            name: 'Standard Tax',
            ratePercent: taxPercent,
            calculationType: 'Percentage',
        }] : [],
        netAmount,
        discountAmount,
        taxAmount,
        lineTotal: round2(netAmount + taxAmount),
    };
}

function summarizeLineItems(lineItems, extraFees, amountPaid) {
    const subtotal = round2(lineItems.reduce((sum, item) => sum + item.netAmount, 0));
    const discountTotal = round2(lineItems.reduce((sum, item) => sum + item.discountAmount, 0));
    const taxTotal = round2(lineItems.reduce((sum, item) => sum + item.taxAmount, 0));
    const grandTotal = round2(subtotal + taxTotal + extraFees);
    const balanceDue = round2(grandTotal - amountPaid);

    return {
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal,
        balanceDue,
    };
}

function publicLineItem(lineItem) {
    return {
        id: lineItem.id,
        itemName: lineItem.itemName,
        description: lineItem.description,
        unit: lineItem.unit,
        quantity: lineItem.quantity,
        unitPrice: lineItem.unitPrice,
        discountType: lineItem.discountType,
        discountPercent: lineItem.discountPercent,
        taxPercent: lineItem.taxPercent,
        taxes: lineItem.taxes,
        lineTotal: lineItem.lineTotal,
    };
}

function buildIssueSnapshot({ business, client, lineItems, totals, issuedAt }) {
    return {
        issuer: {
            businessName: business.businessName,
            address: business.address,
            email: business.email,
            phone: business.phone,
            website: business.website,
            taxId: business.taxId,
            paymentInstructions: business.paymentInstructions,
        },
        client: {
            clientName: client.clientName,
            companyName: client.companyName,
            billingAddress: client.billingAddress,
            email: client.email,
            phone: client.phone,
            taxId: client.taxId,
        },
        lineItems: lineItems.map((lineItem) => ({
            itemName: lineItem.itemName,
            description: lineItem.description,
            unit: lineItem.unit,
            quantity: lineItem.quantity,
            unitPrice: lineItem.unitPrice,
            discountType: lineItem.discountType,
            discountPercent: lineItem.discountPercent,
            taxPercent: lineItem.taxPercent,
            taxes: lineItem.taxes,
            lineTotal: lineItem.lineTotal,
        })),
        totals: {
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            taxTotal: totals.taxTotal,
            extraFees: totals.extraFees,
            grandTotal: totals.grandTotal,
            amountPaid: totals.amountPaid,
            balanceDue: totals.balanceDue,
        },
        capturedAt: issuedAt,
    };
}

function buildInvoiceDocument({
    id,
    ownerUserId,
    business,
    client,
    invoiceNumber,
    invoiceDate,
    dueDate,
    status,
    lineItems,
    extraFees = 0,
    amountPaid = 0,
    notes,
    terms,
    createdAt,
    updatedAt,
    issuedAt = null,
    paidEvents = [],
    cancelledAt = null,
    cancellationReason = null,
}) {
    const totals = summarizeLineItems(lineItems, extraFees, amountPaid);
    const publicItems = lineItems.map(publicLineItem);
    const statusHistory = [
        {
            fromStatus: null,
            toStatus: 'Draft',
            reason: 'InvoiceCreated',
            changedAt: createdAt,
            changedBy: ownerUserId,
        },
    ];

    if (issuedAt) {
        statusHistory.push({
            fromStatus: 'Draft',
            toStatus: dueDate < issuedAt ? 'Overdue' : 'Issued',
            reason: 'InvoiceIssued',
            changedAt: issuedAt,
            changedBy: ownerUserId,
        });
    }

    for (const paidEvent of paidEvents) {
        statusHistory.push({
            fromStatus: paidEvent.fromStatus,
            toStatus: paidEvent.toStatus,
            reason: 'PaymentStateReconciled',
            changedAt: paidEvent.changedAt,
            changedBy: ownerUserId,
        });
    }

    if (cancelledAt) {
        statusHistory.push({
            fromStatus: 'Issued',
            toStatus: 'Cancelled',
            reason: 'InvoiceCancelled',
            changedAt: cancelledAt,
            changedBy: ownerUserId,
        });
    }

    return {
        _id: id,
        ownerUserId,
        businessId: business._id,
        clientId: client._id,
        invoiceNumber,
        invoiceDate,
        dueDate,
        status,
        currency: business.defaultCurrency,
        lineItems: publicItems,
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        extraFees,
        grandTotal: totals.grandTotal,
        amountPaid,
        balanceDue: totals.balanceDue,
        notes,
        terms,
        createdBy: ownerUserId,
        updatedBy: ownerUserId,
        createdAt,
        updatedAt,
        deletedAt: null,
        deletedBy: null,
        origin: {
            kind: 'Manual',
            sourceDocumentId: null,
            sourceDocumentNumber: null,
        },
        ownership: {
            mode: 'SingleBusiness',
            primaryBusinessId: business._id,
            associatedBusinessIds: [business._id],
        },
        issuance: {
            mode: 'Manual',
            approvalState: 'NotRequired',
            requestedAt: null,
            approvedAt: null,
            rejectedAt: null,
            approvedBy: null,
            rejectedBy: null,
        },
        automation: {
            recurrenceScheduleId: null,
            reminderPolicyId: null,
            portalAccess: 'NotConfigured',
        },
        presentation: {
            templateId: null,
        },
        configuration: {
            currencyCode: business.defaultCurrency,
            taxMode: 'LineTaxes',
            taxRulesetId: null,
            jurisdictionCode: null,
        },
        statusHistory,
        issueSnapshot: issuedAt
            ? buildIssueSnapshot({
                business,
                client,
                lineItems,
                totals: {
                    ...totals,
                    extraFees,
                    amountPaid,
                },
                issuedAt,
            })
            : null,
        issuedAt,
        issuedBy: issuedAt ? ownerUserId : null,
        cancelledAt,
        cancelledBy: cancelledAt ? ownerUserId : null,
        cancellationReason,
        voidedAt: null,
        voidedBy: null,
        voidReason: null,
    };
}

function buildPaymentDocument({
    ownerUserId,
    invoiceId,
    businessId,
    currency,
    paymentDate,
    amount,
    method,
    referenceNumber,
    note,
}) {
    return {
        _id: new mongoose.Types.ObjectId(),
        ownerUserId,
        invoiceId,
        businessId,
        currency,
        paymentDate,
        amount,
        method,
        referenceNumber,
        note,
        createdBy: ownerUserId,
        updatedBy: ownerUserId,
        createdAt: paymentDate,
        updatedAt: paymentDate,
        deletedAt: null,
        deletedBy: null,
    };
}

function createWorkspaceSeed(config, now) {
    const ownerUserId = new mongoose.Types.ObjectId().toString();
    const businessId = new mongoose.Types.ObjectId();
    const businessCreatedAt = addDays(now, config.businessAgeDays);
    const currentYear = now.getUTCFullYear();

    const user = {
        _id: new mongoose.Types.ObjectId(ownerUserId),
        name: config.user.name,
        email: config.user.email.toLowerCase(),
        passwordHash: hashPassword(config.user.password),
        createdAt: businessCreatedAt,
        updatedAt: now,
    };

    const business = {
        _id: businessId,
        ownerUserId,
        isActive: true,
        businessName: config.business.businessName,
        address: config.business.address,
        email: config.business.email,
        phone: config.business.phone,
        website: config.business.website,
        taxId: config.business.taxId,
        defaultCurrency: config.business.defaultCurrency,
        paymentInstructions: config.business.paymentInstructions,
        createdBy: ownerUserId,
        updatedBy: ownerUserId,
        createdAt: businessCreatedAt,
        updatedAt: now,
        deletedAt: null,
        deletedBy: null,
    };

    const clients = config.clients.map((client, index) => ({
        _id: new mongoose.Types.ObjectId(),
        ownerUserId,
        businessId,
        isActive: true,
        clientName: client.clientName,
        companyName: client.companyName,
        billingAddress: client.billingAddress,
        email: client.email,
        phone: client.phone,
        taxId: client.taxId,
        notes: client.notes,
        createdBy: ownerUserId,
        updatedBy: ownerUserId,
        createdAt: addDays(businessCreatedAt, index + 1),
        updatedAt: addDays(now, -(index + 2)),
        deletedAt: null,
        deletedBy: null,
    }));

    const draftLineItems = [
        buildLineItem({
            itemName: 'Brand refresh sprint',
            description: 'Concept revisions and asset delivery',
            quantity: 8,
            unitPrice: config.priceBase,
            taxPercent: 8,
        }),
        buildLineItem({
            itemName: 'Collateral updates',
            description: 'Editable templates and exports',
            quantity: 3,
            unitPrice: config.priceBase + 35,
            discountPercent: 5,
            taxPercent: 8,
        }),
    ];

    const issuedLineItems = [
        buildLineItem({
            itemName: 'Campaign page build',
            description: 'Responsive implementation and QA',
            quantity: 7,
            unitPrice: config.priceBase + 20,
            taxPercent: 8,
        }),
        buildLineItem({
            itemName: 'Content handoff',
            description: 'Copy review and publishing support',
            quantity: 4,
            unitPrice: config.priceBase - 10,
            taxPercent: 8,
        }),
    ];

    const partialLineItems = [
        buildLineItem({
            itemName: 'Strategy workshop',
            description: 'Stakeholder discovery session',
            quantity: 5,
            unitPrice: config.priceBase + 55,
            taxPercent: 8,
        }),
        buildLineItem({
            itemName: 'System guidelines',
            description: 'Shared design and usage guidance',
            quantity: 2,
            unitPrice: config.priceBase + 110,
            discountPercent: 5,
            taxPercent: 8,
        }),
    ];

    const paidLineItems = [
        buildLineItem({
            itemName: 'Launch package',
            description: 'Final production files and rollout support',
            quantity: 6,
            unitPrice: config.priceBase + 40,
            taxPercent: 8,
        }),
        buildLineItem({
            itemName: 'Team training',
            description: 'Playback session and Q&A',
            quantity: 2,
            unitPrice: config.priceBase + 85,
            taxPercent: 8,
        }),
    ];

    const partialTotals = summarizeLineItems(partialLineItems, 35, 0);
    const partialPaymentAmount = round2(partialTotals.grandTotal * 0.45);

    const paidTotals = summarizeLineItems(paidLineItems, 20, 0);
    const paidFirstPayment = round2(paidTotals.grandTotal * 0.5);
    const paidSecondPayment = round2(paidTotals.grandTotal - paidFirstPayment);

    const invoiceDocs = [
        buildInvoiceDocument({
            id: new mongoose.Types.ObjectId(),
            ownerUserId,
            business,
            client: clients[0],
            invoiceNumber: `DRAFT-${currentYear}-0001`,
            invoiceDate: addDays(now, -2),
            dueDate: addDays(now, 12),
            status: 'Draft',
            lineItems: draftLineItems,
            extraFees: 25,
            amountPaid: 0,
            notes: 'Draft invoice waiting for internal approval.',
            terms: 'Net 14',
            createdAt: addDays(now, -2),
            updatedAt: addDays(now, -2),
        }),
        buildInvoiceDocument({
            id: new mongoose.Types.ObjectId(),
            ownerUserId,
            business,
            client: clients[1],
            invoiceNumber: `INV-${currentYear}-0001`,
            invoiceDate: addDays(now, -8),
            dueDate: addDays(now, 6),
            status: 'Issued',
            lineItems: issuedLineItems,
            extraFees: 15,
            amountPaid: 0,
            notes: 'Awaiting confirmation from the finance team.',
            terms: 'Net 14',
            createdAt: addDays(now, -8),
            updatedAt: addDays(now, -7),
            issuedAt: addDays(now, -7),
        }),
        buildInvoiceDocument({
            id: new mongoose.Types.ObjectId(),
            ownerUserId,
            business,
            client: clients[2],
            invoiceNumber: `INV-${currentYear}-0002`,
            invoiceDate: addDays(now, -16),
            dueDate: addDays(now, 4),
            status: 'PartiallyPaid',
            lineItems: partialLineItems,
            extraFees: 35,
            amountPaid: partialPaymentAmount,
            notes: 'Deposit received, balance due after final sign-off.',
            terms: 'Net 21',
            createdAt: addDays(now, -16),
            updatedAt: addDays(now, -3),
            issuedAt: addDays(now, -15),
            paidEvents: [{
                fromStatus: 'Issued',
                toStatus: 'PartiallyPaid',
                changedAt: addDays(now, -3),
            }],
        }),
        buildInvoiceDocument({
            id: new mongoose.Types.ObjectId(),
            ownerUserId,
            business,
            client: clients[0],
            invoiceNumber: `INV-${currentYear}-0003`,
            invoiceDate: addDays(now, -24),
            dueDate: addDays(now, -2),
            status: 'Paid',
            lineItems: paidLineItems,
            extraFees: 20,
            amountPaid: paidTotals.grandTotal,
            notes: 'Closed and paid in full.',
            terms: 'Net 14',
            createdAt: addDays(now, -24),
            updatedAt: addDays(now, -1),
            issuedAt: addDays(now, -23),
            paidEvents: [
                {
                    fromStatus: 'Issued',
                    toStatus: 'PartiallyPaid',
                    changedAt: addDays(now, -11),
                },
                {
                    fromStatus: 'PartiallyPaid',
                    toStatus: 'Paid',
                    changedAt: addDays(now, -1),
                },
            ],
        }),
    ];

    const paymentDocs = [
        buildPaymentDocument({
            ownerUserId,
            invoiceId: invoiceDocs[2]._id,
            businessId,
            currency: business.defaultCurrency,
            paymentDate: addDays(now, -3),
            amount: partialPaymentAmount,
            method: 'Bank Transfer',
            referenceNumber: `${config.referencePrefix}-DEP-01`,
            note: 'Deposit payment.',
        }),
        buildPaymentDocument({
            ownerUserId,
            invoiceId: invoiceDocs[3]._id,
            businessId,
            currency: business.defaultCurrency,
            paymentDate: addDays(now, -11),
            amount: paidFirstPayment,
            method: 'Credit Card',
            referenceNumber: `${config.referencePrefix}-CC-01`,
            note: 'First installment.',
        }),
        buildPaymentDocument({
            ownerUserId,
            invoiceId: invoiceDocs[3]._id,
            businessId,
            currency: business.defaultCurrency,
            paymentDate: addDays(now, -1),
            amount: paidSecondPayment,
            method: 'Bank Transfer',
            referenceNumber: `${config.referencePrefix}-BT-02`,
            note: 'Final settlement.',
        }),
    ];

    return {
        user,
        business,
        clients,
        invoices: invoiceDocs,
        payments: paymentDocs,
        invoiceCounter: {
            _id: new mongoose.Types.ObjectId(),
            businessId,
            nextSequence: 3,
            nextDraftSequence: 1,
        },
    };
}

async function seedMockData() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/invoiceflow';
    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const users = db.collection('users');
    const businessProfiles = db.collection('businessprofiles');
    const clients = db.collection('clients');
    const invoices = db.collection('invoices');
    const payments = db.collection('payments');
    const invoiceCounters = db.collection('invoicecounters');

    await Promise.all([
        payments.deleteMany({}),
        invoices.deleteMany({}),
        clients.deleteMany({}),
        businessProfiles.deleteMany({}),
        invoiceCounters.deleteMany({}),
        users.deleteMany({}),
    ]);

    const now = new Date();
    const workspaceSeeds = [
        createWorkspaceSeed({
            user: {
                name: 'Aldren Gacute',
                email: 'aldgacute@gmail.com',
                password: DEFAULT_PASSWORD,
            },
            businessAgeDays: -60,
            business: {
                businessName: 'Gacute Creative Studio',
                address: {
                    street: '114 Rizal Avenue',
                    city: 'Makati',
                    state: 'Metro Manila',
                    postalCode: '1226',
                    country: 'Philippines',
                },
                email: 'hello@gacutecreative.test',
                phone: '+63 917 555 0101',
                website: 'https://gacutecreative.test',
                taxId: 'PH-GCS-2048',
                defaultCurrency: 'USD',
                paymentInstructions: 'Please pay via bank transfer within 14 days and include the invoice number as the reference.',
            },
            clients: [
                {
                    clientName: 'Mia Santos',
                    companyName: 'Harbor Retail Co.',
                    billingAddress: {
                        street: '24 Paseo Center',
                        city: 'Taguig',
                        state: 'Metro Manila',
                        postalCode: '1634',
                        country: 'Philippines',
                    },
                    email: 'finance@harborretail.example',
                    phone: '+63 917 555 0188',
                    taxId: 'HR-0021',
                    notes: 'Monthly ecommerce creative support.',
                },
                {
                    clientName: 'Leo Navarro',
                    companyName: 'Northline Labs',
                    billingAddress: {
                        street: '18 Innovation Drive',
                        city: 'Pasig',
                        state: 'Metro Manila',
                        postalCode: '1605',
                        country: 'Philippines',
                    },
                    email: 'ap@northlinelabs.example',
                    phone: '+63 917 555 0140',
                    taxId: 'NL-5510',
                    notes: 'Approvals handled by the finance lead.',
                },
                {
                    clientName: 'Chloe Rivera',
                    companyName: 'Luma Wellness',
                    billingAddress: {
                        street: '8 Bloom Street',
                        city: 'Cebu City',
                        state: 'Cebu',
                        postalCode: '6000',
                        country: 'Philippines',
                    },
                    email: 'payments@lumawellness.example',
                    phone: '+63 917 555 0124',
                    taxId: 'LW-7780',
                    notes: 'Prefers detailed payment notes on invoices.',
                },
            ],
            priceBase: 95,
            referencePrefix: 'ALG',
        }, now),
        createWorkspaceSeed({
            user: {
                name: 'Maya Patel',
                email: 'maya.patel@invoiceflow-demo.test',
                password: DEFAULT_PASSWORD,
            },
            businessAgeDays: -75,
            business: {
                businessName: 'Maple Ledger Co.',
                address: {
                    street: '440 King Street West',
                    city: 'Toronto',
                    state: 'ON',
                    postalCode: 'M5V 1K1',
                    country: 'Canada',
                },
                email: 'billing@mapleledger.test',
                phone: '+1 416 555 0162',
                website: 'https://mapleledger.test',
                taxId: 'CA-MLC-8842',
                defaultCurrency: 'USD',
                paymentInstructions: 'Send payment within 14 days. Email remittance advice to billing@mapleledger.test.',
            },
            clients: [
                {
                    clientName: 'Olivia Moore',
                    companyName: 'Summit Goods',
                    billingAddress: {
                        street: '92 Bay Street',
                        city: 'Toronto',
                        state: 'ON',
                        postalCode: 'M5J 2N8',
                        country: 'Canada',
                    },
                    email: 'ap@summitgoods.example',
                    phone: '+1 416 555 0118',
                    taxId: 'SG-1042',
                    notes: 'Quarterly retail campaigns.',
                },
                {
                    clientName: 'Noah Adams',
                    companyName: 'Blue Vale Media',
                    billingAddress: {
                        street: '180 Front Street',
                        city: 'Toronto',
                        state: 'ON',
                        postalCode: 'M5V 3K2',
                        country: 'Canada',
                    },
                    email: 'finance@bluevale.example',
                    phone: '+1 416 555 0133',
                    taxId: 'BV-3308',
                    notes: 'Needs invoices before the 25th each month.',
                },
                {
                    clientName: 'Emma Hughes',
                    companyName: 'Cedar Health',
                    billingAddress: {
                        street: '45 Portage Avenue',
                        city: 'Winnipeg',
                        state: 'MB',
                        postalCode: 'R3B 2B3',
                        country: 'Canada',
                    },
                    email: 'payments@cedarhealth.example',
                    phone: '+1 204 555 0191',
                    taxId: 'CH-5544',
                    notes: 'Payment reference required for ACH transfers.',
                },
            ],
            priceBase: 110,
            referencePrefix: 'MAY',
        }, now),
        createWorkspaceSeed({
            user: {
                name: 'Jordan Reyes',
                email: 'jordan.reyes@invoiceflow-demo.test',
                password: DEFAULT_PASSWORD,
            },
            businessAgeDays: -90,
            business: {
                businessName: 'North Peak Design',
                address: {
                    street: '1208 Market Street',
                    city: 'San Francisco',
                    state: 'CA',
                    postalCode: '94103',
                    country: 'USA',
                },
                email: 'accounts@northpeak.test',
                phone: '+1 415 555 0199',
                website: 'https://northpeak.test',
                taxId: 'US-NPD-5519',
                defaultCurrency: 'USD',
                paymentInstructions: 'Please pay by bank transfer within 14 days and include the invoice number in the reference.',
            },
            clients: [
                {
                    clientName: 'Sofia Turner',
                    companyName: 'Acme Retail Group',
                    billingAddress: {
                        street: '450 Madison Ave',
                        city: 'New York',
                        state: 'NY',
                        postalCode: '10022',
                        country: 'USA',
                    },
                    email: 'ap@acmeretail.example',
                    phone: '+1 212 555 0188',
                    taxId: 'AR-8821',
                    notes: 'Monthly branding support retainer.',
                },
                {
                    clientName: 'Marcus Chen',
                    companyName: 'Blue Horizon Labs',
                    billingAddress: {
                        street: '300 Lakeshore Drive',
                        city: 'Chicago',
                        state: 'IL',
                        postalCode: '60601',
                        country: 'USA',
                    },
                    email: 'finance@bluehorizon.example',
                    phone: '+1 312 555 0140',
                    taxId: 'BHL-5510',
                    notes: 'Invoices approved by finance each Friday.',
                },
                {
                    clientName: 'Priya Nair',
                    companyName: 'Luma Wellness',
                    billingAddress: {
                        street: '18 Grove Street',
                        city: 'Austin',
                        state: 'TX',
                        postalCode: '78701',
                        country: 'USA',
                    },
                    email: 'payments@lumawellness.example',
                    phone: '+1 512 555 0124',
                    taxId: 'LW-7780',
                    notes: 'Prefers invoices with clear payment breakdowns.',
                },
            ],
            priceBase: 105,
            referencePrefix: 'JOR',
        }, now),
    ];

    await users.insertMany(workspaceSeeds.map((seed) => seed.user));
    await businessProfiles.insertMany(workspaceSeeds.map((seed) => seed.business));
    await clients.insertMany(workspaceSeeds.flatMap((seed) => seed.clients));
    await invoices.insertMany(workspaceSeeds.flatMap((seed) => seed.invoices));
    await payments.insertMany(workspaceSeeds.flatMap((seed) => seed.payments));
    await invoiceCounters.insertMany(workspaceSeeds.map((seed) => seed.invoiceCounter));

    console.log(`Reset and seeded InvoiceFlow mock data into ${uri}`);
    console.log(`Users created: ${workspaceSeeds.length}`);
    for (const seed of workspaceSeeds) {
        console.log(`- ${seed.user.name}: ${seed.user.email} | password: ${DEFAULT_PASSWORD}`);
        console.log(`  Workspace: ${seed.business.businessName}`);
        console.log(`  Clients: ${seed.clients.length}, Invoices: ${seed.invoices.length}, Payments: ${seed.payments.length}`);
    }
}

seedMockData()
    .catch((error) => {
        console.error('Failed to seed mock data.', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
