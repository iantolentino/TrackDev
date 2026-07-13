import { useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { XIcon, CheckCircle2Icon } from "lucide-react";
import { submitRequest } from "@/services/publicService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/ticket-constants";

const NAME_MIN = 2;
const TITLE_MIN = 5;
const DESCRIPTION_MIN = 20;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function RequestFormPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";

    const oversized = selected.filter((f) => f.size > MAX_FILE_SIZE);
    const combined = [...files, ...selected.filter((f) => f.size <= MAX_FILE_SIZE)].slice(
      0,
      MAX_FILES,
    );

    setFiles(combined);
    setFieldErrors((prev) => ({
      ...prev,
      attachments: oversized.length
        ? `${oversized.map((f) => f.name).join(", ")} exceed the 5MB limit and were skipped.`
        : "",
    }));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (name.trim().length < NAME_MIN) {
      errors.name = "Please enter your name.";
    }
    if (!EMAIL_RE.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (title.trim().length < TITLE_MIN) {
      errors.title = `Title must be at least ${TITLE_MIN} characters.`;
    }
    if (description.trim().length < DESCRIPTION_MIN) {
      errors.description = `Please describe the request in at least ${DESCRIPTION_MIN} characters so we understand what's needed.`;
    }
    if (!category) {
      errors.category = "Please choose a category.";
    }
    if (dueDate && dueDate < todayIso()) {
      errors.dueDate = "Deadline can't be in the past.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await submitRequest({
        name: name.trim(),
        email: email.trim(),
        title: title.trim(),
        description: description.trim(),
        category,
        dueDate: dueDate || undefined,
        files,
      });
      setSubmitted(true);
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error
        : undefined;
      setSubmitError(message ?? "Something went wrong. Please try again.");
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
          {submitted ? (
            <CardContent className="pt-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CheckCircle2Icon />
                  </EmptyMedia>
                  <EmptyTitle>Request submitted</EmptyTitle>
                  <EmptyDescription>
                    Thanks — we'll review it and email you at {email} once we've
                    made a decision.
                  </EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" asChild>
                  <Link to="/request">Check your request status</Link>
                </Button>
              </Empty>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>New request</CardTitle>
                <CardDescription>
                  Tell us who you are and what you need. The more detail you
                  give, the faster we can help.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} noValidate>
                  <FieldGroup>
                    <Field orientation="responsive">
                      <Field data-invalid={!!fieldErrors.name}>
                        <FieldLabel htmlFor="name">Your name</FieldLabel>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          aria-invalid={!!fieldErrors.name}
                          placeholder="Jane Doe"
                        />
                        <FieldError>{fieldErrors.name}</FieldError>
                      </Field>
                      <Field data-invalid={!!fieldErrors.email}>
                        <FieldLabel htmlFor="email">Your email</FieldLabel>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          aria-invalid={!!fieldErrors.email}
                          placeholder="jane@example.com"
                        />
                        <FieldError>{fieldErrors.email}</FieldError>
                      </Field>
                    </Field>

                    <Field data-invalid={!!fieldErrors.title}>
                      <FieldLabel htmlFor="title">Title</FieldLabel>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        aria-invalid={!!fieldErrors.title}
                        placeholder="Short summary of the request"
                      />
                      <FieldError>{fieldErrors.title}</FieldError>
                    </Field>

                    <Field data-invalid={!!fieldErrors.category}>
                      <FieldLabel htmlFor="category">Category</FieldLabel>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" aria-invalid={!!fieldErrors.category}>
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
                      <FieldError>{fieldErrors.category}</FieldError>
                    </Field>

                    <Field data-invalid={!!fieldErrors.description}>
                      <FieldLabel htmlFor="description">Description</FieldLabel>
                      <Textarea
                        id="description"
                        rows={6}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        aria-invalid={!!fieldErrors.description}
                        placeholder="What's the problem or what do you need built? Steps to reproduce, links, and examples all help."
                      />
                      <FieldError>{fieldErrors.description}</FieldError>
                    </Field>

                    <Field data-invalid={!!fieldErrors.dueDate}>
                      <FieldLabel htmlFor="dueDate">Deadline (optional)</FieldLabel>
                      <Input
                        id="dueDate"
                        type="date"
                        min={todayIso()}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        aria-invalid={!!fieldErrors.dueDate}
                      />
                      <FieldDescription>
                        Leave blank if there's no hard deadline.
                      </FieldDescription>
                      <FieldError>{fieldErrors.dueDate}</FieldError>
                    </Field>

                    <Field data-invalid={!!fieldErrors.attachments}>
                      <FieldLabel htmlFor="attachments">
                        Attachments (optional)
                      </FieldLabel>
                      <Input
                        id="attachments"
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,.doc,.docx"
                        onChange={handleFileChange}
                        disabled={files.length >= MAX_FILES}
                      />
                      <FieldDescription>
                        Up to {MAX_FILES} files, 5MB each — screenshots, PDFs, or docs.
                      </FieldDescription>
                      <FieldError>{fieldErrors.attachments}</FieldError>
                      {files.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {files.map((file, i) => (
                            <Badge key={`${file.name}-${i}`} variant="secondary" className="gap-1">
                              {file.name}
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                aria-label={`Remove ${file.name}`}
                              >
                                <XIcon className="size-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Field>

                    {submitError && (
                      <Alert variant="destructive">
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={loading}>
                      {loading ? "Submitting..." : "Submit request"}
                    </Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
