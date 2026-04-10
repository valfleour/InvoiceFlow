import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, hash] = storedHash.split(':');

    if (!salt || !hash) {
        return false;
    }

    const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer;
    const storedKey = Buffer.from(hash, 'hex');

    if (storedKey.length !== derivedKey.length) {
        return false;
    }

    return timingSafeEqual(storedKey, derivedKey);
}
