import prisma from '../config/database.js';
import {
  notifyRequesterOfStatusChange,
  notifyRequesterOfDecision,
} from '../services/emailService.js';
import { logActivity } from '../services/activityService.js';

const STATUSES = ['PENDING', 'BACKLOG', 'TODO', 'IN_PROGRESS', 'AWAITING_INFO', 'COMPLETE', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const CLIENT_LOCKED_FIELDS = ['title', 'description', 'category', 'dueDate'];

const TICKET_INCLUDE = {
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
  attachments: true,
};

function parseDueDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function isStaff(user) {
  return user.role === 'ADMIN' || user.role === 'DEVELOPER';
}

async function setStatus(id, status) {
  return prisma.ticket.update({
    where: { id },
    data: { status },
    include: TICKET_INCLUDE,
  });
}

export async function getAssignableUsers(req, res) {
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEVELOPER'] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}

export async function getTickets(req, res) {
  const { status, priority, category, search } = req.query;
  const where = {};

  if (status) {
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status filter: ${status}` });
    }
    if (status === 'BACKLOG' && !isStaff(req.user)) {
      return res.status(403).json({ error: 'Backlog is staff-only' });
    }
    where.status = status;
  } else if (!isStaff(req.user)) {
    where.status = { not: 'BACKLOG' };
  }

  if (priority) {
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority filter: ${priority}` });
    }
    where.priority = priority;
  }

  if (category) where.category = category;
  if (search) where.title = { contains: search };

  const tickets = await prisma.ticket.findMany({
    where,
    include: TICKET_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  res.json(tickets);
}

export async function getTicketById(req, res) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: TICKET_INCLUDE,
  });

  if (!ticket || (ticket.status === 'BACKLOG' && !isStaff(req.user))) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  res.json(ticket);
}

