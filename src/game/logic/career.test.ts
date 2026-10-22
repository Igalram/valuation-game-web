import { describe, expect, it } from "vitest";
import { getCareerLevel, getPromotionForCompletion } from "./career";

describe("career level milestones", () => {
  it("derives the initial levels from education rather than money or possessions", () => {
    expect(getCareerLevel([])).toMatchObject({ level: 1, title: "Intern" });
    expect(getCareerLevel(["A1"])).toMatchObject({ level: 2, title: "Trainee Analyst" });
    expect(getCareerLevel(["A1", "A2", "A3"])).toMatchObject({ level: 2, title: "Trainee Analyst" });
    expect(getCareerLevel(["A1", "A2", "A3", "A4"])).toMatchObject({
      level: 3,
      title: "Junior Analyst",
    });
    expect(getCareerLevel(["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"])).toMatchObject({
      level: 4,
      title: "Analyst",
    });
  });

  it("keeps unavailable Stage B milestones ready for their configured curriculum", () => {
    const allStageA = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"];
    expect(getCareerLevel([...allStageA, "B1"])).toMatchObject({ level: 4 });
    expect(getCareerLevel([...allStageA, "B1", "B2"])).toMatchObject({
      level: 5,
      title: "Investment Associate",
    });
    expect(getCareerLevel([...allStageA, "B1", "B2", "B3", "B4", "B5"])).toMatchObject({
      level: 6,
      title: "Investment Associate",
    });
  });

  it("returns promotions only for newly completed milestones, not replays", () => {
    expect(getPromotionForCompletion([], "A1")).toMatchObject({ level: 2 });
    expect(getPromotionForCompletion(["A1"], "A1")).toBeNull();
    expect(getPromotionForCompletion(["A1"], "A2")).toBeNull();
    expect(getPromotionForCompletion(["A1", "A2", "A3"], "A4")).toMatchObject({
      level: 3,
      title: "Junior Analyst",
    });
  });
});
