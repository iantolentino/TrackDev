# DEPLOYMENT PLAN

> TrackDev-specific. Updated 2026-07-13 (T018) — target confirmed as `dev.stratastaff.com`
> (existing domain, subdomain to be created). This doc is the runbook; user/team executes it in
> cPanel — see Decision Log for why (credentials for a live-adjacent subdomain shouldn't pass
> through chat).

---

## Target Domain — dev.stratastaff.com

Single subdomain hosts both the frontend (static) and backend (Node, path-scoped) — no second
subdomain needed:

| Piece | URL |
|---|---|
| Frontend (SPA) | `https://dev.stratastaff.com/` |
| Backend API | `https://dev.stratastaff.com/api` |

cPanel's Node.js App feature supports an "Application URL" with a sub-path (`/api`) — requests
under that path route to the Node app via Passenger; everything else on the subdomain is served
as plain static files by Apache. This is why the frontend and backend can share one subdomain
without conflict.

---

## Target Platform
cPanel shared/VPS hosting — Node.js App feature (backend) + MySQL Databases (data) + `public_html`
static file hosting (frontend). No Docker, no serverless — confirmed hard constraint, see
`memory/app_context.md`.

## Deployment Strategy
**Direct** — single production instance, brief downtime acceptable at this scale (small agency,
handful of staff, moderate client count). No staging environment for MVP; test locally against
the real dev DB before pushing (see `guides/` / session notes in `summaries/current_state.md` for
the local verification pattern used throughout this build).

## CI/CD Pipeline
None — manual, git-based. cPanel's **Git Version Control** feature pulls from GitHub; deploys are
triggered by hand after a local `npm run build` + `git push`.

## Deployment Steps (dev.stratastaff.com)

### 0. Create the subdomain (one-time)
1. cPanel → **Domains** (or **Subdomains** on older cPanel) → Create subdomain `dev` on
   `stratastaff.com`.
2. Document root: accept the default (typically `~/dev.stratastaff.com` or
   `~/public_html/dev.stratastaff.com` depending on cPanel version) — this becomes the frontend's
   static file root in step 3.
3. Wait for DNS to propagate, then cPanel → **SSL/TLS Status** → run **AutoSSL** for the new
   subdomain (or confirm it picks it up automatically) so `https://dev.stratastaff.com` has a
   valid cert before testing.

### 1. Database (one-time)
1. cPanel → **MySQL Databases** → create a database and a user with all privileges on it — e.g.
   `<cpaneluser>_trackdev` / `<cpaneluser>_trackdev_app`.
2. Note the full DB name/user (cPanel prefixes both with the account username).

### 2. Backend — cPanel Node.js App (one-time setup, then repeatable deploy)
1. cPanel → **Setup Node.js App** → Create Application.
   - Node.js version: **20 LTS or newer**.
   - Application root: a folder **outside** the subdomain's public document root — e.g.
     `trackdev-backend/` in the home directory — with the git-cloned `backend/` contents inside
     it. Keeping app code outside the public docroot is a standard cPanel security practice.
   - Application startup file: `src/index.js`.
   - Application URL: domain `dev.stratastaff.com`, **URI** `/api` — this is what lets the Node
     app own only `/api/*` while the rest of the subdomain serves the static frontend.
2. Set environment variables in the Node.js App panel:
   - `DATABASE_URL` = `mysql://<cpaneluser>_trackdev_app:<password>@localhost:3306/<cpaneluser>_trackdev`
   - `JWT_SECRET` = a freshly generated random secret (not the local dev value)
   - `EMAIL_USER` / `EMAIL_PASS` = a real `@stratastaffglobal.com` mailbox (see `environments.md`)
   - `CLIENT_URL` = `https://dev.stratastaff.com`
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` = real values for the first admin account
   - `PORT` — leave unset, cPanel injects its own
3. Deploy code via cPanel **Git Version Control** → clone the GitHub repo into the app root.
4. From cPanel's Node.js App "Run NPM Install" button (or SSH, inside the Node app's virtualenv
   shell — cPanel gives you an `source .../bin/activate` command for this):
   ```bash
   cd backend
   npm install          # postinstall runs `prisma generate` automatically
   npx prisma migrate deploy   # applies committed migrations — NOT `migrate dev`
   npm run db:seed      # idempotent — creates/updates the initial ADMIN account only
   ```
5. Confirm the `uploads/` directory exists and is writable by the app process (multer creates it
   automatically via `fs.mkdirSync(..., { recursive: true })` — verify permissions if uploads fail).
6. Restart the Node.js App from the cPanel panel to pick up new code/env vars.

### 3. Frontend — static build to the subdomain's document root
1. Locally: set `frontend/.env`'s `VITE_API_URL=https://dev.stratastaff.com/api`, then:
   ```bash
   cd frontend
   npm run build
   ```
2. Upload the **contents** of `frontend/dist/` (not the folder itself) to the subdomain's
   document root from step 0. `.htaccess` is already inside `dist/` — Vite copies it automatically
   from `frontend/public/.htaccess` on every build, so there is no manual copy step.
3. Confirm `https://dev.stratastaff.com/`, `/login`, `/register`, and `/request` all load directly
   on a hard refresh (not just via in-app navigation) — this is what `.htaccess`'s rewrite exists
   for.

## Rollback Plan
If a deploy fails:
1. In cPanel Git Version Control, check out the previous commit and re-deploy (backend) /
   re-upload the previous `dist/` build (frontend).
2. If a migration was involved, check `npx prisma migrate status` before assuming the schema needs
   reverting — most TrackDev migrations so far are additive.
3. Verify rollback health (see Health Checks).
4. Log the incident in `releases/changelog.md` before re-attempting.

## Health Checks
- [ ] `GET https://dev.stratastaff.com/api/health` → `{"status":"ok"}`
- [ ] `https://dev.stratastaff.com/` loads and `/login` works on a hard refresh (proves
      `.htaccess` rewrite is active)
- [ ] Log in with the seeded admin account, confirm the board loads with real data
- [ ] Submit a test client request end to end, confirm it lands in Todo and an admin-notify email
      attempt doesn't error (check server logs — and check the real inbox if SMTP is configured)
- [ ] Upload an attachment on a test ticket, confirm it's retrievable via its `/uploads/...` link
- [ ] Confirm `https://dev.stratastaff.com` shows a valid SSL cert (no browser warning)
