export type RewardStageId =
  | "A0"
  | "A1"
  | "A2"
  | "A3"
  | "A4"
  | "A5"
  | "A6"
  | "A7"
  | "A8"
  | "B0"
  | "B1"
  | "B2"
  | "B3"
  | "B4"
  | "B5";

export const QUESTIONS_PER_REWARDED_STAGE = 8;
export const MAX_PERFORMANCE_POINTS_PER_QUESTION = 100_000;
export const MAX_PERFORMANCE_POINTS_PER_STAGE =
  QUESTIONS_PER_REWARDED_STAGE * MAX_PERFORMANCE_POINTS_PER_QUESTION;

export const STAGE_REWARD_CAPS: Readonly<Record<RewardStageId, number>> = {
  A0: 730,
  A1: 1_095,
  A2: 1_460,
  A3: 1_825,
  A4: 2_375,
  A5: 2_920,
  A6: 3_650,
  A7: 4_565,
  A8: 5_475,
  B0: 7_300,
  B1: 9_125,
  B2: 10_950,
  B3: 14_600,
  B4: 18_250,
  B5: 27_375,
};

export function stagePayout(stageId: RewardStageId, performancePoints: number): number {
  if (!Number.isFinite(performancePoints)) {
    throw new RangeError("Performance points must be finite.");
  }
  const normalized = Math.min(
    1,
    Math.max(0, performancePoints / MAX_PERFORMANCE_POINTS_PER_STAGE),
  );
  return Math.round(STAGE_REWARD_CAPS[stageId] * normalized);
}
