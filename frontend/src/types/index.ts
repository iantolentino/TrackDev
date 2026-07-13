export type Role = "USER" | "DEVELOPER" | "ADMIN";

export type Status =
  | "PENDING"
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "AWAITING_INFO"
  | "COMPLETE"
  | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Attachment {
  id: string;
  filename: string;
  path: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: string;
  dueDate: string | null;
  createdById: string | null;
  requesterName: string | null;
  requesterEmail: string | null;
  assignedToId: string | null;
  isPublic: boolean;
  createdBy: UserSummary | null;
  assignedTo: UserSummary | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  ticketId: string;
  authorId: string;
  author: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  ticketId: string;
  actorId: string | null;
  actor: UserSummary | null;
  action: string;
  detail: string | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface PublicTicketSummary {
  id: string;
  title: string;
  category: string;
  status: Status;
  dueDate: string | null;
  createdAt: string;
}

export interface PublicBoardTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: Status;
  dueDate: string | null;
  createdAt: string;
}

export interface BlockedEmailEntry {
  id: string;
  email: string;
  reason: string | null;
  blockedById: string;
  blockedBy: { id: string; name: string };
  createdAt: string;
}
