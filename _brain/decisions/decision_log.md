# DECISION LOG

> Record every architecture, stack, or scope decision made after CONFIRMATION_LOCK.
> This prevents the AI from re-opening settled decisions in future sessions.

---

## Format

```
[TYPE] → [Decision made]
Impact: low | medium | high
Reason: [One-line justification]
Date: [YYYY-MM-DD]
```

Types: ARCH | STACK | SCOPE | SECURITY | PERFORMANCE | UX

---

## Decisions

[ARCH] → Use a modular monolith (single Express API + single React SPA) instead of microservices
Impact: high
Reason: MVP scale doesn't justify service-splitting overhead
Date: 2026-07-02

[SCOPE] → Status workflow expanded to 6 states: Backlog, Todo, In Progress, Awaiting Information, Complete, Cancelled (hidden)
Impact: high
Reason: Replaces original Pending/In Progress/Review/Done table workflow with a Kanban board per client request
Date: 2026-07-02

[SCOPE] → Client-submitted tickets land directly in Todo; Backlog is admin/dev-only staging for internally created ideas
Impact: medium
Reason: Keeps client-facing intake simple while giving staff a private space for unvetted internal ideas
Date: 2026-07-02

[SCOPE] → Priority reduced to 3 tiers (Low/Medium/High), set only by admin/dev, not the client at submission time
Impact: low
Reason: Client explicitly requested 3-tier priority; triage decision belongs to staff, not requester
Date: 2026-07-02

[SCOPE] → Admin/dev may only edit priority, status, assignee, and internal notes on client-submitted tickets — title/description/deadline are locked
Impact: medium
Reason: Preserves an audit trail of what the client actually requested
Date: 2026-07-02

[SCOPE] → Admin/dev gets a separate "Quick Add" action to create tickets directly (full edit rights on those, since staff owns the content)
Impact: low
Reason: Answers the need for staff to log their own ideas/suggestions outside the client request flow
Date: 2026-07-02

[UX] → Board visible to all authenticated users showing all tickets (no per-client filtering), except Backlog which is staff-only
Impact: medium
Reason: Client explicitly chose shared visibility over per-client filtering; accepted as intentional tradeoff
Date: 2026-07-02

[UX] → Client may move only their own card, and only to Cancelled (self-withdraw); no other client-side board edits
Impact: low
Reason: Client requested ability to withdraw a request; all other movement is staff-controlled
Date: 2026-07-02

[SCOPE] → Email fires to admin on new client submission, and to requester only on transition into In Progress / Awaiting Information / Complete
Impact: medium
Reason: Matches explicit client requirement; avoids noisy emails on every column move (e.g. Backlog, Todo, Cancelled)
Date: 2026-07-02

[STACK] → shadcn/ui skill and ponytail (token-efficiency) skill installed at project level via `npx skills add`
Impact: low
Reason: Client requested industry-standard UI tooling and token-efficient execution
Date: 2026-07-02

[STACK] → Pin Prisma to 5.x (not latest 7.x) for backend
Impact: medium
Reason: Prisma 7 removed the classic `datasource { url = env(...) }` pattern in favor of mandatory driver adapters + prisma.config.ts — unproven on cPanel shared hosting, the confirmed deployment target. 5.x validated clean (schema + client generation both pass).
Date: 2026-07-02

[SCHEMA] → File attachments modeled as a separate Attachment model (id/filename/path/ticketId), not `String[]` on Ticket
Impact: medium
Reason: MySQL (our datasource) doesn't support Prisma scalar list fields — the original README draft schema would fail `prisma validate` on this provider
Date: 2026-07-02

[SCHEMA] → Internal admin/dev notes stored as `Comment.isInternal` flag rather than a separate notes field/model
Impact: low
Reason: Reuses the existing Comment model instead of adding a parallel concept — avoids premature abstraction for what is functionally a private comment
Date: 2026-07-02

