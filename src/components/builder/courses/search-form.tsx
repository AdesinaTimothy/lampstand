import Form from "next/form";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** GET search form that keeps other filters as hidden fields. */
export function SearchForm({
  action,
  defaultValue,
  placeholder,
  label,
  keep = {},
}: {
  action: string;
  defaultValue: string;
  placeholder: string;
  label: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <Form action={action} role="search" className="relative w-full sm:max-w-xs">
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor={`${action}-search`} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
      <Input id={`${action}-search`} name="q" type="search" defaultValue={defaultValue} placeholder={placeholder} className="pl-9" />
    </Form>
  );
}
