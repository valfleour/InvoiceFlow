import { User } from '../entities/User';

export interface UserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByEmailVerificationTokenHash(tokenHash: string): Promise<User | null>;
    findByResetPasswordTokenHash(tokenHash: string): Promise<User | null>;
    existsByEmail(email: string): Promise<boolean>;
    save(user: User): Promise<User>;
    update(user: User): Promise<User>;
}
