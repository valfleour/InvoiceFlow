import { Router, Request, Response } from 'express';
import { BusinessProfileService } from '../../application/business-profile/BusinessProfileService';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
    CreateBusinessProfileSchema,
    UpdateBusinessProfileSchema,
} from '../validation/schemas';

export function businessProfileRoutes(service: BusinessProfileService): Router {
    const router = Router();

    router.post('/', validate(CreateBusinessProfileSchema), async (req: Request, res: Response) => {
        const auth = (req as AuthenticatedRequest).auth;
        const profile = await service.createProfile(auth.userId, auth.workspaceId, {
            ...req.body,
            createdBy: auth.userId,
            updatedBy: auth.userId,
        });
        res.status(201).json(profile);
    });

    router.get('/', async (req: Request, res: Response) => {
        const profiles = await service.getAllProfiles((req as AuthenticatedRequest).auth.workspaceId);
        res.json(profiles);
    });

    router.get('/:id', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const profile = await service.getProfile((req as AuthenticatedRequest).auth.workspaceId, id);
        if (!profile) {
            res.status(404).json({ error: 'Business profile not found' });
            return;
        }
        res.json(profile);
    });

    router.put('/:id', validate(UpdateBusinessProfileSchema), async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const profile = await service.updateProfile((req as AuthenticatedRequest).auth.workspaceId, id, {
            ...req.body,
            updatedBy: (req as AuthenticatedRequest).auth.userId,
        });
        res.json(profile);
    });

    router.delete('/:id', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        await service.deleteProfile((req as AuthenticatedRequest).auth.workspaceId, id, (req as AuthenticatedRequest).auth.userId);
        res.status(204).send();
    });

    return router;
}
