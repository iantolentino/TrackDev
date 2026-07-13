# CURRENT STATE

> The AI reads this file at the start of every EXECUTION_MODE session.
> Update this file at the end of every session — before stopping.

---

## System State
EXECUTION_MODE

## Current Phase
MVP

## Last Completed Task
T029 — Public read-only roadmap (/board) + admin Public/Private per-ticket toggle
Completed: 2026-07-14

## Next Task
T018 is now LIVE, not just planned — dev.stratastaff.com is deployed and working (see session note
below for the full runbook-execution trace, including the migration casing bug hit and fixed).
Remaining: wire up outbound email (EMAIL_USER/EMAIL_PASS) — blocked on the Microsoft 365 tenant
not allowing legacy app passwords; user deferred this, deploy proceeded without it.
(T016/T017 — Phase 3 Scaling — still pending, lower priority)

## Active Blockers
- Outbound email not yet configured in production. Microsoft 365 tenant has no "App password" option
  in Security Info (legacy basic auth disabled org-wide) — user deferred to a later session rather
  than pursue Graph API/OAuth2 or a third-party provider (Resend/SendGrid) mid-deploy. App runs fully
  without it (logs a warning, skips sending); admin reviews Pending requests directly on the board.

## T029 — Public Read-Only Roadmap + Visibility Toggle (2026-07-14)
User, after seeing the live deployed site: "i want the users to see the list, like what admin sees
but they cannot edit... admin [has] option to public it or private." Clarified via AskUserQuestion:
anonymous public visitors (no client accounts reintroduced), full ticket detail (title, description,
category, dates — no assignee/priority/requester info), per-ticket toggle defaulting to **Public**.
- Schema: `Ticket.isPublic Boolean @default(true)`. Migration `20260713231559_add_ticket_public_visibility`
  — hit the *same* case-sensitivity bug as T020 (Prisma generated `` `ticket` `` lowercase on Windows;
  fixed to `` `Ticket` `` before committing, learned from the production incident below).
