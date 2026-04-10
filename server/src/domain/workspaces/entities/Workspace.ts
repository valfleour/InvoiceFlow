export interface WorkspaceProps {
    id?: string;
    ownerUserId: string;
    memberUserIds?: string[];
    defaultCurrency?: string;
    invoiceNumbering?: {
        submittedPrefix: string;
        draftPrefix: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export class Workspace {
    public readonly id: string;
    public ownerUserId: string;
    public memberUserIds: string[];
    public defaultCurrency: string;
    public invoiceNumbering: {
        submittedPrefix: string;
        draftPrefix: string;
    };
    public createdAt: Date;
    public updatedAt: Date;

    private constructor(props: WorkspaceProps) {
        const normalizedOwnerUserId = props.ownerUserId.trim();
        const normalizedMemberUserIds = normalizeMemberUserIds(props.memberUserIds, normalizedOwnerUserId);

        this.id = props.id ?? '';
        this.ownerUserId = normalizedOwnerUserId;
        this.memberUserIds = normalizedMemberUserIds;
        this.defaultCurrency = props.defaultCurrency ?? 'USD';
        this.invoiceNumbering = props.invoiceNumbering ?? {
            submittedPrefix: 'INV',
            draftPrefix: 'DRAFT',
        };
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? this.createdAt;
    }

    static create(props: WorkspaceProps): Workspace {
        if (!props.ownerUserId || !props.ownerUserId.trim()) {
            throw new Error('Workspace owner is required');
        }

        return new Workspace(props);
    }

    static reconstitute(props: WorkspaceProps): Workspace {
        return new Workspace(props);
    }
}

function normalizeMemberUserIds(memberUserIds: string[] | undefined, ownerUserId: string): string[] {
    const normalizedIds = new Set<string>();

    for (const memberUserId of memberUserIds ?? []) {
        const normalizedMemberUserId = memberUserId.trim();
        if (normalizedMemberUserId) {
            normalizedIds.add(normalizedMemberUserId);
        }
    }

    normalizedIds.add(ownerUserId);
    return [...normalizedIds];
}
