import "server-only";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import type { Permission } from "@/lib/roles";
import { getViewer, type Viewer } from "./viewer";
import { can, isInstructorOrStaff, isStaff } from "../authz/policies";

/** For Server Actions / Route Handlers: throws instead of redirecting. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new AppError("UNAUTHENTICATED", "Your session has expired. Please sign in again.");
  return viewer;
}

/** For pages: redirects to sign-in, preserving the destination. */
export async function requirePageViewer(next?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return viewer;
}

export async function requirePagePermission(permission: Permission, next?: string): Promise<Viewer> {
  const viewer = await requirePageViewer(next);
  if (!can(viewer, permission)) redirect("/forbidden");
  return viewer;
}

export async function requireStaffPage(next?: string): Promise<Viewer> {
  const viewer = await requirePageViewer(next);
  if (!isStaff(viewer)) redirect("/forbidden");
  return viewer;
}

export async function requireInstructorPage(next?: string): Promise<Viewer> {
  const viewer = await requirePageViewer(next);
  if (!isInstructorOrStaff(viewer)) redirect("/forbidden");
  return viewer;
}
