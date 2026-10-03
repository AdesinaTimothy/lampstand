import Link from "next/link";
import { Award, BookOpenCheck, Clock, Flame, GraduationCap, Settings } from "lucide-react";
import type { getProfile } from "@/server/queries/learner";
import { AchievementBadge } from "./achievement-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/ui/stat";
import { formatDate } from "@/lib/format";

type Profile = Extract<NonNullable<Awaited<ReturnType<typeof getProfile>>>, { hidden: false }>;

const ROLE_LABEL = { OWNER: "Church leader", ADMIN: "Administrator", INSTRUCTOR: "Instructor", LEARNER: null } as const;
const VISIBILITY_LABEL = { PUBLIC: "Public profile", MEMBERS: "Visible to church members", PRIVATE: "Private profile" } as const;

export function ProfileView({ profile }: { profile: Profile }) {
  const { user, stats, achievements, certificates, streak, isSelf } = profile;
  const earned = achievements.filter((a) => a.earnedAt).length;
  const hours = stats.learningSeconds / 3600;
  return (
    <div className="container-page max-w-5xl py-8 pb-24 sm:py-12 lg:pb-12">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={user.name} src={user.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-display text-[2rem] font-medium leading-tight">{user.name}</h1>
            {ROLE_LABEL[user.role] && <Badge variant="primary">{ROLE_LABEL[user.role]}</Badge>}
          </div>
          {user.headline && <p className="mt-1 text-muted-foreground">{user.headline}</p>}
          <p className="mt-1 text-sm text-subtle-foreground">
            Member since {formatDate(user.createdAt, "MMMM yyyy")}
            {isSelf && ` · ${VISIBILITY_LABEL[user.profileVisibility]}`}
          </p>
        </div>
        {isSelf && (
          <Button asChild variant="outline">
            <Link href="/settings">
              <Settings aria-hidden /> Edit profile
            </Link>
          </Button>
        )}
      </header>
      {user.bio && <p className="mt-6 max-w-2xl whitespace-pre-line leading-relaxed">{user.bio}</p>}

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Courses completed" value={stats.coursesCompleted} icon={<BookOpenCheck />} />
        <Stat label="Lessons completed" value={stats.completedLessons} icon={<GraduationCap />} />
        <Stat label="Hours learning" value={hours < 1 ? `${Math.round(stats.learningSeconds / 60)}m` : hours.toFixed(1)} icon={<Clock />} />
        <Stat label="Current streak" value={`${streak.current}d`} hint={streak.longest > 0 ? `Longest ${streak.longest} days` : undefined} icon={<Flame />} />
      </div>

      <section id="milestones" aria-labelledby="milestones-heading" className="mt-12 scroll-mt-24">
        <div className="flex items-baseline justify-between">
          <h2 id="milestones-heading" className="text-xl font-semibold">
            Milestones
          </h2>
          <p className="text-sm text-muted-foreground">
            {earned} of {achievements.length} earned
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements
            .filter((a) => isSelf || a.earnedAt)
            .map((a) => (
              <AchievementBadge key={a.code} {...a} />
            ))}
        </div>
        {!isSelf && earned === 0 && <p className="mt-3 text-sm text-muted-foreground">No milestones yet.</p>}
      </section>

      <section aria-labelledby="certs-heading" className="mt-12">
        <h2 id="certs-heading" className="text-xl font-semibold">
          Certificates
        </h2>
        {certificates.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{isSelf ? "Complete a course to earn your first certificate." : "No certificates yet."}</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {certificates.map((c) => (
              <li key={c.id}>
                <Link
                  href={isSelf ? `/certificates/${c.id}` : `/verify/${c.code}`}
                  prefetch={false}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent" aria-hidden>
                    <Award className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.courseTitle}</span>
                    <span className="block text-xs text-muted-foreground">Issued {formatDate(c.issuedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
