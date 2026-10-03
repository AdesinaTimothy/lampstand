// Human labels for audit actions ("member.role_changed" → "Role changed").
const LABELS: Record<string, string> = {
  "member.role_changed": "Role changed",
  "member.suspended": "Member suspended",
  "member.reactivated": "Member reactivated",
  "instructor.added": "Instructor added",
  "instructor.invited": "Instructor invited",
  "course.created": "Course created",
  "course.published": "Course published",
  "course.unpublished": "Course unpublished",
  "course.archived": "Course archived",
  "course.deleted": "Course deleted",
  "course.featured": "Course featured",
  "course.unfeatured": "Course unfeatured",
  "course.instructors_changed": "Instructors changed",
  "category.created": "Category created",
  "category.updated": "Category updated",
  "category.deleted": "Category deleted",
  "announcement.sent": "Announcement sent",
  "organization.settings_updated": "Settings updated",
  "certificate.revoked": "Certificate revoked",
  "review.hidden": "Review hidden",
  "review.shown": "Review shown",
};

export function actionLabel(action: string): string {
  if (LABELS[action]) return LABELS[action];
  const [, verb = action] = action.split(".");
  const text = `${action.split(".")[0]} ${verb.replace(/_/g, " ")}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function actionTone(action: string): "danger" | "success" | "info" | "neutral" | "warning" {
  if (/(suspended|deleted|revoked|archived|hidden|unpublished|unfeatured)$/.test(action)) return "danger";
  if (/(published|reactivated|created|invited|added|featured)$/.test(action)) return "success";
  if (/(role_changed|settings_updated|instructors_changed)$/.test(action)) return "warning";
  if (action.startsWith("announcement")) return "info";
  return "neutral";
}
