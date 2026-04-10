import { Router, Request, Response } from 'express';
import { ClientService } from '../../application/clients/ClientService';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { CreateClientSchema, UpdateClientSchema } from '../validation/schemas';

export function clientRoutes(service: ClientService): Router {
    const router = Router();

    router.post('/', validate(CreateClientSchema), async (req: Request, res: Response) => {
        const auth = (req as AuthenticatedRequest).auth;
        const client = await service.createClient(auth.userId, auth.workspaceId, {
            ...req.body,
            createdBy: auth.userId,
            updatedBy: auth.userId,
        });
        res.status(201).json(client);
    });

    router.get('/', async (req: Request, res: Response) => {
        const businessId = req.query.businessId as string;
        if (!businessId) {
            res.status(400).json({ error: 'businessId query parameter is required' });
            return;
        }
        const clients = await service.getClientsByBusiness((req as AuthenticatedRequest).auth.workspaceId, businessId);
        res.json(clients);
    });

    router.get('/:id', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const client = await service.getClient((req as AuthenticatedRequest).auth.workspaceId, id);
        if (!client) {
            res.status(404).json({ error: 'Client not found' });
            return;
        }
        res.json(client);
    });

    router.put('/:id', validate(UpdateClientSchema), async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const client = await service.updateClient((req as AuthenticatedRequest).auth.workspaceId, id, {
            ...req.body,
            updatedBy: (req as AuthenticatedRequest).auth.userId,
        });
        res.json(client);
    });

    router.delete('/:id', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await service.deleteClient((req as AuthenticatedRequest).auth.workspaceId, id, (req as AuthenticatedRequest).auth.userId);
        res.status(204).send();
    });

    return router;
}
