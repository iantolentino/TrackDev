import { api } from "@/services/api";
import type { BlockedEmailEntry } from "@/types";

export async function getBlockedEmails(): Promise<BlockedEmailEntry[]> {
  const { data } = await api.get<BlockedEmailEntry[]>("/admin/blocked-emails");
  return data;
}

export async function addBlockedEmail(email: string, reason?: string): Promise<BlockedEmailEntry> {
  const { data } = await api.post<BlockedEmailEntry>("/admin/blocked-emails", { email, reason });
  return data;
}

export async function removeBlockedEmail(id: string): Promise<void> {
  await api.delete(`/admin/blocked-emails/${id}`);
}
