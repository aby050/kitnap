import * as Crypto from 'expo-crypto';

/**
 * The alphabet a guardian code is drawn from.
 *
 * Deliberately not the full 36: `O/0`, `I/1/l`, `S/5`, `B/8`, `Z/2` are the
 * pairs people mistype when reading a code off a screenshot, and a code that
 * fails three times because of a glyph is a code the user gives up on. What
 * is left is unambiguous in every common font.
 */
const CODE_ALPHABET = 'ACDEFGHJKMNPQRTUVWXY34679';

/** Eight characters from a 25-symbol alphabet is ~37 bits — about 1.5 trillion
 *  possibilities. Guessing is not the threat model (there is no remote attack
 *  surface, and the owner can always spend bailouts instead), but it has to be
 *  well past "I'll just try a few". */
const CODE_LENGTH = 8;

/**
 * A code, generated on-device, shown exactly once.
 *
 * Alphanumeric rather than six digits: this is now the *only* key to the
 * feature, so it has to be something the owner cannot idly reconstruct from
 * memory of a short number, and something a guardian can read out loud
 * without ambiguity.
 *
 * It never leaves the phone except in the message the user themselves sends
 * via the OS share sheet — Phonewise has no backend, so there is nothing to
 * deliver it and nothing that could leak it in transit.
 *
 * Rejection sampling on the random bytes, not `% length`: the modulo of a
 * 0–255 byte over 25 symbols favours the first six of them, which quietly
 * costs entropy for no reason.
 */
export async function generateGuardianCode(): Promise<string> {
  const out: string[] = [];
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  while (out.length < CODE_LENGTH) {
    const bytes = await Crypto.getRandomBytesAsync(CODE_LENGTH);
    for (const b of bytes) {
      if (out.length >= CODE_LENGTH) break;
      if (b >= limit) continue; // Would bias the draw — take another byte.
      out.push(CODE_ALPHABET[b % CODE_ALPHABET.length]);
    }
  }
  return out.join('');
}

/** Codes are stored and compared upper-cased and stripped of spaces, so a
 *  guardian reading one out and a user typing it back can disagree about case
 *  or spacing without it mattering. */
export function normalizeGuardianCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase();
}

/** Only the salted hash is persisted, never the code itself — the same
 *  reasoning as a password, even though the threat model here is "don't leave
 *  it sitting in plaintext on the phone" rather than a real attacker. */
export async function hashGuardianCode(code: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${normalizeGuardianCode(code)}`,
  );
}

export async function verifyGuardianCode(
  code: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const hash = await hashGuardianCode(code, salt);
  return hash === expectedHash;
}

export async function newSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
