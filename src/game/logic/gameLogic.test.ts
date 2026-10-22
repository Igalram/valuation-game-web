import { describe, expect, it } from "vitest";
import {
  A0_TUTORIAL,
  A1_STAGE,
  A1_TUTORIAL,
  nextStageA,
  STAGE_A,
} from "../definitions/stages";
import { evaluateExpression, formatResult } from "./calculator";
import { completeA1, completeStage } from "./progression";
import { createRandom } from "./random";
import {
  generateA1Question,
  generateA2Question,
  generateStageQuestion,
  formatMoney,
  isValidA1Question,
  isValidStageQuestion,
} from "./questions";
import { scoreA1Answer, stageResultLabel } from "./scoring";
import {
  annuityPresentValue,
  compoundFutureValue,
  perpetuityValue,
  presentValue,
} from "./valuation";
import {
  performancePointsEarned,
  potentialPoints,
  roundedPoints,
} from "./speed";
import {
  MAX_PERFORMANCE_POINTS_PER_STAGE,
  STAGE_REWARD_CAPS,
  stagePayout,
} from "./rewards";
import { LIFESTYLE_ITEMS } from "../../systems/lifestyle-shop/catalog";

describe("ported A0 and A1 content", () => {
  it("keeps the six-card A0 introduction and A1 worked example", () => {
    expect(A0_TUTORIAL).toHaveLength(6);
    expect(A0_TUTORIAL[3]?.title).toBe("INTEREST");
    expect(A0_TUTORIAL[4]?.paragraphs[2]).toBe(
      "For example, $1,000 invested for one year at 5% becomes $1,050.",
    );
    expect(A0_TUTORIAL[4]?.paragraphs[3]).toBe(
      "$1,000 × (1 + 5%) = $1,000 × (1.05) = $1,050.",
    );
    expect(A1_STAGE.questionsPerStage).toBe(8);
    expect(A1_TUTORIAL.finalAnswer).toBe("$1,050");
  });
});

