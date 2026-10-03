# Lampstand

A learning platform for churches: Bible studies, discipleship pathways, leadership and volunteer
training, with progress tracking, quizzes, assignments with feedback, and verifiable certificates.

The demo is set up for **Grace Harbor Church**, with 12 realistic courses and 54 members.

- **Learners** browse and search the catalogue, enrol, then learn through video, audio, reading,
  PDF, quiz and assignment lessons. Progress is saved as they go, and they earn certificates.
- **Instructors** build courses in a studio with drag-and-drop curriculum, autosave, a publish
  checklist, a review queue for submitted work, and per-course analytics.
- **Administrators** see live metrics and manage people, roles, courses, categories, certificates
  and announcements. They also have an audit log.
- **Anyone** can verify a certificate at `/verify` without seeing the holder's private details.

| | |
|---|---|
| Stack | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix primitives |
| Data | PostgreSQL 16, Prisma 6 |
| Forms & data | React Hook Form, Zod (shared client/server schemas), TanStack Query |
| Editor & UI | Tiptap rich text, dnd-kit, Recharts, Motion, Lucide |
| Auth | Email/password with Argon2id, database sessions, email verification, password reset, RBAC |
| Files | Pluggable storage: local disk or any S3-compatible service (AWS S3, Cloudflare R2, MinIO) |
| Tests | Vitest unit and integration tests, Playwright end-to-end tests |

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the requirements analysis, user journeys,
data model and security design, and [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) for how code is
written here.

---

## Quick start (local)

Requirements: **Node 22+**, **PostgreSQL 14+** (16 recommended), and `ffmpeg` only if you want to
regenerate the sample media.

```bash
npm install                       # also runs `prisma generate`
cp .env.example .env              # then set APP_SECRET (openssl rand -base64 32)
createdb lampstand                # or point DATABASE_URL at an existing database
npm run db:migrate                # apply migrations
npm run db:seed                   # demo church, courses, people and activity (idempotent)
npm run dev                       # http://localhost:3000
```

### Demo accounts

All demo accounts use the password **`Lampstand2026!`**.

| Role | Email | What to try |
|---|---|---|
| Learner | `john@graceharbor.example` | Dashboard, resume *Walking Through Romans*, view certificate |
| Instructor | `miriam@graceharbor.example` | Studio, review submitted assignments |
| Instructor | `samuel@graceharbor.example` | Create and publish a course |
| Administrator | `ruth@graceharbor.example` | Admin dashboard, people, audit log |
| Owner | `daniel@graceharbor.example` | Everything, including organization settings |
| Super admin | `support@lampstand.example` | Platform-level support account |

There are 46 more learners at `first.last@graceharbor.example`, for example
`sarah.mitchell@graceharbor.example`.

### Email in development

With `MAIL_DRIVER=log`, emails are printed to the console and stored in the `OutboundEmail` table.
Open **`/dev/mail`** to read them, including verification and password-reset links. That page
returns 404 in production or when SMTP is configured.

---

## Configuration

Everything is set through environment variables. Each one is documented in
[`.env.example`](.env.example) and validated at startup by `src/server/env.ts`, so a
misconfiguration fails fast with a clear message.

| Variable | Required | Notes |
|---|---|---|
| `APP_URL` | yes | Public URL. Used in emails, certificate links, sitemap and OG tags |
| `APP_SECRET` | yes | 32+ random bytes. Used to hash IPs in verification logs |
| `DATABASE_URL` | yes | PostgreSQL connection string. Use a pooled URL on serverless hosts |
| `APP_ORGANIZATION_SLUG` | yes | The church this deployment serves (the seed creates `grace-harbor`) |
| `STORAGE_DRIVER` | | `local` (default) or `s3` |
| `STORAGE_LOCAL_DIR` | | For `local`. Must be a persistent volume in production |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE` | for `s3` | Any S3-compatible service. Media is served through short-lived signed URLs |
| `MAIL_DRIVER` | | `log` (default) or `smtp` |
| `SMTP_URL`, `MAIL_FROM` | for `smtp` | e.g. `smtp://user:pass@smtp.postmarkapp.com:587` |

Secrets are only read on the server. Nothing in `src/server` can be imported by client
components, because those modules start with `import "server-only"`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint, and TypeScript after generating route types |
| `npm run db:migrate` | Apply migrations (`prisma migrate deploy`) |
| `npm run db:seed` | Reset and seed the demo data. **Deletes all data**, so never run it against production |
| `npm run maintenance` | Retry failed emails and purge expired sessions, tokens and rate-limit windows |
| `npm test` | Unit and integration tests |
| `npm run test:e2e` | Playwright end-to-end tests |

---

## Tests

```bash
createdb lampstand_test           # once; integration tests migrate it automatically
npm test                          # 53 unit + integration tests
```

- **Unit tests** (`tests/unit`) cover quiz grading, media completion rules and the anti-skip
  watch-time check, learning streaks, certificate codes, redirect safety, HTML sanitizing and the
  role/permission matrix.
- **Integration tests** (`tests/integration`) run the real services against `lampstand_test`.
  They cover registration, verification, sign-in, password reset and suspension; enrolment,
  progress, quizzes, video completion, course completion, and certificate issue, verification and
  revocation; course creation, slugs, authorization and publish readiness.

