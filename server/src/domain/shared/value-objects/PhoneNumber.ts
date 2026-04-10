export class PhoneNumber {
    public readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(phone: string): PhoneNumber {
        const trimmed = phone.trim();
        if (trimmed.length < 7) {
            throw new Error(`Invalid phone number: ${phone}`);
        }
        return new PhoneNumber(trimmed);
    }
}
