import nodemailer from 'nodemailer';
import prisma from '../config/database.js';

const NOTIFY_STATUS_LABELS = {
  IN_PROGRESS: 'In Progress',
  AWAITING_INFO: 'Awaiting Information',
  COMPLETE: 'Complete',
};

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // STARTTLS on 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

function isEmailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

async function sendMail({ to, subject, text }) {
  if (!to) {
    console.warn(`[email] No recipient for "${subject}" — skipping`);
    return;
  }
  if (!isEmailConfigured()) {
    console.warn(`[email] EMAIL_USER/EMAIL_PASS not set — skipping "${subject}" to ${to}`);
    return;
  }
  try {
    await getTransporter().sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

function requesterName(ticket) {
  return ticket.createdBy?.name || ticket.requesterName || 'A requester';
}

function requesterEmail(ticket) {
  return ticket.createdBy?.email || ticket.requesterEmail;
}

export async function notifyAdminsOfNewTicket(ticket) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
  const to = admins.map((a) => a.email).join(',');

  await sendMail({
    to,
    subject: `New request pending review: ${ticket.title}`,
    text: [
      `${requesterName(ticket)} (${requesterEmail(ticket) || 'no email on file'}) submitted a new request.`,
      '',
      `Title: ${ticket.title}`,
      `Category: ${ticket.category}`,
      `Description: ${ticket.description}`,
      '',
      'Review it in the Pending column on the board.',
    ].join('\n'),
  });
}

export async function notifyRequesterOfStatusChange(ticket, newStatus) {
  const label = NOTIFY_STATUS_LABELS[newStatus];
  if (!label) return;

  await sendMail({
    to: requesterEmail(ticket),
    subject: `Your ticket "${ticket.title}" is now ${label}`,
    text: `Hi ${requesterName(ticket)},\n\nYour request "${ticket.title}" has been moved to: ${label}.`,
  });
}

export async function notifyRequesterOfDecision(ticket, decision) {
  const isAccepted = decision === 'accepted';
  await sendMail({
    to: requesterEmail(ticket),
    subject: isAccepted
      ? `Your request "${ticket.title}" has been accepted`
      : `Your request "${ticket.title}" was not accepted`,
    text: isAccepted
      ? `Hi ${requesterName(ticket)},\n\nGood news — we've accepted your request "${ticket.title}" and it's now in our queue. We'll keep you posted as it progresses.`
      : `Hi ${requesterName(ticket)},\n\nThanks for reaching out. After review, we won't be moving forward with "${ticket.title}" at this time. If you have questions, feel free to reply to this email.`,
  });
}