End-to-end tests need a seeded database and a running app:

```bash
npm run db:seed
E2E_BASE_URL=http://localhost:3000 npm run test:e2e    # against `npm run dev`
# or: npm run build && npm run test:e2e                # starts `next start` on :3200
```

The E2E suite covers all four core journeys:

1. **Learner:** register, verify email, search, enrol, complete a lesson, take notes, bookmark,
   and resume from the dashboard.
2. **Instructor to learner to verifier:** an instructor creates a course, uploads a thumbnail,
   writes a lesson and publishes. A learner enrols and completes it, then gets a certificate.
   A signed-out visitor verifies that certificate.
3. **Admin:** live metrics, member search and profile, and the audit log. Access control is
   checked for owners, admins, instructors and learners.
4. **Certificates:** public verification without private data (also run on a phone viewport),
   PDF download, and owner-only access.

Playwright's bundled Chromium can't decode H.264, so videos show "couldn't be played" in headless
runs. Real browsers play them normally. Media progress is covered by the integration tests.

---

## Deploying

Lampstand is a standard Next.js server app with a PostgreSQL database and file storage. Any of
these setups works.

### Option A: Docker (VPS, Fly.io, Render, Railway)

```bash
docker build -t lampstand .
docker run -p 3000:3000 --env-file .env.production lampstand
```

The container runs `prisma migrate deploy` and then starts the server. Use `STORAGE_DRIVER=s3`,
or mount a volume at `STORAGE_LOCAL_DIR`, so uploads survive redeploys.

### Option B: Vercel (or another serverless host)

1. Create a managed PostgreSQL database (Neon, Supabase, RDS). Use its pooled connection string
   for `DATABASE_URL`.
2. Set `STORAGE_DRIVER=s3` with an S3 or R2 bucket. Serverless file systems are not persistent.
3. Set the remaining variables from the table above. Set the build command to
   `npx prisma migrate deploy && npm run build`.
4. Schedule `npm run maintenance` (or call it from a cron job) every 10 to 15 minutes.

Note: uploads stream through the app at `/api/uploads`, so the host's request-size limit applies.
Vercel caps request bodies at 4.5 MB. For large video files on Vercel, put a direct-to-bucket
upload in front. See "Scaling" in `docs/ARCHITECTURE.md`.

### Production checklist

- [ ] `APP_URL` uses `https://`. Session cookies become `__Secure-` and HSTS is sent automatically.
- [ ] `APP_SECRET` is unique and random, and stored in your host's secret manager.
- [ ] `MAIL_DRIVER=smtp` with a verified sending domain (SPF/DKIM) for `MAIL_FROM`.
- [ ] Persistent storage (S3/R2, or a mounted volume).
- [ ] Database backups enabled.
- [ ] `npm run maintenance` scheduled.
- [ ] Create the real organization and owner. Either adapt `prisma/seed/content` and the seed
      to your church, or insert the `Organization` row and promote the first registered user
      to `OWNER` in `Membership`.
- [ ] The app must sit behind a proxy that sets `X-Forwarded-For` (all the hosts above do).
      Rate limits and verification logs use that header.
- [ ] Uptime monitoring on `/api/health` (it checks the database).

---

## Security overview

- **Passwords** are hashed with Argon2id. Sign-in gives the same error and timing for unknown
  emails, and is rate limited per IP and per account.
- **Sessions** are random 256-bit tokens. Only their SHA-256 hash is stored. Cookies are
  `httpOnly` and `SameSite=Lax`, expire after 30 days of inactivity (sliding), and are revoked on
  password change or reset.
- **Email verification and reset tokens** are hashed, single-use and short-lived. Verification
  needs a button press, so email link scanners can't consume the token.
- **Authorization** is enforced in the service layer for every mutation and read model:
  organization roles (Owner, Admin, Instructor, Learner) plus per-course instructor ownership.
  The UI only hides what the server already refuses.
- **CSRF:** Server Actions check the Origin, cookies are `SameSite=Lax`, and JSON endpoints check
  the origin explicitly.
- **Uploads** are checked by magic bytes, not file extension, against per-purpose size and type
  limits. Images are re-encoded and stripped of metadata. Private media is only served to people
  allowed to see it, with `nosniff` and a sandboxing CSP.
- **Rich text** is sanitized with an allow-list on write. Only YouTube and Vimeo embeds are
  allowed.
- **Quiz answers** never reach the browser before submission. Grading happens on the server.
- **Certificates:** verification pages show only the name, course, dates and issuer. IP
  addresses in verification logs are HMAC-hashed.
- **Audit log** records role changes, suspensions, publishing, deletions, certificate
  revocation, review moderation and settings changes.
- **Headers:** CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS in
  production.

## Accessibility

Lampstand targets WCAG 2.2 AA. It has:

- semantic landmarks and a skip link
- a visible focus ring everywhere, and keyboard-operable everything, including the video player
  (Space/K, J/L, arrow keys, M, F) and curriculum drag-and-drop
- labelled form controls with linked errors
- ARIA combobox search
- screen-reader data tables behind every chart
- full reduced-motion support
- color tokens chosen for contrast in both light and dark themes

Every page is designed from 320px wide upward.
