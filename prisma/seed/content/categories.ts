import type { CategoryIcon } from "@/lib/category-icons";
import type { CategorySlug } from "../types";

export const categories: { slug: CategorySlug; name: string; icon: CategoryIcon; description: string }[] = [
  { slug: "bible-study", name: "Bible Study", icon: "book-open", description: "Book studies and tools for reading Scripture with understanding." },
  { slug: "discipleship", name: "Discipleship", icon: "sprout", description: "Everyday habits of prayer, worship and obedience that help faith grow." },
  { slug: "new-believers", name: "New Believers", icon: "sun", description: "First steps for anyone new to following Jesus or exploring the faith." },
  { slug: "leadership", name: "Leadership", icon: "compass", description: "Equipping leaders to shepherd teams and small groups like Jesus." },
  { slug: "marriage-and-family", name: "Marriage & Family", icon: "home", description: "Biblical wisdom for couples, parents and the whole household." },
  { slug: "youth", name: "Youth", icon: "flame", description: "Honest, hopeful teaching for students in middle and high school." },
  { slug: "ministry-training", name: "Ministry Training", icon: "hand-heart", description: "Required and recommended training for volunteers and serving teams." },
  { slug: "membership", name: "Membership", icon: "church", description: "Get to know Grace Harbor and take your next step into church family life." },
];
