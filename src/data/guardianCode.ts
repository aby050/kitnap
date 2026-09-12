import * as Crypto from 'expo-crypto';

/** A 6-digit code, generated on-device. Never leaves the phone except in the
 *  message the user themselves sends via the OS share sheet — Byre has no
 *  backend, so there is nothing to deliver it and nothing that could leak it
 *  in transit. */
export async function generateGuardianCode(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(4);
  const n = new Uint32Array(bytes.buffer)[0] % 1_000_000;
  return String(n).padStart(6, '0');
}

/** Only the salted hash is persisted, never the code itself — the same
 *  reasoning as a password, even though the threat model here is "don't leave
 *  it sitting in plaintext on the phone" rather than a real attacker. */
export async function hashGuardianCode(code: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${code}`);
}

export async function verifyGuardianCode(
  code: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const hash = await hashGuardianCode(code.trim(), salt);
  return hash === expectedHash;
}

export async function newSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