// Staff-only "Quick Add" — public submissions go through publicController.createPublicTicket
// instead, which lands in PENDING for review rather than being added directly.
export async function createTicket(req, res) {
  const { title, description, category, dueDate, priority, status, assignedToId } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'title, description, and category are required' });
  }

  const parsedDueDate = parseDueDate(dueDate);
  if (parsedDueDate === undefined) {
    return res.status(400).json({ error: 'Invalid dueDate' });
  }

  const data = {
    title,
    description,
    category,
    dueDate: parsedDueDate,
    createdById: req.user.id,
  };

  if (req.files?.length) {
    data.attachments = {
      create: req.files.map((f) => ({
        filename: f.originalname,
        path: `/uploads/${f.filename}`,
      })),
    };
  }

  if (priority) {
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority: ${priority}` });
    }
    data.priority = priority;
  }
  if (status) {
    if (!STATUSES.includes(status) || status === 'PENDING') {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }
    data.status = status;
  } else {
    data.status = 'BACKLOG';
  }
  if (assignedToId) data.assignedToId = assignedToId;

  const ticket = await prisma.ticket.create({ data, include: TICKET_INCLUDE });
  await logActivity({ ticketId: ticket.id, actorId: req.user.id, action: 'CREATED' });

  res.status(201).json(ticket);
}

export async function updateTicket(req, res) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: { createdBy: { select: { role: true } } },
  });
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const body = req.body;
  // No creator (public submission) or a legacy USER-role account — either way, the
  // original request content is locked, same rationale as before the account model changed.
  const isClientSourced = !ticket.createdBy || ticket.createdBy.role === 'USER';

  if (isClientSourced) {
    const lockedFieldsUsed = CLIENT_LOCKED_FIELDS.filter((f) => body[f] !== undefined);
    if (lockedFieldsUsed.length > 0) {
      return res.status(403).json({
        error: `Cannot edit client-submitted fields: ${lockedFieldsUsed.join(', ')}. Only priority and assignee may be changed here (use the status endpoint for status).`,
      });
    }
  }

  const data = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.category !== undefined) data.category = body.category;
  if (body.dueDate !== undefined) {
    const parsedDueDate = parseDueDate(body.dueDate);
    if (parsedDueDate === undefined) {
      return res.status(400).json({ error: 'Invalid dueDate' });
    }
    data.dueDate = parsedDueDate;
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return res.status(400).json({ error: `Invalid priority: ${body.priority}` });
    }
    data.priority = body.priority;
  }
  if (body.assignedToId !== undefined) {
    data.assignedToId = body.assignedToId || null;
  }

  const activityEntries = [];
  if (data.priority !== undefined && data.priority !== ticket.priority) {
    activityEntries.push({ action: 'PRIORITY_CHANGED', detail: `${ticket.priority} → ${data.priority}` });
  }
  if ('assignedToId' in data && data.assignedToId !== ticket.assignedToId) {
    if (data.assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId }, select: { name: true } });
      activityEntries.push({ action: 'ASSIGNED', detail: `Assigned to ${assignee?.name ?? 'someone'}` });
    } else {
      activityEntries.push({ action: 'UNASSIGNED', detail: null });
    }
  }
  const editedFields = ['title', 'description', 'category', 'dueDate'].filter((f) => data[f] !== undefined);
  if (editedFields.length > 0) {
    activityEntries.push({ action: 'UPDATED', detail: `Updated ${editedFields.join(', ')}` });
  }

  const updated = await prisma.ticket.update({
    where: { id: req.params.id },
    data,
    include: TICKET_INCLUDE,
  });

  for (const entry of activityEntries) {
    await logActivity({ ticketId: updated.id, actorId: req.user.id, ...entry });
  }

  res.json(updated);
}

export async function changeStatus(req, res) {
  const { status } = req.body;
  if (!status || !STATUSES.includes(status) || status === 'PENDING') {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.filter((s) => s !== 'PENDING').join(', ')}` });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  if (ticket.status === 'PENDING') {
    return res.status(400).json({ error: 'Pending tickets must be accepted or rejected, not moved directly' });
  }

  const updated = await setStatus(req.params.id, status);
  await logActivity({
    ticketId: updated.id,
    actorId: req.user.id,
    action: 'STATUS_CHANGED',
    detail: `${ticket.status} → ${status}`,
  });
  await notifyRequesterOfStatusChange(updated, status);
  res.json(updated);
}

export async function acceptTicket(req, res) {
  const { targetStatus } = req.body;
  if (!['TODO', 'BACKLOG'].includes(targetStatus)) {
    return res.status(400).json({ error: 'targetStatus must be TODO or BACKLOG' });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  if (ticket.status !== 'PENDING') {
    return res.status(409).json({ error: 'Only pending tickets can be accepted' });
  }

  const updated = await setStatus(req.params.id, targetStatus);
  await logActivity({
    ticketId: updated.id,
    actorId: req.user.id,
    action: 'STATUS_CHANGED',
    detail: `PENDING → ${targetStatus} (accepted)`,
  });
  await notifyRequesterOfDecision(updated, 'accepted');
  res.json(updated);
}

export async function rejectTicket(req, res) {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  if (ticket.status !== 'PENDING') {
    return res.status(409).json({ error: 'Only pending tickets can be rejected' });
  }

  const updated = await setStatus(req.params.id, 'CANCELLED');
  await logActivity({
    ticketId: updated.id,
    actorId: req.user.id,
    action: 'STATUS_CHANGED',
    detail: 'PENDING → CANCELLED (rejected)',
  });
  await notifyRequesterOfDecision(updated, 'rejected');
  res.json(updated);
}

export async function getTicketActivity(req, res) {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket || (ticket.status === 'BACKLOG' && !isStaff(req.user))) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const entries = await prisma.activityLog.findMany({
    where: { ticketId: req.params.id },
    include: { actor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json(entries);
}

export async function deleteTicket(req, res) {
  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  await prisma.ticket.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
