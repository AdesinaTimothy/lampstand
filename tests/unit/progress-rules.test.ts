import { describe, expect, it } from "vitest";
import { isMediaComplete, nextWatchedSeconds } from "@/server/services/progress";

describe("isMediaComplete", () => {
  it("requires 90% of the duration or the final 10 seconds", () => {
    expect(isMediaComplete(89, 100)).toBe(false);
    expect(isMediaComplete(90, 100)).toBe(true);
    expect(isMediaComplete(1000, 1200)).toBe(false);
    expect(isMediaComplete(1190, 1200)).toBe(true);
  });

  it("never completes media without a known duration", () => {
    expect(isMediaComplete(500, null)).toBe(false);
    expect(isMediaComplete(500, 0)).toBe(false);
  });
});

describe("nextWatchedSeconds", () => {
  it("advances with normal playback", () => {
    expect(nextWatchedSeconds({ previousWatched: 30, reportedPosition: 40, elapsedSeconds: 10 })).toBe(40);
  });

  it("does not credit seeking far ahead of real time", () => {
    // 10s elapsed can account for at most 30 + 10*2.5 + 15 = 70s.
    expect(nextWatchedSeconds({ previousWatched: 30, reportedPosition: 600, elapsedSeconds: 10 })).toBe(70);
  });

  it("never moves backwards when the learner rewinds", () => {
    expect(nextWatchedSeconds({ previousWatched: 120, reportedPosition: 15, elapsedSeconds: 10 })).toBe(120);
  });

  it("treats clock skew (negative elapsed) as zero elapsed", () => {
    expect(nextWatchedSeconds({ previousWatched: 0, reportedPosition: 300, elapsedSeconds: -50 })).toBe(15);
  });
});
