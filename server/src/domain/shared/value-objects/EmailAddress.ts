export class EmailAddress {
    public readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(email: string): EmailAddress {
        const trimmed = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            throw new Error(`Invalid email address: ${email}`);
        }
        return new EmailAddress(trimmed);
    }
}
