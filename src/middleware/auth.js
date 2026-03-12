import { verifyAccessToken } from '../utils/auth.js';

function extractBearerToken(req) {
  const header = (req.headers && req.headers.authorization) || '';
  const [type, token] = header.split(' ');
  if (type && type.toLowerCase() === 'bearer' && token) return token.trim();
  return '';
}

export function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Missing Authorization: Bearer <token>' });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.type !== 'staff') {
    return res.status(403).json({ message: 'Staff access required' });
  }
  return next();
}

export function requireRole(...roles) {
  const allowed = new Set(roles.filter(Boolean));
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.type !== 'staff') {
      return res.status(403).json({ message: 'Staff access required' });
    }
    if (allowed.size && !allowed.has(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient role' });
    }
    return next();
  };
}

