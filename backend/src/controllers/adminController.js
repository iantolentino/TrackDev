import prisma from '../config/database.js';

const ROLES = ['USER', 'DEVELOPER', 'ADMIN'];
const USER_SELECT = { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true };

export async function getUsers(req, res) {
  const users = await prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
}

export async function updateUserRole(req, res) {
  const { role } = req.body;
  if (!role || !ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(', ')}` });
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.role === 'ADMIN' && role !== 'ADMIN') {
    const otherAdmins = await prisma.user.count({
      where: { role: 'ADMIN', id: { not: user.id } },
    });
    if (otherAdmins === 0) {
      return res.status(400).json({ error: 'Cannot remove the last remaining admin' });
    }
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: USER_SELECT,
  });

  res.json(updated);
}

export async function getBlockedEmails(req, res) {
  const entries = await prisma.blockedEmail.findMany({
    include: { blockedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(entries);
}

export async function addBlockedEmail(req, res) {
  const { email, reason } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const existing = await prisma.blockedEmail.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'That email is already blocked' });
  }

  const entry = await prisma.blockedEmail.create({
    data: { email, reason: reason || null, blockedById: req.user.id },
    include: { blockedBy: { select: { id: true, name: true } } },
  });
  res.status(201).json(entry);
}

export async function removeBlockedEmail(req, res) {
  const entry = await prisma.blockedEmail.findUnique({ where: { id: req.params.id } });
  if (!entry) {
    return res.status(404).json({ error: 'Blocked email entry not found' });
  }
  await prisma.blockedEmail.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
