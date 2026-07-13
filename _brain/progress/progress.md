# PROGRESS

> The AI reads this file at the start of every EXECUTION_MODE session.
> Update after every completed or blocked task.

---

## Active Task
> None — Phase 4 (Public Request Model pivot) complete, T019 (UI polish) and T026 (request-status lookup page) complete. T018 (cPanel deploy) still pending from Deployment & Launch; T016/T017 still pending from Phase 3 (Scaling)

---

## In Progress
| ID   | Task                  | Blocker        |
|------|-----------------------|----------------|
|      |                       |                |

---

## Completed
| ID   | Task                                                                    | Date Completed |
|------|--------------------------------------------------------------------------|----------------|
| T001 | Prisma schema (User/Ticket/Comment/Attachment, 6-state status, 3-tier priority) | 2026-07-02 |
| T002 | Backend scaffold (Express entry point, auth middleware, JWT utils, Prisma singleton) | 2026-07-02 |
| T003 | Auth controller/routes (register, login)                                | 2026-07-02 |
| T003b | Seed script for initial ADMIN account                                   | 2026-07-02 |
| T004 | Ticket controller/routes (CRUD, restricted edit scope, quick-add)        | 2026-07-02 |
| T005 | Email service (Nodemailer) + status-transition + new-submission triggers | 2026-07-02 |
| T006 | Comment controller/routes                                                | 2026-07-02 |
| T007 | Frontend scaffold (Vite + React + TS + Tailwind + shadcn/ui)             | 2026-07-02 |
| T008 | Auth store (Zustand) + Login/Register pages                              | 2026-07-02 |
| T009 | Board page (Kanban card layout, role-gated controls)                     | 2026-07-02 |
| T010 | Request Form page (client submission, validation)                        | 2026-07-02 |
| T011 | Admin Quick Add action on board                                          | 2026-07-02 |
| T012 | File upload (Multer) wiring, backend + form                              | 2026-07-02 |
| T013 | Deployment config (.htaccess, cPanel env docs)                           | 2026-07-03 |
| T004b | Admin user management endpoints (list users, change role)               | 2026-07-03 |
| T013c | Real assignee picker (replace self-assign-only with a user list)        | 2026-07-03 |
| T013b | Board filters/search (status, priority, category, title search)         | 2026-07-10 |
| T014 | Drag-and-drop library for board columns                                  | 2026-07-10 |
| T015 | Activity/audit log                                                       | 2026-07-10 |
| T020 | Schema: nullable createdById, requesterName/Email, PENDING status, BlockedEmail | 2026-07-13 |
| T021 | Public unauthenticated submission endpoint                              | 2026-07-13 |
| T022 | Admin Accept/Reject actions + requester decision emails                 | 2026-07-13 |
| T023 | Admin blocklist management                                              | 2026-07-13 |
| T024 | Frontend: public Request Form, Pending inbox controls, self-cancel removed | 2026-07-13 |
| T025 | Light/dark toggle + per-status color coding                             | 2026-07-13 |
| T019 | UI polish pass — shadcn skill Critical Rules audit                       | 2026-07-13 |
| T026 | Public request-status lookup page (/request email-search + /request/new form) | 2026-07-13 |

---

## Blocked
| ID   | Task                  | Reason         |
|------|-----------------------|----------------|
|      |                       |                |

---

Last updated: 2026-07-02
Current phase: MVP
