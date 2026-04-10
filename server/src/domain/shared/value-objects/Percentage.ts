export class Percentage {
    public readonly value: number;

    private constructor(value: number) {
        this.value = value;
    }

    /** Create a Percentage (0-100 range) */
    static create(value: number): Percentage {
        if (value < 0 || value > 100) {
            throw new Error(`Percentage must be between 0 and 100, got ${value}`);
        }
        return new Percentage(value);
    }

    /** Returns the decimal multiplier (e.g., 10% → 0.10) */
    toDecimal(): number {
        return this.value / 100;
    }
}
