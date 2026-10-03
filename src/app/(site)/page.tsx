import Link from "next/link";
import { ArrowRight, Award, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";
import { CourseCover } from "@/components/course/course-cover";
import { CourseGrid } from "@/components/course/course-card";
import { CategoryIcon } from "@/components/course/category-icon";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { formatCompact, formatDuration } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import { getCategoriesWithCounts, getFeaturedCourses, getPopularCourses, getRecentCourses } from "@/server/queries/catalog";
import { getPlatformTotals } from "@/server/queries/home";

export default async function HomePage() {
  const [org, viewer] = await Promise.all([getCurrentOrganization(), getViewer()]);
  const [featured, popular, recent, categories, totals] = await Promise.all([
    getFeaturedCourses(org.id, viewer?.id, 3),
    getPopularCourses(org.id, viewer?.id, 4),
    getRecentCourses(org.id, viewer?.id, 4),
    getCategoriesWithCounts(org.id),
    getPlatformTotals(org.id),
  ]);
  const hero = featured[0] ?? popular[0];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              {org.name} · Learning
            </p>
            <h1 className="text-display mt-5 text-[2.6rem] font-medium leading-[1.05] sm:text-[3.4rem] lg:text-[3.9rem]">
              Grow deeper in faith, <span className="italic text-primary">one lesson at a time.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              {org.description ??
                "Bible studies, discipleship pathways and ministry training from your church family — learn at your own pace, on any device."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {viewer ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Continue learning <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href={org.allowSelfRegistration ? "/register" : "/login"}>
                    Start learning free <ArrowRight aria-hidden />
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="outline">
                <Link href="/courses">Browse courses</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
              <div>
                <dt className="text-xs text-muted-foreground">Courses</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{totals.courses}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Lessons</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{totals.lessons}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Learners</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums">{formatCompact(totals.learners)}</dd>
              </div>
            </dl>
          </div>
          {hero && (
            <Link
              href={`/courses/${hero.slug}`}
              className="group relative mx-auto w-full max-w-lg animate-fade-up rounded-2xl [animation-delay:120ms]"
              aria-label={`Featured course: ${hero.title}`}
            >
              <div className="absolute -inset-3 -z-10 rotate-2 rounded-[1.4rem] bg-primary-soft" aria-hidden />
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
                <CourseCover src={hero.thumbnailUrl} title={hero.title} seed={hero.id} preload sizes="(min-width: 1024px) 40vw, 100vw" />
                <div className="p-5 sm:p-6">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
                    <Sparkles className="size-3.5" aria-hidden /> Featured course
                  </p>
                  <p className="text-display mt-2 text-2xl font-medium leading-tight">{hero.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {hero.instructors.join(", ")} · {pluralize(hero.lessonCount, "lesson")} · {formatDuration(hero.durationSeconds)}
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section aria-labelledby="categories-heading" className="container-page py-14 sm:py-16">
          <SectionHeading id="categories-heading" title="Explore by topic" description="Find the right next step for where you are." />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/courses?category=${c.slug}`}
                  className="group flex h-full items-center gap-3 rounded-xl border border-border bg-surface p-3.5 transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-sm sm:p-4"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <CategoryIcon name={c.icon} className="size-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{c.name}</span>
                    <span className="block text-xs text-muted-foreground">{pluralize(c.courseCount, "course")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="border-y border-border bg-surface-muted/40">
          <div className="container-page py-14 sm:py-16">
            <SectionHeading id="featured-heading" title="Featured this season" description="Chosen by our pastors for where our church is heading." href="/courses" />
            <CourseGrid courses={featured} className="lg:grid-cols-3 xl:grid-cols-3" />
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section aria-labelledby="popular-heading" className="container-page py-14 sm:py-16">
          <SectionHeading id="popular-heading" title="Most popular" description="The courses our members return to most." href="/courses?sort=popular" />
          <CourseGrid courses={popular} />
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent-heading" className="container-page pb-14 sm:pb-16">
          <SectionHeading id="recent-heading" title="Recently added" href="/courses?sort=newest" />
          <CourseGrid courses={recent} />
        </section>
      )}

      <section aria-labelledby="how-heading" className="border-t border-border bg-surface">
        <div className="container-page grid gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="how-heading" className="text-display text-[1.85rem] font-medium leading-tight">Learning that fits real life</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Short lessons for the commute, deeper studies for a quiet evening. Your progress follows you on every device.
            </p>
          </div>
          <ol className="grid gap-6 sm:grid-cols-3">
            {[
              { icon: BookOpenCheck, title: "Enrol in a course", body: "Every course is free for our church family. Pick one and begin today." },
              { icon: Sparkles, title: "Learn at your pace", body: "Watch, read, listen and reflect. We save your place automatically." },
              { icon: Award, title: "Celebrate milestones", body: "Finish a course to receive a verifiable certificate you can share." },
            ].map((step, i) => (
              <li key={step.title} className="rounded-xl border border-border bg-background p-5">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <step.icon className="size-4 text-primary" aria-hidden /> Step {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-primary-soft/60 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-primary shadow-xs">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Verify a certificate</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCompact(totals.certificates)} certificates issued. Confirm any certificate with its unique code.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/verify">Verify a certificate</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
