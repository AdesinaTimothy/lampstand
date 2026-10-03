// Helpers for reading Next.js searchParams safely.
export type SearchParams = Record<string, string | string[] | undefined>;

export function param(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.length <= 200 ? s : undefined;
}

export function pageParam(sp: SearchParams): number {
  const n = Number(param(sp, "page"));
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

export function enumParam<T extends string>(sp: SearchParams, key: string, values: readonly T[]): T | undefined {
  const v = param(sp, key);
  return v && (values as readonly string[]).includes(v) ? (v as T) : undefined;
}

export function toRecord(sp: SearchParams): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}
