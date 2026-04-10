const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export class PasswordPolicy {
    static assertValidPlainText(password: string): void {
        if (password.length < MIN_PASSWORD_LENGTH) {
            throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
        }
        if (password.length > MAX_PASSWORD_LENGTH) {
            throw new Error(`Password must be at most ${MAX_PASSWORD_LENGTH} characters long`);
        }
        if (!/[a-z]/.test(password)) {
            throw new Error('Password must include at least one lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            throw new Error('Password must include at least one uppercase letter');
        }
        if (!/\d/.test(password)) {
            throw new Error('Password must include at least one number');
        }
    }
}
