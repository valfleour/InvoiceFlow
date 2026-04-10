import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const details = result.error.issues.reduce<Record<string, string[]>>((acc, issue) => {
                const path = issue.path.length > 0 ? issue.path.join('.') : 'form';
                acc[path] = [...(acc[path] ?? []), issue.message];
                return acc;
            }, {});

            res.status(400).json({
                error: 'Validation failed',
                details,
            });
            return;
        }
        req.body = result.data;
        next();
    };
}
