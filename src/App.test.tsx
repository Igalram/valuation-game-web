import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { STAGE_A } from "./game/definitions/stages";
import { createRandom } from "./game/logic/random";
import { generateStageQuestion } from "./game/logic/questions";
import { createNewGame, loadGame, saveGame, SAVE_KEY, type GameSave } from "./progress/persistence/gameSave";

vi.mock("./systems/lifestyle-shop/LifestyleDriveway", () => ({ default: () => null }));

function createPlayerProfile(name = "Alex") {
  fireEvent.click(screen.getByRole("button", { name: "NEW GAME" }));
  fireEvent.change(screen.getByLabelText("Player name"), { target: { value: name } });
  fireEvent.click(screen.getByRole("button", { name: "START PLAYING" }));
}

function finishA4CalculatorDemo() {
  fireEvent.click(screen.getByRole("button", { name: "SHOW ALL →" }));
  fireEvent.click(screen.getByRole("button", { name: "DEMO CALCULATOR →" }));
  act(() => vi.advanceTimersByTime(6_000));
  fireEvent.click(screen.getByRole("button", { name: "START A4 →" }));
}

describe("Stage A browser lifecycle", () => {
  it("completes all eight A1 questions and persists the one-time cash reward", () => {
    window.localStorage.clear();
    const { unmount } = render(<App />);

    createPlayerProfile();
    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
    expect(screen.queryByRole("button", { name: "CONTINUE TO A2 →" })).not.toBeInTheDocument();

    for (let question = 0; question < 8; question += 1) {
      expect(screen.getByRole("heading", { name: "Interest" })).toBeInTheDocument();
      if (question % 2 === 0) {
        fireEvent.keyDown(window, { key: "1" });
      } else {
        fireEvent.click(screen.getAllByTestId("answer-choice")[1]!);
      }
      if (question === 0) {
        fireEvent.click(screen.getByRole("button", { name: "EXAMPLE" }));
        fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
        expect(screen.getByRole("button", { name: "CONTINUE →" })).toBeInTheDocument();
      }
      if (question < 7) {
        fireEvent.click(screen.getByRole("button", { name: "CONTINUE →" }));
      }
    }

    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
    expect(screen.getByRole("heading", { name: "A1 · INTEREST" })).toBeInTheDocument();
    expect(screen.getByText("1 / 8 COMPLETE")).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "A1 completed" })).toBeInTheDocument();
    expect(screen.getByRole("listitem", { name: "A2 not completed" })).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem(SAVE_KEY)!);
    expect(saved.questionNumber).toBe(8);
    expect(saved.result.totalQuestions).toBe(8);
    expect(saved.cashCreditedStages).toContain("A1");
    expect(saved.availableCash).toBe(saved.result.cashCredited);

    fireEvent.click(screen.getByRole("button", { name: "CONTINUE TO MAP →" }));
    unmount();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
    expect(screen.getByRole("heading", { name: "STAGE MAP" })).toBeInTheDocument();
    expect(screen.queryByText("LEVEL UP!")).not.toBeInTheDocument();
    const reloadedSave = JSON.parse(window.localStorage.getItem(SAVE_KEY)!);
    expect(reloadedSave.availableCash).toBe(saved.availableCash);
  });

  it("unlocks and completes every Stage A substage through the shared browser flow", () => {
    window.localStorage.clear();
    render(<App />);
    createPlayerProfile();
    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));

    for (let question = 0; question < 8; question += 1) {
      fireEvent.click(screen.getAllByTestId("answer-choice")[0]!);
      if (question < 7) fireEvent.click(screen.getByRole("button", { name: "CONTINUE →" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE TO MAP →" }));
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE TO A2 →" }));
    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
    for (const stage of STAGE_A.slice(1)) {
      for (let question = 0; question < 8; question += 1) {
        expect(screen.getByRole("heading", { name: stage.title })).toBeInTheDocument();
        fireEvent.click(screen.getAllByTestId("answer-choice")[0]!);
        if (question < 7) {
          fireEvent.click(screen.getByRole("button", { name: "CONTINUE →" }));
        }
      }

      if (stage.id === "A4" || stage.id === "A8") {
        fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
      }
      expect(
        screen.getByRole("heading", { name: `${stage.id} · ${stage.title.toUpperCase()}` }),
      ).toBeInTheDocument();
      const completedSave = loadGame()!;
      expect(completedSave.currentStageId).toBe(stage.id);
      expect(completedSave.completedStages).toEqual(STAGE_A.slice(0, STAGE_A.indexOf(stage) + 1).map(({ id }) => id));
      expect(completedSave.cashCreditedStages).toEqual(completedSave.completedStages);
      expect(completedSave.result?.stageId).toBe(stage.id);
      expect(completedSave.result?.totalQuestions).toBe(8);
      expect(screen.getByText(`${STAGE_A.indexOf(stage) + 1} / ${STAGE_A.length} COMPLETE`)).toBeInTheDocument();
      if (stage.id !== "A8") {
        const nextId = `A${Number(stage.id.slice(1)) + 1}`;
        fireEvent.click(screen.getByRole("button", { name: "CONTINUE TO MAP →" }));
        fireEvent.click(screen.getByRole("button", { name: `CONTINUE TO ${nextId} →` }));
        expect(screen.getByRole("heading", { name: STAGE_A.find(({ id }) => id === nextId)!.tutorial.title })).toBeInTheDocument();
        if (nextId === "A4") {
          vi.useFakeTimers();
          try {
            finishA4CalculatorDemo();
          } finally {
            vi.useRealTimers();
          }
        } else {
          fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
        }
      }
    }

    expect(screen.getByRole("heading", { name: "A8 · PERPETUITIES" })).toBeInTheDocument();
  });

  it("completes a stage, shops with cash, equips an owned item, and returns to the map without replaying rewards", () => {
    window.localStorage.clear();
    const { unmount } = render(<App />);
    createPlayerProfile();
    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));

    for (let question = 0; question < 8; question += 1) {
      const current = loadGame()!;
      const correctAnswer = current.question!.correctAnswer;
      const choice = screen.getAllByTestId("answer-choice").find((button) =>
        button.getAttribute("aria-label")?.endsWith(correctAnswer),
      );
      expect(choice).toBeDefined();
      fireEvent.click(choice!);
      if (question < 7) fireEvent.click(screen.getByRole("button", { name: "CONTINUE →" }));
    }

    const completionSave = loadGame()!;
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
    expect(screen.getByRole("button", { name: "VISIT LIFESTYLE →" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "VISIT LIFESTYLE →" }));
    expect(screen.getByRole("button", { name: "Edit profile for Alex" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit profile for Alex" }));
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Riley" } });
    fireEvent.click(screen.getByRole("button", { name: "Maya" }));
    fireEvent.click(screen.getByRole("button", { name: "SAVE PROFILE" }));
    expect(loadGame()?.playerName).toBe("Riley");
    expect(loadGame()?.playerAvatarId).toBe("maya");
    expect(loadGame()?.availableCash).toBe(completionSave.availableCash);
    expect(loadGame()?.careerEarnings).toBe(completionSave.careerEarnings);
    expect(screen.getByRole("button", { name: "Edit profile for Riley" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fashion Store OPEN CATALOG →" }));
    fireEvent.click(screen.getByRole("button", { name: /Everyday Casual/ }));
    fireEvent.click(screen.getByRole("button", { name: "BUY" }));

    const purchased = loadGame()!;
    expect(purchased.availableCash).toBe(completionSave.availableCash - 100);
    expect(purchased.careerEarnings).toBe(completionSave.careerEarnings);
    expect(purchased.ownedLifestyleIds).toContain("outfit_01");
    fireEvent.click(screen.getByRole("button", { name: "EQUIP" }));
    expect(loadGame()!.lifestyleSlots.clothing).toBe("outfit_01");
    expect(loadGame()!.availableCash).toBe(purchased.availableCash);
    const equippedSave = loadGame()!;
    fireEvent.click(screen.getByRole("button", { name: "Edit profile for Riley" }));
    fireEvent.click(screen.getByRole("button", { name: "Jordan" }));
    fireEvent.click(screen.getByRole("button", { name: "SAVE PROFILE" }));
    const afterAvatarChange = loadGame()!;
    expect(afterAvatarChange.playerAvatarId).toBe("jordan");
    expect(afterAvatarChange.availableCash).toBe(purchased.availableCash);
    expect(afterAvatarChange.careerEarnings).toBe(purchased.careerEarnings);
    expect(afterAvatarChange.ownedLifestyleIds).toEqual(purchased.ownedLifestyleIds);
    expect(afterAvatarChange.ownedVehicleIds).toEqual(purchased.ownedVehicleIds);
    expect(afterAvatarChange.equippedVehicleId).toBe(purchased.equippedVehicleId);
    expect(afterAvatarChange.lifestyleSlots).toEqual(equippedSave.lifestyleSlots);

    fireEvent.click(screen.getByRole("button", { name: "← DRIVEWAY" }));
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE TO MAP" }));
    expect(screen.getByRole("heading", { name: "STAGE MAP" })).toBeInTheDocument();
    expect(loadGame()!.availableCash).toBe(purchased.availableCash);
    expect(loadGame()!.cashCreditedStages).toEqual(["A1"]);
    unmount();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
    expect(screen.getByRole("heading", { name: "STAGE MAP" })).toBeInTheDocument();
    expect(loadGame()!.availableCash).toBe(purchased.availableCash);
    expect(loadGame()!.ownedLifestyleIds).toContain("outfit_01");
    expect(loadGame()!.lifestyleSlots.clothing).toBe("outfit_01");
  });

  it("makes each Python Lifestyle shop and its full catalog accessible", () => {
    window.localStorage.clear();
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "LIFESTYLE" }));

    const shopCases = [
      ["Car Dealership", "cars", 8, "Old Hatchback"],
      ["Fashion Store", "fashion", 12, "Everyday Casual"],
      ["Jewelry & Accessories", "jewelry", 10, "Sport Watch"],
      ["Garage & Toys", "toys", 12, "Bicycle"],
      ["Realtor", "property", 6, "Starter Home"],
    ] as const;
    for (const [shopIndex, [shop, category, count, firstItem]] of shopCases.entries()) {
      fireEvent.click(screen.getByRole("button", { name: `${shop} OPEN CATALOG →` }));
      expect(screen.getByRole("heading", { name: shop })).toBeInTheDocument();
      expect(screen.getByLabelText(`${category} product catalog`).children).toHaveLength(count);
      expect(screen.getByRole("button", { name: new RegExp(firstItem) })).toBeInTheDocument();
      if (shopIndex === 0) {
        fireEvent.click(screen.getByRole("button", { name: /Economy Sedan/ }));
        expect(screen.getByRole("button", { name: "INSUFFICIENT CASH" })).toBeDisabled();
      }
      fireEvent.click(screen.getByRole("button", { name: "← DRIVEWAY" }));
    }
  });

  it("creates and edits a profile without resetting an active question", () => {
    window.localStorage.clear();
    render(<App />);

    expect(screen.queryByRole("heading", { name: "Create your player profile" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "NEW GAME" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "NEW GAME" }));
    expect(screen.getByRole("heading", { name: "Create your player profile" })).toBeInTheDocument();
    for (const avatarName of ["Alex", "Maya", "Jordan", "Sam"]) {
      expect(screen.getByRole("button", { name: avatarName })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button").filter((button) => button.classList.contains("avatar-option"))).toHaveLength(24);
    fireEvent.click(screen.getByRole("button", { name: "Maya" }));
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Taylor" } });
    fireEvent.click(screen.getByRole("button", { name: "START PLAYING" }));
    expect(loadGame()?.profileCreated).toBe(true);
    expect(loadGame()?.playerName).toBe("Taylor");
    expect(loadGame()?.playerAvatarId).toBe("maya");

    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
    fireEvent.click(screen.getByRole("button", { name: "SKIP" }));
    const beforeEdit = loadGame()!;
    fireEvent.click(screen.getByRole("button", { name: "Edit profile for Taylor" }));
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Taylor Morgan" } });
    fireEvent.click(screen.getByRole("button", { name: "Jordan" }));
    fireEvent.click(screen.getByRole("button", { name: "SAVE PROFILE" }));

    const afterEdit = loadGame()!;
    expect(afterEdit.playerName).toBe("Taylor Morgan");
    expect(afterEdit.playerAvatarId).toBe("jordan");
    expect(afterEdit.phase).toBe("question");
    expect(afterEdit.question?.id).toBe(beforeEdit.question?.id);
    expect(afterEdit.questionNumber).toBe(beforeEdit.questionNumber);
    expect(afterEdit.availableCash).toBe(beforeEdit.availableCash);
    expect(afterEdit.careerEarnings).toBe(beforeEdit.careerEarnings);
    expect(afterEdit.elapsedMs).toBeGreaterThanOrEqual(beforeEdit.elapsedMs);
    expect(screen.getByRole("button", { name: "Edit profile for Taylor Morgan" })).toBeInTheDocument();
  });

  it("hides Continue without a save and confirms before replacing an existing save", () => {
    window.localStorage.clear();
    const { unmount } = render(<App />);
    expect(screen.queryByRole("button", { name: "CONTINUE" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Create your player profile" })).not.toBeInTheDocument();
    unmount();

    const existingSave: GameSave = {
      ...createNewGame(),
      playerName: "Saved Player",
      profileCreated: true,
      phase: "menu",
      resumePhase: "map",
      currentStageId: "A3",
      completedStages: ["A1", "A2"],
      cashCreditedStages: ["A1", "A2"],
      availableCash: 1_800,
      careerEarnings: 2_000,
    };
    saveGame(existingSave);
    render(<App />);
    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "NEW GAME" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Your current browser save will be replaced.");
    fireEvent.click(screen.getByRole("button", { name: "CANCEL" }));
    expect(loadGame()?.availableCash).toBe(1_800);

    fireEvent.click(screen.getByRole("button", { name: "NEW GAME" }));
    fireEvent.click(screen.getByRole("button", { name: "START NEW GAME" }));
    expect(screen.getByRole("heading", { name: "Create your player profile" })).toBeInTheDocument();
    expect(loadGame()?.availableCash).toBe(1_800);
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Fresh Start" } });
    fireEvent.click(screen.getByRole("button", { name: "START PLAYING" }));
    expect(loadGame()?.playerName).toBe("Fresh Start");
    expect(loadGame()?.availableCash).toBe(0);
    expect(loadGame()?.completedStages).toEqual([]);
  });

  it("demonstrates Future Value powers with the in-game calculator before A4 starts", async () => {
    window.localStorage.clear();
    saveGame({
      ...createNewGame(),
      playerName: "A4 Test Player",
      profileCreated: true,
      phase: "menu",
      resumePhase: "a1-tutorial",
      currentStageId: "A4",
      completedStages: ["A1", "A2", "A3"],
      cashCreditedStages: ["A1", "A2", "A3"],
      introSeen: true,
      tutorialsSeenStages: ["A1", "A2", "A3"],
    });
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
      expect(screen.getByRole("heading", { name: "Future Value" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "SHOW ALL →" }));
      expect(document.querySelector(".formula-line")).toHaveTextContent("FV = PV × (1 + r)^n");
      fireEvent.click(screen.getByRole("button", { name: "DEMO CALCULATOR →" }));

      const calculator = screen.getByRole("dialog", { name: "Calculator" });
      expect(calculator).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /xʸ/ })).toBeInTheDocument();
      expect(calculator.querySelector('[data-demo-active="true"]')).toHaveTextContent("AC");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(720);
      });
      expect(within(calculator).getByText("Enter the present value, $1,000.")).toBeInTheDocument();
      expect(calculator.querySelector('[data-demo-active="true"]')).toHaveTextContent("1");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(14 * 360);
      });
      expect(screen.queryByRole("dialog", { name: "Calculator" })).not.toBeInTheDocument();
      expect(document.querySelector(".future-value-demo-result")).toHaveTextContent("$1,276.28");
      expect(screen.getByRole("button", { name: "START A4 →" })).toBeEnabled();
      fireEvent.click(screen.getByRole("button", { name: "START A4 →" }));
      expect(screen.getByRole("heading", { name: "Future Value" })).toBeInTheDocument();
      expect(loadGame()?.phase).toBe("question");
    } finally {
      vi.useRealTimers();
    }
  });

  it("applies A4's slower decay in both potential points and awarded points", () => {
    window.localStorage.clear();
    const question = generateStageQuestion("A4", createRandom(43), 1, 1);
    saveGame({
      ...createNewGame(),
      playerName: "A4 Scoring Test",
      profileCreated: true,
      phase: "menu",
      resumePhase: "question",
      currentStageId: "A4",
      completedStages: ["A1", "A2", "A3"],
      cashCreditedStages: ["A1", "A2", "A3"],
      introSeen: true,
      tutorialsSeenStages: ["A1", "A2", "A3", "A4"],
      question,
      elapsedMs: 5_240,
    });
    vi.useFakeTimers();
    try {
      render(<App />);
      fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
      expect(screen.getByText("79,400")).toBeInTheDocument();
      const correctChoice = screen.getAllByTestId("answer-choice").find((button) =>
        button.getAttribute("aria-label")?.endsWith(question.correctAnswer),
      );
      expect(correctChoice).toBeDefined();
      fireEvent.click(correctChoice!);
      expect(loadGame()?.questionPerformancePoints).toBe(79_400);
    } finally {
      vi.useRealTimers();
    }
  });

  it("prompts version 4 players for a profile while retaining their progress and possessions", () => {
    window.localStorage.clear();
    const legacySave = {
      version: 4,
      phase: "menu",
      resumePhase: "map",
      currentStageId: "A3",
      completedStages: ["A1", "A2"],
      tutorialsSeenStages: ["A1", "A2"],
      introIndex: 0,
      introSeen: true,
      tutorialSeen: true,
      question: null,
      questionNumber: 0,
      correctAnswers: 0,
      streak: 0,
      careerEarnings: 2_345,
      availableCash: 1_234,
      stageEarnings: 0,
      performancePoints: 0,
      stagePerformancePoints: 0,
      cashCreditedStages: ["A1", "A2"],
      ownedVehicleIds: ["car_01"],
      equippedVehicleId: "car_01",
      ownedLifestyleIds: ["outfit_01"],
      lifestyleSlots: { clothing: "outfit_01" },
      randomSeed: 1729,
      itemSerial: 0,
      elapsedMs: 0,
      answer: null,
      answerCorrect: null,
      questionPerformancePoints: 0,
      feedback: [],
      result: null,
      audioMuted: false,
      tutorialReturnPhase: null,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(legacySave));
    render(<App />);

    expect(screen.queryByRole("heading", { name: "Create your player profile" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CONTINUE" }));
    expect(screen.getByRole("heading", { name: "Create your player profile" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Returning Player" } });
    fireEvent.click(screen.getByRole("button", { name: "START PLAYING" }));
    const migrated = loadGame()!;
    expect(migrated.playerName).toBe("Returning Player");
    expect(migrated.profileCreated).toBe(true);
    expect(migrated.currentStageId).toBe("A3");
    expect(migrated.completedStages).toEqual(["A1", "A2"]);
    expect(migrated.availableCash).toBe(1_234);
    expect(migrated.careerEarnings).toBe(2_345);
    expect(migrated.ownedLifestyleIds).toEqual(["outfit_01"]);
    expect(migrated.lifestyleSlots).toEqual({ clothing: "outfit_01" });
  });
});
