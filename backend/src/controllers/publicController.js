import prisma from '../config/database.js';
import { notifyAdminsOfNewTicket } from '../services/emailService.js';
import { logActivity } from '../services/activityService.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDueDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

// Always returns the same generic success response, whether or not a ticket was
// actually created — a blocked sender's submission is silently dropped rather than
// rejected, so they get no signal that they've been identified. See decision log.
export async function createPublicTicket(req, res) {
  const { name, email, title, description, category, dueDate } = req.body;

  if (!name || !email || !title || !description || !category) {
    return res.status(400).json({ error: 'name, email, title, description, and category are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  const parsedDueDate = parseDueDate(dueDate);
  if (parsedDueDate === undefined) {
    return res.status(400).json({ error: 'Invalid dueDate' });
  }

  const blocked = await prisma.blockedEmail.findUnique({ where: { email } });
  if (blocked) {
    return res.status(201).json({ success: true });
  }

  const data = {
    title,
    description,
    category,
    dueDate: parsedDueDate,
    status: 'PENDING',
    requesterName: name,
    requesterEmail: email,
  };

  if (req.files?.length) {
    data.attachments = {
      create: req.files.map((f) => ({
        filename: f.originalname,
        path: `/uploads/${f.filename}`,
      })),
    };
  }

  const ticket = await prisma.ticket.create({ data });
  await logActivity({ ticketId: ticket.id, actorId: null, action: 'CREATED' });
  await notifyAdminsOfNewTicket(ticket);

  res.status(201).json({ success: true });
}

// Public, unauthenticated status lookup — scoped strictly to the exact requesterEmail
// match, so a caller can only ever see their own submissions, never anyone else's.
export async function getPublicTicketsByEmail(req, res) {
  const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  const tickets = await prisma.ticket.findMany({
    where: { requesterEmail: email },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      dueDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(tickets);
}
