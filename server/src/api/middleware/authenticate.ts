import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../../application/auth/AuthService';

export interface AuthenticatedRequest extends Request {
    auth: {
        userId: string;
        workspaceId: string;
        email: string;
        name: string;
        sessionToken: string;
    };
}

export function authenticate(authService: AuthService) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.header('authorization')?.trim();
        const sessionTokenHeader = req.header('x-session-token')?.trim();
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;
        const sessionToken = bearerToken || sessionTokenHeader || null;

        if (!sessionToken) {
            res.status(401).json({ error: 'Authentication is required' });
            return;
        }

        const user = await authService.getUserBySessionToken(sessionToken);

        if (!user) {
            res.status(401).json({ error: 'Authenticated session is invalid or expired' });
            return;
        }

        (req as AuthenticatedRequest).auth = {
            userId: user.id,
            workspaceId: user.workspaceId!,
            email: user.email,
            name: user.name,
            sessionToken,
        };

        next();
    };
}
