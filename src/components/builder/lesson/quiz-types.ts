import type { z } from "zod";
import type { QuestionType } from "@prisma/client";
import type { quizSchema } from "@/lib/validation/course";

export type QuizValues = z.input<typeof quizSchema>;
export type QuizOutput = z.output<typeof quizSchema>;

export type QuizData = {
  passingScore: number;
  maxAttempts: number | null;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  _count: { attempts: number };
  questions: {
    id: string;
    type: QuestionType;
    prompt: string;
    explanation: string | null;
    points: number;
    options: { id: string; text: string; isCorrect: boolean }[];
  }[];
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Single answer",
  MULTIPLE_CHOICE: "Multiple answers",
  TRUE_FALSE: "True or false",
};

export function quizToValues(quiz: QuizData | null): QuizValues {
  return {
    passingScore: quiz?.passingScore ?? 70,
    maxAttempts: quiz?.maxAttempts ?? null,
    shuffleQuestions: quiz?.shuffleQuestions ?? false,
    showCorrectAnswers: quiz?.showCorrectAnswers ?? true,
    questions: (quiz?.questions ?? []).map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      explanation: q.explanation ?? "",
      points: q.points,
      options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
    })),
  };
}

export const newQuestion = (): QuizValues["questions"][number] => ({
  type: "SINGLE_CHOICE",
  prompt: "",
  explanation: "",
  points: 1,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

export const trueFalseOptions = () => [
  { text: "True", isCorrect: true },
  { text: "False", isCorrect: false },
];
