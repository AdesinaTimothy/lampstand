import { describe, expect, it } from "vitest";
import { computeStreak } from "@/server/services/activity";

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-10-03", "2026-10-02", "2026-10-01"], "2026-10-03")).toEqual({ current: 3, longest: 3, activeToday: true });
  });

  it("keeps the streak alive until the end of today if yesterday was active", () => {
    expect(computeStreak(["2026-10-02", "2026-10-01"], "2026-10-03")).toEqual({ current: 2, longest: 2, activeToday: false });
  });

  it("resets after a missed day but remembers the longest run", () => {
    const days = ["2026-10-03", "2026-09-30", "2026-09-29", "2026-09-28", "2026-09-27"];
    expect(computeStreak(days, "2026-10-03")).toEqual({ current: 1, longest: 4, activeToday: true });
  });

  it("handles month boundaries and no activity", () => {
    expect(computeStreak(["2026-10-01", "2026-09-30"], "2026-10-01").current).toBe(2);
    expect(computeStreak([], "2026-10-01")).toEqual({ current: 0, longest: 0, activeToday: false });
  });
});
