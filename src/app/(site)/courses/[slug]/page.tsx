import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Globe,
  ListVideo,
  PlayCircle,
  Smartphone,
  Users,
} from "lucide-react";
import { CourseCover } from "@/components/course/course-cover";
import { CurriculumAccordion } from "@/components/course/curriculum-accordion";
import { EnrollButton } from "@/components/course/enroll-button";
import { RatingStars } from "@/components/course/rating";
import { ReviewForm } from "@/components/course/review-form";
import { PreviewVideoButton } from "@/components/course/preview-video";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { LEVEL_LABELS } from "@/lib/course-meta";
import { formatCompact, formatDate, formatDuration, formatRelative } from "@/lib/format";
import { pluralize, stripHtml, truncate } from "@/lib/utils";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import {
  getCourseBySlug,
  getCourseResourcesCount,
  getCourseReviews,
  getCurriculum,
  getViewerCourseState,
  resolveNextLesson,
} from "@/server/queries/course";
import { db } from "@/server/db";
import { mediaUrl } from "@/server/storage/urls";

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const org = await getCurrentOrganization();
  const course = await getCourseBySlug(org.id, slug);
  if (!course || course.status !== "PUBLISHED") return { title: "Course not found", robots: { index: false } };
  const description = truncate(course.subtitle || stripHtml(course.description), 160);
  const image = course.thumbnailId ? mediaUrl(course.thumbnailId) : undefined;
  return {
    title: course.title,
    description,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { title: course.title, description, type: "website", images: image ? [{ url: image, width: 1600, height: 900 }] : undefined },
    twitter: { card: "summary_large_image", title: course.title, description, images: image ? [image] : undefined },
  };
}

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  const [org, viewer] = await Promise.all([getCurrentOrganization(), getViewer()]);
  const course = await getCourseBySlug(org.id, slug);
  if (!course) notFound();

  const [state, sections, reviews, resourceCount] = await Promise.all([
    getViewerCourseState(viewer, course.id),
    getCurriculum(course.id),
    getCourseReviews(course.id),
    getCourseResourcesCount(course.id),
  ]);
  // Unpublished courses are visible only to their managers and existing learners.
  if (course.status !== "PUBLISHED" && !state.canManage && !state.enrollment) notFound();

  const lessons = sections.flatMap((s) => s.lessons);
  const totalSeconds = course.estimatedMinutes ? course.estimatedMinutes * 60 : lessons.reduce((n, l) => n + (l.durationSeconds ?? 0), 0);
  const enrolled = state.enrollment;
  const nextLessonId = resolveNextLesson(sections, state.completedLessonIds, enrolled?.lastLessonId);
  const continueHref = nextLessonId ? `/learn/${course.slug}/${nextLessonId}` : `/learn/${course.slug}`;
  const previewLesson = course.previewLessonId
    ? await db.lesson.findFirst({
        where: { id: course.previewLessonId, deletedAt: null, isPreview: true, type: "VIDEO", mediaId: { not: null } },
        select: { id: true, title: true, mediaId: true },
      })
    : null;
  const instructors = course.instructors.map((i) => i.user);
  const thumbnailUrl = course.thumbnailId ? mediaUrl(course.thumbnailId) : null;
  const canReview = enrolled && (enrolled.status === "COMPLETED" || enrolled.progressPercent >= 20);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: truncate(course.subtitle || stripHtml(course.description), 300),
    provider: { "@type": "Organization", name: org.name },
    ...(course.ratingCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: course.ratingAverage.toFixed(1), ratingCount: course.ratingCount } }
      : {}),
  };

  const ctaCard = (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
      <div className="relative">
        <CourseCover src={thumbnailUrl} title={course.title} seed={course.id} preload sizes="(min-width: 1024px) 380px, 100vw" />
        {previewLesson?.mediaId && <PreviewVideoButton src={mediaUrl(previewLesson.mediaId)} title={previewLesson.title} />}
      </div>
      <div className="p-5 sm:p-6">
        {enrolled ? (
          <>
            {enrolled.status === "COMPLETED" ? (
              <p className="flex items-center gap-2 font-semibold text-success">
                <CheckCircle2 className="size-5" aria-hidden /> You completed this course
              </p>
            ) : (
              <>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">Your progress</span>
                  <span className="tabular-nums text-muted-foreground">{enrolled.progressPercent}%</span>
                </div>
                <ProgressBar value={enrolled.progressPercent} className="mt-2" label="Course progress" />
              </>
            )}
            <Button asChild size="lg" className="mt-5 w-full">
              <Link href={continueHref}>{enrolled.status === "COMPLETED" ? "Review course" : enrolled.progressPercent > 0 ? "Continue learning" : "Start learning"}</Link>
            </Button>
            {enrolled.certificate && (
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href={`/certificates/${enrolled.certificate.id}`}>
                  <Award aria-hidden /> View certificate
                </Link>
              </Button>
            )}
          </>
        ) : course.status === "PUBLISHED" ? (
          <>
            <p className="text-display text-2xl font-medium">Free for our church family</p>
            <EnrollButton courseId={course.id} courseSlug={course.slug} signedIn={Boolean(viewer)} size="lg" className="mt-4 w-full" />
            {!viewer && <p className="mt-2 text-center text-xs text-muted-foreground">You&apos;ll be asked to sign in first.</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">This course is not published yet.</p>
        )}
        {state.canManage && (
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href={`/instructor/courses/${course.id}`}>Edit course</Link>
          </Button>
        )}
        <ul className="mt-6 space-y-2.5 border-t border-border pt-5 text-sm">
          <li className="flex items-center gap-2.5">
            <ListVideo className="size-4 text-muted-foreground" aria-hidden />
            {pluralize(lessons.length, "lesson")} in {pluralize(sections.length, "section")}
          </li>
          <li className="flex items-center gap-2.5">
            <Clock className="size-4 text-muted-foreground" aria-hidden />
            {formatDuration(totalSeconds)} of learning
          </li>
          {resourceCount > 0 && (
            <li className="flex items-center gap-2.5">
              <Download className="size-4 text-muted-foreground" aria-hidden />
              {pluralize(resourceCount, "downloadable resource")}
            </li>
          )}
          <li className="flex items-center gap-2.5">
            <Smartphone className="size-4 text-muted-foreground" aria-hidden />
            Learn on phone, tablet or computer
          </li>
          {course.certificateEnabled && (
            <li className="flex items-center gap-2.5">
              <Award className="size-4 text-muted-foreground" aria-hidden />
              Certificate of completion
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {course.status !== "PUBLISHED" && (
        <div className="border-b border-warning/30 bg-warning-soft px-4 py-2.5 text-center text-sm text-warning">
          This course is a {course.status.toLowerCase()} — only instructors and enrolled learners can see this page.
        </div>
      )}
      <section className="border-b border-border bg-surface-muted/50">
        <div className="container-page grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 animate-fade-up">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/courses" className="hover:text-foreground">
                Courses
              </Link>
              {course.category && (
                <>
                  <ChevronRight className="size-3.5" aria-hidden />
                  <Link href={`/courses?category=${course.category.slug}`} className="hover:text-foreground">
                    {course.category.name}
                  </Link>
                </>
              )}
            </nav>
            <h1 className="text-display mt-4 text-[2.15rem] font-medium leading-[1.1] sm:text-[2.75rem]">{course.title}</h1>
            {course.subtitle && <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">{course.subtitle}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {course.ratingCount > 0 && (
                <a href="#reviews" className="flex items-center gap-1.5 hover:underline">
                  <span className="font-semibold">{course.ratingAverage.toFixed(1)}</span>
                  <RatingStars value={course.ratingAverage} />
                  <span className="text-muted-foreground">({pluralize(course.ratingCount, "review")})</span>
                </a>
              )}
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" aria-hidden /> {formatCompact(course.enrollmentCount)} learners
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <BarChart3 className="size-4" aria-hidden /> {LEVEL_LABELS[course.level]}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="size-4" aria-hidden /> English
              </span>
            </div>
            {instructors.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {instructors.map((i) => (
                    <Avatar key={i.id} name={i.name} src={i.avatarId ? mediaUrl(i.avatarId) : null} size="sm" className="ring-2 ring-surface-muted" />
                  ))}
                </div>
                <p className="text-sm">
                  Taught by{" "}
                  {instructors.map((i, idx) => (
                    <span key={i.id}>
                      {idx > 0 && (idx === instructors.length - 1 ? " and " : ", ")}
                      <Link href={`/instructors/${i.id}`} className="font-medium text-primary hover:underline">
                        {i.name}
                      </Link>
                    </span>
                  ))}
                </p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Last updated {formatDate(course.updatedAt, "MMMM yyyy")}</p>
          </div>
          <div className="lg:row-span-2">
            <div className="lg:sticky lg:top-24">{ctaCard}</div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 pb-28 sm:py-14 lg:grid-cols-[1fr_380px] lg:pb-14">
        <div className="min-w-0 space-y-12">
          {course.objectives.length > 0 && (
            <section aria-labelledby="learn-heading" className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
              <h2 id="learn-heading" className="text-display text-[1.6rem] font-medium">What you&apos;ll learn</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {course.objectives.map((o) => (
                  <li key={o} className="flex gap-3 text-[15px] leading-relaxed">
                    <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="curriculum-heading" id="curriculum" className="scroll-mt-24">
            <h2 id="curriculum-heading" className="text-display mb-4 text-[1.6rem] font-medium">Course content</h2>
            {sections.length > 0 ? (
              <CurriculumAccordion
                sections={sections}
                courseSlug={course.slug}
                completedIds={[...state.completedLessonIds]}
                canOpenAll={Boolean(enrolled) || state.canManage}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Lessons are being prepared.</p>
            )}
          </section>

          {course.requirements.length > 0 && (
            <section aria-labelledby="req-heading">
              <h2 id="req-heading" className="text-display text-[1.6rem] font-medium">Before you begin</h2>
              <ul className="mt-4 space-y-2">
                {course.requirements.map((r) => (
                  <li key={r} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-subtle-foreground" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.description && (
            <section aria-labelledby="desc-heading">
              <h2 id="desc-heading" className="text-display text-[1.6rem] font-medium">About this course</h2>
              <div className="prose-lesson mt-4 !text-base" dangerouslySetInnerHTML={{ __html: course.description }} />
            </section>
          )}

          {course.audience.length > 0 && (
            <section aria-labelledby="aud-heading">
              <h2 id="aud-heading" className="text-display text-[1.6rem] font-medium">Who this course is for</h2>
              <ul className="mt-4 space-y-2">
                {course.audience.map((a) => (
                  <li key={a} className="flex gap-3 text-[15px] leading-relaxed">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {instructors.length > 0 && (
            <section aria-labelledby="inst-heading">
              <h2 id="inst-heading" className="text-display text-[1.6rem] font-medium">
                Your {instructors.length > 1 ? "instructors" : "instructor"}
              </h2>
              <div className="mt-5 space-y-6">
                {instructors.map((i) => (
                  <div key={i.id} className="flex gap-4">
                    <Avatar name={i.name} src={i.avatarId ? mediaUrl(i.avatarId) : null} size="lg" />
                    <div className="min-w-0">
                      <Link href={`/instructors/${i.id}`} className="font-semibold hover:underline">
                        {i.name}
                      </Link>
                      {i.headline && <p className="text-sm text-muted-foreground">{i.headline}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{pluralize(i._count.teaching, "course")}</p>
                      {i.bio && <p className="mt-2 text-[15px] leading-relaxed text-foreground/90">{i.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {course.certificateEnabled && (
            <section aria-labelledby="cert-heading" className="flex flex-col gap-5 rounded-2xl border border-border bg-accent-soft/50 p-6 sm:flex-row sm:items-center">
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-surface text-accent shadow-xs">
                <Award className="size-6" aria-hidden />
              </div>
              <div>
                <h2 id="cert-heading" className="font-semibold">Earn a certificate of completion</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Complete every required lesson{lessons.some((l) => l.type === "QUIZ") ? " and pass the quizzes" : ""} to receive a
                  certificate from {org.name} with a unique code anyone can verify.
                </p>
              </div>
            </section>
          )}

          <section aria-labelledby="reviews-heading" id="reviews" className="scroll-mt-24">
            <h2 id="reviews-heading" className="text-display text-[1.6rem] font-medium">Learner reviews</h2>
            {course.ratingCount > 0 ? (
              <div className="mt-5 grid gap-8 md:grid-cols-[220px_1fr]">
                <div>
                  <p className="text-display text-5xl font-medium">{course.ratingAverage.toFixed(1)}</p>
                  <RatingStars value={course.ratingAverage} size="md" className="mt-2" />
                  <p className="mt-1 text-sm text-muted-foreground">{pluralize(course.ratingCount, "review")}</p>
                  <ul className="mt-4 space-y-1.5">
                    {reviews.distribution.map((d) => (
                      <li key={d.rating} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-3 tabular-nums">{d.rating}</span>
                        <ProgressBar value={course.ratingCount ? (d.count / course.ratingCount) * 100 : 0} size="sm" tone="accent" label={`${d.rating} star reviews`} />
                        <span className="w-6 text-right tabular-nums">{d.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <ul className="space-y-6">
                  {reviews.reviews.map((r) => (
                    <li key={r.id} className="border-b border-border pb-6 last:border-0">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.user.name} src={r.user.avatarUrl} size="sm" />
                        <div>
                          <p className="text-sm font-semibold">{r.user.name}</p>
                          <div className="flex items-center gap-2">
                            <RatingStars value={r.rating} />
                            <span className="text-xs text-muted-foreground">{formatRelative(r.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {r.body && <p className="mt-3 text-[15px] leading-relaxed">{r.body}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No reviews yet. Learners can share feedback once they&apos;re underway.</p>
            )}
            {canReview && (
              <div className="mt-8">
                <ReviewForm courseId={course.id} initial={state.review} />
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Sticky mobile call to action */}
      <div
        className={`fixed inset-x-0 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur lg:hidden ${viewer ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:bottom-0" : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"}`}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{course.title}</p>
            <p className="text-xs text-muted-foreground">
              {enrolled ? `${enrolled.status === "COMPLETED" ? 100 : enrolled.progressPercent}% complete` : `${pluralize(lessons.length, "lesson")} · Free`}
            </p>
          </div>
          {enrolled ? (
            <Button asChild>
              <Link href={continueHref}>
                <PlayCircle aria-hidden /> {enrolled.progressPercent > 0 ? "Continue" : "Start"}
              </Link>
            </Button>
          ) : course.status === "PUBLISHED" ? (
            <EnrollButton courseId={course.id} courseSlug={course.slug} signedIn={Boolean(viewer)}>
              Enrol free
            </EnrollButton>
          ) : (
            <Badge variant="warning">Draft</Badge>
          )}
        </div>
      </div>
    </>
  );
}
