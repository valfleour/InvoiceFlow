import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error('[Error]', err.message);

    const databaseError = err as Error & {
        code?: number;
        name?: string;
        keyValue?: Record<string, unknown>;
    };

    if (databaseError.code === 11000) {
        const duplicateFields = Object.keys(databaseError.keyValue ?? {});
        const duplicateDescription = duplicateFields.length > 0
            ? duplicateFields.join(', ')
            : 'unique field';
        res.status(409).json({ error: `Duplicate value for ${duplicateDescription}` });
        return;
    }

    if (databaseError.name === 'ValidationError') {
        res.status(400).json({ error: err.message });
        return;
    }

    if (err.message.includes('Too many sign in attempts')) {
        res.status(429).json({ error: err.message });
        return;
    }

    // Domain / business rule errors
    if (
        err.message.includes('not found') ||
        err.message.includes('Cannot') ||
        err.message.includes('Only') ||
        err.message.includes('already') ||
        err.message.includes('ready') ||
        err.message.includes('configured') ||
        err.message.includes('must') ||
        err.message.includes('required') ||
        err.message.includes('invalid')
    ) {
        res.status(400).json({ error: err.message });
        return;
    }

    res.status(500).json({ error: 'Internal server error' });
}