describe("A1 question generation and scoring", () => {
  it("generates valid one-year-interest questions with the two original distractors", () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const question = generateA1Question(createRandom(seed), seed + 1);
      const { principal, rate } = question.inputs;
      const expectedAnswer = `$${(principal * (1 + rate)).toLocaleString("en-US")}`;
      const expectedChoices = new Set([
        expectedAnswer,
        `$${principal.toLocaleString("en-US")}`,
        `$${(principal * (1 + rate * 2)).toLocaleString("en-US")}`,
      ]);
      expect(isValidA1Question(question)).toBe(true);
      expect(question.correctAnswer).toBe(expectedAnswer);
      expect(new Set(question.choices)).toEqual(expectedChoices);
      expect(question.diagram).toEqual([
        ["TODAY", `$${principal.toLocaleString("en-US")}`],
        ["YEAR 1", "?"],
      ]);
      expect(question.completedDiagram[1]?.[1]).toBe(expectedAnswer);
    }
  });

  describe("A2 losses and negative returns", () => {
    it("occupies the original slot between A1 Interest and A3 Compounding", () => {
      expect(STAGE_A.map(({ id }) => id)).toEqual([
        "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
      ]);
      expect(nextStageA("A1")).toBe("A2");
      expect(nextStageA("A2")).toBe("A3");
      expect(STAGE_A[1]?.title).toBe("Losses & Negative Returns");
      expect(STAGE_A[1]?.tutorial.notes).toBe(
        "Each question covers exactly one year and one negative return.",
      );
    });

    it("generates the four one-year loss skills with exact formulas and distractors", () => {
      const kinds = new Set<number>();
      for (let seed = 0; seed < 40; seed += 1) {
        for (let questionNumber = 1; questionNumber <= 8; questionNumber += 1) {
          const question = generateA2Question(
            createRandom(seed),
            1000 + seed * 8 + questionNumber,
            questionNumber,
          );
          const {
            initial_value: initial,
            ending_value: ending,
            loss_pct: pct,
            amount_lost: lost,
            periods,
            rate,
            question_type: kind,
          } = question.inputs;
          kinds.add(kind!);
          const correct = question.correctAnswer;
          const expected = [
            `$${ending!.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
            `${pct}%`,
            `$${initial!.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
            `$${lost!.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
          ][kind!]!;
          expect(isValidStageQuestion(question)).toBe(true);
          expect(correct).toBe(expected);
          expect(periods).toBe(1);
          expect(rate).toBe(-pct! / 100);
          expect(question.choices.filter((choice) => choice === correct)).toHaveLength(1);
          expect(new Set(question.choices).size).toBe(3);
          expect(question.diagram.every(([, value]) => value !== correct)).toBe(true);
          expect(question.kind).toBe("negative_return");
          if (questionNumber <= 4) {
            expect([5, 10, 20, 25, 50]).toContain(pct);
            expect([200, 400, 1000, 2000]).toContain(initial);
          } else {
            expect([8, 12, 15, 18, 32]).toContain(pct);
            expect([640, 1250, 2400, 3750]).toContain(initial);
          }
        }
      }
      expect(kinds).toEqual(new Set([0, 1, 2, 3]));
    });

    it("rejects malformed negative-return questions", () => {
      const question = generateA2Question(createRandom(4), 9, 1);
      expect(isValidStageQuestion({
        ...question,
        correctAnswer: "$1",
      })).toBe(false);
      expect(isValidStageQuestion({
        ...question,
        inputs: { ...question.inputs, rate: 0.1 },
      })).toBe(false);
    });
  });

  describe("A3-A8 question generation", () => {
    it("preserves each later Stage A formula, answer types, and diagram masking", () => {
      const stageIds = ["A3", "A4", "A5", "A6", "A7", "A8"] as const;
      for (const stageId of stageIds) {
        for (let serial = 1; serial <= 48; serial += 1) {
          const question = generateStageQuestion(
            stageId,
            createRandom(serial * 19),
            serial,
            serial,
          );
          expect(question.stageId).toBe(stageId);
          expect(isValidStageQuestion(question)).toBe(true);
          expect(question.choices).toHaveLength(3);
          expect(new Set(question.choices).size).toBe(3);
          expect(question.choices.filter((choice) => choice === question.correctAnswer)).toHaveLength(1);
          expect(question.diagram).toHaveLength(question.completedDiagram.length);
          if (stageId === "A3") {
            expect(question.diagram.slice(1).every(([, shown]) => shown === "?")).toBe(true);
          } else if (stageId === "A4") {
            expect(question.diagram[question.diagram.length - 1]?.[1]).toBe("?");
          } else if (stageId === "A5") {
            expect(question.diagram[0]?.[1]).toBe("?");
          } else if (stageId === "A6") {
            if (question.completedDiagram[0]?.[0] === "TODAY") {
              expect(question.diagram[0]?.[1]).toBe("?");
            } else {
              expect(question.diagram.every(([, shown]) => shown === "?")).toBe(true);
            }
          } else {
            expect(question.diagram).toEqual(question.completedDiagram);
          }

          const { rate, periods } = question.inputs;
          if (stageId === "A3") {
            const principal = question.inputs.present_value!;
            const correct = formatMoney(compoundFutureValue(principal, rate!, periods!));
            expect(question.correctAnswer).toBe(correct);
            expect(new Set(question.choices)).toEqual(new Set([
              correct,
              formatMoney(principal * (1 + rate! * periods!)),
              formatMoney(compoundFutureValue(principal, rate!, periods!) + principal * rate!),
            ]));
          } else if (stageId === "A4") {
            const principal = question.inputs.present_value!;
            const correct = `$${compoundFutureValue(principal, rate!, periods!).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            expect(question.correctAnswer).toBe(correct);
            expect(question.completedDiagram[1]?.[1]).toBe(correct);
            expect(new Set(question.choices)).toEqual(new Set([
              correct,
              `$${(principal * (1 + rate! * periods!)).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              `$${compoundFutureValue(principal, rate!, periods! + 1).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            ]));
          } else if (stageId === "A5") {
            const future = question.inputs.future_value!;
            const present = presentValue(future, rate!, periods!);
            const formatCents = (value: number) => `$${value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            const correct = formatCents(present);
            expect(question.correctAnswer).toBe(correct);
            expect(new Set(question.choices)).toEqual(new Set([
              correct,
              formatCents(future),
              formatCents(future / Math.pow(1 + rate!, periods! + 1)),
            ]));
          } else if (stageId === "A6" && question.inputs.future_value !== undefined) {
            const today = presentValue(question.inputs.future_value, rate!, periods!);
            const correct = formatMoney(today);
            expect(question.correctAnswer).toBe(correct);
            expect(new Set(question.choices)).toEqual(new Set([
              correct,
              formatMoney(question.inputs.future_value),
              formatMoney(today * (1 - rate!)),
            ]));
          } else if (stageId === "A7" && question.inputs.rate !== undefined) {
            const payment = question.inputs.payment!;
            const correct = formatMoney(annuityPresentValue(payment, rate!, periods!));
            expect(question.correctAnswer).toBe(correct);
            expect(new Set(question.choices)).toEqual(new Set([
              correct,
              formatMoney(payment * periods!),
              formatMoney(payment / (1 + rate!)),
            ]));
          } else if (stageId === "A8") {
            const payment = question.inputs.payment!;
            const correct = formatMoney(perpetuityValue(payment, rate!));
            expect(question.correctAnswer).toBe(correct);
            expect(new Set(question.choices)).toEqual(new Set([
              correct,
              formatMoney(payment / rate! / 2),
              formatMoney((payment / rate!) * 2),
            ]));
          }
        }
      }
    });
  });

  it("scores exact choices and preserves the original result bands", () => {
    const question = generateA1Question(createRandom(17), 1);
    expect(scoreA1Answer(question, question.correctAnswer)).toEqual({
      outcome: "correct",
      score: 1,
    });
    expect(scoreA1Answer(question, question.choices.find((choice) => choice !== question.correctAnswer)!)).toEqual({
      outcome: "incorrect",
      score: 0,
    });
    expect([8, 6, 4, 3].map(stageResultLabel)).toEqual([
      "Excellent",
      "Good",
      "Developing",
      "Needs Review",
    ]);
  });
});

describe("A4 and A5 numerical question quality", () => {
  const dollarsWithCents = (value: number) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const onlyHasNeatCents = (question: ReturnType<typeof generateStageQuestion>) => {
    const neat = question.choices.map((answer) => answer.endsWith(".00"));
    return neat.filter(Boolean).length === 1 && neat[question.choices.indexOf(question.correctAnswer)];
  };

  it("varies A4 future values and keeps choices coherent, unique, and equally precise", () => {
    const questions = Array.from({ length: 240 }, (_, index) =>
      generateStageQuestion("A4", createRandom((index + 1) * 97), index + 1, index + 1),
    );
    const correctAnswers = new Set(questions.map(({ correctAnswer }) => correctAnswer));
    const neatCorrect = questions.filter(onlyHasNeatCents).length;
    const neatWrong = questions.filter((question) =>
      question.choices.some((choice) => choice.endsWith(".00") && choice !== question.correctAnswer),
    ).length;

    expect(correctAnswers.size).toBeGreaterThan(100);
    expect(neatCorrect).toBeGreaterThan(0);
    expect(neatWrong).toBeGreaterThan(0);
    expect(neatCorrect).toBeLessThan(questions.length * 0.3);
    for (const question of questions) {
      const { present_value: principal, rate, periods } = question.inputs;
      expect(question.correctAnswer).toBe(dollarsWithCents(
        compoundFutureValue(principal!, rate!, periods!),
      ));
      expect(new Set(question.choices).size).toBe(3);
      expect(question.choices.every((choice) => /^\$[\d,]+\.\d{2}$/.test(choice))).toBe(true);
      expect(question.choices).toContain(question.correctAnswer);
    }
  });

  it("varies A5 present values instead of reversing from a neat starting balance", () => {
    const questions = Array.from({ length: 240 }, (_, index) =>
      generateStageQuestion("A5", createRandom((index + 1) * 113), index + 1, index + 1),
    );
    const correctAnswers = new Set(questions.map(({ correctAnswer }) => correctAnswer));
    const neatCorrect = questions.filter(({ correctAnswer }) => correctAnswer.endsWith(".00")).length;
    const nonNeatCorrect = questions.length - neatCorrect;
    const neatWrongWithNonNeatCorrect = questions.filter((question) =>
      !question.correctAnswer.endsWith(".00") &&
      question.choices.some((choice) => choice.endsWith(".00") && choice !== question.correctAnswer),
    ).length;

    expect(correctAnswers.size).toBeGreaterThan(6);
    expect(neatCorrect).toBeGreaterThan(0);
    expect(nonNeatCorrect).toBeGreaterThan(0);
    expect(neatWrongWithNonNeatCorrect).toBeGreaterThan(0);
    expect(neatCorrect).toBeLessThan(questions.length * 0.3);
    for (const question of questions) {
      const { future_value: future, present_value: present, rate, periods } = question.inputs;
      expect(present).toBeCloseTo(presentValue(future!, rate!, periods!), 10);
      expect(question.correctAnswer).toBe(dollarsWithCents(present!));
      expect(new Set(question.choices).size).toBe(3);
      expect(question.choices.every((choice) => /^\$[\d,]+\.\d{2}$/.test(choice))).toBe(true);
      expect(question.choices).toContain(question.correctAnswer);
    }
  });
});

describe("A6 conceptual answer length and scope", () => {
  it("keeps every A6 answer concise and covers only concepts stated in its tutorial", () => {
    const tutorial = STAGE_A.find(({ id }) => id === "A6")!.tutorial;
    expect(tutorial.steps.join(" ").toLowerCase()).toContain("higher required return");
    const questions = Array.from({ length: 24 }, (_, index) =>
      generateStageQuestion("A6", createRandom(index + 31), index + 1, index + 1),
    );
    expect(questions.some(({ prompt }) => prompt.includes("Rates rise"))).toBe(true);
    for (const question of questions) {
      expect(question.choices.every((answer) => answer.length <= 24)).toBe(true);
      expect(new Set(question.choices).size).toBe(3);
      expect(question.choices.filter((answer) => answer === question.correctAnswer)).toHaveLength(1);
    }
  });
});

describe("timer rewards and completion", () => {
  it("keeps the exponential speed score, hundred-point rounding, and one-third wrong-answer penalty", () => {
    expect(potentialPoints(0)).toBe(100_000);
    expect(potentialPoints(5.24)).toBeCloseTo(50_000, 8);
    expect(roundedPoints(12_550)).toBe(12_600);
    expect(roundedPoints(12_450)).toBe(12_400);
    expect(performancePointsEarned(0, true)).toBe(100_000);
    expect(performancePointsEarned(0, false)).toBe(-33_300);
    expect(performancePointsEarned(5.24, true, 1)).toBe(50_000);
    expect(performancePointsEarned(5.24, true, 3)).toBe(
      roundedPoints(potentialPoints(5.24 / 3)),
    );
    expect(performancePointsEarned(5.24, true, 3)).toBeGreaterThan(50_000);
    expect(performancePointsEarned(5.24, false, 3)).toBe(
      -roundedPoints(potentialPoints(5.24 / 3) / 3),
    );
    expect(STAGE_A.find(({ id }) => id === "A4")?.timeFactor).toBe(3);
    expect(STAGE_A.filter(({ id }) => ["A1", "A2", "A3", "A5"].includes(id))
      .every(({ timeFactor }) => timeFactor === 1)).toBe(true);
  });

  it("normalizes score to each typed stage cap and floors weak or negative payouts at zero", () => {
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
    });
    for (const [stageId, cap] of Object.entries(STAGE_REWARD_CAPS) as [keyof typeof STAGE_REWARD_CAPS, number][]) {
      expect(stagePayout(stageId, MAX_PERFORMANCE_POINTS_PER_STAGE)).toBe(cap);
      expect(stagePayout(stageId, MAX_PERFORMANCE_POINTS_PER_STAGE * 0.8)).toBe(Math.round(cap * 0.8));
      expect(stagePayout(stageId, MAX_PERFORMANCE_POINTS_PER_STAGE * 0.5)).toBe(Math.round(cap * 0.5));
      expect(stagePayout(stageId, -50_000)).toBe(0);
    }
    expect(() => stagePayout("A1", Number.NaN)).toThrow("finite");
  });

  it("credits normalized stage payouts once and keeps score separate from earnings", () => {
    expect(completeA1(6, 45_600, false)).toMatchObject({
      performancePoints: 45_600,
      earnings: 62,
      cashCredited: 62,
    });
    expect(completeA1(6, -20_000, false)).toMatchObject({
      performancePoints: -20_000,
      earnings: 0,
      cashCredited: 0,
    });
    expect(completeA1(6, 45_600, true).cashCredited).toBe(0);
    expect(completeStage("A2", 7, 45_600, false)).toMatchObject({
      stageId: "A2",
      correctAnswers: 7,
      totalQuestions: 8,
      result: "Good",
      performancePoints: 45_600,
      earnings: 83,
      cashCredited: 83,
    });
    expect(completeStage("A2", 7, 45_600, true).cashCredited).toBe(0);
  });
});

describe("Lifestyle affordability at revised 80% reward payouts", () => {
  const affordableAt = (cash: number) =>
    LIFESTYLE_ITEMS.filter((product) => product.price <= cash);

  it("matches the staged A/B payout totals without counting tutorial-only A0 or B0", () => {
    const afterA1 = Math.round(STAGE_REWARD_CAPS.A1 * 0.8);
    const afterA4 = Math.round(
      ["A1", "A2", "A3", "A4"].reduce(
        (total, stageId) => total + STAGE_REWARD_CAPS[stageId as keyof typeof STAGE_REWARD_CAPS],
        0,
      ) * 0.8,
    );
    const afterStageA = Math.round(
      STAGE_A.reduce((total, stage) => total + STAGE_REWARD_CAPS[stage.id], 0) * 0.8,
    );
    const stageBEarnings = Math.round(
      ["B1", "B2", "B3", "B4", "B5"].reduce(
        (total, stageId) => total + STAGE_REWARD_CAPS[stageId as keyof typeof STAGE_REWARD_CAPS],
        0,
      ) * 0.8,
    );
    const afterStageB = afterStageA + stageBEarnings;
    const perfectAllStages =
      STAGE_A.reduce((total, stage) => total + STAGE_REWARD_CAPS[stage.id], 0) +
      ["B1", "B2", "B3", "B4", "B5"].reduce(
        (total, stageId) => total + STAGE_REWARD_CAPS[stageId as keyof typeof STAGE_REWARD_CAPS],
        0,
      );

    expect([afterA1, afterA4, afterStageA, stageBEarnings, afterStageB]).toEqual([
      876,
      5_404,
      18_692,
      64_240,
      82_932,
    ]);
    expect(affordableAt(afterA1).map(({ name }) => name)).toEqual([
      "Everyday Casual",
      "Weekend Hoodie",
      "Sport Tracksuit",
      "Sport Watch",
      "Silver Chain",
      "Classic Sunglasses",
      "Everyday Cap",
      "Bicycle",
      "Skateboard",
      "Surfboard",
      "Basketball",
      "Toolbox",
      "Sports Equipment",
    ]);
    expect(affordableAt(afterA4)).toHaveLength(24);
    expect(affordableAt(afterStageA)).toHaveLength(32);
    expect(affordableAt(afterStageA).map(({ name }) => name)).toContain("Tailored Suit");
    expect(affordableAt(afterStageA).map(({ name }) => name)).toContain("Old Hatchback");
    expect(affordableAt(afterStageB)).toHaveLength(38);
    expect(affordableAt(afterStageB).map(({ name }) => name)).toContain("Economy Sedan");
    expect(affordableAt(afterStageB).some(({ category }) => category === "property")).toBe(true);
    expect(affordableAt(afterStageB).some(({ name }) => name === "Runway Royalty")).toBe(false);
    expect(affordableAt(stageBEarnings)).toHaveLength(34);
    expect(affordableAt(afterStageB).some(({ name }) => name === "Starter Home")).toBe(true);
    expect(perfectAllStages).toBe(103_665);
    expect(affordableAt(perfectAllStages).some(({ name }) => name === "Starter Home")).toBe(true);
  });
});

describe("calculator arithmetic", () => {
  it("supports precedence, parentheses, percentages, powers, and signed values", () => {
    expect(evaluateExpression("5000 ÷ 4%")).toBe(125_000);
    expect(evaluateExpression("5000 / 0.04")).toBe(125_000);
    expect(evaluateExpression("(1000 + 50) * 2")).toBe(2_100);
    expect(evaluateExpression("-2^2")).toBe(-4);
    expect(evaluateExpression("2^3^2")).toBe(512);
    expect(formatResult(125_000)).toBe("125,000");
  });

  it("rejects invalid expressions rather than evaluating arbitrary input", () => {
    expect(() => evaluateExpression("1 / 0")).toThrow("Division by zero");
    expect(() => evaluateExpression("alert(1)")).toThrow("Invalid expression");
  });
});
