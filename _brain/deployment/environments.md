# ENVIRONMENTS

> TrackDev-specific. Updated 2026-07-13 (T018) — production target confirmed as dev.stratastaff.com.

---

## Environment Summary

| Environment | Purpose                    | Access          |
|-------------|-----------------------------|-----------------|
| Local       | Development against a real local MySQL/MariaDB instance | Developer only |
| Production  | Live cPanel deployment      | Staff + clients |

No staging environment at this scale (small agency) — see `deployment.md` § Deployment Strategy.

---

## Backend Environment Variables (`backend/.env`)

Full template lives in `backend/.env.example` — this table is the authoritative reference for
what each var does and where production values come from.

| Variable | Local (this build) | Production |
|----------|---------------------|------------|
| `DATABASE_URL` | `mysql://root:@localhost:3306/trackdev_dev` (Laragon MariaDB, no password) | `mysql://<cpanel_user>:<pass>@localhost:3306/<cpanel_db>` from cPanel MySQL Databases |
| `JWT_SECRET` | dev-only placeholder string | a real random secret — generate fresh, never reuse the dev value |
| `EMAIL_USER` | unset (email sends are skipped, logged as a warning — see `services/emailService.js`) | a real `@stratastaffglobal.com` mailbox |
| `EMAIL_PASS` | unset | app password (if the mailbox has MFA) or the account password (if SMTP AUTH is enabled tenant-wide) |
| `PORT` | `5000` | cPanel injects its own `PORT` — no action needed, app already reads `process.env.PORT` |
| `CLIENT_URL` | `http://localhost:5174` (see Decision Log — port 5173 was already in use by another local project) | `https://dev.stratastaff.com` — used for CORS |
| `ADMIN_EMAIL` | `admin@trackdev.local` (seed default) | a real admin mailbox |
| `ADMIN_PASSWORD` | `ChangeMe123!` (seed default — **dev only**) | set explicitly before running `npm run db:seed` in production — never rely on the default |
| `ADMIN_NAME` | `Admin` | whatever's appropriate |

SMTP is Office365/Outlook (`smtp.office365.com:587`), not Gmail — see Decision Log for why.

## Frontend Environment Variables (`frontend/.env`)

| Variable | Local | Production |
|----------|-------|------------|
| `VITE_API_URL` | `http://localhost:5000/api` | `https://dev.stratastaff.com/api` (path-scoped Node app on the same subdomain — see `deployment.md`) |

`VITE_`-prefixed vars are baked into the client bundle at build time — there is no runtime env
switch for the frontend; each environment needs its own `npm run build`.

---

## Environment Rules
- Never commit `.env` files — both `backend/.gitignore` and `frontend/.gitignore` already exclude
  them; only the `.env.example` templates are tracked.
- `ADMIN_PASSWORD`'s dev default (`ChangeMe123!`) must never reach production — set a real value
  in the production env before the first `npm run db:seed` run there.
- `CLIENT_URL` (backend) and the frontend's actual serving origin must match exactly, or CORS
  requests fail — this bit us locally once already (see Decision Log, port 5173 → 5174 fix).