- Backend: `GET /api/public/board` (public controller) — returns tickets where `isPublic: true` AND
  `status NOT IN (PENDING, CANCELLED)` (unreviewed/rejected tickets aren't useful to show visitors).
  `PATCH /api/tickets/:id/visibility` (staff-only) toggles it, logs an activity entry.
- Frontend: new `PublicBoardPage.tsx` at `/board` — read-only Kanban-style columns (Backlog → Complete),
  no drag/drop, no edit controls, using the restricted `PublicBoardTicket` type (no assignee/priority/
  requester fields ever sent to this endpoint in the first place — enforced server-side via Prisma
  `select`, not just hidden client-side). Added shadcn `Switch` component. `TicketCard.tsx` gained a
  Public/Private switch in the card header (staff-only, all ticket states). Cross-linked from
  `RequestStatusPage.tsx` ("View public roadmap").
- Verified live end-to-end: curl-submitted a ticket, confirmed absent from `/api/public/board` while
  PENDING, accepted it to TODO, confirmed it appeared with `isPublic` defaulting true, toggled false/
  true via the real API and reconfirmed each time, then Playwright-screenshotted both `/board` (public,
  no edit UI) and the staff board (showing the live toggle switch) against the real running app.
  Test data cleaned up afterward.

## T028 — Deployed to Production: dev.stratastaff.com (2026-07-13/14)
Actually executed the cPanel runbook live with the user (not just planning it) — walked through
every step interactively over many messages. Key incidents worth remembering:
- **Two nested `.git` dirs blocked repo init** (`_brain/.git` had real history from the AI Nexus
  template; `frontend/.git` was an empty scaffold artifact from shadcn/vite's own `git init`). Got
  explicit per-directory user confirmation before deleting either (auto-mode's safety classifier
  correctly required two separate confirmations, not one blanket answer).
- User forked the repo to `stratastaffglobal-webs/TrackDev.git` for the org — that fork is now the
  one cPanel actually deploys from. `iantolentino/TrackDev.git` (personal) is a step behind unless
  manually synced; **always push fixes to the personal repo, then remind the user to click GitHub's
  "Sync fork" button**, since this session has no push credentials for the org fork.
- **cPanel Node.js App root gotcha**: creating the app first, then changing "Application root" to
  point at a path with existing files, corrupts the passenger app registration ("Unable to find app
  venv folder"). Fix is destroy + recreate with the correct root from the start — don't try to
  rename an existing app's root after the fact.
- **DATABASE_URL silently lost its password** when entered via cPanel's env-var UI (displayed as
  `mysql://user:@localhost/db` with nothing between `:` and `@`). Cost one full `migrate deploy`
  attempt (P1000 auth failure) before catching it. Always re-verify the full value after saving,
  don't trust that what you typed is what got stored.
- **Same table-name casing bug hit in production that was already fixed once in T020's migration**
  (`ticket`/`activitylog` lowercase vs `Ticket`/`ActivityLog` in the actual schema) — Windows/local
  MariaDB is case-insensitive on table names, Linux cPanel MySQL is case-sensitive by default. This
  is now a known recurring risk: **any hand-inspected Prisma-generated migration should be checked
  for this before it's trusted**, not just the one time it broke deploy. Fixed via `prisma migrate
  resolve --rolled-back` (the failed migration errored on its very first statement, so nothing had
  actually applied) then re-deploying after the SQL fix.
- Two cPanel env-var name fields got corrupted to blank (`ADMIN_EMAIL`/`ADMIN_PASSWORD` saved as
  `=value` with no name) after an earlier edit — cPanel UI bug, not something reproducible on our
  end; fix was just delete-and-re-add the two rows cleanly.
- Frontend deploy: `Compress-Archive` on Windows **does** include dotfiles like `.htaccess` (verified
  by inspecting the zip's actual entries before telling the user to upload) — this was a real risk
  worth checking rather than assuming, since a missing `.htaccess` would have silently broken every
  route except `/` on first hard refresh.
- Outbound email deliberately deferred — see Active Blockers above.
- End state: **dev.stratastaff.com is live**, admin login confirmed working with real seeded
  credentials (`ian@stratastaffglobal.com`), `/api/health` returns ok, database schema fully migrated,
  frontend serving correctly with SPA routing intact.

## T028 — Git Repo Init + Push (2026-07-13, precedes the deploy above)
User provided github.com/iantolentino/TrackDev.git and asked to prepare the repo ahead of cPanel
deploy. Project had never been under version control (no root .git). Two blockers found and
resolved with explicit user confirmation before any deletion:
- `_brain/.git` — a real nested repo with its own commit history (from the AI Nexus template
  origin). User explicitly confirmed: fold it in as regular files, commit history discarded (its
  file *contents* are preserved and now versioned as part of TrackDev's own history going forward).
- `frontend/.git` — an empty nested repo (zero commits) left by the shadcn/vite scaffold's own
  `git init`. User separately confirmed deletion of this one too (auto-mode's safety classifier
  correctly required a second, distinct confirmation since the first answer only named `_brain`).
Added root `.gitignore` (node_modules, .env, dist, backend/uploads, editor files) — verified via
`git status --short` that only `.env.example` templates staged, no real `.env`/secrets. Committed
231 files (full app + `_brain` history) to `main`, added `origin`, pushed successfully.
Repo is now live at https://github.com/iantolentino/TrackDev.git, ready for T018 (cPanel pull/deploy).

## T027 — Board Layout: Column-Only Scroll + Sort (2026-07-13)
User: "update the columns only is the scrollable not the whole page... list can be sorted via time."
- `BoardPage.tsx`: root changed from `min-h-svh` (page grows/scrolls) to `h-svh overflow-hidden`
  (viewport-locked); Navbar and filter bar are now fixed, only the column row area is `flex-1
  min-h-0 overflow-x-auto`.
- `BoardColumn.tsx`: each column is now `h-full` with its header fixed (`shrink-0`) and its ticket
  list as an independent `flex-1 min-h-0 overflow-y-auto` region — this is the actual "columns
  scroll, not the page" behavior requested.
- Added a Newest/Oldest sort `Select` next to the existing filters, sorting all columns by
  `createdAt`.
- Folded the old separate "Show cancelled" block into the main column row (toggled into
  `columnStatuses` instead of a second DOM section below) — keeps the single-row-scrolls-together
  layout consistent instead of having an orphaned section that would defeat the fixed-viewport goal.
- Verified live via Playwright against real seeded dev data (12-ticket Todo column): screenshot
  confirms navbar/filter bar pinned, columns independently scrollable, whole page static.

## T026 — Public Request-Status Lookup (2026-07-13)
User asked "where can I see as client the list of approves?" — there was no answer, since the
pivot removed client accounts entirely and requesters only ever got email notifications. Follow-up
request: make `/request` the client-facing list, and move the submission form behind a button.

Implementation:
- Backend: `GET /api/public/tickets?email=...` (new, in `publicController.js`/`publicRoutes.js`,
  no auth) — strict exact-match on `requesterEmail`, returns only `id/title/category/status/
  dueDate/createdAt` (no description/attachments/internal fields). Scoped so a caller can only ever
  see their own submissions — email is effectively the (weak, un-verified) credential here, an
  accepted tradeoff for a low-stakes MVP status check, not a real auth mechanism.
- Frontend: new `RequestStatusPage.tsx` now owns route `/request` — email field + "View requests"
  button, renders each ticket as a card with a live status badge (`STATUS_BADGE_CLASSES`), an empty
  state via `Empty` if none found, and a "Submit a new request" button linking to `/request/new`.
- `RequestFormPage.tsx` (the actual submission form) moved from `/request` to `/request/new`;
  its post-submit thank-you screen now also links back to `/request` to check status.
- `publicService.ts` gained `getMyRequests(email)`; `types/index.ts` gained `PublicTicketSummary`.
- Verified live: curl-submitted a test ticket, confirmed `GET .../tickets?email=...` returns it and
  rejects malformed emails with 400; Playwright screenshot of `/request` (empty + button state),
  `/request/new` (form), and a filled email-lookup showing the real "Pending Review" badge
  end-to-end through the actual running app. Test ticket deleted afterward; dev servers stopped.

## T019 — UI Polish Pass (2026-07-13)
Audited every frontend page/component against `.agents/skills/shadcn/SKILL.md` Critical Rules.
Findings and fixes:
- `RequestFormPage.tsx`: name/email responsive row used raw `div className="flex flex-col gap-2"`
  instead of nested `Field` inside `Field orientation="responsive"` — replaced with proper `Field`
  composition (matches the pattern already used for every other field in the same form).
- `RequestFormPage.tsx`: success-state `CheckCircle2Icon` had a manual `text-emerald-600
  dark:text-emerald-400` override — removed; `EmptyMedia variant="icon"` already themes it via
  semantic tokens.
- `QuickAddDialog.tsx`: same raw-`div`-instead-of-`Field` pattern in both responsive rows
  (category/priority, column/deadline) — fixed identically.
- `ActivityLogDialog.tsx`: loading state was a plain `<p>Loading...</p>` — replaced with 3
  `Skeleton` placeholders per the "use Skeleton for loading, no custom text/pulse divs" rule.
- Checked and passed clean (no changes needed): `TicketCard.tsx`, `BoardColumn.tsx`,
  `BoardPage.tsx`, `Navbar.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `DraggableTicketCard.tsx` —
  no `space-x-*`/`space-y-*`, no unequal `w-*`/`h-*` masquerading as `size-*`, icons inside
  `Button` already correctly use `data-icon`/no manual sizing, `Empty`/`Alert`/`Badge`/`Skeleton`
  already used instead of custom markup where applicable.
- `STATUS_BADGE_CLASSES`/`STATUS_DOT_CLASSES` in `ticket-constants.ts` intentionally kept as raw
  Tailwind color utilities (not semantic tokens) — deliberate, pre-existing exception from T025:
  shadcn's built-in Badge variants (default/secondary/destructive/outline) can't express 7 distinct
  statuses, so a dedicated light+dark color pair per status is the correct call here, not a rule
  violation to "fix."
- Verified: `npm run typecheck` clean; started both dev servers, screenshot-verified the rebuilt
  `/request` form renders correctly with no layout regression; servers stopped after verification.

## Session Notes
- Full spec confirmed 2026-07-02: Kanban board (6 statuses incl. hidden Backlog/Cancelled), 3-tier priority set by admin/dev only, restricted admin edit scope on client tickets, admin Quick Add for internal tickets, dual email triggers. See `decisions/decision_log.md` for full rationale.
- `shadcn` and `ponytail` (+ audit/debt/gain/help/review) skills installed project-locally via `npx skills add` into `.agents/skills/` — takes effect on next session start.
- T001 done: `backend/prisma/schema.prisma` created and validated (`npx prisma validate` + `npx prisma generate` both pass). `backend/package.json`, `.env`, `.env.example`, `.gitignore` also created — minimal, prisma-only deps for now; T002 adds express/jwt/bcrypt/etc.
- Prisma pinned to 5.22.x, not latest 7.x — Prisma 7 requires driver adapters + prisma.config.ts, dropping classic `datasource url`; unproven on cPanel shared hosting.
- Attachments modeled as their own `Attachment` model, not `String[]` — MySQL doesn't support Prisma scalar lists.
- Internal admin notes = `Comment.isInternal` flag, reusing the Comment model rather than a new one.
- T002 done: `backend/src/index.js` (Express app, cors/json/static-uploads/health/404/error middleware), `src/middleware/auth.js` (verifyToken/isAdmin/isAdminOrDev), `src/utils/jwt.js` (signToken/verifyToken), `src/config/database.js` (Prisma singleton). Verified live: server started, `GET /api/health` → 200, unknown route → 404, then cleanly stopped.
- Bumped bcrypt→6.x, nodemailer→9.x, multer→2.x during `npm install` — README's originally suggested versions had 4 high-severity CVEs per `npm audit`. Now 0 vulnerabilities.
- T003 done: `src/controllers/authController.js` (register/login), `src/routes/authRoutes.js`, `src/utils/asyncHandler.js`, mounted at `/api/auth`. Register silently drops any client-supplied `role` (always creates USER) — closes a privilege-escalation hole present in the original README spec.
- Local dev DB now live: MariaDB 10.4 via Laragon, database `trackdev_dev`, `DATABASE_URL` in `backend/.env` points at it, initial migration applied (`prisma migrate dev --name init`). Verified live via curl: register (role-injection ignored), duplicate email → 409, login correct → token, wrong password → 401 generic.
- T003b done: `prisma/seed.js` (idempotent upsert on email), wired via `"prisma": {"seed": "node prisma/seed.js"}` in package.json + `npm run db:seed`. Reads `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` env vars with dev-only fallback defaults (`admin@trackdev.local` / `ChangeMe123!`), documented in `.env.example`. Verified live: seeded, re-ran (still exactly 1 admin row, same id), logged in via `/api/auth/login` and confirmed `role: "ADMIN"` in the response.
- Local dev admin login for manual testing: `admin@trackdev.local` / `ChangeMe123!` (default, not for any real deployment — must set `ADMIN_PASSWORD` before seeding a real environment).
- T004 done: `src/controllers/ticketController.js` + `src/routes/ticketRoutes.js`, mounted at `/api/tickets`. GET/POST open to any authenticated user; PUT + PATCH /status are `isAdminOrDev`-gated; DELETE is `isAdmin`-gated; PATCH /cancel is open but self-ownership-checked inside the handler.
- Ran 17 live HTTP test cases against the dev DB covering: client-create defaults (forced TODO/MEDIUM regardless of body), admin quick-add defaults (BACKLOG), Backlog hidden from client list + single-GET (404), locked-field 403 on client tickets vs full edit on staff's own tickets, status-only-via-PATCH, client self-cancel (200), double-cancel (409), cross-user cancel (403), non-admin delete (403) vs admin delete (204 + confirmed gone). All passed.
- Judgment call logged: added `category` to the client-locked-field list (title/description/deadline were explicit; category wasn't named but the audit-trail rationale applies the same way) — flag to the user if that's not what they meant.
- `PUT /:id` cannot change `status` at all now, even on staff's own tickets — only `PATCH /:id/status` can, giving T005 a single hook point for the email trigger.
- T005 done: `src/services/emailService.js` (`notifyAdminsOfNewTicket`, `notifyRequesterOfStatusChange` — the latter no-ops unless the new status is IN_PROGRESS/AWAITING_INFO/COMPLETE). Wired into `createTicket` (client submissions only) and `changeStatus`. Verified live via server logs: submit → admin-notify attempt logged to both seeded admins; → TODO/BACKLOG → silent (correctly excluded); → IN_PROGRESS/COMPLETE → requester-notify attempt logged.
- User supplied a real email (ian@stratastaffglobal.com, Outlook) — seeded as a second real ADMIN account so notifications have a real inbox. EMAIL_USER/EMAIL_PASS are still unset (no real SMTP send possible in this sandbox either way), so actual delivery is unverified — only the trigger logic is proven.
- RESOLVED: user confirmed all org users share one mail format/provider (Microsoft 365). Switched `emailService.js` transporter from Gmail to Office365/Outlook SMTP (`smtp.office365.com:587`, STARTTLS). `.env.example` updated with Office365 auth notes (app password if MFA is on; SMTP AUTH may need enabling tenant-wide). Re-verified live after the switch: skip-path still logs correctly with EMAIL_USER/EMAIL_PASS unset.
- T006 done: `src/controllers/commentController.js` + `src/routes/commentRoutes.js`, mounted at `/api/tickets/:ticketId/comments` (mergeParams). Any user who can view a ticket can comment on it — same Backlog-hidden-from-clients rule as the ticket endpoints (404, not 403, on both GET/POST). `isInternal` notes: only staff can set the flag (client attempts are silently forced false, verified), and non-staff never see internal comments in the list response at all (filtered server-side, not just flagged).
- Verified live: client comment (plain + injection attempt), admin internal note, client list (internal hidden) vs admin list (internal visible), Backlog-ticket comment access blocked for client on both GET and POST, empty/whitespace-only content → 400.
- **Backend MVP core (T001–T006) is now functionally complete and live-tested end-to-end** against the real dev DB: auth, seeded admin, full ticket lifecycle with role-scoped editing, email triggers, comments/internal notes. Remaining backend work: T004b (admin user management), T012 (file upload wiring).
- T007 done: `frontend/` scaffolded via `npx shadcn@latest init --template vite --preset nova --base radix` (React 19, Tailwind v4, `@/` aliases, radix-nova style). Installed react-router-dom@6.30.4 (deliberately not v7 — no data-router needs), zustand, axios (0 vulnerabilities). Folder skeleton created: `components/{auth,board,tickets,admin,shared}`, `pages/`, `store/`, `services/` (`api.ts` — axios instance + baseURL only, no auth interceptor yet), `types/index.ts` (mirrors the Prisma schema: Role/Status/Priority/Ticket/Comment/AuthUser). `.env`/`.env.example` with `VITE_API_URL`.
- Fixed a real out-of-the-box break: `npm run lint` failed on the CLI's own generated `button.tsx` (react-refresh rule vs shadcn's `buttonVariants` co-export pattern) — added `allowConstantExport: true`, the same fix Vite's own React template uses. Verified: typecheck clean, build clean, lint clean (1 benign warning), dev server serves real content on port 5174.
- RESOLVED: user confirmed port 5173 is permanently used by another of their projects. Pinned frontend dev server to port 5174 (`strictPort: true` in vite.config.ts — fails loudly instead of silently drifting), updated `backend/.env` and `.env.example` `CLIENT_URL` to `http://localhost:5174` to match. Re-verified live: dev server binds exactly 5174, no fallback message.
- `frontend/` has its own nested `.git` (created automatically by the shadcn CLI's Vite scaffolder), same pattern as `_brain/` already being its own nested repo — the TD root itself is not a git repo.
- App.tsx is still the unmodified CLI placeholder ("Project ready!" + demo Button) — intentionally left as-is since it already proves shadcn/Tailwind render correctly; T008 will replace it with real routing + pages rather than wiring routes now and re-touching immediately after.
- T008 done: `store/useAuthStore.ts` (Zustand + persist, localStorage key `trackdev-auth`), `services/api.ts` extended with a request interceptor (attaches `Authorization: Bearer` from the store) and a response interceptor (auto-logout on any 401), `components/shared/ProtectedRoute.tsx` (redirects to /login if no token; optional `allowedRoles` for future role-gated routes), `pages/LoginPage.tsx` + `pages/RegisterPage.tsx` (shadcn Field/FieldGroup/Card/Alert per the shadcn skill's rules — no raw divs). `App.tsx` rewritten with `BrowserRouter`: `/login`, `/register`, protected `/` (currently a minimal placeholder — real Board page is T009). Added shadcn `input`, `field`, `card`, `alert`, `label`, `separator` components.
- **Verified in a real browser** (Playwright/headless Chromium, since `chromium-cli` wasn't available in this environment — used a one-off scratchpad script instead, not committed): logged-out → redirects to /login (screenshot confirmed real rendered form, not blank); login with seeded client → redirects to / and shows "Signed in as Test Client (USER)" with working Log out; wrong password → inline red "Invalid email or password" alert with `data-invalid` styling on both fields (screenshot confirmed); register with a fresh email → auto-logs-in and redirects to /. Only console message across the whole run was the *expected* 401 from the intentional bad-password test — no unexpected errors.
- Recommend running `/run-skill-generator` at some point to capture this browser-driven verification flow (dev server ports, seeded test accounts, Playwright driver) as a proper project skill for `run`, since it had to be improvised this time (`chromium-cli` unavailable, used raw Playwright in a scratch dir instead).
- T009 done: `lib/ticket-constants.ts` (status/priority labels, badge variants, visible-status list), `services/ticketService.ts` (thin wrappers over the ticket API), `components/shared/Navbar.tsx` (app title + user + logout, reused across pages), `components/board/TicketCard.tsx` + `BoardColumn.tsx`, `pages/BoardPage.tsx`. `App.tsx`'s `/` route now renders the real board instead of the placeholder. Added shadcn `select`, `badge`, `alert-dialog`, `skeleton`, `avatar`, `empty`.
- Client sees 4 columns (Todo/In Progress/Awaiting Info/Complete), staff sees 5 (+ Backlog); Cancelled is hidden behind a "Show cancelled (n)" toggle for everyone. Staff get per-card Priority + Status selects and an Assign-to-me/Unassign-me toggle; clients get a Withdraw button on their own still-open tickets only.
- **Verified in a real two-session browser test** (Playwright, separate contexts for client vs admin login): client's board correctly has no Backlog column and never sees the admin's internal-idea card; admin's board shows Backlog with both real tickets; changed a client ticket's status via the dropdown (Todo → In Progress) and watched it actually move columns; used "Assign to me" and confirmed "Assigned to Admin" appeared on the card. Zero console errors in either session.
- **Found and fixed a real bug via screenshot review** (not caught by typecheck/lint/build): staff saw a redundant "Withdraw" button on tickets *they themselves* created (e.g. admin's own quick-add idea), duplicating what the Status dropdown already does. Fixed by scoping Withdraw to `isOwnTicket && !isStaff` — re-verified live that it's gone from staff's own cards.
- Queued two follow-ups rather than silently dropping them: T013b (board filters/search — was CORE in the original README, not explicitly in T009's scope) and T013c (real assignee picker once T004b's user-list endpoint exists — for now it's self-assign/unassign only).
- T010 done: `pages/RequestFormPage.tsx` (title/category/description/optional-deadline, no priority field per the confirmed spec), `createTicket` added to `services/ticketService.ts`, route `/request` (protected), a "New request" nav link added to `Navbar.tsx`, `<Toaster />` mounted in `App.tsx`. Added shadcn `textarea`, `sonner`. Category is a fixed 5-option Select (Bug/Feature Request/Improvement/Question/Other), not free text.
- Client-side quality gates (title ≥5 chars, description ≥20 chars, category required, deadline can't be in the past) directly implement the client's explicit ask that "the form must properly formatted and the user must give detail properly" — these are UX gates only, backend still just requires non-empty strings.
- **Verified live in browser**: empty submit blocked with all 3 field errors shown inline; too-short title/description still blocked; valid submit → toast "Request submitted" → redirected to board → new ticket visible and confirmed specifically inside the **Todo** column (not Backlog) with the deadline rendered on the card; past-date deadline blocked with its own inline error. Zero console errors across the whole run.
- T011 done: `components/board/QuickAddDialog.tsx` (title/category/priority/description/column/deadline, `status` defaults to Backlog but staff picks any of the 5 visible columns), wired into `BoardPage.tsx` gated by `isStaff`. `CATEGORIES` moved to `lib/ticket-constants.ts` so Request Form and Quick Add share the same list. `createTicket`'s `CreateTicketInput` extended with optional `priority`/`status` (staff-only fields; backend already silently ignores them for non-staff callers).
- **Verified live**: client never sees the Quick Add button at all (count 0); admin sees it, empty submit blocked inline with dialog staying open; filled it out targeting the Awaiting Information column with High priority → new card appeared correctly inside **that exact column** with the High badge. Zero console errors.
- **Found and fixed a UX bug via screenshot review**: the inline validation error didn't clear at the start of a new submit attempt (only on success), so a stale message could linger. Fixed by moving `setError(null)` before the validation check.
- No route files mounted yet in index.js beyond `/api/auth` — ticket/comment routes don't exist until T004/T006 — each future task adds its router with a minimal diff to index.js.
- T012 done: `backend/src/utils/upload.js` (multer diskStorage, MIME allowlist, 5MB/5-file limits, random filenames), wired into `POST /api/tickets` via `uploadAttachments` middleware; `createTicket` nests `attachments: { create: [...] }` from `req.files`. Frontend: `services/api.ts` exports `API_ORIGIN`; `ticketService.createTicket` now builds `FormData` (accepts optional `files: File[]`); `RequestFormPage.tsx` gained a file input (chips with remove buttons, 5-file/5MB client-side pre-filter); `TicketCard.tsx` renders attachment links (`${API_ORIGIN}${path}`, opens in new tab).
- **Found and fixed a real bug via network tracing, not just UI testing**: the shared axios instance's hardcoded `Content-Type: application/json` default silently broke every FormData upload — axios JSON-serialized the FormData instead of sending multipart (confirmed by comparing to a raw `fetch()` with identical FormData, which worked correctly). Removed the redundant default header entirely; axios auto-sets JSON content-type for plain objects anyway. Fixed uploads without touching any other request.
- **Verified live end-to-end** (backend via curl multipart, frontend via Playwright): valid image upload → attachment persisted with correct `filename`/`path`, servable via `/uploads/...` (200); disallowed file type (`.exe`) → 400 with clear error, both directly against the API and through the actual form (inline error shown, stayed on page); plain JSON ticket creation (no files) still works unchanged; uploaded file's link on the board card is clickable and fetches 200. Zero console errors throughout.
- Chased down an apparent regression where an old T008-era Playwright script (`verify.js`) reported login failing — root-caused via direct network tracing to a stale test assumption, not an app bug: that script waits for literal text "Signed in as ...", which only existed on the placeholder home page App.tsx had *before* T009 replaced it with the real Board page (whose `Navbar` shows `{name} ({role})` without that prefix). Confirmed login itself works correctly (200, valid token, correct redirect) via both a raw network trace and a direct `/api/auth/login` curl call. No code changes needed for this; noting it so a future session doesn't re-chase the same false alarm.
- T013 done: `frontend/public/.htaccess` (SPA rewrite rules) — placed in `public/` specifically so Vite auto-copies it into `dist/` on every build (verified: built, confirmed present in `dist/.htaccess`), no manual copy step at deploy time like the original README assumed. Rewrote `_brain/deployment/deployment.md` and `_brain/deployment/environments.md` from generic starter templates into TrackDev-specific cPanel steps (Node.js App setup, MySQL, `prisma migrate deploy` + `db:seed`, frontend static build/upload) and the full real env var reference (local values used this session vs. what production needs). Cross-checked every command/var against actual `package.json` scripts and `.env.example` — no discrepancies.
- **MVP Phase 1 core is now complete (T001–T013)**: full backend (auth, tickets, comments, email, uploads), full frontend (auth pages, board, request form, quick add), and deployment docs/config. Remaining backlog items are all explicitly lower-priority/deferred, not gaps: T004b (admin user management — needed for T013c), T013b (board filters/search), T013c (real assignee picker, depends on T004b). Phase 2 (T014 drag-and-drop, T015 activity log) and Phase 3 (T016 email provider swap, T017 SLA alerts) are Scale Prep/Scaling, not MVP.
- T004b done: `backend/src/controllers/adminController.js` (`getUsers`, `updateUserRole`) + `src/routes/adminRoutes.js`, mounted at `/api/admin` (both routes `isAdmin`-gated). `GET /api/admin/users` returns id/name/email/role/createdAt/updatedAt — no password field. `PUT /api/admin/users/:id` validates the target role against the enum and blocks demoting the *last* remaining ADMIN (counts other ADMINs first) to prevent a full lockout.
- **Verified live against the real dev DB**, including cleanup of the state changes the test itself made: non-admin GET → 403; admin GET → full list, no password leaked; promoted `client@test.com` to DEVELOPER then reverted to USER (other live tests assume it's a USER); demoted one of the two seeded admins while the other still existed → 200; then tried demoting that *last* remaining admin → 400 "Cannot remove the last remaining admin"; restored the original admin's role back to ADMIN afterward. Also checked invalid role value → 400, nonexistent user id → 404. Dev DB left in its expected prior state.
- T013c done: added `GET /api/tickets/assignable-users` (`ticketController.getAssignableUsers`, isAdminOrDev-gated, returns only ADMIN/DEVELOPER accounts) — deliberately separate from the ADMIN-only `/api/admin/users` management endpoint (see decision log). Registered before `GET /:id` in `ticketRoutes.js` to avoid route-collision (verified both resolve correctly). Frontend: `getAssignableUsers` added to `ticketService.ts`; `BoardPage.tsx` fetches the list once (staff only) and threads it through `BoardColumn` → `TicketCard`; the old "Assign to me"/"Unassign me" button replaced with a `Select` showing "Unassigned" + every assignable staff member by name.
- **Verified live in browser**: client sees zero priority/status/assignee controls (still fully staff-gated); admin's card shows a real assignee dropdown defaulting to "Unassigned," listing all seeded ADMIN/DEVELOPER accounts by name; selecting one persists and the card immediately shows "Assigned to \<name\>". Backend re-verified directly too: client gets 403 on the new endpoint, admin gets the correct staff-only list (no client accounts leaked). Zero console errors.
- Board/assignment MVP surface is now fully closed out: T009, T011, T013c together give staff full card control (priority, status/column, real assignee, quick-add) with nothing left as a stub.
- T013b done: added a filter bar to `BoardPage.tsx` — title search (`Input`), priority `Select` (+ "All priorities"), category `Select` (+ "All categories" using the shared `CATEGORIES` list), and a "Clear filters" button that appears only when a filter is active. Filtering is client-side via a `useMemo` over the already-fetched ticket list (see decision log for why not server-side/why no status filter — the columns already are the status view). `BoardColumn` now receives `filteredTickets` instead of the raw list; Cancelled-column count/contents also respect the active filters.
- **Verified live in browser**: seeded a uniquely-named/categorized/prioritized ticket ("Filter test: unique zephyr ticket", HIGH, Question); searching "zephyr" narrowed 17 cards → 1 (the right one); "Clear filters" restored all 17 and emptied the search box; priority filter "High" narrowed to exactly the 2 HIGH-priority tickets present; category filter "Question" narrowed to exactly 1 (the seeded ticket), with empty columns correctly showing "No tickets here." and a 0 count. Zero console errors throughout.
- **MVP Phase 1 is now fully complete**: every backlog item at MVP priority (T001–T013, T004b, T013b, T013c) is done and live-verified — full backend, full frontend, deployment docs, admin tooling, board polish. Nothing left as a stub or hidden gap.
- T014 done (Phase 2 — Scale Prep): installed `@dnd-kit/core` + `@dnd-kit/utilities` (not `react-beautiful-dnd` — unmaintained, breaks under React 18+/19 concurrent rendering; see decision log). New `components/board/DraggableTicketCard.tsx` wraps `TicketCard` with `useDraggable` (disabled for non-staff); `BoardColumn.tsx` is now a `useDroppable` zone (disabled for non-staff, highlights via `isOver`); `BoardPage.tsx` wraps the main columns in `DndContext` with a `PointerSensor` (8px activation distance, so ordinary clicks on card Selects don't get swallowed as drags), `onDragEnd` calls the existing `changeTicketStatus` service function, and a `DragOverlay` shows a lightweight floating preview while dragging. Drag is scoped to the main visible columns only — no within-column reordering (no ordering field in the data model) and the toggle-hidden Cancelled column isn't a drop target (Status Select already covers cancelling). Status Select stays on every card as the accessible fallback.
- **Verified live with real simulated mouse drags** (not clicks): first attempt used an ambiguous Playwright column locator (`div` + `has:` matched an oversized outer wrapper, not the specific column) which made it look like the drag silently failed — caught this via a screenshot + direct backend status check before concluding anything, then fixed the test to target the column's actual `div.w-72` element specifically. With correct targeting: dragging a Todo card onto In Progress correctly moved it (confirmed both in the UI and via a direct API check that `status` was `IN_PROGRESS` server-side afterward); client account has no drag capability at all (verified: card wrapper has no `cursor-grab` class for non-staff); a plain click on the Priority Select still worked normally on a draggable card (confirms the activation-distance fix prevents click/drag conflicts). Zero console errors.
- **Phase 2 (Scale Prep) is now complete: T014 and T015 both done.**
- T015 done: new `ActivityLog` Prisma model (ticketId, actorId, action string, optional detail text — migration `20260710054209_add_activity_log` applied clean) + `backend/src/services/activityService.js` (`logActivity`). Wired into `ticketController.js`: `createTicket` → `CREATED`; `updateTicket` → `PRIORITY_CHANGED` / `ASSIGNED` (snapshots the assignee's name at write time, not just the id) / `UNASSIGNED` / `UPDATED` (lists which locked fields changed, only reachable when staff edit their own ticket); `changeStatus` and `cancelTicket` → `STATUS_CHANGED` (old → new). New `GET /api/tickets/:id/activity` (same Backlog-hidden-from-client 404 rule as the ticket itself, no separate internal/external split like Comments — none of the tracked actions reveal anything sensitive). Frontend: `ActivityLogEntry` type, `getTicketActivity` in `ticketService.ts`, `ACTIVITY_ACTION_LABELS` in `ticket-constants.ts`, new `components/board/ActivityLogDialog.tsx` (lazy-loads on open) wired into every `TicketCard` via a "History" button visible to all roles.
- **Verified live**: ran all 5 write paths via curl against the real dev DB (create → priority change → assign → unassign → status change) and confirmed the log returned all 5 entries in correct chronological order with correct actor names and human-readable detail text (e.g. "MEDIUM → HIGH", "Assigned to Admin"); confirmed the cancel path also logs correctly ("IN_PROGRESS → CANCELLED"); confirmed Backlog-ticket activity is 404 for clients and nonexistent-ticket activity is 404. Then verified the frontend "History" dialog in a real browser — opened it on a card, confirmed it lazy-loaded and rendered "Admin — Created the ticket" with a real timestamp. Zero console errors.
- **MVP (Phase 1) + Scale Prep (Phase 2) are both fully complete.** Only Phase 3 (Scaling) items remain: T016 (swap Office365 SMTP for a dedicated transactional email provider) and T017 (SLA/deadline-breach alerts) — both explicitly deferred-until-needed scaling work, not gaps.

## 🔴 2026-07-13 — Major pivot session (T018–T025)

Client requested, mid-session: no more client accounts — public submitters give only name +
email; admin reviews every submission in a staff-only Pending queue before Accept (choose
Todo/Backlog) or Reject (→ Cancelled); admin-only blocklist by email (silent drop, no tip-off);
whole board becomes staff-only. Full rationale in `decisions/decision_log.md` § MAJOR PIVOT. Also:
deploy target confirmed as `dev.stratastaff.com`, 4 more skills installed, light/dark toggle +
status colors requested.

- Installed skills: `andrej-karpathy-skills`, `claude-mem` (bundled ~17 skills: babysit, do,
  make-plan, mem-search, smart-explore, standup, timeline-report, weekly-digests, learn-codebase,
  pathfinder, knowledge-agent, oh-my-issues, etc.), and `Leonxlnx/taste-skill` (tasteskill.dev's
  actual repo — auto-mode blocked the first install attempt because the repo was agent-discovered
  via WebFetch rather than user-named; re-confirmed with the user before installing, per the
  safety gate's own design). `ponytail` was already installed earlier in this session.
- T018: wrote the full cPanel runbook for `dev.stratastaff.com` in `deployment/deployment.md` +
  `deployment/environments.md` — single subdomain, frontend as static files + backend Node app
  path-scoped to `/api` (cPanel's Application URL supports a sub-path, avoiding a second
  subdomain). NOT executed — user chose "I write the runbook, you execute it" over sharing
  cPanel/SSH credentials in chat. Still PENDING until the user's team actually runs it.
- T020 done: migration `20260713052221_public_submission_model`. `Status` gained `PENDING`.
  `Ticket.createdById` is now nullable (`User?` relation); added `requesterName`/`requesterEmail`
  plain string fields for public submissions — deliberately NOT a shadow/passwordless User record,
  matching the client's literal ask ("we just need their email and name"). `ActivityLog.actorId`
  also made nullable (public submissions have no staff actor for their CREATED entry). New
  `BlockedEmail` model (email unique, reason, blockedBy → User, createdAt).
- T021 done: `backend/src/controllers/publicController.js` + `routes/publicRoutes.js`, mounted at
  `/api/public` with **no** `verifyToken`. Validates name/email/title/description/category +
  email format regex; checks `BlockedEmail` — if blocked, returns the identical `201 {success:true}`
  response as a real submission but creates nothing (silent drop, no tip-off — client's exact
  framing). Otherwise creates a `PENDING` ticket, logs a `CREATED` activity entry with `actorId:
  null`, and emails all admins.
- T022 done: `acceptTicket` (`PATCH /:id/accept`, body `targetStatus: TODO|BACKLOG`) and
  `rejectTicket` (`PATCH /:id/reject`, → `CANCELLED`) added to `ticketController.js`, both
  `isAdminOrDev`-gated, both only valid on `PENDING` tickets (409 otherwise). New
  `notifyRequesterOfDecision(ticket, 'accepted'|'rejected')` in `emailService.js`. The old
  self-service `cancelTicket`/`PATCH /:id/cancel` was removed entirely (dead now — no client login
  to self-cancel with). `changeStatus` (the normal status-Select endpoint) now explicitly rejects
  `PENDING` tickets with 400 "must be accepted or rejected, not moved directly" — closes a real
  gap where the generic endpoint could otherwise silently bypass the review gate and the
  accept/reject emails.
- T023 done: `getBlockedEmails`/`addBlockedEmail`/`removeBlockedEmail` in `adminController.js`,
  mounted under the existing `isAdmin`-gated `/api/admin` router as `/blocked-emails`.
- **Whole board tightened to staff-only**: `ticketRoutes.js`'s router-level middleware is now
  `verifyToken, isAdminOrDev` (was just `verifyToken`) — GET list/single/activity, assignable-users,
  and comments (`commentRoutes.js` too) all now require staff, closing a gap where a lingering
  legacy `USER`-role account could otherwise still read the board.
- **Verified live end-to-end via curl** before touching any frontend code: valid public submission
  → `201 {success:true}`, ticket confirmed `PENDING` with `createdBy: null` and
  `requesterName`/`requesterEmail` set; missing-fields and invalid-email → 400; legacy USER-role
  account hitting `GET /api/tickets` → now 403 (was 200 before this pivot); accept → `TODO`,
  activity logged; direct `changeStatus` on a still-`PENDING` ticket → 400 as designed; reject →
  `CANCELLED`; blocklist add → 201, submission from that exact email → still `201
  {success:true}` but **zero** tickets actually created (checked via count query), list/duplicate
  (409) all correct.
- T024 done (frontend): `types/index.ts` — `Status` gained `PENDING`, `Ticket.createdBy`/
  `createdById` now nullable + `requesterName`/`requesterEmail` added, new `BlockedEmailEntry`
  type. New `services/publicService.ts` — deliberately a **separate plain axios instance**, not
  the shared `api` (which attaches a bearer token and 401-triggers `logout()` — neither is correct
  for an anonymous endpoint). New `services/adminService.ts` (blocklist CRUD). `ticketService.ts`:
  `cancelTicket` replaced with `acceptTicket`/`rejectTicket`.
  `RequestFormPage.tsx` rewritten as fully public (no `Navbar`, no `ProtectedRoute` — it's outside
  the protected route group in `App.tsx` now) with Name + Email fields and a post-submit
  thank-you screen (`Empty` component) instead of navigating to the now-inaccessible board.
  `TicketCard.tsx`: `PENDING` tickets show **Accept → Todo / Accept → Backlog / Reject / Block
  sender** instead of the normal Priority/Status/Assignee triad; requester email shown as a
  `mailto:` link directly on pending cards (supports "contact them first" workflow); the old
  Withdraw/`canWithdraw` self-cancel logic removed entirely (dead — no client login exists to
  self-cancel with). `BoardColumn`/`DraggableTicketCard`: Pending is neither a drop target nor
  draggable — dragging would bypass Accept/Reject's target-column choice and the decision email
  entirely, so this was closed before it could become a real bug, not discovered by a user later.
- T025 done: `Navbar.tsx` gained a real light/dark toggle button (sun/moon icon) using the
  existing `useTheme()` hook from the T007-era `ThemeProvider` (previously only reachable via a
  "press d" keyboard shortcut with no visible UI control). `lib/ticket-constants.ts` gained
  `STATUS_BADGE_CLASSES` (7-color light+dark badge palette) and `STATUS_DOT_CLASSES` (solid dot
  colors for column headers) — a dedicated small palette rather than shadcn's default Badge
  variants, since 7 distinct statuses need more differentiation than
  default/secondary/destructive/outline can express. Every `TicketCard` now shows a colored status
  badge; every `BoardColumn` header shows a matching colored dot.
- **Verified the entire pivot live in a real browser**, public form → admin board → accept, in one
  continuous flow: visited `/request` with no login (confirmed reachable), submitted a real
  request, got the "Request submitted" thank-you screen with zero console errors; confirmed the
  same form is usable at a 390px mobile viewport (fields stack correctly); logged in as admin, saw
  the new ticket in the **Pending Review** column with the requester's email shown as a live
  `mailto:` link, clicked **Accept → Todo**, watched it move columns; toggled dark mode and
  confirmed `<html>` actually gained the `dark` class with the whole board re-rendering correctly
  (status dots and badges stayed legible in both themes). Zero console errors across the whole
  session.
- **Phase 4 (Public Request Model) is now fully complete and live-verified.** Remaining backlog:
  T018 (cPanel deploy execution — runbook ready, waiting on the user's team), T019 (UI polish pass
  against the shadcn skill), T016/T017 (Phase 3 Scaling, lower priority).

---

Last updated: 2026-07-13
