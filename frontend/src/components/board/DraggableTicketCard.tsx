import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { AuthUser, Ticket, UserSummary } from "@/types";
import { TicketCard } from "@/components/board/TicketCard";

interface DraggableTicketCardProps {
  ticket: Ticket;
  currentUser: AuthUser;
  isStaff: boolean;
  assignableUsers: UserSummary[];
  onUpdated: (ticket: Ticket) => void;
}

export function DraggableTicketCard({
  ticket,
  currentUser,
  isStaff,
  assignableUsers,
  onUpdated,
}: DraggableTicketCardProps) {
  // Pending tickets move via Accept/Reject only — not drag, since that would
  // bypass the requester-decision email and the accept-target-column choice.
  const canDrag = isStaff && ticket.status !== "PENDING";

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    disabled: !canDrag,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      className={canDrag ? "cursor-grab touch-none active:cursor-grabbing" : undefined}
    >
      <TicketCard
        ticket={ticket}
        currentUser={currentUser}
        isStaff={isStaff}
        assignableUsers={assignableUsers}
        onUpdated={onUpdated}
      />
    </div>
  );
}
