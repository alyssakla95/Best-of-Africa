const PASSWORD_ITERATIONS = 210_000;

function toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
    return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
    const material = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
        material,
        256,
    );
    return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derived = await derivePassword(password, salt, PASSWORD_ITERATIONS);
    return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`;
}

export async function verifyPassword(
    password: string,
    stored: string,
): Promise<{ valid: boolean; legacy: boolean }> {
    if (stored.startsWith('pbkdf2-sha256$')) {
        const [, iterationsText, saltText, hashText] = stored.split('$');
        const iterations = Number(iterationsText);
        if (!Number.isInteger(iterations) || iterations < 100_000 || !saltText || !hashText) {
            return { valid: false, legacy: false };
        }
        const expected = fromBase64(hashText);
        const actual = await derivePassword(password, fromBase64(saltText), iterations);
        if (expected.length !== actual.length) return { valid: false, legacy: false };
        let difference = 0;
        for (let index = 0; index < expected.length; index += 1) {
            difference |= expected[index] ^ actual[index];
        }
        return { valid: difference === 0, legacy: false };
    }

    // Legacy rows contain a 64-character hexadecimal SHA-256 digest.
    if (!/^[a-f0-9]{64}$/i.test(stored)) return { valid: false, legacy: false };
    const digest = new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)),
    );
    const actual = Array.from(digest).map(byte => byte.toString(16).padStart(2, '0')).join('');
    return { valid: actual === stored.toLowerCase(), legacy: true };
}
