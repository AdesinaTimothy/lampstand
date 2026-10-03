"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  ListTree,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import type { PlayerData } from "@/server/queries/player";
import { recordLessonViewAction, toggleBookmarkAction } from "@/actions/learning";
import { Button } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { ProgressRing } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { LogoMark } from "@/components/brand/logo";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { LESSON_TYPE_LABELS } from "@/lib/course-meta";
import { formatBytes, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PlayerContext, type CompletionEvent } from "./player-context";
import { CurriculumNav } from "./curriculum-nav";
import { VideoPlayer } from "./video-player";
import { AudioPlayer } from "./audio-player";
import { useMediaProgress } from "./use-media-progress";
import { CompleteButton } from "./complete-button";
import { QuizPlayer } from "./quiz-player";
import { AssignmentPanel } from "./assignment-panel";
import { NotesPanel } from "./notes-panel";
import { DiscussionPanel } from "./discussion-panel";
import { CourseCompleteDialog } from "./course-complete-dialog";

export function PlayerShell({ data }: { data: PlayerData }) {
  const router = useRouter();
  const tracking = Boolean(data.enrollment) && !data.previewMode;
  const [completed, setCompleted] = React.useState(data.progress?.status === "COMPLETED");
  const [contentsOpen, setContentsOpen] = React.useState(false);
  const [celebrate, setCelebrate] = React.useState<{ certificateId: string | null } | null>(null);
  const mediaRef = React.useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const lesson = data.lesson;
  const isMedia = (lesson.type === "VIDEO" || lesson.type === "AUDIO") && Boolean(lesson.media);
  const q = data.previewMode ? "?preview=1" : "";

  // A view is recorded after mount, so prefetches and bots never count.
  React.useEffect(() => {
    if (tracking) void recordLessonViewAction(lesson.id);
  }, [tracking, lesson.id]);

  // Course completion can arrive via a refresh (quiz, assignment): celebrate the transition once.
  const initialStatus = React.useRef(data.enrollment?.status);
  React.useEffect(() => {
    if (initialStatus.current !== "COMPLETED" && data.enrollment?.status === "COMPLETED") {
      initialStatus.current = "COMPLETED";
      setCelebrate({ certificateId: data.enrollment.certificateId });
    }
  }, [data.enrollment]);

  const onCompleted = React.useCallback(
    (e: CompletionEvent) => {
      setCompleted(true);
      router.refresh();
      if (e.courseCompleted) {
        initialStatus.current = "COMPLETED";
        setCelebrate({ certificateId: e.certificateId });
      } else {
        toast.success("Lesson complete", {
          action: data.nextLessonId ? { label: "Next lesson", onClick: () => router.push(`/learn/${data.course.slug}/${data.nextLessonId}`) } : undefined,
        });
      }
    },
    [router, data.nextLessonId, data.course.slug],
  );

  useMediaProgress(mediaRef, { lessonId: lesson.id, enabled: tracking && isMedia, onCompleted });

  const ctx = React.useMemo(
    () => ({
      data,
      tracking,
      completed,
      onCompleted,
      mediaTime: () => mediaRef.current?.currentTime ?? null,
      seek: (t: number) => {
        const m = mediaRef.current;
        if (!m) return;
        m.currentTime = t;
        m.scrollIntoView({ block: "center", behavior: "smooth" });
        void m.play().catch(() => undefined);
      },
    }),
    [data, tracking, completed, onCompleted],
  );

  const progressPct = data.enrollment?.progressPercent ?? 0;
  const totalLessons = data.sections.reduce((n, s) => n + s.lessons.length, 0);
  const doneLessons = data.sections.reduce((n, s) => n + s.lessons.filter((l) => l.status === "COMPLETED").length, 0);
  const startAt = data.progress?.status === "COMPLETED" ? 0 : (data.progress?.positionSeconds ?? 0);

  return (
    <PlayerContext.Provider value={ctx}>
      <div className="flex min-h-dvh flex-col bg-background">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-2 backdrop-blur sm:gap-3 sm:px-4">
          <Link href="/" className="hidden shrink-0 rounded-md p-1 sm:block" aria-label="Lampstand home">
            <LogoMark className="size-7" />
          </Link>
          <Button asChild variant="ghost" size="icon-sm" className="sm:hidden">
            <Link href={`/courses/${data.course.slug}`} aria-label="Back to course page">
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
          <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
          <Link href={`/courses/${data.course.slug}`} className="min-w-0 flex-1 truncate text-sm font-semibold hover:underline sm:text-base">
            {data.course.title}
          </Link>
          {tracking && (
            <div className="flex shrink-0 items-center gap-2">
              <ProgressRing value={progressPct} size={34} stroke={3.5} label={`Course progress ${progressPct}%`}>
                <span className="text-[10px] font-semibold tabular-nums">{progressPct}%</span>
              </ProgressRing>
              <span className="hidden text-xs text-muted-foreground md:block">
                {doneLessons} of {totalLessons} lessons
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" className="shrink-0 lg:hidden" onClick={() => setContentsOpen(true)}>
            <ListTree aria-hidden /> <span className="hidden sm:inline">Contents</span>
            <span className="sr-only sm:hidden">Course contents</span>
          </Button>
        </header>

        {data.previewMode && (
          <div className="flex items-center justify-center gap-2 bg-info-soft px-4 py-2 text-center text-sm text-info">
            <Eye className="size-4 shrink-0" aria-hidden />
            <span>
              Preview mode — you&apos;re seeing what learners see. Nothing is tracked.
              {data.course.status !== "PUBLISHED" && " This course isn't published yet."}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          <main id="main" className="min-w-0 flex-1 pb-24 lg:pb-12">
            {/* Stage */}
            {lesson.type === "VIDEO" && lesson.media ? (
              <div className="bg-black lg:bg-transparent lg:px-6 lg:pt-6">
                <div className="mx-auto max-w-5xl">
                  <VideoPlayer
                    src={lesson.media.url}
                    title={lesson.title}
                    startAt={startAt}
                    mediaRef={mediaRef as React.RefObject<HTMLVideoElement | null>}
                  />
                </div>
              </div>
            ) : lesson.type === "AUDIO" && lesson.media ? (
              <div className="lg:px-6 lg:pt-6">
                <div className="mx-auto max-w-5xl">
                  <AudioPlayer
                    src={lesson.media.url}
                    title={lesson.title}
                    courseTitle={data.course.title}
                    startAt={startAt}
                    mediaRef={mediaRef as React.RefObject<HTMLAudioElement | null>}
                  />
                </div>
              </div>
            ) : lesson.type === "PDF" && lesson.media ? (
              <div className="px-0 lg:px-6 lg:pt-6">
                <div className="mx-auto max-w-5xl">
                  <iframe
                    src={lesson.media.url}
                    title={`${lesson.title} (PDF document)`}
                    className="h-[70dvh] w-full border-y border-border bg-surface-muted lg:rounded-xl lg:border"
                  />
                  <p className="px-4 pt-2 text-xs text-muted-foreground lg:px-0">
                    Document not showing?{" "}
                    <a href={lesson.media.downloadUrl} className="font-medium text-primary underline-offset-2 hover:underline">
                      Download the PDF
                    </a>
                    .
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-5xl">
              {/* Lesson heading */}
              <div className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <LessonTypeIcon type={lesson.type} className="size-3.5" />
                    {LESSON_TYPE_LABELS[lesson.type]}
                    {lesson.durationSeconds ? ` · ${formatDuration(lesson.durationSeconds)}` : null}
                  </p>
                  <h1 className="text-display mt-1 text-2xl font-medium leading-tight sm:text-3xl">{lesson.title}</h1>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {tracking && <BookmarkButton lessonId={lesson.id} initial={data.bookmarked} />}
                  {lesson.media && lesson.type === "PDF" && (
                    <Button asChild variant="outline" size="sm">
                      <a href={lesson.media.downloadUrl}>
                        <Download aria-hidden /> Download
                      </a>
                    </Button>
                  )}
                  {(lesson.type === "PDF" || (lesson.type === "TEXT" && completed)) && <CompleteButton />}
                  {isMedia && tracking && completed && <CompleteButton />}
                </div>
              </div>

              {/* Primary content for non-media lessons */}
              {lesson.type === "TEXT" && (
                <article className="py-8">
                  {lesson.content ? (
                    <div className="prose-lesson mx-auto max-w-[68ch]" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  ) : (
                    <p className="text-muted-foreground">This lesson has no content yet.</p>
                  )}
                  {!completed && (
                    <div className="mx-auto mt-10 flex max-w-[68ch] flex-col items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 p-6 text-center">
                      <p className="font-medium">Finished reading?</p>
                      <CompleteButton label="Mark as complete" />
                    </div>
                  )}
                </article>
              )}
              {lesson.type === "QUIZ" && lesson.quiz && (
                <div className="py-6">
                  <QuizPlayer quiz={lesson.quiz} />
                </div>
              )}
              {lesson.type === "ASSIGNMENT" && lesson.assignment && (
                <div className="py-6">
                  <AssignmentPanel assignment={lesson.assignment} />
                </div>
              )}
              {isMedia && tracking && !completed && (
                <p className="mt-4 rounded-lg bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
                  This lesson completes automatically once you&apos;ve watched or listened to almost all of it. Your place is saved as you go.
                </p>
              )}
              {(lesson.type === "VIDEO" || lesson.type === "AUDIO" || lesson.type === "PDF") && !lesson.media && (
                <p className="mt-6 rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">The media for this lesson hasn&apos;t been uploaded yet.</p>
              )}

              <LessonTabs />
            </div>
          </main>

          {/* Desktop sidebar */}
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[22rem] shrink-0 flex-col border-l border-border bg-surface lg:flex">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Course contents</p>
              {tracking && <p className="text-xs text-muted-foreground">{progressPct}% complete</p>}
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <CurriculumNav data={data} />
            </div>
            {prevNext("border-t border-border p-3")}
          </aside>
        </div>

        {/* Mobile bottom bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
          {prevNext()}
        </div>

        <Dialog open={contentsOpen} onOpenChange={setContentsOpen}>
          <SheetContent side="right" title="Course contents" description={tracking ? `${progressPct}% complete` : undefined} className="p-0">
            <div className="flex-1 overflow-y-auto">
              <CurriculumNav data={data} onNavigate={() => setContentsOpen(false)} />
            </div>
          </SheetContent>
        </Dialog>

        <CourseCompleteDialog
          open={Boolean(celebrate)}
          onOpenChange={(o) => !o && setCelebrate(null)}
          courseTitle={data.course.title}
          courseSlug={data.course.slug}
          certificateId={celebrate?.certificateId ?? null}
          certificateEnabled={data.course.certificateEnabled}
        />
      </div>
    </PlayerContext.Provider>
  );

  function prevNext(className?: string) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button asChild={Boolean(data.prevLessonId)} variant="outline" className="flex-1" disabled={!data.prevLessonId}>
          {data.prevLessonId ? (
            <Link href={`/learn/${data.course.slug}/${data.prevLessonId}${q}`}>
              <ChevronLeft aria-hidden /> Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft aria-hidden /> Previous
            </span>
          )}
        </Button>
        <Button asChild={Boolean(data.nextLessonId)} variant={completed ? "primary" : "outline"} className="flex-1" disabled={!data.nextLessonId}>
          {data.nextLessonId ? (
            <Link href={`/learn/${data.course.slug}/${data.nextLessonId}${q}`}>
              Next <ChevronRight aria-hidden />
            </Link>
          ) : (
            <span>
              Next <ChevronRight aria-hidden />
            </span>
          )}
        </Button>
      </div>
    );
  }
}

function BookmarkButton({ lessonId, initial }: { lessonId: string; initial: boolean }) {
  const [on, setOn] = React.useState(initial);
  const [pending, start] = React.useTransition();
  return (
    <Tooltip content={on ? "Remove bookmark" : "Bookmark this lesson"}>
      <Button
        variant="outline"
        size="icon-sm"
        aria-pressed={on}
        aria-label={on ? "Remove bookmark" : "Bookmark this lesson"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setOn(!on);
            const res = await toggleBookmarkAction(lessonId);
            if (!res.ok) {
              setOn(on);
              toast.error(res.error);
            } else {
              setOn(res.data.bookmarked);
              toast.success(res.data.bookmarked ? "Saved to bookmarks" : "Bookmark removed");
            }
          })
        }
      >
        {on ? <BookmarkCheck className="text-primary" aria-hidden /> : <Bookmark aria-hidden />}
      </Button>
    </Tooltip>
  );
}

function LessonTabs() {
  const { data } = React.useContext(PlayerContext)!;
  const lesson = data.lesson;
  const commentCount = data.comments.reduce((n, c) => n + 1 + c.replies.length, 0);
  const hasOverview = Boolean(lesson.summary) || ((lesson.type === "VIDEO" || lesson.type === "AUDIO" || lesson.type === "PDF") && Boolean(lesson.content));

  return (
    <Tabs defaultValue={hasOverview ? "overview" : lesson.resources.length ? "resources" : "notes"} className="mt-8">
      <TabsList className="w-full justify-start overflow-x-auto scrollbar-none">
        {hasOverview && <TabsTrigger value="overview">Overview</TabsTrigger>}
        <TabsTrigger value="resources">
          Resources{lesson.resources.length > 0 && <span className="ml-1.5 rounded-full bg-surface-sunken px-1.5 text-xs tabular-nums">{lesson.resources.length}</span>}
        </TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="discussion">
          Discussion{commentCount > 0 && <span className="ml-1.5 rounded-full bg-surface-sunken px-1.5 text-xs tabular-nums">{commentCount}</span>}
        </TabsTrigger>
      </TabsList>
      {hasOverview && (
        <TabsContent value="overview" className="py-6">
          {lesson.summary && <p className="text-base leading-relaxed text-muted-foreground">{lesson.summary}</p>}
          {lesson.type !== "TEXT" && lesson.content && <div className="prose-lesson mt-4" dangerouslySetInnerHTML={{ __html: lesson.content }} />}
        </TabsContent>
      )}
      <TabsContent value="resources" className="py-6">
        {lesson.resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No downloadable resources for this lesson.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {lesson.resources.map((r) => (
              <li key={r.id}>
                <a
                  href={r.href}
                  target={r.external ? "_blank" : undefined}
                  rel={r.external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-muted"
                >
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
                  {r.size ? <span className="text-xs text-muted-foreground">{formatBytes(r.size)}</span> : null}
                  {r.external ? <ExternalLink className="size-4 text-muted-foreground" aria-label="Opens in a new tab" /> : <Download className="size-4 text-muted-foreground" aria-hidden />}
                </a>
              </li>
            ))}
          </ul>
        )}
      </TabsContent>
      <TabsContent value="notes" className="py-6">
        <NotesPanel />
      </TabsContent>
      <TabsContent value="discussion" className="py-6">
        <DiscussionPanel />
      </TabsContent>
    </Tabs>
  );
}
