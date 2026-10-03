# Lampstand — Architecture & Product Design

Lampstand is a learning platform for churches and ministries. This document records
the analysis done before implementation and the decisions that shape the codebase.
Read it first if you are joining the project.

## 1. Requirements analysis

The product serves four audiences with very different needs:

| Audience | Primary need | Where they live |
| --- | --- | --- |
| Learners (members, new believers, volunteers) | Find a course, learn on a phone in short sessions, pick up where they left off | `/`, `/courses`, `/dashboard`, `/learn/*` |
| Instructors (pastors, ministry leaders) | Build a course without technical help, see who is progressing | `/instructor/*` |
| Organization admins (church staff) | Oversee people, courses and outcomes | `/admin/*` |
| The public | Discover what the church teaches, verify a certificate | `/`, `/courses`, `/verify/*` |

Non-functional priorities, in order: correctness of progress & certificates, security
(server-side authorization everywhere), mobile learning experience, maintainability.

## 2. Core user journeys

1. **Learner** — Register → verify email → sign in → browse → course page → enrol →
   player → watch video (≥90% watched) → lesson completes → quiz (graded on server) →
   continue → course completes → certificate issued + notification.
2. **Instructor** — Sign in → instructor dashboard → new course (draft) → sections →
   lessons (video/audio/text/PDF/quiz/assignment) → upload media → preview as learner →
   publish (server validates readiness) → learners & analytics.
3. **Admin** — Sign in → admin dashboard (live metrics) → organization settings →
   instructors (invite/promote, assign to courses) → learners (search, filter, profile,
   suspend, change role) → all courses (feature/unpublish) → audit log.
4. **Verification** — Certificate issued with a unique code → learner shares
   `/verify/<code>` → anyone sees issuer, course, name, date and validity, nothing else.

## 3. Information architecture

```
Public           /  /courses  /courses/[slug]  /search  /verify  /verify/[code]
                 /instructors/[id]   /login  /register  /forgot-password  /reset-password
Learner          /dashboard  /my-courses  /certificates  /bookmarks  /notifications
                 /profile  /settings  /learn/[courseSlug]/[lessonId]
Instructor       /instructor  /instructor/courses  /instructor/courses/new
                 /instructor/courses/[id]/(details|curriculum|lessons/[lessonId]|settings)
                 /instructor/courses/[id]/learners  /instructor/courses/[id]/analytics
                 /instructor/submissions
Admin            /admin  /admin/learners  /admin/learners/[id]  /admin/instructors
                 /admin/courses  /admin/categories  /admin/announcements
                 /admin/settings  /admin/audit-log
```

Navigation adapts per breakpoint: a top bar + account menu on desktop, a bottom tab bar
for learners on phones, a collapsible sidebar for instructor/admin consoles (sheet on
mobile). The course player uses a sidebar curriculum on desktop and a bottom sheet +
sticky lesson footer on mobile.

## 4. Application architecture

Single Next.js (App Router) application. Server Components read data; mutations go
through Server Actions (forms) or Route Handlers (binary uploads, media streaming,
progress beacons, PDF/OG generation). No separate API server: it would add a network
hop and a second auth surface without benefit at this scale. The domain layer is
framework-agnostic so an API server could be split out later.

```
src/
  app/                  Routes only. Pages compose components and call queries.
  components/
    ui/                 Design-system primitives (Button, Input, Dialog, …)
    <domain>/           Composed, domain-aware components (course, player, builder…)
  server/               Server-only code ("server-only" import guard)
    db.ts               Prisma client singleton
    auth/               Password hashing, sessions, tokens, current user
    authz/              Roles → permissions, resource policies, guards
    services/           Business logic (enrolment, progress, quizzes, certificates…)
    queries/            Read models for pages (dashboard, catalogue, analytics)
    storage/            Storage abstraction: local disk + S3-compatible drivers
    mail/               Mail transport abstraction + templates + outbox
    notifications/      In-app notifications + email fan-out
    audit.ts, rate-limit.ts, activity.ts
  actions/              Server Actions: parse (Zod) → authorize → call service → revalidate
  lib/                  Isomorphic helpers & Zod schemas shared by client and server
```

Rules:
- Pages never import Prisma directly; they use `server/queries` or `server/services`.
- Every Server Action and Route Handler resolves the session and calls a guard
  (`requireUser`, `requirePermission`, `assertCanManageCourse`, …) before work.
- Business rules exist once (e.g. completion rules live in `services/progress.ts` and
  are used by the player, the beacon endpoint, quiz grading and tests).
- Client components receive DTOs, never Prisma models with secrets
  (e.g. `isCorrect` on quiz options is never sent before an attempt is graded).

## 5. Data model (PostgreSQL + Prisma)

See `prisma/schema.prisma` (commented). Highlights:
- **Multi-organization ready**: `Organization` + `Membership(role)`; the app runs one
  primary organization (`APP_ORGANIZATION_SLUG`) today, and host-based resolution can
  be added without schema changes.
