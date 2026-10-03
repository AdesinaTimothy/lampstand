import {
  Baby,
  BookOpen,
  Church,
  Compass,
  Cross,
  Flame,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  House,
  Mic,
  Music,
  Scroll,
  Sprout,
  Sun,
  Users,
} from "lucide-react";
import { isCategoryIcon, type CategoryIcon as CategoryIconName } from "@/lib/category-icons";

// Explicit map keeps the bundle to the icons we actually allow.
const ICONS: Record<CategoryIconName, React.ComponentType<{ className?: string }>> = {
  "book-open": BookOpen,
  cross: Cross,
  church: Church,
  "heart-handshake": HeartHandshake,
  users: Users,
  sprout: Sprout,
  "graduation-cap": GraduationCap,
  "hand-heart": HandHeart,
  baby: Baby,
  sun: Sun,
  music: Music,
  compass: Compass,
  scroll: Scroll,
  flame: Flame,
  home: House,
  mic: Mic,
};

export function CategoryIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = ICONS[isCategoryIcon(name) ? name : "book-open"];
  return <Icon className={className} aria-hidden />;
}
