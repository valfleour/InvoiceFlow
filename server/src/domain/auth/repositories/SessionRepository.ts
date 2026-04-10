export interface SessionRecord {
    id: string;
    userId: string;
    workspaceId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface SessionRepository {
    create(props: {
        userId: string;
        workspaceId: string;
        tokenHash: string;
        expiresAt: Date;
    }): Promise<SessionRecord>;
    findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
    revokeByTokenHash(tokenHash: string): Promise<void>;
}
