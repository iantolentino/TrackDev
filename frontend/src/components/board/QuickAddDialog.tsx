import { useState } from "react";
import { isAxiosError } from "axios";
import type { Priority, Status, Ticket } from "@/types";
import {
  CATEGORIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  VISIBLE_STATUSES,
} from "@/lib/ticket-constants";
import { createTicket } from "@/services/ticketService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

interface QuickAddDialogProps {
  onCreated: (ticket: Ticket) => void;
}

export function QuickAddDialog({ onCreated }: QuickAddDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [status, setStatus] = useState<Status>("BACKLOG");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("");
    setPriority("MEDIUM");
    setStatus("BACKLOG");
    setDueDate("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim() || !category) {
      setError("Title, description, and category are required.");
      return;
    }

    setLoading(true);
    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status,
        dueDate: dueDate || undefined,
      });
      onCreated(ticket);
      setOpen(false);
      reset();
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error
        : undefined;
      setError(message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">Quick add</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an internal ticket</DialogTitle>
          <DialogDescription>
            For ideas or work you're tracking yourself — not a client request.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="qa-title">Title</FieldLabel>
              <Input
                id="qa-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>

            <Field orientation="responsive">
              <Field>
                <FieldLabel htmlFor="qa-category">Category</FieldLabel>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="qa-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="qa-priority">Priority</FieldLabel>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as Priority)}
                >
                  <SelectTrigger id="qa-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </Field>

            <Field>
              <FieldLabel htmlFor="qa-description">Description</FieldLabel>
              <Textarea
                id="qa-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field orientation="responsive">
              <Field>
                <FieldLabel htmlFor="qa-status">Column</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as Status)}
                >
                  <SelectTrigger id="qa-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {VISIBLE_STATUSES.filter((s) => s !== "PENDING").map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="qa-dueDate">Deadline (optional)</FieldLabel>
                <Input
                  id="qa-dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </Field>
            </Field>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
