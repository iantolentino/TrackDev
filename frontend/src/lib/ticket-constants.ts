import type { Priority, Status } from "@/types";

export const STATUS_LABELS: Record<Status, string> = {
  PENDING: "Pending Review",
  BACKLOG: "Backlog",
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  AWAITING_INFO: "Awaiting Information",
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
};

// Board is staff-only now (no more client persona) — every status is a real column.
export const VISIBLE_STATUSES: Status[] = [
  "PENDING",
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "AWAITING_INFO",
  "COMPLETE",
];

// Distinct, readable color per status — light + dark variants. A dedicated small
// palette here (not generic Badge variants) since 7 statuses need more differentiation
// than default/secondary/destructive/outline can express.
export const STATUS_DOT_CLASSES: Record<Status, string> = {
  PENDING: "bg-amber-500",
  BACKLOG: "bg-slate-400",
  TODO: "bg-blue-500",
  IN_PROGRESS: "bg-violet-500",
  AWAITING_INFO: "bg-orange-500",
  COMPLETE: "bg-emerald-500",
  CANCELLED: "bg-rose-500",
};

export const STATUS_BADGE_CLASSES: Record<Status, string> = {
  PENDING:
    "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300",
  BACKLOG:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  TODO: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  IN_PROGRESS:
    "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  AWAITING_INFO:
    "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  COMPLETE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  CANCELLED:
    "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const PRIORITY_BADGE_VARIANT: Record<
  Priority,
  "secondary" | "outline" | "destructive"
> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "destructive",
};

export const CATEGORIES = [
  "Bug",
  "Feature Request",
  "Improvement",
  "Question",
  "Other",
];

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  CREATED: "Created the ticket",
  STATUS_CHANGED: "Changed status",
  PRIORITY_CHANGED: "Changed priority",
  ASSIGNED: "Assignment updated",
  UNASSIGNED: "Unassigned",
  UPDATED: "Updated details",
};
