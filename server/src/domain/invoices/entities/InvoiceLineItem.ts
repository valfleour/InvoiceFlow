import { Money } from '../../shared/value-objects/Money';

export interface InvoiceLineTaxProps {
    code: string;
    name?: string;
    ratePercent: number;
    calculationType?: 'Percentage';
}

export interface InvoiceLineItemProps {
    id: string;
    itemName: string;
    description?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;       // stored as dollar amount, converted to Money internally
    discountType?: 'Percentage';
    discountPercent: number;  // 0-100
    taxPercent?: number;      // compatibility field for simple rate entry
    taxes?: InvoiceLineTaxProps[];
    currency?: string;
}

export class InvoiceLineItem {
    public readonly id: string;
    public itemName: string;
    public description?: string;
    public unit?: string;
    public quantity: number;
    public unitPrice: Money;
    public discountType: 'Percentage';
    public discountPercent: number;
    public taxes: InvoiceLineTaxProps[];

    private constructor(props: InvoiceLineItemProps & { unitPriceMoney: Money }) {
        this.id = props.id;
        this.itemName = props.itemName;
        this.description = props.description;
        this.unit = props.unit;
        this.quantity = props.quantity;
        this.unitPrice = props.unitPriceMoney;
        this.discountType = props.discountType ?? 'Percentage';
        this.discountPercent = props.discountPercent;
        this.taxes = props.taxes ?? [];
    }

    static create(props: InvoiceLineItemProps): InvoiceLineItem {
        if (!props.itemName || props.itemName.trim().length === 0) {
            throw new Error('Line item name is required');
        }
        if (props.quantity <= 0) {
            throw new Error('Quantity must be greater than zero');
        }
        if (!hasAllowedScale(props.quantity, 3)) {
            throw new Error('Quantity must use no more than 3 decimal places');
        }
        if (props.unitPrice < 0) {
            throw new Error('Unit price cannot be negative');
        }
        if (!hasAllowedScale(props.unitPrice, 2)) {
            throw new Error('Unit price must use no more than 2 decimal places');
        }
        if ((props.discountType ?? 'Percentage') !== 'Percentage') {
            throw new Error('Only percentage discounts are supported');
        }
        if (props.discountPercent < 0 || props.discountPercent > 100) {
            throw new Error('Discount percent must be between 0 and 100');
        }
        if (!hasAllowedScale(props.discountPercent, 2)) {
            throw new Error('Discount percent must use no more than 2 decimal places');
        }

        const taxes = normalizeTaxes(props);
        for (const tax of taxes) {
            if (!tax.code || tax.code.trim().length === 0) {
                throw new Error('Tax code is required when a tax component is provided');
            }
            if (tax.ratePercent < 0 || tax.ratePercent > 100) {
                throw new Error('Tax percent must be between 0 and 100');
            }
            if ((tax.calculationType ?? 'Percentage') !== 'Percentage') {
                throw new Error('Only percentage taxes are supported');
            }
            if (!hasAllowedScale(tax.ratePercent, 2)) {
                throw new Error('Tax percent must use no more than 2 decimal places');
            }
        }

        const unitPriceMoney = Money.fromAmount(props.unitPrice, props.currency ?? 'USD');
        return new InvoiceLineItem({ ...props, taxes, unitPriceMoney });
    }

    static reconstitute(props: InvoiceLineItemProps): InvoiceLineItem {
        const unitPriceMoney = Money.fromAmount(props.unitPrice, props.currency ?? 'USD');
        return new InvoiceLineItem({ ...props, taxes: normalizeTaxes(props), unitPriceMoney });
    }

    get taxPercent(): number {
        return this.taxes.reduce((sum, tax) => sum + tax.ratePercent, 0);
    }

    /** Gross = quantity * unitPrice */
    get grossAmount(): Money {
        return this.unitPrice.multiply(this.quantity);
    }

    /** Discount amount on this line */
    get discountAmount(): Money {
        return this.grossAmount.multiply(this.discountPercent / 100);
    }

    /** Net after discount */
    get netAmount(): Money {
        return this.grossAmount.subtract(this.discountAmount);
    }

    /** Tax amount on the net */
    get taxAmount(): Money {
        return this.taxes.reduce(
            (sum, tax) => sum.add(this.netAmount.multiply(tax.ratePercent / 100)),
            Money.zero(this.unitPrice.currency)
        );
    }

    /** Line total = net + tax */
    get lineTotal(): Money {
        return this.netAmount.add(this.taxAmount);
    }

    /** Validate that the line does not produce a negative total */
    validate(): void {
        if (this.lineTotal.isNegative()) {
            throw new Error(
                `Line item "${this.itemName}" produces a negative total. Check discount and tax values.`
            );
        }
    }
}

function normalizeTaxes(props: InvoiceLineItemProps): InvoiceLineTaxProps[] {
    if (props.taxes && props.taxes.length > 0) {
        return props.taxes.map((tax) => ({
            code: tax.code,
            name: tax.name,
            ratePercent: tax.ratePercent,
            calculationType: tax.calculationType ?? 'Percentage',
        }));
    }

    const taxPercent = props.taxPercent ?? 0;
    if (taxPercent === 0) {
        return [];
    }

    return [
        {
            code: 'STANDARD',
            name: 'Standard Tax',
            ratePercent: taxPercent,
            calculationType: 'Percentage',
        },
    ];
}

function hasAllowedScale(value: number, maxScale: number): boolean {
    return Number.isFinite(value) && Number(value.toFixed(maxScale)) === value;
}
