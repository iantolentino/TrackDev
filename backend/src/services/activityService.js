import prisma from '../config/database.js';

export async function logActivity({ ticketId, actorId, action, detail }) {
  await prisma.activityLog.create({
    data: { ticketId, actorId, action, detail: detail ?? null },
  });
}
