# APP CONTEXT

> Filled in after CONFIRMATION_LOCK approved (2026-07-02). Revised 2026-07-13 — client accounts
> removed, public-submission + admin-gatekeeper model. See `decisions/decision_log.md` §
> MAJOR PIVOT for full rationale; original client-login model's decisions are left in place there
> as history, not deleted.

---

## Project Name
TrackDev

## Project Type
SaaS ticketing system (agency ↔ client web dev requests)

## Domain
Web development project management / client request tracking

## Target Users
- **Public requesters (no account)** — submit a request via a public form with just name + email; no login, no board access, receive email updates on their request's outcome
- **Admin/Dev (ADMIN/DEVELOPER role)** — the only accounts that exist now; review every incoming request in a staff-only Pending queue, Accept or Reject it, triage/prioritize/assign accepted work on the board, can add internal ideas directly (Quick Add)

## Core Workflow
1. A visitor submits a request via the public, unauthenticated Request Form (name, email, title, description, category, optional deadline, attachments) — no account needed
2. Ticket lands in the staff-only **Pending Review** column; every admin gets an email
3. Admin reviews — if it looks like a bot/spam, **Block sender** (rejects it and silently drops all future submissions from that exact email, no tip-off to the sender); if it's a real person they're unsure about, they can email the requester directly (shown as a `mailto:` link on the card) before deciding
4. Admin **Accepts** (choosing Todo or Backlog as the destination) or **Rejects** (→ Cancelled, record kept) — either outcome emails the requester
5. Once accepted, admin/dev triages normally: sets priority, assigns, drags/moves the card across columns
6. Admin/dev can also **Quick Add** an internal idea directly onto the board (lands in Backlog by default)

## Key Features (MVP + Pivot)
- [ ] Kanban board, staff-only (Login/Register pages still exist, but only for staff onboarding — a new hire registers, an existing admin promotes them)
- [ ] Public, unauthenticated request form (structured, validated, name + email required)
- [ ] Staff-only Pending Review queue with Accept (Todo/Backlog choice)/Reject/Block-sender actions
- [ ] Admin-only email blocklist (silent drop, no signal to the blocked sender)
- [ ] Admin quick-add for internal tickets
- [ ] Restricted admin edit scope on publicly-submitted tickets (priority/status/assignee only — title/description/category/deadline locked, preserves the original ask)
- [ ] Dual email triggers: admin on every new submission; requester on Accept or Reject
- [ ] Deadline shown on card when a requester sets one
- [ ] Light/dark mode toggle; distinct color per status (badges + column dots)

## Tech Stack
| Layer       | Technology |
|-------------|------------|
| Language    | TypeScript / JavaScript (ESM) |
| Frontend    | React 19 + TypeScript, Tailwind CSS v4, shadcn/ui (radix-nova style), Zustand, React Router v6.30, @dnd-kit |
| Backend     | Node.js + Express |
| Database    | MySQL |
| ORM         | Prisma |
| Auth        | JWT + bcrypt (staff only — no public auth) |
| File Upload | Multer |
| Email       | Nodemailer (Office365/Outlook SMTP) |
| Hosting     | cPanel (Node.js App + MySQL) — target subdomain `dev.stratastaff.com`, GitHub-based deploy |

## Expected Scale
Small — single agency, handful of admin/dev staff, unlimited/unbounded public requesters (no account creation needed, so no meaningful cap on submission volume — the blocklist and Pending-review gate are the spam controls).

## Hard Constraints
- Must deploy to cPanel (Node.js App support + MySQL, no Docker/serverless), specifically the `dev.stratastaff.com` subdomain (domain already owned)
- Email via Office365/Outlook SMTP (no dedicated transactional email provider for MVP — deferred). All org users share one mail domain/provider (Microsoft 365).
- No client accounts of any kind — this is a deliberate, confirmed constraint, not a gap

## Current Phase
MVP + Phase 4 (Public Request Model) complete. Deployment (T018) and UI polish (T019) pending.
