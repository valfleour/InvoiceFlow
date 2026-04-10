export interface PaymentProps {
    id?: string;
    workspaceId: string;
    ownerUserId: string;
    invoiceId: string;
    businessId: string;
    currency: string;
    paymentDate: Date;
    amount: number;       // dollar amount
    method: string;
    referenceNumber?: string;
    note?: string;
    createdAt?: Date;
    createdBy?: string | null;
    updatedAt?: Date;
    updatedBy?: string | null;
    deletedAt?: Date | null;
    deletedBy?: string | null;
}

export class Payment {
    public readonly id: string;
    public readonly workspaceId: string;
    public readonly ownerUserId: string;
    public readonly invoiceId: string;
    public readonly businessId: string;
    public readonly currency: string;
    public paymentDate: Date;
    public amount: number;
    public method: string;
    public referenceNumber?: string;
    public note?: string;
    public createdAt: Date;
    public createdBy?: string | null;
    public updatedAt: Date;
    public updatedBy?: string | null;
    public deletedAt?: Date | null;
    public deletedBy?: string | null;

    private constructor(props: PaymentProps) {
        this.id = props.id ?? '';
        this.workspaceId = props.workspaceId;
        this.ownerUserId = props.ownerUserId;
        this.invoiceId = props.invoiceId;
        this.businessId = props.businessId;
        this.currency = props.currency;
        this.paymentDate = props.paymentDate;
        this.amount = props.amount;
        this.method = props.method;
        this.referenceNumber = props.referenceNumber;
        this.note = props.note;
        this.createdAt = props.createdAt ?? new Date();
        this.createdBy = props.createdBy ?? null;
        this.updatedAt = props.updatedAt ?? this.createdAt;
        this.updatedBy = props.updatedBy ?? props.createdBy ?? null;
        this.deletedAt = props.deletedAt ?? null;
        this.deletedBy = props.deletedBy ?? null;
    }

    static create(props: PaymentProps): Payment {
        if (!props.workspaceId) throw new Error('Payment workspace is required');
        if (!props.ownerUserId) throw new Error('Payment owner is required');
        if (!props.invoiceId) throw new Error('Payment must reference an invoice');
        if (!props.businessId) throw new Error('Payment must reference a business');
        if (!props.currency) throw new Error('Payment currency is required');
        if (props.amount <= 0) throw new Error('Payment amount must be greater than zero');
        if (Number(props.amount.toFixed(2)) !== props.amount) {
            throw new Error('Payment amount must use no more than 2 decimal places');
        }
        if (!props.method || props.method.trim().length === 0) {
            throw new Error('Payment method is required');
        }
        if (!props.paymentDate) throw new Error('Payment date is required');
        return new Payment(props);
    }

    static reconstitute(props: PaymentProps): Payment {
        return new Payment(props);
    }
}
