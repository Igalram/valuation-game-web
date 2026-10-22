import { describe, expect, it } from "vitest";
import { completeStage } from "./progression";
import {
  MAX_PERFORMANCE_POINTS_PER_STAGE,
  STAGE_REWARD_CAPS,
  stagePayout,
  type RewardStageId,
} from "./rewards";

describe("stage reward economy", () => {
  it("keeps the expanded staged payout caps in one typed configuration", () => {
    expect(STAGE_REWARD_CAPS).toEqual({
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
    } satisfies Record<RewardStageId, number>);
  });

  it("normalizes performance points to the stage cap and never pays negative cash", () => {
    for (const [stageId, cap] of Object.entries(STAGE_REWARD_CAPS) as [RewardStageId, number][]) {
      expect(stagePayout(stageId, MAX_PERFORMANCE_POINTS_PER_STAGE)).toBe(cap);
      expect(stagePayout(stageId, MAX_PERFORMANCE_POINTS_PER_STAGE / 2)).toBe(
        Math.round(cap / 2),
      );
      expect(stagePayout(stageId, 0)).toBe(0);
      expect(stagePayout(stageId, -MAX_PERFORMANCE_POINTS_PER_STAGE)).toBe(0);
      expect(stagePayout(stageId, MAX_PERFORMANCE_POINTS_PER_STAGE * 2)).toBe(cap);
    }
  });

  it("keeps performance points separate from cash and does not credit a replay twice", () => {
    const firstCompletion = completeStage("A1", 6, 400_000, false);
    const replay = completeStage("A1", 6, 400_000, true);

    expect(firstCompletion.performancePoints).toBe(400_000);
    expect(firstCompletion.earnings).toBe(548);
    expect(firstCompletion.cashCredited).toBe(548);
    expect(replay.performancePoints).toBe(400_000);
    expect(replay.earnings).toBe(548);
    expect(replay.cashCredited).toBe(0);
  });

  it("targets about $3,500 after strong A1-A3 results without a completion bonus", () => {
    const strongPerformance = MAX_PERFORMANCE_POINTS_PER_STAGE * 0.8;
    const payouts = (["A1", "A2", "A3"] as const).map((stageId) =>
      stagePayout(stageId, strongPerformance),
    );

    expect(payouts).toEqual([876, 1_168, 1_460]);
    expect(payouts.reduce((total, payout) => total + payout, 0)).toBe(3_504);
    expect((["A1", "A2", "A3"] as const).reduce(
      (total, stageId) =>
        total + stagePayout(stageId, MAX_PERFORMANCE_POINTS_PER_STAGE * 0.5),
      0,
    )).toBe(2_191);
    expect((["A1", "A2", "A3"] as const).reduce(
      (total, stageId) => total + stagePayout(stageId, 0),
      0,
    )).toBe(0);
  });
});
