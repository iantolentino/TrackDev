import { useState } from "react";
import { HistoryIcon } from "lucide-react";
import type { ActivityLogEntry } from "@/types";
import { ACTIVITY_ACTION_LABELS } from "@/lib/ticket-constants";
import { getTicketActivity } from "@/services/ticketService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityLogDialogProps {
  ticketId: string;
  ticketTitle: string;
}

export function ActivityLogDialog({ ticketId, ticketTitle }: ActivityLogDialogProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpenChange(open: boolean) {
    if (!open || entries) return;
    setLoading(true);
    try {
      setEntries(await getTicketActivity(ticketId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <HistoryIcon data-icon="inline-start" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activity — {ticketTitle}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!loading && entries && entries.length === 0 && (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyDescription>No activity recorded yet.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {!loading && entries && entries.length > 0 && (
          <ul className="flex flex-col gap-3 text-sm">
            {entries.map((entry) => (
              <li key={entry.id} className="border-b pb-2 last:border-0">
                <p className="font-medium">
                  {entry.actor?.name ?? "Requester"} — {ACTIVITY_ACTION_LABELS[entry.action] ?? entry.action}
                </p>
                {entry.detail && (
                  <p className="text-muted-foreground">{entry.detail}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
