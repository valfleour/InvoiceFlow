import { Request, Response, Router } from 'express';
import { AuthService } from '../../application/auth/AuthService';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
    ForgotPasswordSchema,
    RequestEmailVerificationSchema,
    ResetPasswordSchema,
    SignInSchema,
    SignUpSchema,
    UpdateProfileSchema,
    VerifyEmailSchema,
} from '../validation/schemas';

function toAuthPayload(user: { id: string; name: string; email: string; workspaceId: string | null; emailVerifiedAt?: Date | null; isEmailVerified?: () => boolean }) {
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            workspaceId: user.workspaceId,
            emailVerifiedAt: user.emailVerifiedAt ?? null,
            isEmailVerified: typeof user.isEmailVerified === 'function'
                ? user.isEmailVerified()
                : Boolean(user.emailVerifiedAt),
        },
    };
}

export function authRoutes(service: AuthService): Router {
    const router = Router();

    router.post('/signup', validate(SignUpSchema), async (req: Request, res: Response) => {
        const { user, emailVerificationStatus } = await service.register(req.body);
        const message = emailVerificationStatus === 'delivery_not_configured'
            ? 'Account created, but the verification email could not be sent because email delivery is not configured on the server. Configure SMTP, then resend the verification email.'
            : 'Account created. Verify your email before signing in.';
        res.status(201).json({
            ...toAuthPayload(user),
            verificationRequired: true,
            message,
        });
    });

    router.post('/signin', validate(SignInSchema), async (req: Request, res: Response) => {
        const result = await service.signIn(req.body, { ipAddress: req.ip });

        if (!result) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        res.json({
            ...toAuthPayload(result.user),
            session: {
                token: result.sessionToken,
                expiresAt: result.sessionExpiresAt,
            },
        });
    });

    router.post('/verify-email/request', validate(RequestEmailVerificationSchema), async (req: Request, res: Response) => {
        const status = await service.requestEmailVerification(req.body);
        const message = status === 'skipped_cooldown'
            ? 'If an unverified account exists for that email, wait about a minute before requesting another verification link.'
            : status === 'skipped_rate_limit'
                ? 'If an unverified account exists for that email, too many verification links were requested recently. Try again in about an hour.'
                : status === 'delivery_not_configured'
                    ? 'Verification email delivery is temporarily unavailable on the server. Check the SMTP configuration and provider logs, then try again.'
                    : 'If an unverified account exists for that email, a verification link has been sent.';
        res.json({
            status,
            message,
        });
    });

    router.post('/verify-email/confirm', validate(VerifyEmailSchema), async (req: Request, res: Response) => {
        await service.verifyEmail(req.body);
        res.json({
            message: 'Email verification successful. You can now sign in.',
        });
    });

    router.post('/forgot-password', validate(ForgotPasswordSchema), async (req: Request, res: Response) => {
        await service.requestPasswordReset(req.body);
        res.json({
            message: 'If an account exists for that email, a password reset link has been sent.',
        });
    });

    router.post('/reset-password', validate(ResetPasswordSchema), async (req: Request, res: Response) => {
        await service.resetPassword(req.body);
        res.json({
            message: 'Password reset successful. You can now sign in with your new password.',
        });
    });

    router.patch('/me', authenticate(service), validate(UpdateProfileSchema), async (req: Request, res: Response) => {
        const authenticatedRequest = req as AuthenticatedRequest;
        const user = await service.updateProfile(authenticatedRequest.auth.userId, req.body);
        res.json(toAuthPayload(user));
    });

    router.post('/signout', authenticate(service), async (req: Request, res: Response) => {
        const authenticatedRequest = req as AuthenticatedRequest;
        await service.signOut(authenticatedRequest.auth.sessionToken);
        res.status(204).send();
    });

    return router;
}
