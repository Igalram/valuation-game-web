import { beforeEach, describe, expect, it } from "vitest";
import {
  clearGameSave,
  createNewGame,
  loadGame,
  saveGame,
  SAVE_KEY,
} from "./gameSave";
import { createRandom } from "../../game/logic/random";
import { generateA1Question } from "../../game/logic/questions";
import { displayLifestyleItem, purchaseLifestyleItem } from "../../systems/lifestyle-shop/economy";

describe("browser save data", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a new game and clears it", () => {
    const initial = createNewGame();
    saveGame(initial);
    expect(loadGame()).toEqual(initial);
    clearGameSave();
    expect(loadGame()).toBeNull();
  });

  it("rejects incompatible or malformed saved state", () => {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 99 }));
    expect(() => loadGame()).toThrow("incompatible version");
    window.localStorage.setItem(SAVE_KEY, "{");
    expect(() => loadGame()).toThrow();
  });

  it("upgrades existing A1 saves and reveals the saved question only in feedback", () => {
    const legacy = {
      ...createNewGame(),
      version: 1,
      question: generateA1Question(createRandom(31), 1),
      phase: "question",
      resumePhase: "question",
      tutorialSeen: true,
    } as Record<string, unknown>;
    const oldQuestion = legacy.question as Record<string, unknown>;
    oldQuestion.diagram = oldQuestion.completedDiagram;
    delete oldQuestion.completedDiagram;
    delete legacy.currentStageId;
    delete legacy.completedStages;
    delete legacy.tutorialsSeenStages;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(legacy));

    const upgraded = loadGame();
    expect(upgraded?.version).toBe(5);
    expect(upgraded?.currentStageId).toBe("A1");
    expect(upgraded?.tutorialsSeenStages).toEqual(["A1"]);
    expect(upgraded?.question?.diagram[1]?.[1]).toBe("?");
    expect(upgraded?.question?.completedDiagram[1]?.[1]).toBe(
      upgraded?.question?.correctAnswer,
    );
    expect(upgraded?.ownedVehicleIds).toEqual(["car_01"]);
    expect(upgraded?.availableCash).toBe(0);
    expect(upgraded?.profileCreated).toBe(false);
  });

  it("migrates version 2 player saves without changing cash or earnings", () => {
    const oldSave = {
      ...createNewGame(),
      version: 2,
      availableCash: 12_345,
      careerEarnings: 67_890,
      completedStages: ["A1"],
    };
    delete (oldSave as Partial<typeof oldSave>).ownedVehicleIds;
    delete (oldSave as Partial<typeof oldSave>).equippedVehicleId;
    delete (oldSave as Partial<typeof oldSave>).ownedLifestyleIds;
    delete (oldSave as Partial<typeof oldSave>).lifestyleSlots;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(oldSave));

    const migrated = loadGame();
    expect(migrated?.version).toBe(5);
    expect(migrated?.availableCash).toBe(12_345);
    expect(migrated?.careerEarnings).toBe(67_890);
    expect(migrated?.ownedVehicleIds).toEqual(["car_01"]);
    expect(migrated?.equippedVehicleId).toBe("car_01");
    expect(migrated?.ownedLifestyleIds).toEqual([]);
    expect(migrated?.lifestyleSlots).toEqual({});
  });

  it("upgrades version 3 earnings saves without changing cash, career earnings, or purchases", () => {
    const oldSave = {
      ...createNewGame(),
      version: 3,
      availableCash: 8_765,
      careerEarnings: 54_321,
      stageEarnings: 123_400,
      phase: "menu",
      resumePhase: "question",
      questionPerformancePoints: undefined,
      feeEarned: 5_600,
      ownedLifestyleIds: ["outfit_01"],
      lifestyleSlots: { clothing: "outfit_01" },
    };
    delete (oldSave as Partial<typeof oldSave>).performancePoints;
    delete (oldSave as Partial<typeof oldSave>).stagePerformancePoints;
    delete (oldSave as Partial<typeof oldSave>).questionPerformancePoints;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(oldSave));

    const migrated = loadGame();
    expect(migrated?.version).toBe(5);
    expect(migrated?.availableCash).toBe(8_765);
    expect(migrated?.careerEarnings).toBe(54_321);
    expect(migrated?.ownedLifestyleIds).toEqual(["outfit_01"]);
    expect(migrated?.lifestyleSlots).toEqual({ clothing: "outfit_01" });
    expect(migrated?.stagePerformancePoints).toBe(123_400);
    expect(migrated?.stageEarnings).toBe(0);
    expect(migrated?.questionPerformancePoints).toBe(5_600);
  });

  it("adds profile setup to version 4 saves without changing existing player data", () => {
    const oldSave = {
      ...createNewGame(),
      version: 4,
      phase: "menu",
      resumePhase: "map",
      completedStages: ["A1", "A2"],
      cashCreditedStages: ["A1", "A2"],
      availableCash: 1_234,
      careerEarnings: 2_345,
      ownedLifestyleIds: ["outfit_01"],
      lifestyleSlots: { clothing: "outfit_01" },
    };
    delete (oldSave as Partial<typeof oldSave>).playerName;
    delete (oldSave as Partial<typeof oldSave>).playerAvatarId;
    delete (oldSave as Partial<typeof oldSave>).profileCreated;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(oldSave));

    const migrated = loadGame();
    expect(migrated?.version).toBe(5);
    expect(migrated?.playerName).toBe("");
    expect(migrated?.profileCreated).toBe(false);
    expect(migrated?.playerAvatarId).toBe("alex");
    expect(migrated?.completedStages).toEqual(["A1", "A2"]);
    expect(migrated?.cashCreditedStages).toEqual(["A1", "A2"]);
    expect(migrated?.availableCash).toBe(1_234);
    expect(migrated?.careerEarnings).toBe(2_345);
    expect(migrated?.ownedLifestyleIds).toEqual(["outfit_01"]);
    expect(migrated?.lifestyleSlots).toEqual({ clothing: "outfit_01" });
  });

  it("round-trips purchases and equipment without changing lifetime earnings", () => {
    let save = { ...createNewGame(), availableCash: 25_000, careerEarnings: 90_000 };
    save = purchaseLifestyleItem(save, "car_02")!;
    save = displayLifestyleItem(save, "car_02")!;
    save = purchaseLifestyleItem(save, "outfit_01")!;
    save = displayLifestyleItem(save, "outfit_01")!;
    saveGame(save);

    const loaded = loadGame();
    expect(loaded?.availableCash).toBe(6_900);
    expect(loaded?.careerEarnings).toBe(90_000);
    expect(loaded?.ownedVehicleIds).toEqual(["car_01", "car_02"]);
    expect(loaded?.equippedVehicleId).toBe("car_02");
    expect(loaded?.ownedLifestyleIds).toEqual(["outfit_01"]);
    expect(loaded?.lifestyleSlots).toEqual({ clothing: "outfit_01" });
  });
});
