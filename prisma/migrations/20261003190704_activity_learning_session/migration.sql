-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'LEARNING_SESSION';

-- DropIndex
DROP INDEX "Course_title_trgm_idx";

-- DropIndex
DROP INDEX "Lesson_title_trgm_idx";

-- DropIndex
DROP INDEX "User_email_trgm_idx";

-- DropIndex
DROP INDEX "User_name_trgm_idx";
