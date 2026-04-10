interface SignInAttemptState {
    failureCount: number;
    firstFailureAt: number;
    blockedUntil?: number;
}

export class SignInThrottle {
    private readonly attempts = new Map<string, SignInAttemptState>();

    constructor(
        private readonly maxFailures = 5,
        private readonly windowMs = 1000 * 60 * 15,
        private readonly blockMs = 1000 * 60 * 15,
        private readonly now: () => number = () => Date.now()
    ) { }

    assertCanAttempt(email: string, ipAddress?: string) {
        const key = createAttemptKey(email, ipAddress);
        const entry = this.attempts.get(key);

        if (!entry) {
            return;
        }

        const currentTime = this.now();
        if (entry.blockedUntil && entry.blockedUntil > currentTime) {
            throw new Error('Too many sign in attempts. Please wait before trying again.');
        }

        if (entry.blockedUntil && entry.blockedUntil <= currentTime) {
            this.attempts.delete(key);
        }
    }

    recordFailure(email: string, ipAddress?: string) {
        const key = createAttemptKey(email, ipAddress);
        const currentTime = this.now();
        const existing = this.attempts.get(key);

        if (!existing || currentTime - existing.firstFailureAt > this.windowMs) {
            this.attempts.set(key, {
                failureCount: 1,
                firstFailureAt: currentTime,
            });
            return;
        }

        const nextFailureCount = existing.failureCount + 1;
        this.attempts.set(key, {
            failureCount: nextFailureCount,
            firstFailureAt: existing.firstFailureAt,
            blockedUntil: nextFailureCount >= this.maxFailures ? currentTime + this.blockMs : existing.blockedUntil,
        });
    }

    recordSuccess(email: string, ipAddress?: string) {
        this.attempts.delete(createAttemptKey(email, ipAddress));
    }
}

function createAttemptKey(email: string, ipAddress?: string) {
    return `${email.trim().toLowerCase()}::${ipAddress?.trim() || 'unknown'}`;
}
