import { z } from "zod";
import { nameSchema, emailSchema } from "./auth";

export const MEMBER_ROLES = ["OWNER", "ADMIN", "INSTRUCTOR", "LEARNER"] as const;

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(160).optional().default(""),
  description: z.string().trim().max(2000).optional().default(""),
  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .default("")
    .refine((v) => !v || /^https?:\/\//i.test(v), "Enter a full URL starting with https://"),
  email: z.union([z.literal(""), emailSchema]).optional().default(""),
  logoId: z.string().max(40).nullish(),
  allowSelfRegistration: z.boolean(),
  requireEmailVerification: z.boolean(),
  certificateSignatoryName: z.string().trim().max(120).optional().default(""),
  certificateSignatoryTitle: z.string().trim().max(120).optional().default(""),
  timezone: z.string().trim().min(1).max(64),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(60),
  description: z.string().trim().max(300).optional().default(""),
  icon: z.string().trim().max(40).optional().default("book-open"),
});

export const changeRoleSchema = z.object({
  userId: z.string().min(1).max(40),
  role: z.enum(MEMBER_ROLES),
});

export const setStatusSchema = z.object({
  userId: z.string().min(1).max(40),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const inviteInstructorSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(140),
  body: z.string().trim().min(3, "Write a message").max(2000),
  sendEmail: z.boolean().default(false),
});

export const courseInstructorsSchema = z.object({
  courseId: z.string().min(1).max(40),
  instructorIds: z.array(z.string().min(1).max(40)).min(1, "A course needs at least one instructor").max(10),
});

export const profileSchema = z.object({
  name: nameSchema,
  headline: z.string().trim().max(100).optional().default(""),
  bio: z.string().trim().max(1000).optional().default(""),
  avatarId: z.string().max(40).nullish(),
  profileVisibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]),
  emailNotifications: z.boolean(),
});
