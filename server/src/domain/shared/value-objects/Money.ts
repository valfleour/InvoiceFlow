/**
 * Money value object — decimal-safe representation for financial values.
 * Stores amounts as integer cents to avoid floating-point issues.
 */
export class Money {
    private constructor(
        public readonly cents: number,
        public readonly currency: string
    ) { }

    static fromAmount(amount: number, currency = 'USD'): Money {
        const cents = Math.round(amount * 100);
        return new Money(cents, currency);
    }

    static fromCents(cents: number, currency = 'USD'): Money {
        if (!Number.isInteger(cents)) {
            throw new Error('Cents must be an integer');
        }
        return new Money(cents, currency);
    }

    static zero(currency = 'USD'): Money {
        return new Money(0, currency);
    }

    toAmount(): number {
        return this.cents / 100;
    }

    add(other: Money): Money {
        this.assertSameCurrency(other);
        return new Money(this.cents + other.cents, this.currency);
    }

    subtract(other: Money): Money {
        this.assertSameCurrency(other);
        return new Money(this.cents - other.cents, this.currency);
    }

    multiply(factor: number): Money {
        return new Money(Math.round(this.cents * factor), this.currency);
    }

    isNegative(): boolean {
        return this.cents < 0;
    }

    isZero(): boolean {
        return this.cents === 0;
    }

    isPositive(): boolean {
        return this.cents > 0;
    }

    equals(other: Money): boolean {
        return this.cents === other.cents && this.currency === other.currency;
    }

    greaterThan(other: Money): boolean {
        this.assertSameCurrency(other);
        return this.cents > other.cents;
    }

    lessThan(other: Money): boolean {
        this.assertSameCurrency(other);
        return this.cents < other.cents;
    }

    private assertSameCurrency(other: Money): void {
        if (this.currency !== other.currency) {
            throw new Error(
                `Currency mismatch: ${this.currency} vs ${other.currency}`
            );
        }
    }
}
