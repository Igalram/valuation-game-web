import { A1_STAGE, type StageAId } from "../definitions/stages";
import { stageResultLabel } from "./scoring";
import { stagePayout } from "./rewards";

export type StageResult = {
  stageId: StageAId;
  correctAnswers: number;
  totalQuestions: 8;
  accuracyPct: number;
  result: string;
  earnings: number;
  performancePoints: number;
  cashCredited: number;
};

export function completeStage(
  stageId: StageAId,
  correctAnswers: number,
  performancePoints: number,
  alreadyCredited: boolean,
): StageResult {
  const earnings = stagePayout(stageId, performancePoints);
  const cashCredited = alreadyCredited ? 0 : earnings;
  return {
    stageId,
    correctAnswers,
    totalQuestions: 8,
    accuracyPct: Math.round(
      (correctAnswers / 8) * 100,
    ),
    result: stageResultLabel(correctAnswers),
    earnings,
    performancePoints,
    cashCredited,
  };
}

export function completeA1(
  correctAnswers: number,
  performancePoints: number,
  alreadyCredited: boolean,
): StageResult {
  return completeStage(
    A1_STAGE.id,
    correctAnswers,
    performancePoints,
    alreadyCredited,
  );
}
