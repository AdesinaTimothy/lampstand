# Code conventions

Read `docs/ARCHITECTURE.md` first. This file is the practical "how we write code here".

## Next.js 16 specifics
- `params` / `searchParams` are Promises: `export default async function Page(props: PageProps<"/courses/[slug]">) { const { slug } = await props.params; }`
- Route handlers: `export async function GET(req: Request, ctx: RouteContext<"/api/x/[id]">)`.
- `cookies()` / `headers()` are async. `proxy.ts` replaces middleware.
- `next/image`: `preload` replaces `priority`. Local images from `/api/media/**` are allowed.
- Bundled docs: `node_modules/next/dist/docs/`.

## Layers (never skip one)
1. **Page / layout** (`src/app/**`): Server Component. Calls a guard (`requirePageViewer`,
   `requireInstructorPage`, `requireStaffPage`, `requirePagePermission`) and then a query/service.
2. **Queries** (`src/server/queries/*`): read models shaped for pages. Return plain data.
3. **Services** (`src/server/services/*`): business rules + authorization (`assertCan`,
   `assertCanManageCourse`, …). Every mutation is authorized *here*, not only in the UI.
4. **Server Actions** (`src/actions/*.ts`, `"use server"`): thin —
   `runAction(async () => { const viewer = await requireViewer(); const data = parse(schema, input); return service(viewer, data); })`.
   Return `ActionResult<T>` (`{ ok: true, data } | { ok: false, error, fieldErrors }`). Call
   `revalidatePath` for pages that show the changed data.
5. **Client components** (`"use client"`): forms with React Hook Form + `zodResolver(schema)` using the
   *same* Zod schema from `src/lib/validation/*`. Call the action, then `toast.success/error` (sonner)
   and `router.refresh()` when server data changed. Map `fieldErrors` back with `form.setError`.

Never import `@/server/*` from a client component. Never send secrets to the client (e.g. quiz
`isCorrect`, password hashes, emails of other learners on public pages).

## UI
- Primitives in `src/components/ui/*` — use them; don't hand-roll buttons/inputs/dialogs.
  `Button` (variants primary/secondary/outline/ghost/soft/danger/danger-ghost/link, sizes sm/md/lg/icon/icon-sm,
  `asChild`, `loading`), `Input`, `Textarea`, `NativeSelect`, `Select`, `Field` (label+help+error),
  `FormError`, `Checkbox`, `Switch`, `SwitchField`, `RadioGroup`, `Dialog*`, `SheetContent`,
  `ConfirmDialog`, `DropdownMenu*`, `Tabs*`, `Tooltip`, `Popover*`, `Badge`, `Avatar`, `Card*`,
  `Skeleton`, `ProgressBar`, `ProgressRing`, `EmptyState`, `Table/THead/TBody/TR/TH/TD`,
  `Pagination` (server, `?page=`), `Stat`, `PageHeader`, `Separator`.
- Tokens only (Tailwind classes mapped to CSS variables): `bg-surface`, `bg-surface-muted`,
  `text-muted-foreground`, `border-border`, `bg-primary`, `bg-primary-soft`, `text-accent`, `bg-success-soft`,
  `text-danger`… No raw hex colors in components. Headings use `text-display` (serif) for page titles.
- Mobile first. Every page must work at 320px. Tables scroll inside their container; on phones
  prefer stacked rows/cards for primary lists. Use `container-page` on public pages.
- Every list has an `EmptyState`; every route segment with slow data has a `loading.tsx` with skeletons.
- Accessibility: labels for every control (`Field` + `htmlFor`), `aria-invalid`, `aria-describedby`,
  icon-only buttons need `aria-label` or `sr-only` text, keyboard reachable, visible focus.
- Icons: `lucide-react`, `aria-hidden` when decorative.
- Animation: Tailwind `animate-fade-in`, `animate-fade-up`, `animate-scale-in`; motion (`motion/react`)
  only where it clearly helps. Respect reduced motion (global CSS already does).
- Charts: `recharts`, wrapped in `ResponsiveContainer`, colors from CSS variables
  (`var(--primary)`, `var(--accent)`, `var(--info)`), each chart has a text summary / `aria-label`.

## Data
- Prisma client: `import { db } from "@/server/db"`. Multi-row writes in `db.$transaction`.
- Always scope by organization: `organizationId: viewer.organizationId`.
- Soft-deleted rows: filter `deletedAt: null` for `Course`, `Lesson`, `User`.
- Media URLs: `mediaUrl(assetId)` from `@/server/storage/urls`. Uploads: `POST /api/uploads?purpose=…`
  with the raw file as body and `X-File-Name` (URI-encoded) header; see `src/lib/upload-rules.ts`.
- Audit sensitive admin actions with `audit(viewer, "thing.verb", { type, id }, metadata, tx)`.

## Naming
- Files kebab-case; components PascalCase; actions end in `Action`; queries start with `get`/`list`.
