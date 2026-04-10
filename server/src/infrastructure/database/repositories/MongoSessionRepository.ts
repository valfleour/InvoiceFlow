import { SessionRecord, SessionRepository } from '../../../domain/auth/repositories/SessionRepository';
import { SessionModel } from '../schemas/SessionSchema';

export class MongoSessionRepository implements SessionRepository {
    async create(props: {
        userId: string;
        workspaceId: string;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<SessionRecord> {
        const doc = await SessionModel.create(props);
        return this.toRecord(doc.toObject());
    }

    async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
        const doc = await SessionModel.findOne({ tokenHash }).lean();
        if (!doc) {
            return null;
        }

        return this.toRecord(doc);
    }

    async revokeByTokenHash(tokenHash: string): Promise<void> {
        await SessionModel.findOneAndUpdate(
            { tokenHash, revokedAt: null },
            { revokedAt: new Date() }
        );
    }

    private toRecord(doc: any): SessionRecord {
        return {
            id: doc._id.toString(),
            userId: doc.userId,
            workspaceId: doc.workspaceId,
            tokenHash: doc.tokenHash,
            expiresAt: new Date(doc.expiresAt),
            revokedAt: doc.revokedAt ? new Date(doc.revokedAt) : null,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
        };
    }
}
