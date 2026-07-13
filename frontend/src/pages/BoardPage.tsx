import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import {
  changeTicketStatus,
  getAssignableUsers,
  getTickets,
} from "@/services/ticketService";
import type { Priority, Status, Ticket, UserSummary } from "@/types";
import {
  CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  VISIBLE_STATUSES,
} from "@/lib/ticket-constants";
import { Navbar } from "@/components/shared/Navbar";
import { BoardColumn } from "@/components/board/BoardColumn";
import { QuickAddDialog } from "@/components/board/QuickAddDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "ALL";

export function BoardPage() {
  const user = useAuthStore((state) => state.user);
  const isStaff = user?.role === "ADMIN" || user?.role === "DEVELOPER";

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const hasActiveFilters =
    search.trim() !== "" || priorityFilter !== ALL || categoryFilter !== ALL;

  const filteredTickets = useMemo(() => {
    if (!tickets) return null;
    const term = search.trim().toLowerCase();
    const filtered = tickets.filter((t) => {
      const matchesSearch = !term || t.title.toLowerCase().includes(term);
      const matchesPriority = priorityFilter === ALL || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === ALL || t.category === categoryFilter;
      return matchesSearch && matchesPriority && matchesCategory;
    });
    return [...filtered].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? -diff : diff;
    });
  }, [tickets, search, priorityFilter, categoryFilter, sortOrder]);

  useEffect(() => {
    getTickets()
      .then(setTickets)
      .catch((err) => {
        const message = isAxiosError(err)
          ? (err.response?.data as { error?: string } | undefined)?.error
          : undefined;
        setError(message ?? "Failed to load tickets.");
      });
  }, []);

  useEffect(() => {
    if (!isStaff) return;
    getAssignableUsers()
      .then(setAssignableUsers)
      .catch(() => {
        // Non-fatal — the assignee picker just won't have options if this fails.
      });
  }, [isStaff]);

  function handleUpdated(updated: Ticket) {
    setTickets((prev) =>
      prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev,
    );
  }

  function handleCreated(created: Ticket) {
    setTickets((prev) => (prev ? [created, ...prev] : [created]));
  }

  const [activeDragTicket, setActiveDragTicket] = useState<Ticket | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const ticket = tickets?.find((t) => t.id === event.active.id) ?? null;
    setActiveDragTicket(ticket);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragTicket(null);
    const targetStatus = event.over?.id as Status | undefined;
    const ticket = tickets?.find((t) => t.id === event.active.id);
    if (!targetStatus || !ticket || ticket.status === targetStatus) return;

    try {
      const updated = await changeTicketStatus(ticket.id, targetStatus);
      handleUpdated(updated);
    } catch {
      toast.error("Couldn't move that ticket. Please try again.");
    }
  }

  // Board is staff-only (route + backend both gate it), so every status is a real column.
  // Cancelled is folded into the row itself (toggle-controlled) instead of a separate
  // block below, so the whole board stays a single horizontally-scrolling row.
  const columnStatuses = showCancelled
    ? [...VISIBLE_STATUSES, "CANCELLED" as Status]
    : VISIBLE_STATUSES;

  const cancelledCount =
    filteredTickets?.filter((t) => t.status === "CANCELLED").length ?? 0;

  if (!user) return null;

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <Navbar />
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

        {tickets && filteredTickets && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {isStaff && <QuickAddDialog onCreated={handleCreated} />}

              <Input
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px]"
              />

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>All priorities</SelectItem>
                    {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>All categories</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button
                variant={showCancelled ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setShowCancelled((v) => !v)}
              >
                {showCancelled ? "Hide" : "Show"} cancelled ({cancelledCount})
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setPriorityFilter(ALL);
                    setCategoryFilter(ALL);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
                {columnStatuses.map((status: Status) => (
                  <BoardColumn
                    key={status}
                    status={status}
                    label={STATUS_LABELS[status]}
                    tickets={filteredTickets.filter((t) => t.status === status)}
                    currentUser={user}
                    isStaff={isStaff}
                    assignableUsers={assignableUsers}
                    onUpdated={handleUpdated}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeDragTicket && (
                  <div className="w-72 rounded-lg border bg-card p-3 text-sm font-medium shadow-lg">
                    {activeDragTicket.title}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </main>
    </div>
  );
}
