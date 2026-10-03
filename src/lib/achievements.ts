// Achievement catalogue. Kept small and meaningful: milestones of faithfulness,
// not points for clicking.
export const ACHIEVEMENTS = [
  { code: "FIRST_STEP", title: "First Step", description: "Completed your first lesson", icon: "footprints" },
  { code: "WELL_STUDIED", title: "Well Studied", description: "Completed 25 lessons", icon: "library" },
  { code: "FIRST_COURSE", title: "Finished the Race", description: "Completed your first course", icon: "flag" },
  { code: "THREE_COURSES", title: "Rooted & Growing", description: "Completed three courses", icon: "sprout" },
  { code: "PERFECT_QUIZ", title: "Rightly Dividing", description: "Scored 100% on a quiz", icon: "target" },
  { code: "STREAK_7", title: "Week of Faithfulness", description: "Learned seven days in a row", icon: "flame" },
  { code: "STREAK_30", title: "Steadfast", description: "Learned thirty days in a row", icon: "mountain" },
] as const;

export type AchievementCode = (typeof ACHIEVEMENTS)[number]["code"];
