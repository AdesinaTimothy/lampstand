import { describe, expect, it } from "vitest";
import { gradeQuiz } from "@/server/services/quiz";

const questions = [
  { id: "q1", points: 1, options: [{ id: "a", isCorrect: false }, { id: "b", isCorrect: true }] },
  { id: "q2", points: 2, options: [{ id: "c", isCorrect: true }, { id: "d", isCorrect: true }, { id: "e", isCorrect: false }] },
  { id: "q3", points: 1, options: [{ id: "t", isCorrect: true }, { id: "f", isCorrect: false }] },
];

describe("gradeQuiz", () => {
  it("awards full marks for an exact match", () => {
    const r = gradeQuiz(questions, { q1: ["b"], q2: ["c", "d"], q3: ["t"] }, 70);
    expect(r).toMatchObject({ score: 100, pointsEarned: 4, pointsTotal: 4, passed: true });
  });

  it("gives no partial credit on multiple-answer questions", () => {
    const r = gradeQuiz(questions, { q1: ["b"], q2: ["c"], q3: ["t"] }, 70);
    expect(r.pointsEarned).toBe(2);
    expect(r.score).toBe(50);
    expect(r.passed).toBe(false);
  });

  it("treats selecting extra wrong options as incorrect", () => {
    const r = gradeQuiz(questions, { q2: ["c", "d", "e"] }, 0);
    expect(r.results.find((x) => x.questionId === "q2")?.correct).toBe(false);
  });

  it("ignores option ids that don't belong to the question and duplicate ids", () => {
    const r = gradeQuiz(questions, { q1: ["b", "b", "zzz"], q3: ["c"] }, 0);
    expect(r.results[0]).toMatchObject({ correct: true, selected: ["b"] });
    expect(r.results[2]).toMatchObject({ correct: false, selected: [] });
  });

  it("passes exactly at the threshold and handles empty quizzes", () => {
    expect(gradeQuiz(questions, { q1: ["b"], q3: ["t"] }, 50).passed).toBe(true);
    expect(gradeQuiz([], {}, 50)).toMatchObject({ score: 0, passed: false });
  });
});
