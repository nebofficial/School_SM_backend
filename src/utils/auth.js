import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET. Create backend/.env from backend/.env.example');
  }
  return secret;
}

export function isBcryptHash(value) {
  return typeof value === 'string' && value.startsWith('$2');
}

export async function hashPassword(password) {
  const raw = String(password || '');
  if (!raw) return '';
  const saltRounds = Math.max(8, Math.min(14, parseInt(process.env.BCRYPT_ROUNDS, 10) || 12));
  return await bcrypt.hash(raw, saltRounds);
}

export async function verifyPassword({ candidatePassword, storedPassword }) {
  const candidate = String(candidatePassword || '');
  const stored = String(storedPassword || '');
  if (!candidate || !stored) return { ok: false, needsRehash: false };

  if (isBcryptHash(stored)) {
    const ok = await bcrypt.compare(candidate, stored);
    return { ok, needsRehash: false };
  }

  // Legacy plaintext storage fallback (upgrade on successful login)
  const ok = candidate === stored;
  return { ok, needsRehash: ok };
}

export function signAccessToken(payload) {
  const secret = requireJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token) {
  const secret = requireJwtSecret();
  return jwt.verify(token, secret);
}

