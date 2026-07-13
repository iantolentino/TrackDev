import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { getPublicBoard } from "@/services/publicService";
import type { PublicBoardTicket, Status } from "@/types";
import { STATUS_BADGE_CLASSES, STATUS_DOT_CLASSES, STATUS_LABELS } from "@/lib/ticket-constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";

const PUBLIC_STATUSES: Status[] = ["BACKLOG", "TODO", "IN_PROGRESS", "AWAITING_INFO", "COMPLETE"];

export function PublicBoardPage() {
  const [tickets, setTickets] = useState<PublicBoardTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicBoard()
      .then(setTickets)
      .catch((err) => {
        const message = isAxiosError(err)
          ? (err.response?.data as { error?: string } | undefined)?.error
          : undefined;
        setError(message ?? "Failed to load the roadmap.");
      });
  }, []);

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b p-4">
        <span className="font-semibold">TrackDev — Public Roadmap</span>
        <Button variant="outline" size="sm" asChild>
          <Link to="/request">Check your request</Link>
        </Button>
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!tickets && !error && (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-72 shrink-0" />
            ))}
          </div>
        )}

        {tickets && (
          <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
            {PUBLIC_STATUSES.map((status) => {
              const columnTickets = tickets.filter((t) => t.status === status);
              return (
                <div key={status} className="flex h-full w-72 shrink-0 flex-col gap-3 rounded-lg p-1">
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("size-2.5 shrink-0 rounded-full", STATUS_DOT_CLASSES[status])} />
                    <h2 className="text-sm font-medium">{STATUS_LABELS[status]}</h2>
                    <Badge variant="secondary">{columnTickets.length}</Badge>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                    {columnTickets.length === 0 ? (
                      <Empty className="p-4">
                        <EmptyHeader>
                          <EmptyDescription>Nothing here.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      columnTickets.map((ticket) => (
                        <Card key={ticket.id}>
                          <CardHeader>
                            <CardTitle className="text-sm">{ticket.title}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={cn("border-transparent", STATUS_BADGE_CLASSES[ticket.status])}>
                                {STATUS_LABELS[ticket.status]}
                              </Badge>
                              <Badge variant="outline">{ticket.category}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <p className="line-clamp-3">{ticket.description}</p>
                            {ticket.dueDate && (
                              <p>Due {new Date(ticket.dueDate).toLocaleDateString()}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
