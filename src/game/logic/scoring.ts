import type { TimeValueQuestion } from "./questions";

export type AnswerResult = {
  outcome: "correct" | "incorrect";
  score: 1 | 0;
};

export function scoreA1Answer(
  question: TimeValueQuestion,
  answer: string,
): AnswerResult {
  const correct = answer === question.correctAnswer;
  return { outcome: correct ? "correct" : "incorrect", score: correct ? 1 : 0 };
}

export function stageResultLabel(correctAnswers: number): string {
  if (correctAnswers >= 8) return "Excellent";
  if (correctAnswers >= 6) return "Good";
  if (correctAnswers >= 4) return "Developing";
  return "Needs Review";
}
