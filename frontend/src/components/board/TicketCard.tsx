import { useState } from "react";
import { PaperclipIcon } from "lucide-react";
import type { AuthUser, Priority, Status, Ticket, UserSummary } from "@/types";
import {
  PRIORITY_BADGE_VARIANT,
  PRIORITY_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/ticket-constants";
import { cn } from "@/lib/utils";
import { API_ORIGIN } from "@/services/api";
import { ActivityLogDialog } from "@/components/board/ActivityLogDialog";
import { addBlockedEmail } from "@/services/adminService";
import {
  acceptTicket,
  assignTicket,
  changeTicketStatus,
  rejectTicket,
  updateTicketPriority,
} from "@/services/ticketService";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const UNASSIGNED = "unassigned";

interface TicketCardProps {
  ticket: Ticket;
  currentUser: AuthUser;
  isStaff: boolean;
  assignableUsers: UserSummary[];
  onUpdated: (ticket: Ticket) => void;
}

export function TicketCard({
  ticket,
  isStaff,
  assignableUsers,
  onUpdated,
}: TicketCardProps) {
  const [pending, setPending] = useState(false);
  const requesterDisplayName = ticket.createdBy?.name ?? ticket.requesterName ?? "Unknown";
  const requesterDisplayEmail = ticket.createdBy?.email ?? ticket.requesterEmail;

  async function run(action: () => Promise<Ticket>) {
    setPending(true);
    try {
      const updated = await action();
      onUpdated(updated);
    } finally {
      setPending(false);
    }
  }

  async function handleBlockAndReject() {
    if (!requesterDisplayEmail) return;
    setPending(true);
    try {
      await addBlockedEmail(requesterDisplayEmail, `Blocked from ticket "${ticket.title}"`);
      const updated = await rejectTicket(ticket.id);
      onUpdated(updated);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{ticket.title}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge className={cn("border-transparent", STATUS_BADGE_CLASSES[ticket.status])}>
            {STATUS_LABELS[ticket.status]}
          </Badge>
          <Badge variant={PRIORITY_BADGE_VARIANT[ticket.priority]}>
            {PRIORITY_LABELS[ticket.priority]}
          </Badge>
          <Badge variant="outline">{ticket.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p className="line-clamp-3">{ticket.description}</p>
        <p>
          By {requesterDisplayName}
          {ticket.status === "PENDING" && requesterDisplayEmail && (
            <>
              {" — "}
              <a href={`mailto:${requesterDisplayEmail}`} className="underline underline-offset-4">
                {requesterDisplayEmail}
              </a>
            </>
          )}
        </p>
        {ticket.assignedTo && <p>Assigned to {ticket.assignedTo.name}</p>}
        {ticket.dueDate && (
          <p>Due {new Date(ticket.dueDate).toLocaleDateString()}</p>
        )}
        {ticket.attachments.length > 0 && (
          <ul className="flex flex-col gap-1">
            {ticket.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={`${API_ORIGIN}${a.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-4"
                >
                  <PaperclipIcon className="size-3" />
                  {a.filename}
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {isStaff && ticket.status === "PENDING" && (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => acceptTicket(ticket.id, "TODO"))}
            >
              Accept → Todo
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => acceptTicket(ticket.id, "BACKLOG"))}
            >
              Accept → Backlog
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run(() => rejectTicket(ticket.id))}
            >
              Reject
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={pending}>
                  Block sender
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Block {requesterDisplayEmail}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This rejects the request and silently drops any future submissions
                    from this email — they won't be told they're blocked.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBlockAndReject}>
                    Block and reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {isStaff && ticket.status !== "PENDING" && (
          <>
            <Select
              disabled={pending}
              value={ticket.priority}
              onValueChange={(value) =>
                run(() => updateTicketPriority(ticket.id, value as Priority))
              }
            >
              <SelectTrigger size="sm" className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              disabled={pending}
              value={ticket.status}
              onValueChange={(value) =>
                run(() => changeTicketStatus(ticket.id, value as Status))
              }
            >
              <SelectTrigger size="sm" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {(Object.keys(STATUS_LABELS) as Status[])
                    .filter((s) => s !== "PENDING")
                    .map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              disabled={pending}
              value={ticket.assignedToId ?? UNASSIGNED}
              onValueChange={(value) =>
                run(() =>
                  assignTicket(ticket.id, value === UNASSIGNED ? null : value),
                )
              }
            >
              <SelectTrigger size="sm" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </>
        )}

        <ActivityLogDialog ticketId={ticket.id} ticketTitle={ticket.title} />
      </CardFooter>
    </Card>
  );
}
