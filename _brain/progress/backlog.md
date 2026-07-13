# BACKLOG

> Tasks are ordered by dependency. Do not execute a task until all dependencies are COMPLETE.
> This file is written during SYSTEM_GENERATION and updated as scope changes.

---

## Phase 1 — MVP

| ID   | Task                                                        | Priority | Depends On | Status  |
|------|--------------------------------------------------------------|----------|------------|---------|
| T001 | Prisma schema (User/Ticket/Comment/Attachment, 6-state status enum, 3-tier priority) | HIGH | none | COMPLETE |
| T002 | Backend scaffold: Express entry point, auth middleware, JWT utils | HIGH | T001 | COMPLETE |
| T003 | Auth controller/routes (register, login)                     | HIGH     | T002       | COMPLETE |
| T003b | Seed script to create initial ADMIN account (register endpoint can only ever create USER) | HIGH | T003 | COMPLETE |
| T004 | Ticket controller/routes (CRUD, restricted edit scope for client tickets, quick-add for admin) | HIGH | T003 | COMPLETE |
| T004b | Admin user management endpoints (list users, change role) | MEDIUM | T003 | COMPLETE |
| T005 | Email service (Nodemailer) + status-transition + new-submission triggers | HIGH | T004 | COMPLETE |
| T006 | Comment controller/routes                                    | MEDIUM   | T004       | COMPLETE |
| T007 | Frontend scaffold: Vite + React + TS + Tailwind + shadcn/ui init | HIGH  | none       | COMPLETE |
| T008 | Auth store (Zustand) + Login/Register pages                  | HIGH     | T003, T007 | COMPLETE |
| T009 | Board page: Kanban card layout, role-gated controls, hidden Backlog/Cancelled columns | HIGH | T004, T008 | COMPLETE |
| T010 | Request Form page (client submission, validation)             | HIGH     | T004, T008 | COMPLETE |
| T011 | Admin Quick Add action on board                                | MEDIUM   | T009       | COMPLETE |
| T012 | File upload (Multer) wiring, backend + form                   | MEDIUM   | T004, T010 | COMPLETE |
| T013 | Deployment config (.htaccess, cPanel env docs)                 | LOW      | T009, T010 | COMPLETE |
| T013b | Board filters/search (status, priority, category, title search) | LOW    | T009       | COMPLETE |
| T013c | Real assignee picker (replace self-assign-only with a user list) | LOW    | T004b, T009 | COMPLETE |

## Phase 2 — Scale Prep

| ID   | Task                                      | Priority | Depends On | Status  |
|------|--------------------------------------------|----------|------------|---------|
| T014 | Drag-and-drop library for board columns   | LOW      | T009       | COMPLETE |
| T015 | Activity/audit log                        | LOW      | T004       | COMPLETE |

## Phase 3 — Scaling

| ID   | Task                                      | Priority | Depends On | Status  |
|------|--------------------------------------------|----------|------------|---------|
| T016 | Swap Office365 SMTP for transactional email provider | LOW | T005    | PENDING |
| T017 | SLA / deadline-breach alerts               | LOW      | T005       | PENDING |

## Deployment & Launch

| ID   | Task                                      | Priority | Depends On | Status  |
|------|--------------------------------------------|----------|------------|---------|
| T018 | Deploy to cPanel subdomain dev.stratastaff.com (runbook + execution) | HIGH | T013 | PENDING |
| T019 | UI polish pass — audit against shadcn skill's Critical Rules, fix violations | MEDIUM | T009, T010 | COMPLETE |

## Phase 4 — Public Request Model (client accounts removed)

> Confirmed 2026-07-13: no more client login/accounts. Public submitters give only name + email.
> Admin reviews every submission in a staff-only Pending inbox before it enters the board — Accept
> (choose Todo or Backlog) or Reject (→ Cancelled, record kept) — either way the requester gets an
> email. Admin-only blocklist by email; blocked senders still see a normal success message (no
> tip-off). Whole board becomes staff-only since there's no more client persona to view it.

| ID   | Task                                      | Priority | Depends On | Status  |
|------|--------------------------------------------|----------|------------|---------|
| T020 | Schema: nullable Ticket.createdById, requesterName/requesterEmail, PENDING status, BlockedEmail model | HIGH | T001 | COMPLETE |
| T021 | Public unauthenticated submission endpoint (name/email/details, blocklist check, admin-notify) | HIGH | T020 | COMPLETE |
| T022 | Admin Accept (→ Todo/Backlog)/Reject (→ Cancelled) actions + requester email on either outcome | HIGH | T020, T005 | COMPLETE |
| T023 | Admin blocklist management (add/remove blocked emails)                | MEDIUM   | T020       | COMPLETE |
| T024 | Frontend: public Request Form (no login), Pending inbox column with Accept/Reject/Block controls, remove client self-cancel | HIGH | T021, T022, T023 | COMPLETE |
| T025 | Light/dark mode toggle in Navbar + real per-status color coding (badges, columns) | MEDIUM | T009 | COMPLETE |
| T026 | Public request-status lookup page: /request is now email-lookup + list, form moved to /request/new | MEDIUM | T021, T024 | COMPLETE |
| T027 | Board layout: page fixed to viewport, each column scrolls independently; sort-by-time control | MEDIUM | T009, T014 | COMPLETE |
| T028 | Git repo prepared and pushed to https://github.com/iantolentino/TrackDev.git for cPanel deploy prep | HIGH | T013 | COMPLETE |

---

## Task Status Key
| Status      | Meaning                            |
|-------------|------------------------------------|
| PENDING     | Not started                        |
| IN_PROGRESS | Currently executing                |
| COMPLETE    | Done and usable                    |
| BLOCKED     | Waiting on dependency              |
| REJECTED    | Will not implement — see decisions |

---

## Rejected Tasks
See: `decisions/rejected_options.md`
