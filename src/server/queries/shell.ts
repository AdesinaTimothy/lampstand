import "server-only";
import { db } from "../db";
import { getViewer } from "../auth/viewer";
import { getCurrentOrganization } from "../organization";
import { isInstructorOrStaff, isStaff } from "../authz/policies";

/** Data every page shell needs: who is signed in and their unread count. */
export async function getShellData() {
  const [viewer, org] = await Promise.all([getViewer(), getCurrentOrganization()]);
  const unread = viewer ? await db.notification.count({ where: { userId: viewer.id, readAt: null } }) : 0;
  return {
    org: { name: org.name, tagline: org.tagline, allowSelfRegistration: org.allowSelfRegistration },
    viewer: viewer
      ? {
          name: viewer.name,
          email: viewer.email,
          avatarUrl: viewer.avatarUrl,
          role: viewer.role,
          canTeach: isInstructorOrStaff(viewer),
          isStaff: isStaff(viewer),
        }
      : null,
    unread,
  };
}
