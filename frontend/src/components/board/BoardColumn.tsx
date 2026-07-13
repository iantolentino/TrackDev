import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { AuthUser, Status, Ticket, UserSummary } from "@/types";
import { STATUS_DOT_CLASSES } from "@/lib/ticket-constants";
import { DraggableTicketCard } from "@/components/board/DraggableTicketCard";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";

interface BoardColumnProps {
  status: Status;
  label: string;
  tickets: Ticket[];
  currentUser: AuthUser;
  isStaff: boolean;
  assignableUsers: UserSummary[];
  onUpdated: (ticket: Ticket) => void;
}

export function BoardColumn({
  status,
  label,
  tickets,
  currentUser,
  isStaff,
  assignableUsers,
  onUpdated,
}: BoardColumnProps) {
  // Pending is never a drop target — tickets only leave it via Accept/Reject.
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: !isStaff || status === "PENDING",
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col gap-3 rounded-lg p-1 transition-colors",
        isOver && "bg-accent",
      )}
    >
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("size-2.5 shrink-0 rounded-full", STATUS_DOT_CLASSES[status])} />
        <h2 className="text-sm font-medium">{label}</h2>
        <Badge variant="secondary">{tickets.length}</Badge>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {tickets.length === 0 ? (
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyDescription>No tickets here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          tickets.map((ticket) => (
            <DraggableTicketCard
              key={ticket.id}
              ticket={ticket}
              currentUser={currentUser}
              isStaff={isStaff}
              assignableUsers={assignableUsers}
              onUpdated={onUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
}
