import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen, Star, Users } from "lucide-react";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import { getTeacher } from "@/server/queries/teachers";
import { CourseGrid } from "@/components/course/course-card";
import { Avatar } from "@/components/ui/avatar";
import { formatNumber } from "@/lib/format";
import { pluralize, truncate } from "@/lib/utils";

export async function generateMetadata(props: PageProps<"/instructors/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const org = await getCurrentOrganization();
  const t = await getTeacher(org.id, id);
  if (!t) return { title: "Instructor not found" };
  return {
    title: t.name,
    description: truncate(t.headline ?? t.bio ?? `Courses taught by ${t.name} at ${org.name}.`, 160),
    alternates: { canonical: `/instructors/${id}` },
  };
}

export default async function InstructorPage(props: PageProps<"/instructors/[id]">) {
  const { id } = await props.params;
  const [org, viewer] = await Promise.all([getCurrentOrganization(), getViewer()]);
  const t = await getTeacher(org.id, id, viewer?.id);
  if (!t) notFound();

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="flex flex-col gap-6 md:flex-row md:items-start">
        <Avatar name={t.name} src={t.avatarUrl} size="xl" className="size-28 text-4xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">Instructor</p>
          <h1 className="text-display mt-1 text-[2.25rem] font-medium leading-tight sm:text-[2.75rem]">{t.name}</h1>
          {t.headline && <p className="mt-2 text-lg text-muted-foreground">{t.headline}</p>}
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li className="flex items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" aria-hidden /> {pluralize(t.courses.length, "course")}
            </li>
            <li className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" aria-hidden /> {formatNumber(t.learners)} {t.learners === 1 ? "learner" : "learners"}
            </li>
            {t.ratingCount > 0 && (
              <li className="flex items-center gap-2">
                <Star className="size-4 fill-accent text-accent" aria-hidden /> {t.rating.toFixed(1)} average from {pluralize(t.ratingCount, "review")}
              </li>
            )}
          </ul>
          {t.bio && <p className="mt-6 max-w-3xl whitespace-pre-line leading-relaxed">{t.bio}</p>}
        </div>
      </header>
      <section className="mt-14" aria-labelledby="courses-heading">
        <h2 id="courses-heading" className="text-xl font-semibold">
          Courses by {t.name.split(" ")[0]}
        </h2>
        <CourseGrid courses={t.courses} className="mt-5" />
      </section>
    </div>
  );
}