[SECURITY] → Bumped bcrypt to 6.x, nodemailer to 9.x, multer to 2.x (up from README's originally suggested versions)
Impact: medium
Reason: `npm audit` on the originally suggested versions surfaced 4 high-severity CVEs (nodemailer SMTP/header injection chain, bcrypt's node-tar path-traversal chain via node-pre-gyp) plus a flagged multer 1.x deprecation with patched vulnerabilities in 2.x. Reinstall after bump: 0 vulnerabilities. APIs used (hash/compare, createTransport/sendMail, diskStorage/single/array) are unaffected by the version bump.
Date: 2026-07-02

[SECURITY] → Public `/api/auth/register` silently ignores any `role` field in the request body — always creates `USER`
Impact: high
Reason: Original README's register spec accepted an optional `role` field from the client, which is a privilege-escalation hole (anyone could self-register as ADMIN). ADMIN/DEVELOPER accounts must be provisioned another way (seed script or an authenticated admin action) — not yet scoped as a task, flagged for backlog follow-up.
Date: 2026-07-02

[SECURITY] → Login returns a generic "Invalid email or password" for both unknown-email and wrong-password cases
Impact: low
Reason: Prevents user enumeration via differential error messages
Date: 2026-07-02

[ENV] → Local dev/testing runs against a real MariaDB 10.4 instance (Laragon), database `trackdev_dev`, not mocked
Impact: low
Reason: `_brain` completion guarantee requires proof of working integration, not just code that type-checks — every backend task from here on is verified with a live migration + live HTTP request before being marked COMPLETE
Date: 2026-07-02

[SCOPE] → `category` added to the client-locked field list alongside title/description/deadline
Impact: low
Reason: Not explicitly named in the earlier confirmation, but the stated rationale ("preserve an audit trail of what was actually requested") applies equally to the client's chosen category — treated as part of the original request content, same as title/description
Date: 2026-07-02

[ARCH] → Status changes on client-submitted tickets go only through the dedicated `PATCH /:id/status` endpoint — the general `PUT /:id` cannot change status at all (staff or self-owned tickets included)
Impact: medium
Reason: Single choke point for status transitions gives T005 (email triggers) one place to hook into, instead of having to detect status changes inside two different handlers
Date: 2026-07-02

[SCOPE] → "Notify admin" targets every user with role ADMIN (queried live), not a single fixed address
Impact: low
Reason: Matches the future admin-user-management task (T004b) without any extra config — works correctly whether there's one admin or several
Date: 2026-07-02

[ENV] → Seeded a second, real ADMIN account (ian@stratastaffglobal.com) alongside the placeholder dev admin (admin@trackdev.local)
Impact: low
Reason: User supplied their real inbox so admin-notification emails have somewhere real to land during testing
Date: 2026-07-02

[STACK] → Switched emailService.js transporter from Gmail SMTP to Office365/Outlook SMTP (smtp.office365.com:587, STARTTLS)
Impact: medium
Reason: User confirmed every user of the system (clients, admin, dev) shares the same corporate mail format/provider (Microsoft 365, e.g. ian@stratastaffglobal.com) — Gmail's transport wouldn't accept that account as a sender. Resolves the prior [OPEN] item.
Date: 2026-07-02

[SCOPE] → Any authenticated user who can view a ticket may comment on it (not restricted to the ticket's own creator/assignee)
Impact: low
Reason: Matches the confirmed "shared board, all tickets visible" model — comment access mirrors ticket-view access. Same Backlog rule applies: clients get 404 on both GET and POST for Backlog-ticket comments, same as they do for the ticket itself.
Date: 2026-07-02

[SCOPE] → `isInternal` comments (staff notes) are filtered out of the response entirely for non-staff viewers, not just flagged
Impact: low
Reason: Prevents a client from ever seeing internal staff discussion about their own ticket, even indirectly via the API response
Date: 2026-07-02

[STACK] → Frontend scaffolded via `npx shadcn@latest init --template vite --preset nova --base radix` (React 19, Tailwind v4 CSS-based config, Vite 8, TS 6) rather than the React 18/Tailwind v3/`tailwind.config.js` versions named in the original README
Impact: medium
Reason: This is what the current shadcn CLI actually produces as of today — it's the real "industry standard, current" baseline the user asked for. Unlike the Prisma 7 case, there's no cPanel runtime risk here: the frontend is a static build (`vite build` → `dist/`) uploaded as files, so the frontend toolchain's version doesn't touch the hosting environment's constraints at all.
Date: 2026-07-02

[STACK] → react-router-dom pinned to `^6.30.4`, not the newly-current v7
Impact: low
Reason: v7 merges the data-router/Remix paradigm (loaders/actions) which this app doesn't use — Zustand + axios handle data fetching client-side. v6.30.4 has an open peer range (react >=16.8) so it's fully compatible with React 19. Matches the originally-specified "React Router v6" without adopting unneeded architectural complexity.
Date: 2026-07-02

[FIX] → Added `{ allowConstantExport: true }` to the `react-refresh/only-export-components` ESLint rule
Impact: low
Reason: The CLI-generated `button.tsx` co-exports `buttonVariants` (a cva constant) alongside the `Button` component, which is standard shadcn/ui practice but trips this rule by default — same fix used in Vite's own React template. Without it, `npm run lint` failed out of the box on unmodified scaffold output.
Date: 2026-07-02

[ENV] → Frontend dev server pinned to port 5174 (`server: { port: 5174, strictPort: true }` in vite.config.ts); backend `CLIENT_URL` updated to match
Impact: low
Reason: User confirmed port 5173 is already in permanent use by another of their projects on this machine. `strictPort: true` makes this fail loudly if 5174 is ever unavailable too, instead of silently drifting to a port that no longer matches the backend's CORS allowlist.
Date: 2026-07-02

[ARCH] → Register auto-logs-in (backend already returns token+user on register) rather than redirecting to a separate login step
Impact: low
Reason: Matches the backend's actual response shape from T003 — no reason to make the user log in again immediately after creating an account
Date: 2026-07-02

[ARCH] → Axios response interceptor auto-logs-out on any 401 (clears the Zustand/persisted auth state)
Impact: low
Reason: Keeps an expired/invalid token from leaving the user stuck on a broken authenticated view — ProtectedRoute naturally redirects to /login once the store's token clears
Date: 2026-07-02

[VERIFY] → Verified the full auth flow (redirect-when-logged-out, login, bad-password error, register-and-auto-login) with a real headless-Chromium session via Playwright, not just typecheck/build
Impact: low
Reason: This is UI/frontend work — per project standards, UI changes need to be driven in an actual browser before being called done, not just type-checked. `chromium-cli` (the project's usual driver) wasn't available in this environment, so a one-off Playwright script was used instead (scratchpad only, not committed to the repo).
Date: 2026-07-02

[SCOPE] → Status changes on the board use a `Select` dropdown per card (all 6 statuses, including Cancelled), not drag-and-drop
Impact: low
Reason: Matches the already-logged SCALE-READY decision — MVP uses move controls, DnD is a later hook (T014)
Date: 2026-07-02

[SCOPE] → No user-picker for "assign to" yet — only a self-service "Assign to me" / "Unassign me" toggle
Impact: medium
Reason: A real assignee picker needs a list-all-users endpoint, which is T004b (admin user management) — not yet built. Self-assign covers the common case (a dev picking up their own work) without blocking T009 on an unbuilt endpoint. Full picker is a natural follow-up once T004b exists.
Date: 2026-07-02

[SCOPE] → No filter/search controls on the board yet (status/priority/category filters, title search)
Impact: low
Reason: Listed as a CORE feature in the original README but not named in T009's specific backlog scope ("Kanban card layout, role-gated controls, hidden Backlog/Cancelled columns"). With columns already grouping by status, filtering is lower-urgency; flagged as a good follow-up task rather than silently dropped.
Date: 2026-07-02

[FIX] → Removed the "Withdraw" button from a staff member's own tickets (found via screenshot review, not initially caught in code)
Impact: low
Reason: Staff already have full status control via the Select (including Cancelled) — showing both a dropdown option and a redundant one-click button on the same card for the same action was UI clutter. Withdraw is now client-only (`isOwnTicket && !isStaff`), matching its actual purpose as the client's one self-service lever.
Date: 2026-07-02

[SCOPE] → Category is a fixed `Select` (Bug / Feature Request / Improvement / Question / Other), not a free-text field
Impact: low
Reason: Backend's `category` is a plain string with no enum validation, but a fixed list keeps client submissions consistent for future filtering (T013b) and matches "the form must be properly formatted" — client's explicit ask
Date: 2026-07-02

[SCOPE] → Request form enforces minimum lengths (title ≥5 chars, description ≥20 chars) client-side before submit
Impact: low
Reason: Directly matches the client's explicit requirement that "the user must give detail properly" — backend only requires non-empty, so this is a frontend-only quality gate, not a security boundary
Date: 2026-07-02

[ARCH] → Toast (`sonner`) confirms submission, then redirects to the board so the client immediately sees their new ticket in Todo
Impact: low
Reason: Closes the loop visibly — user gets both an explicit confirmation and proof the request landed correctly, rather than a silent redirect
Date: 2026-07-02

[SCOPE] → Quick Add has no minimum-length validation (unlike the client Request Form's title≥5/description≥20 gates) — just non-empty
Impact: low
Reason: Different intent — this is staff jotting down their own idea quickly, not a formal client request needing enforced detail. Category list is shared (`CATEGORIES` moved to `ticket-constants.ts`) so both forms stay consistent.
Date: 2026-07-02

[FIX] → Quick Add's validation error now clears at the start of every submit attempt, not only on success
Impact: low
Reason: Found via screenshot review — after fixing a validation error and resubmitting, the stale error message would persist on screen for a frame even though the new attempt might have a different (or no) error. `setError(null)` moved before the validation check.
Date: 2026-07-02

[FIX] → Removed the hardcoded `Content-Type: application/json` default header from the `api` axios instance
Impact: high
Reason: That default silently broke FormData uploads — axios only auto-detects FormData and lets the browser set the correct multipart boundary when Content-Type isn't already explicitly forced. With the header present, axios JSON-stringified the FormData object instead (confirmed via network trace: request went out as `application/json` with an empty `attachments` field), so files never reached the backend even though the ticket itself was created. Axios already sets `application/json` automatically for plain-object bodies, so the explicit default was redundant for JSON requests and actively harmful for multipart ones. Removing it fixed uploads; re-verified JSON requests (login) still work correctly afterward.
Date: 2026-07-02

[SECURITY] → Multer upload restricted to an explicit MIME allowlist (images, PDF, plain text, Word docs), 5MB/file, 5 files/request, server-generated random filenames
Impact: medium
Reason: Unrestricted file upload is a real vulnerability surface (arbitrary file upload, stored content served back via `/uploads`). Original filename is kept only as a display label (DB field, never used as a filesystem path), so it can't be used for path traversal.
Date: 2026-07-02

[ARCH] → New endpoint `GET /api/tickets/assignable-users` (isAdminOrDev-gated) instead of reusing `GET /api/admin/users` (isAdmin-only) to populate the assignee picker
Impact: medium
Reason: `/api/admin/users` is the full user-management surface (role changes), deliberately ADMIN-only from T004b. The assignee picker needs to be usable by any staff member (ADMIN or DEVELOPER) to assign tickets to any other staff member — opening the full admin surface to DEVELOPER role would blur that boundary. The new endpoint returns only id/name/email/role for ADMIN+DEVELOPER accounts, nothing else.
Date: 2026-07-03

[FIX] → `GET /api/tickets/assignable-users` registered before `GET /api/tickets/:id` in the route file
Impact: low
Reason: Express matches routes in registration order — if `:id` were registered first, a request to `/assignable-users` would be swallowed as `getTicketById` with `id="assignable-users"` instead of reaching the new handler. Verified live: both the new endpoint and a real `/api/tickets/<id>` lookup resolve correctly.
Date: 2026-07-03

[SCOPE] → Board filters (search/priority/category) are client-side over the already-fetched ticket list, not server-side query params, and there's no status filter control
Impact: low
Reason: The backend already supports `?status&priority&category&search` (built in T004) but the board's columns already ARE the status view — a redundant status-filter dropdown would just duplicate what the column layout already shows, and would need to hide whole columns rather than filter within them (a different feature). Client-side filtering over data already in memory is simpler and more responsive than a round-trip per keystroke/selection; the server-side query params remain available for any future non-board consumer.
Date: 2026-07-10

[STACK] → `@dnd-kit/core` + `@dnd-kit/utilities` for drag-and-drop, not `react-beautiful-dnd`
Impact: medium
Reason: `react-beautiful-dnd` is unmaintained and known to break under React 18+ strict mode/concurrent rendering; this app is on React 19. `@dnd-kit` is the actively maintained modern standard and installed clean with 0 vulnerabilities.
Date: 2026-07-10

[SCOPE] → Drag-and-drop only moves cards between the main visible columns — no within-column reordering, and the Cancelled column (hidden behind its own toggle) isn't a drop target
Impact: low
Reason: Tickets have no manual ordering field in the data model (sorted by createdAt server-side), so reordering wasn't a real requirement — adding `@dnd-kit/sortable` for that would be scope creep beyond what T014 asked for. Cancelled is a secondary, toggle-hidden view; making it a live drop target while collapsed would be a confusing interaction, and staff already have the Status Select (which includes Cancelled) as the explicit way to cancel a ticket.
Date: 2026-07-10

[ARCH] → Drag-and-drop is additive, not a replacement — the existing Status `Select` dropdown stays on every card
Impact: low
Reason: Drag has no built-in keyboard/screen-reader path in this implementation; keeping the Select ensures status changes stay fully accessible. Also gave `PointerSensor` an 8px `activationConstraint` specifically so ordinary clicks on the Select/Button controls inside a draggable card aren't swallowed as accidental drag-starts — verified live that clicking Priority still works normally on a card that also has drag listeners attached.
Date: 2026-07-10

[SCHEMA] → New `ActivityLog` model (ticketId, actorId, action string, optional detail text, createdAt) rather than a Prisma enum for `action`
Impact: medium
Reason: A plain String avoids a migration for every future action type (e.g. if T016/T017 or later features want to log something new), matching "prefer scalable simplicity over premature abstraction." Cascade-deletes with the ticket — the log's purpose is per-ticket history while the ticket exists, not surviving its deletion.
Date: 2026-07-10

[SCOPE] → Activity log covers CREATED, STATUS_CHANGED, PRIORITY_CHANGED, ASSIGNED/UNASSIGNED, and UPDATED (title/description/category/dueDate edits on staff's own tickets) — comments are deliberately NOT duplicated into it
Impact: low
Reason: The Comment list already shows author + timestamp + content for every comment; a parallel "COMMENTED" activity entry would be redundant with data already visible elsewhere, so it's skipped to avoid overengineering.
Date: 2026-07-10

[ARCH] → Assignment log entries snapshot the assignee's name at write time (extra query when assigning) rather than storing just the id
Impact: low
Reason: Audit records should stay meaningful even if the referenced user is later renamed or removed — resolving the name lazily from a possibly-stale/deleted user id at read time would be a weaker audit trail.
Date: 2026-07-10

[ARCH] → Activity log access follows the exact same visibility rule as the ticket itself (staff always; clients only for non-Backlog tickets, 404 not 403) — no separate internal/external split like Comments have
Impact: low
Reason: None of the tracked actions reveal anything the client can't already see from the ticket's current state (priority/status/assignee) — the log just adds history, not new sensitive information, so a client seeing their own ticket's history is fine and even good for transparency.
Date: 2026-07-10

---

## 🔴 MAJOR PIVOT — 2026-07-13: Client accounts removed, public-submission + admin-gatekeeper model

Client confirmed: "we don't need the client account anymore we just need their email and name when
they submit something." This SUPERSEDES every prior decision built on client login/self-service
(client register/login, client board visibility, client self-cancel/Withdraw, Backlog-hidden-from-
client, comment access for clients). Those entries are left in place above as history of *why* the
original model was built that way, not deleted — see claude.md § BUG FIX MEMORY LAYER rule (never
delete, mark superseded).

[ARCH] → Client submission becomes a public, unauthenticated endpoint (name + email only, no account) — the whole board (and all existing role-gating logic) becomes staff-only, since there is no more client persona to view it
Impact: high
Reason: Direct client request — clients should not need to create/remember an account just to file a request
Date: 2026-07-13

[SCOPE] → New `PENDING` status: every public submission lands here first, staff-only inbox, never auto-added to Todo/Backlog
Impact: high
Reason: Client's explicit workflow: "ill see it in my dashboard only as admin, then once i approved it will be listed in my to do list or backlog" — gives admin a bot/spam checkpoint before anything reaches the working board
Date: 2026-07-13

[SCOPE] → Accept lets admin choose the destination column (Todo or Backlog); Reject moves the ticket to CANCELLED (existing status, record kept, not deleted). Both outcomes email the requester.
Impact: medium
Reason: Confirmed directly — "we email the user that their request is either accepted or rejected"; keeping rejected tickets as Cancelled (not deleted) preserves a record consistent with how Cancelled already works for self-withdrawals
Date: 2026-07-13

[SECURITY] → Admin-only email blocklist. A blocked sender's submission does not create a ticket, but they still see the same generic success response as anyone else
Impact: medium
Reason: Client's own framing — "as an admin i'll have a list of the block, the user doesn't/can't see it" — silent drop avoids tipping off bots/spammers that they've been specifically identified, while sparing admin's inbox from repeat spam
Date: 2026-07-13

[SCHEMA] → `Ticket.createdById` becomes nullable; new `requesterName`/`requesterEmail` plain string fields for public submissions (not a User relation)
Impact: high
Reason: Matches the client's stated mental model exactly ("we just need their email and name") — no shadow/passwordless User record needed. Staff-created tickets (Quick Add) still set `createdById` normally; comments/activity-log actors remain real Users since only staff interact with tickets going forward.
Date: 2026-07-13

[ARCH] → Register/Login pages are NOT removed — repurposed as the staff-onboarding path (a new hire registers, an existing admin promotes them via the T004b role-management endpoint)
Impact: low
Reason: Avoids building a separate "invite staff" flow from scratch when register+promote already covers the same need now that register is no longer client-facing
Date: 2026-07-13

---
