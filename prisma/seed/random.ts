// Deterministic pseudo-randomness so every seed run produces the same dataset
// (apart from wall-clock-relative dates and certificate codes).

export class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Mulberry32: tiny, fast, good enough for demo data. */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("pick() from empty list");
    return items[Math.floor(this.next() * items.length)];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  sample<T>(items: readonly T[], n: number): T[] {
    return this.shuffle(items).slice(0, Math.max(0, Math.min(n, items.length)));
  }

  /** Value in [0,1) skewed towards 1 (recent) when power > 1. */
  skewed(power: number): number {
    return 1 - Math.pow(this.next(), power);
  }
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** Wall-clock anchor for the whole run, so every relative date agrees. */
export const NOW = new Date();

export function daysAgo(days: number, from: Date = NOW): Date {
  return new Date(from.getTime() - days * DAY);
}

export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

export function minDate(...dates: Date[]): Date {
  return new Date(Math.min(...dates.map((d) => d.getTime())));
}

export function maxDate(...dates: Date[]): Date {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

/**
 * Nudges a timestamp to a believable local hour for a church community in
 * America/New_York (early morning devotions, lunch breaks, evenings).
 * Keeps the calendar day (in New York) and never moves past `NOW`.
 */
export function atLocalHour(date: Date, rng: Random): Date {
  const hours = [6, 7, 7, 8, 12, 12, 13, 18, 19, 20, 20, 21, 21, 22];
  const day = nyDayStart(date);
  const local = addMs(day, rng.pick(hours) * HOUR + rng.int(0, 59) * MINUTE + rng.int(0, 59) * 1000);
  return local.getTime() > NOW.getTime() ? addMs(NOW, -rng.int(2, 40) * MINUTE) : local;
}

const NY_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function nyOffsetMs(date: Date): number {
  const parts = Object.fromEntries(NY_PARTS.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant at which the New York calendar day containing `date` began. */
export function nyDayStart(date: Date): Date {
  const offset = nyOffsetMs(date);
  const local = new Date(date.getTime() + offset);
  const startLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const guess = new Date(startLocal - offset);
  // Re-evaluate the offset at the start of the day (DST transitions).
  return new Date(startLocal - nyOffsetMs(guess));
}

/** YYYY-MM-DD in New York time. */
export function nyDayKey(date: Date): string {
  const parts = Object.fromEntries(NY_PARTS.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

export function wordCount(text: string): number {
  return stripHtml(text).split(/\s+/).filter(Boolean).length;
}

/** Same formula as the app's lesson editor (services/curriculum.ts). */
export function readingSeconds(html: string): number {
  return Math.max(60, Math.round((wordCount(html) / 200) * 60));
}
