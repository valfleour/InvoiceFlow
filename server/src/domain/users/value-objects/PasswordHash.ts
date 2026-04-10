const PASSWORD_HASH_REGEX = /^[a-f0-9]{32}:[a-f0-9]{128}$/i;

export class PasswordHash {
    public readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static create(passwordHash: string): PasswordHash {
        const normalized = passwordHash.trim();

        if (!PASSWORD_HASH_REGEX.test(normalized)) {
            throw new Error('User password hash must be a valid scrypt hash');
        }

        return new PasswordHash(normalized);
    }
}