- **Roles**: `User.platformRole` (`USER` | `SUPER_ADMIN`) for the platform and
  `Membership.role` (`OWNER` | `ADMIN` | `INSTRUCTOR` | `LEARNER`) per organization.
  Permissions are defined in code (`server/authz/permissions.ts`) — reviewable and
  type-checked — rather than editable rows, which is safer for a small org.
- **Courses**: `Course → CourseSection → Lesson`; quiz/assignment are 1:1 extensions of
  a lesson. `CourseInstructor` lets several teachers share a course.
- **Media**: `MediaAsset` rows store metadata + storage key; bytes live in object
  storage. Visibility (`PUBLIC`/`PRIVATE`) drives how they are served.
- **Learning state**: `Enrollment` (status, percent, last lesson), `LessonProgress`
  (position, furthest point watched, completion), `QuizAttempt`, `AssignmentSubmission`.
- **Certificates**: immutable snapshot of names at issue time + unique public code;
  `CertificateVerification` logs lookups (hashed IP only).
- **Soft deletion** for user-authored content that may be referenced by learning
  history (`Course`, `Lesson`, `User`). Learning records cascade with their owner.
- **Denormalized counters** (`Course.enrollmentCount`, `ratingAverage`) are updated in
  the same transaction as their source rows to keep catalogue sorting cheap.

## 6. Completion rules

| Lesson type | Completes when |
| --- | --- |
| Video / audio | Learner has *watched* ≥ 90% of the duration (furthest-played point tracked server-side, seeking ahead does not count) or reached the final 10 s naturally |
| Text / PDF | Learner explicitly marks complete (button at end of content) |
| Quiz | A graded attempt meets the passing score |
| Assignment | Submission is made (status `SUBMITTED`); instructor approval is required only if the course enables `requireAssignmentApproval` |

A course is complete when every *required* lesson is complete. Completion is
re-evaluated by `progress.recomputeEnrollment()` after any change, which also issues
the certificate (idempotent: one certificate per enrollment) and notifications.

Progress is saved every 10 s while playing, on pause/seek, and on `pagehide` via
`navigator.sendBeacon`, so closing the tab does not lose position.

## 7. Design system

- **Voice**: calm, warm, editorial. Serif display type (Newsreader) for headings and
  course titles; Geist Sans for UI; Geist Mono for codes.
- **Color**: evergreen primary (trust, growth), warm parchment neutrals, a restrained
  gold accent for achievement moments only. Light and dark themes via CSS variables.
- **Shape**: 10px base radius, soft layered shadows, 1px hairline borders; cards only
  where content is a distinct object (a course, a certificate), lists elsewhere.
- **Motion**: 150–250 ms ease-out for feedback; progress rings animate; page content
  fades in; `prefers-reduced-motion` respected globally.
- **Components**: Button, IconButton, Input, Textarea, Select, Checkbox, Radio, Switch,
  Label/FormField, Dialog, Sheet, DropdownMenu, Tabs, Tooltip, Badge, Avatar, Progress,
  ProgressRing, Skeleton, EmptyState, ErrorState, Pagination, DataTable, StatCard, Toast.

## 8. Security

- Passwords: Argon2id (`@node-rs/argon2`), min 10 chars, breached-pattern checks.
- Sessions: 256-bit random token in an `HttpOnly; Secure; SameSite=Lax` cookie; only a
  SHA-256 hash is stored. Sliding 30-day expiry, revocable, rotated on privilege change.
- Tokens (verify email / reset password): single-use, hashed, short-lived; reset
  revokes all sessions.
- Authorization: role permissions + resource policies checked in every action/handler.
- CSRF: Server Actions are POST-only with Next's Origin check; custom Route Handlers
  that mutate verify `Origin` against `APP_URL`; cookies are `SameSite=Lax`.
- Validation: Zod on every input; rich text sanitized with an allow-list on write.
- Injection: Prisma parameterizes queries; the few raw queries use tagged templates.
- Uploads: size limits per kind, MIME allow-list verified with magic bytes, random keys,
  images re-encoded (strips EXIF), private media streamed only after an access check.
- Rate limiting: Postgres-backed fixed-window limiter on auth, upload and search.
- Audit log for admin actions (role changes, suspensions, settings, publish/unpublish).
- Security headers (CSP, frame-ancestors, referrer policy) in `next.config.ts`.
- Enumeration resistance: login/forgot-password responses do not reveal whether an
  email exists.

## 9. Scalability notes

- Indexes on every foreign key and on catalogue filters/sorts; full-text search uses a
  Postgres `tsvector` expression index on courses and lessons.
- Analytics queries aggregate in SQL; heavy dashboards cache for 60 s.
- Media is served by the storage provider (signed URLs on S3) so app servers don't
  proxy large files in production.
- Email is written to an outbox table and delivered asynchronously-safe (retryable).
- Known future work: background job runner for email retries, CDN video transcoding
  (HLS), host-based multi-tenancy, social sign-in via the `Account` table.
