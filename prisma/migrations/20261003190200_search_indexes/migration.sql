-- Full-text and fuzzy search support.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Weighted document for course ranking: title (A) > subtitle/objectives (B) > description (C)
CREATE INDEX "Course_search_idx" ON "Course" USING GIN (
  (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("subtitle", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'C')
  )
);
CREATE INDEX "Course_title_trgm_idx" ON "Course" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Lesson_title_trgm_idx" ON "Lesson" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "User_name_trgm_idx" ON "User" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "User_email_trgm_idx" ON "User" USING GIN ("email" gin_trgm_ops);

-- Integrity rules Prisma cannot express.
ALTER TABLE "Review" ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_passing_score_range" CHECK ("passingScore" BETWEEN 0 AND 100);
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_progress_range" CHECK ("progressPercent" BETWEEN 0 AND 100);
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_score_range" CHECK ("score" BETWEEN 0 AND 100);
