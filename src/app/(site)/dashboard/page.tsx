import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpenCheck, CalendarClock, ChevronRight, Clock, Compass, GraduationCap } from "lucide-react";
import { requirePageViewer } from "@/server/auth/guards";
import { getCurrentOrganization } from "@/server/organization";
import { getDashboard } from "@/server/queries/learner";
import { ContinueLearningCard, LearnerCourseCard } from "@/components/learner/learner-course-card";
import { StreakCard } from "@/components/learner/streak-card";
import { AchievementBadge } from "@/components/learner/achievement-badge";
import { CourseGrid } from "@/components/course/course-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(timezone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatLearningTime(seconds: number) {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = seconds / 3600;
  return `${h < 10 ? h.toFixed(1) : Math.round(h)}h`;
}

export default async function DashboardPage() {
  const viewer = await requirePageViewer("/dashboard");
  const org = await getCurrentOrganization();
  const d = await getDashboard(viewer, org.timezone);
  const firstName = viewer.name.split(" ")[0];
  const isNew = !d.continueCourse && d.inProgress.length === 0 && d.completed.length === 0;

  return (
    <div className="container-page py-8 pb-24 sm:py-12 lg:pb-12">
      <header>
        <h1 className="text-display text-[2rem] font-medium leading-tight sm:text-[2.5rem]">
          {greeting(org.timezone)}, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isNew ? `Welcome to ${org.name}. Let's find your first course.` : d.streak.activeToday ? "You've already learned today. Keep it up." : "Ready to pick up where you left off?"}
        </p>
      </header>

      {isNew ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-surface p-6 sm:p-10">
          <div className="max-w-xl">
            <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Compass className="size-6" aria-hidden />
            </span>
            <h2 className="text-display mt-5 text-2xl font-medium">Start your first course</h2>
            <p className="mt-2 text-muted-foreground">
              Courses are self-paced. Watch, read and reflect in short lessons, and your progress is saved automatically. Finish a course to earn a certificate.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        </section>
      ) : (
        <div className="mt-8 space-y-6">
          {d.continueCourse && <ContinueLearningCard item={d.continueCourse} />}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Courses in progress" value={d.stats.coursesInProgress} icon={<BookOpenCheck />} hint={`${d.stats.coursesCompleted} completed`} />
            <Stat label="Lessons completed" value={d.stats.completedLessons} icon={<GraduationCap />} />
            <Stat label="Time learning" value={formatLearningTime(d.stats.learningSeconds)} icon={<Clock />} />
            <Stat label="Certificates" value={d.stats.certificates} icon={<Award />} />
          </div>
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-12">
          {d.inProgress.length > 0 && (
            <section aria-labelledby="in-progress">
              <SectionHeading id="in-progress" title="In progress" href="/my-courses?filter=in-progress" linkLabel="All my courses" />
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {d.inProgress.map((c) => (
                  <LearnerCourseCard key={c.enrollmentId} item={c} />
                ))}
              </div>
            </section>
          )}

          {d.recommended.length > 0 && (
            <section aria-labelledby="recommended">
              <SectionHeading id="recommended" title="Recommended for you" description="Based on the topics you've been studying." href="/courses" linkLabel="Browse all" />
              <CourseGrid courses={d.recommended} className="mt-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4" />
            </section>
          )}

          {d.completed.length > 0 && (
            <section aria-labelledby="completed">
              <SectionHeading id="completed" title="Completed" href="/my-courses?filter=completed" />
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {d.completed.map((c) => (
                  <LearnerCourseCard key={c.enrollmentId} item={c} />
                ))}
              </div>
            </section>
          )}

          {d.recentlyAdded.length > 0 && (
            <section aria-labelledby="recent">
              <SectionHeading id="recent" title="Recently added" href="/courses?sort=newest" />
              <CourseGrid courses={d.recentlyAdded} className="mt-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4" />
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <StreakCard {...d.streak} />

          <section aria-labelledby="due-heading" className="rounded-2xl border border-border bg-surface p-5">
            <h2 id="due-heading" className="flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="size-4 text-muted-foreground" aria-hidden /> Upcoming assignments
            </h2>
            {d.upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing due. You&apos;re all caught up.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {d.upcoming.map((a) => (
                  <li key={a.lessonId}>
                    <Link href={`/learn/${a.courseSlug}/${a.lessonId}`} className="-mx-2 block rounded-lg px-2 py-2 transition-colors hover:bg-surface-muted">
                      <p className="text-sm font-medium leading-snug">{a.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{a.courseTitle}</span>
                        {a.overdue ? <Badge variant="danger">Overdue</Badge> : <span>· Due {formatDate(a.dueAt)}</span>}
                        {a.status === "NEEDS_REVISION" && <Badge variant="warning">Revise</Badge>}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="certs-heading" className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 id="certs-heading" className="flex items-center gap-2 text-sm font-semibold">
                <Award className="size-4 text-muted-foreground" aria-hidden /> Certificates
              </h2>
              {d.certificates.length > 0 && (
                <Link href="/certificates" className="inline-flex items-center text-xs font-medium text-primary hover:underline">
                  View all <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              )}
            </div>
            {d.certificates.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Complete a course to earn your first certificate.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {d.certificates.map((c) => (
                  <li key={c.id}>
                    <Link href={`/certificates/${c.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-muted">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
                        <Award className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{c.courseTitle}</span>
                        <span className="block text-xs text-muted-foreground">Issued {formatDate(c.issuedAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {d.achievements.length > 0 && (
            <section aria-labelledby="ach-heading" className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 id="ach-heading" className="text-sm font-semibold">
                  Recent milestones
                </h2>
                <Link href="/profile#milestones" className="inline-flex items-center text-xs font-medium text-primary hover:underline">
                  All <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
              <div className="mt-3 space-y-3">
                {d.achievements.map((a) => (
                  <AchievementBadge key={a.achievement.code} {...a.achievement} earnedAt={a.earnedAt} size="sm" />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
