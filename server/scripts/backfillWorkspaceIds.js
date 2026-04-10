const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DEFAULT_WORKSPACE_SETTINGS = {
    defaultCurrency: 'USD',
    invoiceNumbering: {
        submittedPrefix: 'INV',
        draftPrefix: 'DRAFT',
    },
};

function missingWorkspaceId(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

function idToString(value) {
    return value ? value.toString() : null;
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function normalizeClientName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

async function ensureWorkspaceForOwner(workspaces, ownerUserId, fallbackCreatedAt, now) {
    let workspace = await workspaces.findOne({ ownerUserId });

    if (!workspace) {
        const workspaceDocument = {
            ownerUserId,
            memberUserIds: [ownerUserId],
            ...DEFAULT_WORKSPACE_SETTINGS,
            createdAt: fallbackCreatedAt || now,
            updatedAt: now,
        };
        const result = await workspaces.insertOne(workspaceDocument);
        workspace = {
            _id: result.insertedId,
            ...workspaceDocument,
        };
    } else {
        const memberUserIds = Array.isArray(workspace.memberUserIds) ? workspace.memberUserIds.map(String) : [];
        if (!memberUserIds.includes(ownerUserId)) {
            await workspaces.updateOne(
                { _id: workspace._id },
                {
                    $set: {
                        memberUserIds: [...new Set([...memberUserIds, ownerUserId])],
                        updatedAt: now,
                    },
                }
            );
            workspace.memberUserIds = [...new Set([...memberUserIds, ownerUserId])];
        }
    }

    return idToString(workspace._id);
}

async function backfillWorkspaceIds() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/invoiceflow';
    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const users = db.collection('users');
    const workspaces = db.collection('workspaces');
    const businessProfiles = db.collection('businessprofiles');
    const clients = db.collection('clients');
    const invoices = db.collection('invoices');
    const payments = db.collection('payments');
    const invoiceCounters = db.collection('invoicecounters');

    const now = new Date();
    const summary = {
        workspacesCreated: 0,
        usersUpdated: 0,
        workspacesUpdated: 0,
        businessesUpdated: 0,
        clientsUpdated: 0,
        invoicesUpdated: 0,
        paymentsUpdated: 0,
        invoiceCountersUpdated: 0,
        unresolved: [],
    };

    const userDocs = await users.find({}).toArray();
    const workspaceIdByOwnerUserId = new Map();

    for (const user of userDocs) {
        const ownerUserId = idToString(user._id);
        const hadWorkspaceId = !missingWorkspaceId(user.workspaceId);
        const existingWorkspaceCount = await workspaces.countDocuments({ ownerUserId });
        const workspaceId = hadWorkspaceId
            ? String(user.workspaceId)
            : await ensureWorkspaceForOwner(workspaces, ownerUserId, user.createdAt, now);

        if (!hadWorkspaceId && existingWorkspaceCount === 0) {
            summary.workspacesCreated += 1;
        }

        workspaceIdByOwnerUserId.set(ownerUserId, workspaceId);

        const updates = {};
        if (!hadWorkspaceId) {
            updates.workspaceId = workspaceId;
        }
        if (!user.normalizedEmail && user.email) {
            updates.normalizedEmail = normalizeEmail(user.email);
        }
        if (!user.emailVerifiedAt) {
            updates.emailVerifiedAt = user.updatedAt || user.createdAt || now;
        }

        if (Object.keys(updates).length > 0) {
            updates.updatedAt = now;
            await users.updateOne({ _id: user._id }, { $set: updates });
            summary.usersUpdated += 1;
        }
    }

    const workspaceDocs = await workspaces.find({}).toArray();
    for (const workspace of workspaceDocs) {
        const ownerUserId = String(workspace.ownerUserId);
        const memberUserIds = Array.isArray(workspace.memberUserIds) ? workspace.memberUserIds.map(String) : [];

        if (!memberUserIds.includes(ownerUserId)) {
            await workspaces.updateOne(
                { _id: workspace._id },
                {
                    $set: {
                        memberUserIds: [...new Set([...memberUserIds, ownerUserId])],
                        updatedAt: now,
                    },
                }
            );
            summary.workspacesUpdated += 1;
        }
    }

    const businessDocs = await businessProfiles.find({}).toArray();
    const workspaceIdByBusinessId = new Map();

    for (const business of businessDocs) {
        const businessId = idToString(business._id);
        const ownerUserId = business.ownerUserId ? String(business.ownerUserId) : null;
        const inferredWorkspaceId = !missingWorkspaceId(business.workspaceId)
            ? String(business.workspaceId)
            : (ownerUserId ? workspaceIdByOwnerUserId.get(ownerUserId) : null);

        if (!inferredWorkspaceId) {
            summary.unresolved.push(`business:${businessId}`);
            continue;
        }

        workspaceIdByBusinessId.set(businessId, inferredWorkspaceId);

        if (missingWorkspaceId(business.workspaceId)) {
            await businessProfiles.updateOne(
                { _id: business._id },
                { $set: { workspaceId: inferredWorkspaceId, updatedAt: now } }
            );
            summary.businessesUpdated += 1;
        }
    }

    const clientDocs = await clients.find({}).toArray();
    const workspaceIdByClientId = new Map();

    for (const client of clientDocs) {
        const clientId = idToString(client._id);
        const businessId = idToString(client.businessId);
        const ownerUserId = client.ownerUserId ? String(client.ownerUserId) : null;
        const inferredWorkspaceId = !missingWorkspaceId(client.workspaceId)
            ? String(client.workspaceId)
            : workspaceIdByBusinessId.get(businessId) || (ownerUserId ? workspaceIdByOwnerUserId.get(ownerUserId) : null);

        if (!inferredWorkspaceId) {
            summary.unresolved.push(`client:${clientId}`);
            continue;
        }

        workspaceIdByClientId.set(clientId, inferredWorkspaceId);

        if (missingWorkspaceId(client.workspaceId)) {
            const updates = {
                workspaceId: inferredWorkspaceId,
                updatedAt: now,
            };
            if (!client.normalizedClientName) {
                updates.normalizedClientName = normalizeClientName(client.clientName);
            }
            if (!client.normalizedEmail && client.email) {
                updates.normalizedEmail = normalizeEmail(client.email);
            }
            await clients.updateOne(
                { _id: client._id },
                { $set: updates }
            );
            summary.clientsUpdated += 1;
        } else if (!client.normalizedClientName || !client.normalizedEmail) {
            const updates = {};
            if (!client.normalizedClientName) {
                updates.normalizedClientName = normalizeClientName(client.clientName);
            }
            if (!client.normalizedEmail && client.email) {
                updates.normalizedEmail = normalizeEmail(client.email);
            }
            if (Object.keys(updates).length > 0) {
                updates.updatedAt = now;
                await clients.updateOne({ _id: client._id }, { $set: updates });
                summary.clientsUpdated += 1;
            }
        }
    }

    const invoiceDocs = await invoices.find({}).toArray();
    const workspaceIdByInvoiceId = new Map();

    for (const invoice of invoiceDocs) {
        const invoiceId = idToString(invoice._id);
        const businessId = idToString(invoice.businessId);
        const clientId = idToString(invoice.clientId);
        const ownerUserId = invoice.ownerUserId ? String(invoice.ownerUserId) : null;
        const inferredWorkspaceId = !missingWorkspaceId(invoice.workspaceId)
            ? String(invoice.workspaceId)
            : workspaceIdByBusinessId.get(businessId)
                || workspaceIdByClientId.get(clientId)
                || (ownerUserId ? workspaceIdByOwnerUserId.get(ownerUserId) : null);

        if (!inferredWorkspaceId) {
            summary.unresolved.push(`invoice:${invoiceId}`);
            continue;
        }

        workspaceIdByInvoiceId.set(invoiceId, inferredWorkspaceId);

        const updates = {};
        if (missingWorkspaceId(invoice.workspaceId)) {
            updates.workspaceId = inferredWorkspaceId;
        }
        if (!invoice.submittedAt && invoice.issuedAt) {
            updates.submittedAt = invoice.issuedAt;
            updates.submittedBy = invoice.issuedBy || invoice.updatedBy || null;
        }

        if (Object.keys(updates).length > 0) {
            updates.updatedAt = now;
            await invoices.updateOne({ _id: invoice._id }, { $set: updates });
            summary.invoicesUpdated += 1;
        }
    }

    const paymentDocs = await payments.find({}).toArray();
    for (const payment of paymentDocs) {
        const paymentId = idToString(payment._id);
        const businessId = idToString(payment.businessId);
        const invoiceId = idToString(payment.invoiceId);
        const ownerUserId = payment.ownerUserId ? String(payment.ownerUserId) : null;
        const inferredWorkspaceId = !missingWorkspaceId(payment.workspaceId)
            ? String(payment.workspaceId)
            : workspaceIdByInvoiceId.get(invoiceId)
                || workspaceIdByBusinessId.get(businessId)
                || (ownerUserId ? workspaceIdByOwnerUserId.get(ownerUserId) : null);

        if (!inferredWorkspaceId) {
            summary.unresolved.push(`payment:${paymentId}`);
            continue;
        }

        if (missingWorkspaceId(payment.workspaceId)) {
            await payments.updateOne(
                { _id: payment._id },
                { $set: { workspaceId: inferredWorkspaceId, updatedAt: now } }
            );
            summary.paymentsUpdated += 1;
        }
    }

    const counterDocs = await invoiceCounters.find({}).toArray();
    for (const counter of counterDocs) {
        if (!missingWorkspaceId(counter.workspaceId)) {
            continue;
        }

        const businessId = idToString(counter.businessId);
        const inferredWorkspaceId = workspaceIdByBusinessId.get(businessId);

        if (!inferredWorkspaceId) {
            summary.unresolved.push(`invoiceCounter:${idToString(counter._id)}`);
            continue;
        }

        await invoiceCounters.updateOne(
            { _id: counter._id },
            {
                $set: { workspaceId: inferredWorkspaceId },
                $unset: { businessId: '' },
            }
        );
        summary.invoiceCountersUpdated += 1;
    }

    console.log('Workspace backfill complete.');
    console.log(JSON.stringify(summary, null, 2));
}

backfillWorkspaceIds()
    .catch((error) => {
        console.error('Failed to backfill workspace ids.', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
