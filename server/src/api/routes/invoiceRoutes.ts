import { Request, Response, Router } from 'express';
import { BusinessProfileService } from '../../application/business-profile/BusinessProfileService';
import { ClientService } from '../../application/clients/ClientService';
import { InvoiceService } from '../../application/invoices/InvoiceService';
import { generateInvoicePdf, type InvoicePdfData } from '../../infrastructure/pdf/generateInvoicePdf';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
    CancelInvoiceSchema,
    CreateInvoiceSchema,
    RecordPaymentSchema,
    UpdateDraftInvoiceSchema,
    VoidInvoiceSchema,
} from '../validation/schemas';

export function invoiceRoutes(
    invoiceService: InvoiceService,
    businessProfileService: BusinessProfileService,
    clientService: ClientService
): Router {
    const router = Router();

    router.post('/', validate(CreateInvoiceSchema), async (req: Request, res: Response) => {
        const auth = (req as AuthenticatedRequest).auth;
        const idempotencyKeyHeader = req.header('Idempotency-Key') ?? req.header('x-idempotency-key');
        const snapshot = await invoiceService.createInvoice(auth.userId, {
            workspaceId: auth.workspaceId,
            ...req.body,
            createdBy: auth.userId,
            idempotencyKey: idempotencyKeyHeader?.trim() || undefined,
        });
        res.status(201).json(snapshot);
    });

    router.get('/', async (req: Request, res: Response) => {
        const businessId = req.query.businessId as string;
        if (!businessId) {
            res.status(400).json({ error: 'businessId query parameter is required' });
            return;
        }

        const invoices = await invoiceService.getInvoicesByBusiness((req as AuthenticatedRequest).auth.workspaceId, businessId);
        res.json(invoices);
    });

    router.get('/overdue', async (req: Request, res: Response) => {
        const businessId = req.query.businessId as string;
        if (!businessId) {
            res.status(400).json({ error: 'businessId query parameter is required' });
            return;
        }

        const invoices = await invoiceService.getOverdueInvoices((req as AuthenticatedRequest).auth.workspaceId, businessId);
        res.json(invoices);
    });

    router.get('/:id', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const snapshot = await invoiceService.getInvoice((req as AuthenticatedRequest).auth.workspaceId, id);
        if (!snapshot) {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        res.json(snapshot);
    });

    router.patch('/:id/draft', validate(UpdateDraftInvoiceSchema), async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const snapshot = await invoiceService.updateDraftInvoice((req as AuthenticatedRequest).auth.workspaceId, id, {
            ...req.body,
            updatedBy: (req as AuthenticatedRequest).auth.userId,
        });
        res.json(snapshot);
    });

    router.post('/:id/issue', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const snapshot = await invoiceService.issueInvoice((req as AuthenticatedRequest).auth.workspaceId, id, (req as AuthenticatedRequest).auth.userId);
        res.json(snapshot);
    });

    router.post('/:id/duplicate', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const snapshot = await invoiceService.duplicateInvoice((req as AuthenticatedRequest).auth.workspaceId, {
            sourceInvoiceId: id,
            duplicatedBy: (req as AuthenticatedRequest).auth.userId,
        });
        res.status(201).json(snapshot);
    });

    router.post('/:id/payments', validate(RecordPaymentSchema), async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const snapshot = await invoiceService.recordPayment((req as AuthenticatedRequest).auth.workspaceId, {
            ...req.body,
            invoiceId: id,
            createdBy: (req as AuthenticatedRequest).auth.userId,
        });
        res.json(snapshot);
    });

    router.get('/:id/payments', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const payments = await invoiceService.getPaymentsByInvoice((req as AuthenticatedRequest).auth.workspaceId, id);
        res.json(payments);
    });

    router.post('/:id/cancel', validate(CancelInvoiceSchema), async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const snapshot = await invoiceService.cancelInvoice((req as AuthenticatedRequest).auth.workspaceId, id, req.body.reason, (req as AuthenticatedRequest).auth.userId);
        res.json(snapshot);
    });

    router.post('/:id/void', validate(VoidInvoiceSchema), async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const snapshot = await invoiceService.voidInvoice((req as AuthenticatedRequest).auth.workspaceId, {
            invoiceId: id,
            reason: req.body.reason,
            voidedBy: (req as AuthenticatedRequest).auth.userId,
        });
        res.json(snapshot);
    });

    router.delete('/:id', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await invoiceService.deleteInvoice((req as AuthenticatedRequest).auth.workspaceId, id, (req as AuthenticatedRequest).auth.userId);
        res.status(204).send();
    });

    router.get('/:id/pdf', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const snapshot = await invoiceService.getInvoice((req as AuthenticatedRequest).auth.workspaceId, id);
        if (!snapshot) {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        const businessSnapshot = snapshot.issueSnapshot?.issuer;
        const clientSnapshot = snapshot.issueSnapshot?.client;

        const business = businessSnapshot ?? await businessProfileService.getProfile((req as AuthenticatedRequest).auth.workspaceId, snapshot.businessId);
        if (!business) {
            res.status(400).json({ error: 'Business profile not found for invoice' });
            return;
        }

        const client = clientSnapshot ?? await clientService.getClient((req as AuthenticatedRequest).auth.workspaceId, snapshot.clientId);
        if (!client) {
            res.status(400).json({ error: 'Client not found for invoice' });
            return;
        }

        const pdfData: InvoicePdfData = {
            invoiceNumber: snapshot.invoiceNumber,
            invoiceDate: snapshot.invoiceDate,
            dueDate: snapshot.dueDate,
            status: snapshot.status,
            currency: snapshot.currency,
            business: {
                businessName: business.businessName,
                address: business.address,
                email: business.email,
                phone: business.phone,
                taxId: business.taxId,
                paymentInstructions: business.paymentInstructions,
            },
            client: {
                clientName: client.clientName,
                companyName: client.companyName,
                billingAddress: client.billingAddress,
                email: client.email,
            },
            lineItems: snapshot.lineItems,
            subtotal: snapshot.subtotal,
            discountTotal: snapshot.discountTotal,
            taxTotal: snapshot.taxTotal,
            extraFees: snapshot.extraFees,
            grandTotal: snapshot.grandTotal,
            amountPaid: snapshot.amountPaid,
            balanceDue: snapshot.balanceDue,
            notes: snapshot.notes,
            terms: snapshot.terms,
        };

        const stream = generateInvoicePdf(pdfData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${snapshot.invoiceNumber}.pdf"`);
        stream.pipe(res);
    });

    return router;
}
