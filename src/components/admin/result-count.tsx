import { pluralize } from "@/lib/utils";

export function ResultCount({ total, noun, plural, filtered }: { total: number; noun: string; plural?: string; filtered: boolean }) {
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      {pluralize(total, noun, plural)}
      {filtered ? " match your filters" : ""}
    </p>
  );
}
