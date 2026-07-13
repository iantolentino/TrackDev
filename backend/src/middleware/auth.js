import { verifyToken as verifyJwt } from '../utils/jwt.js';
import prisma from '../config/database.js';

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const decoded = verifyJwt(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function isAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function isAdminOrDev(req, res, next) {
  if (req.user?.role !== 'ADMIN' && req.user?.role !== 'DEVELOPER') {
    return res.status(403).json({ error: 'Admin or developer access required' });
  }
  next();
}
