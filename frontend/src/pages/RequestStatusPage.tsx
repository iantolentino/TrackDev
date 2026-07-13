import { useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { InboxIcon } from "lucide-react";
import { getMyRequests } from "@/services/publicService";
import type { PublicTicketSummary } from "@/types";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/ticket-constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestStatusPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PublicTicketSummary[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setFieldError("Please enter a valid email address.");
      return;
    }
    setFieldError(null);
    setLoading(true);
    try {
      const data = await getMyRequests(trimmed);
      setResults(data);
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
    <div className="flex min-h-svh flex-col">
      <header className="border-b p-4">
        <span className="font-semibold">TrackDev</span>
      </header>
      <main className="flex flex-1 items-start justify-center p-4 sm:p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Check your requests</CardTitle>
            <CardDescription>
              Enter the email you submitted with to see the status of your requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <form onSubmit={handleSubmit} noValidate>
              <FieldGroup>
                <Field orientation="responsive" data-invalid={!!fieldError}>
                  <Field className="flex-1">
                    <FieldLabel htmlFor="lookup-email" className="sr-only">
                      Your email
                    </FieldLabel>
                    <Input
                      id="lookup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={!!fieldError}
                      placeholder="jane@example.com"
                    />
                    <FieldError>{fieldError}</FieldError>
                  </Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Searching..." : "View requests"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {!loading && results && results.length === 0 && (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <InboxIcon />
                  </EmptyMedia>
                  <EmptyTitle>No requests found</EmptyTitle>
                  <EmptyDescription>
                    We couldn't find any requests submitted with that email.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {!loading && results && results.length > 0 && (
              <ul className="flex flex-col gap-3">
                {results.map((ticket) => (
                  <li key={ticket.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">{ticket.title}</span>
                      <Badge className={cn("border-transparent", STATUS_BADGE_CLASSES[ticket.status])}>
                        {STATUS_LABELS[ticket.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.category} — submitted{" "}
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/request/new">Submit a new request</Link>
              </Button>
              <Button variant="ghost" className="flex-1" asChild>
                <Link to="/board">View public roadmap</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
