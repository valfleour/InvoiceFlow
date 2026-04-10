import { Address } from '../../shared/value-objects/Address';
import { EmailAddress } from '../../shared/value-objects/EmailAddress';
import { PhoneNumber } from '../../shared/value-objects/PhoneNumber';

export interface ClientProps {
    id?: string;
    workspaceId: string;
    ownerUserId: string;
    businessId: string;
    isActive?: boolean;
    clientName: string;
    companyName?: string;
    billingAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    email: string;
    phone?: string;
    taxId?: string;
    notes?: string;
    createdAt?: Date;
    createdBy?: string | null;
    updatedAt?: Date;
    updatedBy?: string | null;
    deletedAt?: Date | null;
    deletedBy?: string | null;
}

export class Client {
    public readonly id: string;
    public readonly workspaceId: string;
    public readonly ownerUserId: string;
    public readonly businessId: string;
    public isActive: boolean;
    public clientName: string;
    public companyName?: string;
    public billingAddress: ClientProps['billingAddress'];
    public email: string;
    public phone?: string;
    public taxId?: string;
    public notes?: string;
    public createdAt: Date;
    public createdBy?: string | null;
    public updatedAt: Date;
    public updatedBy?: string | null;
    public deletedAt?: Date | null;
    public deletedBy?: string | null;

    private constructor(props: ClientProps) {
        this.id = props.id ?? '';
        this.workspaceId = props.workspaceId;
        this.ownerUserId = props.ownerUserId;
        this.businessId = props.businessId;
        this.isActive = props.isActive ?? true;
        this.clientName = normalizeClientName(props.clientName);
        this.companyName = props.companyName;
        this.billingAddress = Address.create(props.billingAddress).toPlain();
        this.email = EmailAddress.create(props.email).value;
        this.phone = props.phone ? PhoneNumber.create(props.phone).value : undefined;
        this.taxId = normalizeOptionalTaxId(props.taxId);
        this.notes = props.notes;
        this.createdAt = props.createdAt ?? new Date();
        this.createdBy = props.createdBy ?? null;
        this.updatedAt = props.updatedAt ?? new Date();
        this.updatedBy = props.updatedBy ?? props.createdBy ?? null;
        this.deletedAt = props.deletedAt ?? null;
        this.deletedBy = props.deletedBy ?? null;
    }

    static create(props: ClientProps): Client {
        if (!props.workspaceId) {
            throw new Error('Client workspace is required');
        }
        if (!props.ownerUserId) {
            throw new Error('Client owner is required');
        }
        if (!props.businessId) {
            throw new Error('Client must belong to a business');
        }
        return new Client(props);
    }

    static reconstitute(props: ClientProps): Client {
        return new Client(props);
    }

    update(changes: Partial<Omit<ClientProps, 'id' | 'businessId' | 'createdAt' | 'createdBy' | 'deletedAt' | 'deletedBy'>>): void {
        if (changes.isActive !== undefined) this.isActive = changes.isActive;
        if (changes.clientName !== undefined) this.clientName = normalizeClientName(changes.clientName);
        if (changes.companyName !== undefined) this.companyName = changes.companyName;
        if (changes.billingAddress !== undefined) this.billingAddress = Address.create(changes.billingAddress).toPlain();
        if (changes.email !== undefined) this.email = EmailAddress.create(changes.email).value;
        if (changes.phone !== undefined) this.phone = changes.phone ? PhoneNumber.create(changes.phone).value : undefined;
        if (changes.taxId !== undefined) this.taxId = normalizeOptionalTaxId(changes.taxId);
        if (changes.notes !== undefined) this.notes = changes.notes;
        if (changes.updatedBy !== undefined) this.updatedBy = changes.updatedBy;
        this.updatedAt = new Date();
    }

    markDeleted(deletedBy?: string): void {
        this.deletedAt = new Date();
        this.deletedBy = deletedBy ?? null;
        this.updatedAt = this.deletedAt;
        this.updatedBy = deletedBy ?? this.updatedBy ?? null;
    }
}

export function normalizeClientName(name: string): string {
    const normalized = name.trim().replace(/\s+/g, ' ');

    if (!normalized) {
        throw new Error('Client name is required');
    }

    return normalized;
}

export function normalizeClientEmail(email: string): string {
    return EmailAddress.create(email).value;
}

function normalizeOptionalTaxId(taxId?: string): string | undefined {
    if (!taxId) {
        return undefined;
    }

    const normalized = taxId.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,32}$/.test(normalized)) {
        throw new Error('Client tax ID must be 3-32 characters using letters, numbers, or hyphens');
    }

    return normalized;
}
