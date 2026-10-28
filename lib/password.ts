import crypto from "crypto";

const KEY_LENGTH = 64;

/**
 * Hashes a plain text password with a random 16-byte salt using scrypt.
 * Returns format: "scrypt:<salt>:<hash>"
 */
export function hashPassword(password: string): string {
  if (!password || password.trim().length === 0) {
    throw new Error("Password cannot be empty");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a plain text password against a stored password hash.
 * Supports:
 * 1. "scrypt:<salt>:<derivedKey>" (Standard modern format)
 * 2. Constant-time comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!password || !storedHash) {
    return false;
  }

  // Modern scrypt format
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, originalHash] = parts;

    try {
      const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
      const originalBuffer = Buffer.from(originalHash, "hex");
      if (derivedKey.length !== originalBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(derivedKey, originalBuffer);
    } catch {
      return false;
    }
  }

  // If password was stored in plain text (legacy upgrade path)
  // Constant-time compare strings to prevent timing attacks
  const passBuf = Buffer.from(password);
  const storedBuf = Buffer.from(storedHash);
  if (passBuf.length === storedBuf.length && crypto.timingSafeEqual(passBuf, storedBuf)) {
    return true;
  }

  return false;
}
