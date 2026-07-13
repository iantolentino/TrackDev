import prisma from '../config/database.js';

const AUTHOR_SELECT = { id: true, name: true, email: true, role: true };

function isStaff(user) {
  return user.role === 'ADMIN' || user.role === 'DEVELOPER';
}

async function findVisibleTicket(ticketId, user) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return null;
  if (ticket.status === 'BACKLOG' && !isStaff(user)) return null;
  return ticket;
}

export async function getComments(req, res) {
  const ticket = await findVisibleTicket(req.params.ticketId, req.user);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const where = { ticketId: ticket.id };
  if (!isStaff(req.user)) {
    where.isInternal = false;
  }

  const comments = await prisma.comment.findMany({
    where,
    include: { author: { select: AUTHOR_SELECT } },
    orderBy: { createdAt: 'asc' },
  });

  res.json(comments);
}

export async function addComment(req, res) {
  const { content, isInternal } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }

  const ticket = await findVisibleTicket(req.params.ticketId, req.user);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      isInternal: isStaff(req.user) ? Boolean(isInternal) : false,
      ticketId: ticket.id,
      authorId: req.user.id,
    },
    include: { author: { select: AUTHOR_SELECT } },
  });

  res.status(201).json(comment);
}
