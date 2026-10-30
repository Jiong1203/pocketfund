// Password hashing with WebCrypto PBKDF2, which runs natively and fits the Workers CPU budget.
// Legacy bcrypt hashes (from the NestJS backend) are still accepted and flagged for rehashing.

const ALGORITHM = "pbkdf2-sha256";
// 100,000 is the maximum iteration count the Workers runtime allows for PBKDF2.
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

export interface PasswordCheck {
  valid: boolean;
  needsRehash: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derive(password, salt, ITERATIONS);
  return [ALGORITHM, ITERATIONS, toBase64(salt), toBase64(derived)].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<PasswordCheck> {
  if (stored.startsWith("$2")) {
    const { default: bcrypt } = await import("bcryptjs");
    const valid = await bcrypt.compare(password, stored);
    return { valid, needsRehash: valid };
  }

  const [algorithm, iterationsText, saltText, hashText] = stored.split("$");
  const iterations = Number(iterationsText);
  if (algorithm !== ALGORITHM || !Number.isInteger(iterations) || !saltText || !hashText) {
    return { valid: false, needsRehash: false };
  }

  const expected = fromBase64(hashText);
  const derived = await derive(password, fromBase64(saltText), iterations);
  const valid = timingSafeEqual(derived, expected);
  return { valid, needsRehash: valid && iterations !== ITERATIONS };
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits"
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}
