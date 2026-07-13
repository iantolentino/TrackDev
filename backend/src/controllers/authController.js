import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

export async function register(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name, role: 'USER' },
  });

  const token = signToken({ id: user.id, role: user.role });
  res.status(201).json({ token, user: sanitizeUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ id: user.id, role: user.role });
  res.json({ token, user: sanitizeUser(user) });
}
