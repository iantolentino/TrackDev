# SYSTEM ARCHITECTURE

> Written during SYSTEM_GENERATION (2026-07-02). Updated 2026-07-13 for the public-submission
> pivot (T020–T025) — see decision log § MAJOR PIVOT.

---

## Architecture Pattern
Modular monolith — single Express backend, single React SPA frontend, single MySQL DB. No services/queues at MVP scale.

## Layer Map
| Layer      | Technology | Responsibility                    |
|------------|------------|-----------------------------------|
| Frontend   | React 19 + TS, Tailwind v4, shadcn/ui, @dnd-kit | Board page (staff-only), public Request Form page, auth screens (staff onboarding only) |
| Backend    | Node.js + Express | REST API, staff auth, ticket lifecycle, public intake, email dispatch |
| Database   | MySQL via Prisma | Users (staff only), Tickets, Comments, ActivityLog, BlockedEmail |
| Cache      | none | not needed at this scale |
| Queue      | none | email sent synchronously via Nodemailer; revisit if volume grows |
| Auth       | JWT + bcrypt | staff-only stateless auth header; `/api/public/*` is intentionally unauthenticated |

## Data Flow
**Public submission**: anonymous browser → React SPA (`/request`, no auth) → `POST /api/public/tickets` (no `verifyToken`) → blocklist check → Prisma → MySQL (status `PENDING`, `createdById: null`, `requesterName`/`requesterEmail` set) → admin-notify email. Same generic success response whether or not a ticket was actually created (blocked senders get no signal).

**Staff/admin**: browser → React SPA (`/`, `/login`, protected) → REST API (`/api/*`, `verifyToken` + `isAdminOrDev` on nearly every route) → Express controller → Prisma → MySQL → JSON response → SPA re-renders board.

**Decision side effect**: Accept/Reject controller → `setStatus` + `logActivity` → `emailService.notifyRequesterOfDecision` → Nodemailer → Office365/Outlook SMTP (smtp.office365.com:587) → requester inbox.

## External Integrations
- Office365/Outlook SMTP (Nodemailer) — transactional email only (new-submission-to-admin, accept/reject-to-requester, status-change-to-requester for post-acceptance moves). All org users share the same mail domain/provider.

## Scaling Strategy
Not a current concern (small scale). Deferred: swap Office365 SMTP for a dedicated transactional provider if volume/deliverability becomes an issue — this matters more now that submission volume is unbounded (no account creation friction).

## Known Risks
- Public submission endpoint has no rate-limiting yet — acceptable at current scale given the blocklist + admin review gate, but worth revisiting if spam volume grows (T016/T017 territory)
- Office365 SMTP has send-rate limits and may require SMTP AUTH enabled tenant-wide (often off by default) — acceptable at current scale, flagged for revisit
- Kanban drag-and-drop uses `@dnd-kit`; Pending column is deliberately excluded from both drag-source and drop-target to prevent bypassing the Accept/Reject email flow

## Architecture Decisions
See: `decisions/decision_log.md`
