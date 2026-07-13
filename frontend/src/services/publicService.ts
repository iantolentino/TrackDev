import axios from "axios";
import { API_ORIGIN } from "@/services/api";
import type { PublicTicketSummary } from "@/types";

// Deliberately a plain axios instance, not the shared `api` — this call is
// unauthenticated and must never carry a stale bearer token or trigger the
// shared instance's 401-logout interceptor.
const publicApi = axios.create({ baseURL: `${API_ORIGIN}/api` });

export interface SubmitRequestInput {
  name: string;
  email: string;
  title: string;
  description: string;
  category: string;
  dueDate?: string;
  files?: File[];
}

export async function submitRequest(input: SubmitRequestInput): Promise<void> {
  const { files, ...fields } = input;
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, value);
  }
  for (const file of files ?? []) {
    form.append("attachments", file);
  }

  await publicApi.post("/public/tickets", form);
}

export async function getMyRequests(email: string): Promise<PublicTicketSummary[]> {
  const { data } = await publicApi.get<PublicTicketSummary[]>("/public/tickets", {
    params: { email },
  });
  return data;
}
