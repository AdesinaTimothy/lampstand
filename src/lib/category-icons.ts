// Allow-listed icon names for categories (rendered via lucide-react).
export const CATEGORY_ICONS = [
  "book-open",
  "cross",
  "church",
  "heart-handshake",
  "users",
  "sprout",
  "graduation-cap",
  "hand-heart",
  "baby",
  "sun",
  "music",
  "compass",
  "scroll",
  "flame",
  "home",
  "mic",
] as const;
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];
export const isCategoryIcon = (v: string | null | undefined): v is CategoryIcon =>
  !!v && (CATEGORY_ICONS as readonly string[]).includes(v);
