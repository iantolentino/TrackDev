import { api } from "@/services/api";
import type { ActivityLogEntry, Priority, Status, Ticket, UserSummary } from "@/types";

export async function getTickets(): Promise<Ticket[]> {
  const { data } = await api.get<Ticket[]>("/tickets");
  return data;
}

export async function getTicketActivity(id: string): Promise<ActivityLogEntry[]> {
  const { data } = await api.get<ActivityLogEntry[]>(`/tickets/${id}/activity`);
  return data;
}

export async function getAssignableUsers(): Promise<UserSummary[]> {
  const { data } = await api.get<UserSummary[]>("/tickets/assignable-users");
  return data;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  category: string;
  dueDate?: string;
  priority?: Priority;
  status?: Status;
  files?: File[];
}

// Staff-only "Quick Add" — public submitters use publicService.submitRequest instead.
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const { files, ...fields } = input;
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, value);
  }
  for (const file of files ?? []) {
    form.append("attachments", file);
  }

  const { data } = await api.post<Ticket>("/tickets", form);
  return data;
}

export async function updateTicketPriority(id: string, priority: Priority): Promise<Ticket> {
  const { data } = await api.put<Ticket>(`/tickets/${id}`, { priority });
  return data;
}

export async function assignTicket(id: string, assignedToId: string | null): Promise<Ticket> {
  const { data } = await api.put<Ticket>(`/tickets/${id}`, { assignedToId });
  return data;
}

export async function changeTicketStatus(id: string, status: Status): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/tickets/${id}/status`, { status });
  return data;
}

export async function acceptTicket(id: string, targetStatus: "TODO" | "BACKLOG"): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/tickets/${id}/accept`, { targetStatus });
  return data;
}

export async function rejectTicket(id: string): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/tickets/${id}/reject`);
  return data;
}

export async function setTicketVisibility(id: string, isPublic: boolean): Promise<Ticket> {
  const { data } = await api.patch<Ticket>(`/tickets/${id}/visibility`, { isPublic });
  return data;
}
