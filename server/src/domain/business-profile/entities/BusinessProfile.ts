import { Address } from '../../shared/value-objects/Address';
import { EmailAddress } from '../../shared/value-objects/EmailAddress';
import { PhoneNumber } from '../../shared/value-objects/PhoneNumber';

export interface BusinessProfileProps {
    id?: string;
    workspaceId: string;
    ownerUserId: string;
    isActive?: boolean;
    businessName: string;
    logoUrl?: string;
    address: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    email: string;
    phone: string;
    website?: string;
    taxId?: string;
    defaultCurrency: string;
    paymentInstructions?: string;
    createdAt?: Date;
    createdBy?: string | null;
    updatedAt?: Date;
    updatedBy?: string | null;
    deletedAt?: Date | null;
    deletedBy?: string | null;
}

export class BusinessProfile {
    public readonly id: string;
    public readonly workspaceId: string;
    public readonly ownerUserId: string;
    public isActive: boolean;
    public businessName: string;
    public logoUrl?: string;
    public address: BusinessProfileProps['address'];
    public email: string;
    public phone: string;
    public website?: string;
    public taxId?: string;
    public defaultCurrency: string;
    public paymentInstructions?: string;
    public createdAt: Date;
    public createdBy?: string | null;
    public updatedAt: Date;
    public updatedBy?: string | null;
    public deletedAt?: Date | null;
    public deletedBy?: string | null;

    private constructor(props: BusinessProfileProps) {
        this.id = props.id ?? '';
        this.workspaceId = props.workspaceId;
        this.ownerUserId = props.ownerUserId;
        this.isActive = props.isActive ?? false;
        this.businessName = normalizeBusinessName(props.businessName);
        this.logoUrl = props.logoUrl;
        this.address = Address.create(props.address).toPlain();
        this.email = EmailAddress.create(props.email).value;
        this.phone = PhoneNumber.create(props.phone).value;
        this.website = props.website;
        this.taxId = normalizeOptionalTaxId(props.taxId);
        this.defaultCurrency = props.defaultCurrency;
        this.paymentInstructions = props.paymentInstructions;
        this.createdAt = props.createdAt ?? new Date();
        this.createdBy = props.createdBy ?? null;
        this.updatedAt = props.updatedAt ?? new Date();
        this.updatedBy = props.updatedBy ?? props.createdBy ?? null;
        this.deletedAt = props.deletedAt ?? null;
        this.deletedBy = props.deletedBy ?? null;
    }

    static create(props: BusinessProfileProps): BusinessProfile {
        if (!props.workspaceId) {
            throw new Error('Business profile workspace is required');
        }
        if (!props.ownerUserId) {
            throw new Error('Business profile owner is required');
        }
        return new BusinessProfile(props);
    }

    static reconstitute(props: BusinessProfileProps): BusinessProfile {
        return new BusinessProfile(props);
    }

    update(changes: Partial<Omit<BusinessProfileProps, 'id' | 'createdAt' | 'createdBy' | 'deletedAt' | 'deletedBy'>>): void {
        if (changes.isActive !== undefined) this.isActive = changes.isActive;
        if (changes.businessName !== undefined) this.businessName = normalizeBusinessName(changes.businessName);
        if (changes.logoUrl !== undefined) this.logoUrl = changes.logoUrl;
        if (changes.address !== undefined) this.address = Address.create(changes.address).toPlain();
        if (changes.email !== undefined) this.email = EmailAddress.create(changes.email).value;
        if (changes.phone !== undefined) this.phone = PhoneNumber.create(changes.phone).value;
        if (changes.website !== undefined) this.website = changes.website;
        if (changes.taxId !== undefined) this.taxId = normalizeOptionalTaxId(changes.taxId);
        if (changes.defaultCurrency !== undefined) this.defaultCurrency = changes.defaultCurrency;
        if (changes.paymentInstructions !== undefined) this.paymentInstructions = changes.paymentInstructions;
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

function normalizeBusinessName(name: string): string {
    const normalized = name.trim().replace(/\s+/g, ' ');

    if (!normalized) {
        throw new Error('Business name is required');
    }

    return normalized;
}

function normalizeOptionalTaxId(taxId?: string): string | undefined {
    if (!taxId) {
        return undefined;
    }

    const normalized = taxId.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,32}$/.test(normalized)) {
        throw new Error('Business tax ID must be 3-32 characters using letters, numbers, or hyphens');
    }

    return normalized;
}
