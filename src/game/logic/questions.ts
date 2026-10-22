import { A1_STAGE, type StageAId } from "../definitions/stages";
import { choose, shuffle, type RandomSource } from "./random";
import {
  annuityPresentValue,
  compoundFutureValue,
  perpetuityValue,
  presentValue,
  simpleFutureValue,
} from "./valuation";

export type TimeValueQuestion = {
  id: string;
  stageId: StageAId;
  kind: string;
  prompt: string;
  choices: [string, string, string];
  correctAnswer: string;
  explanation: string;
  diagram: [string, string][];
  completedDiagram: [string, string][];
  inputs: Record<string, number>;
};

export function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatMoneyCents(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const A5_PRESENT_VALUE_SCENARIOS = [
  { future: 1_275, rate: 0.04, periods: 3 },
  { future: 2_460, rate: 0.06, periods: 2 },
  { future: 3_825, rate: 0.08, periods: 4 },
  { future: 5_890, rate: 0.1, periods: 3 },
  { future: 8_475, rate: 0.12, periods: 1 },
  { future: 12_350, rate: 0.05, periods: 4 },
  { future: 18_625, rate: 0.04, periods: 2 },
  { future: 11_025, rate: 0.05, periods: 2 },
  { future: 6_050, rate: 0.1, periods: 2 },
  { future: 6_615, rate: 0.05, periods: 2 },
] as const;

export function generateA1Question(
  random: RandomSource,
  serial: number,
): TimeValueQuestion {
  const principal = choose([500, 1000, 2000, 5000], random);
  const rate = choose([0.04, 0.05, 0.06, 0.08, 0.1], random);
  const value = simpleFutureValue(principal, rate);
  const interest = principal * rate;
  const correctAnswer = formatMoney(value);
  const choices = shuffle(
    [
      correctAnswer,
      formatMoney(principal),
      formatMoney(principal * (1 + rate * 2)),
    ],
    random,
  );

  const question: TimeValueQuestion = {
    id: `A1-${serial}`,
    stageId: "A1",
    kind: "one_period_interest",
    prompt: `You invest ${formatMoney(principal)} for one year at ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })}. How much money do you have after one year?`,
    choices: [choices[0]!, choices[1]!, choices[2]!],
    correctAnswer,
    explanation: `${formatMoney(principal)} + ${formatMoney(interest)} interest = ${correctAnswer}.`,
    diagram: [
      ["TODAY", formatMoney(principal)],
      ["YEAR 1", "?"],
    ],
    completedDiagram: [
      ["TODAY", formatMoney(principal)],
      ["YEAR 1", correctAnswer],
    ],
    inputs: { principal, rate },
  };

  if (!isValidStageQuestion(question)) {
    throw new Error("A1 question generator produced an invalid question");
  }
  return question;
}

function moneyWithCents(value: number): string {
  if (Number.isInteger(value)) return formatMoney(value);
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function uniqueChoices(
  correct: string,
  distractors: [string, string],
  random: RandomSource,
): [string, string, string] {
  if (new Set([correct, ...distractors]).size !== 3) {
    throw new Error("Question choices must be unique");
  }
  const choices = shuffle([correct, ...distractors], random);
  return [choices[0]!, choices[1]!, choices[2]!];
}

export function generateA2Question(
  random: RandomSource,
  serial: number,
  questionNumber: number,
): TimeValueQuestion {
  const number = ((questionNumber - 1) % 8) + 1;
  const initial = choose(
    number <= 4 ? [200, 400, 1000, 2000] : [640, 1250, 2400, 3750],
    random,
  );
  const lossPct = choose(
    number <= 4 ? [5, 10, 20, 25, 50] : [8, 12, 15, 18, 32],
    random,
  );
  const amountLost = (initial * lossPct) / 100;
  const ending = initial - amountLost;
  const fmt = moneyWithCents;
  const kind = (number - 1) % 4;
  const inputs = {
    initial_value: initial,
    ending_value: ending,
    loss_pct: lossPct,
    amount_lost: amountLost,
    periods: 1,
    rate: -lossPct / 100,
    question_type: kind,
    question_number: number,
  };

  let prompt: string;
  let correctAnswer: string;
  let distractors: [string, string];
  let explanation: string;
  let diagram: [string, string][];
  if (kind === 0) {
    prompt = `An investment starts at ${fmt(initial)} and loses ${lossPct}% over one year. What is its ending value?`;
    correctAnswer = fmt(ending);
    distractors = [fmt(initial + amountLost), fmt(initial)];
    explanation = `Ending value = ${fmt(initial)} × (1 - ${lossPct}%) = ${correctAnswer}.`;
    diagram = [["TODAY", fmt(initial)], ["YEAR 1", correctAnswer]];
  } else if (kind === 1) {
    prompt = `An investment falls from ${fmt(initial)} to ${fmt(ending)} over one year. What percentage of its starting value was lost?`;
    correctAnswer = `${lossPct}%`;
    distractors = [`${100 - lossPct}%`, `${lossPct + 5}%`];
    if (new Set([correctAnswer, ...distractors]).size !== 3) {
      distractors = [`${lossPct + 5}%`, `${lossPct + 10}%`];
    }
    explanation = `Loss = ${fmt(initial)} - ${fmt(ending)} = ${fmt(amountLost)}. ${fmt(amountLost)} ÷ ${fmt(initial)} = ${correctAnswer}.`;
    diagram = [["TODAY", fmt(initial)], ["YEAR 1", fmt(ending)], ["LOSS", correctAnswer]];
  } else if (kind === 2) {
    correctAnswer = fmt(initial);
    prompt = `After losing ${lossPct}% over one year, an investment is worth ${fmt(ending)}. What was its starting value?`;
    distractors = [fmt(ending), fmt(ending * (1 - lossPct / 100))];
    explanation = `Starting value = ${fmt(ending)} ÷ (1 - ${lossPct}%) = ${correctAnswer}.`;
    diagram = [["TODAY", correctAnswer], ["YEAR 1", fmt(ending)]];
  } else {
    correctAnswer = fmt(amountLost);
    prompt = `An investment starts at ${fmt(initial)} and loses ${lossPct}% over one year. How many dollars were lost?`;
    distractors = [fmt(initial), fmt(initial + amountLost)];
    explanation = `Amount lost = ${fmt(initial)} × ${lossPct}% = ${correctAnswer}. Ending value = ${fmt(ending)}.`;
    diagram = [["TODAY", fmt(initial)], ["YEAR 1", fmt(ending)], ["LOST", correctAnswer]];
  }

  const completedDiagram = diagram;
  const answerLabel = kind === 0 ? "YEAR 1" : kind === 1 ? "LOSS" : kind === 2 ? "TODAY" : "LOST";
  const questionDiagram = diagram.map(([label, value]) => [
    label,
    label === answerLabel || value === correctAnswer ? "?" : value,
  ]) as [string, string][];
  const question: TimeValueQuestion = {
    id: `A2-${serial}`,
    stageId: "A2",
    kind: "negative_return",
    prompt,
    choices: uniqueChoices(correctAnswer, distractors, random),
    correctAnswer,
    explanation,
    diagram: questionDiagram,
    completedDiagram,
    inputs,
  };
  if (!isValidStageQuestion(question)) {
    throw new Error("A2 question generator produced an invalid question");
  }
  return question;
}

function makeQuestion(
  stageId: StageAId,
  serial: number,
  kind: string,
  prompt: string,
  correctAnswer: string,
  distractors: [string, string],
  explanation: string,
  completedDiagram: [string, string][],
  inputs: Record<string, number>,
  random: RandomSource,
): TimeValueQuestion {
  const question: TimeValueQuestion = {
    id: `${stageId}-${serial}`,
    stageId,
    kind,
    prompt,
    choices: uniqueChoices(correctAnswer, distractors, random),
    correctAnswer,
    explanation,
    diagram: maskDiagram(stageId, completedDiagram, correctAnswer),
    completedDiagram,
    inputs,
  };
  if (!isValidStageQuestion(question)) {
    throw new Error(`${stageId} question generator produced an invalid question`);
  }
  return question;
}

function maskDiagram(
  stageId: StageAId,
  diagram: [string, string][],
  correctAnswer: string,
): [string, string][] {
  const masked = diagram.map(([label, value]) => [label, value] as [string, string]);
  if (stageId === "A2") {
    return masked.map(([label, value]) => [
      label,
      value === correctAnswer ? "?" : value,
    ]);
  }
  if ((stageId === "A1" || stageId === "A4") && masked.length > 0) {
    masked[masked.length - 1]![1] = "?";
  } else if (stageId === "A3") {
    for (let index = 1; index < masked.length; index += 1) masked[index]![1] = "?";
  } else if (stageId === "A5" && masked.length > 0) {
    masked[0]![1] = "?";
  } else if (stageId === "A6") {
    if (masked[0]?.[0] === "TODAY") masked[0]![1] = "?";
    else {
      for (const point of masked) point[1] = "?";
    }
  }
  return masked;
}

function generateA3Question(
  random: RandomSource,
  serial: number,
): TimeValueQuestion {
  const principal = choose([500, 1000, 2000], random);
  const rate = choose([0.05, 0.1], random);
  const periods = 2;
  const value = compoundFutureValue(principal, rate, periods);
  const simple = principal * (1 + rate * periods);
  const correct = formatMoney(value);
  return makeQuestion(
    "A3",
    serial,
    "compound_interest",
    `${formatMoney(principal)} earns ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })} per year for two years. How much do you have?`,
    correct,
    [formatMoney(simple), formatMoney(value + principal * rate)],
    `${formatMoney(principal)} × ${(1 + rate).toFixed(2)}² = ${correct}. The first year's interest also earns interest.`,
    [
      ["YEAR 0", formatMoney(principal)],
      ["YEAR 1", formatMoney(principal * (1 + rate))],
      ["YEAR 2", correct],
    ],
    { present_value: principal, rate, periods },
    random,
  );
}

function generateA4Question(
  random: RandomSource,
  serial: number,
): TimeValueQuestion {
  const present = choose([1_275, 2_460, 3_825, 5_890, 8_475, 12_350], random);
  const rate = choose([0.04, 0.05, 0.06, 0.08, 0.1], random);
  const periods = choose([2, 3, 4, 5, 6], random);
  const value = compoundFutureValue(present, rate, periods);
  const correct = formatMoneyCents(value);
  return makeQuestion(
    "A4",
    serial,
    "future_value",
    `${formatMoney(present)} is invested at ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })} for ${periods} years. Approximately how much will you have?`,
    correct,
    [
      formatMoneyCents(present * (1 + rate * periods)),
      formatMoneyCents(compoundFutureValue(present, rate, periods + 1)),
    ],
    `FV = PV × (1 + r)^n = ${formatMoney(present)} × ${(1 + rate).toFixed(2)}^${periods} = ${correct}.`,
    [["TODAY", formatMoney(present)], [`YEAR ${periods}`, correct]],
    { present_value: present, rate, periods },
    random,
  );
}

function generateA5Question(
  random: RandomSource,
  serial: number,
): TimeValueQuestion {
  const { future, rate, periods } = choose(A5_PRESENT_VALUE_SCENARIOS, random);
  const present = presentValue(future, rate, periods);
  const correct = formatMoneyCents(present);
  return makeQuestion(
    "A5",
    serial,
    "present_value",
    `You will receive ${formatMoney(future)} in ${periods} year${periods === 1 ? "" : "s"}. Your required return is ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })}. What is it worth today?`,
    correct,
    [
      formatMoneyCents(future),
      formatMoneyCents(future / Math.pow(1 + rate, periods + 1)),
    ],
    `PV = FV ÷ (1 + r)^n = ${formatMoney(future)} ÷ ${(1 + rate).toFixed(2)}^${periods} = ${correct}.`,
    [["TODAY", correct], [`YEAR ${periods}`, formatMoney(future)]],
    { future_value: future, present_value: present, rate, periods },
    random,
  );
}

function generateA6Question(
  random: RandomSource,
  serial: number,
): TimeValueQuestion {
  if (serial % 2 === 0) {
    const rate = choose([0.05, 0.1], random);
    const periods = choose([1, 2], random);
    const today = choose([500, 1000, 2000], random);
    const future = compoundFutureValue(today, rate, periods);
    const correct = formatMoney(today);
    return makeQuestion(
      "A6",
      serial,
      "conceptual_discounting",
      `You will receive ${formatMoney(future)} in ${periods} year${periods === 1 ? "" : "s"}. At ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })}, approximately what is it worth today?`,
      correct,
      [formatMoney(future), formatMoney(today * (1 - rate))],
      `Discount the future payment back ${periods} period${periods === 1 ? "" : "s"}: ${correct} today.`,
      [["TODAY", correct], [`YEAR ${periods}`, formatMoney(future)]],
      { future_value: future, rate, periods },
      random,
    );
  }
  const variants: [string, string, [string, string], string][] = [
    [
      "At a positive interest rate, which is worth more today?",
      "The 1-year payment",
      ["The 5-year payment", "Same value"],
      "Money arriving sooner is discounted less.",
    ],
    [
      "A $10,000 payment is due in five years. Rates rise. What happens to its present value?",
      "It falls",
      ["It rises", "No change"],
      "A higher required return means more discounting and a lower present value.",
    ],
    [
      "Two equal payments arrive in one year and ten years. Which must be discounted more?",
      "The 10-year payment",
      ["The 1-year payment", "Same discount"],
      "More time means more discounting.",
    ],
  ];
  const [prompt, correct, wrong, explanation] = variants[(serial - 1) % variants.length]!;
  return makeQuestion(
    "A6",
    serial,
    "conceptual_discounting",
    prompt,
    correct,
    wrong,
    explanation,
    [["MORE TIME", "MORE DISCOUNTING"], ["HIGHER RATE", "LOWER PV"]],
    {},
    random,
  );
}

function generateA7Question(
  random: RandomSource,
  serial: number,
): TimeValueQuestion {
  if (serial % 2 === 1) {
    const correct = "Discount each payment to today and add them";
    return makeQuestion(
      "A7",
      serial,
      "annuity",
      "An investment pays $1,000 at the end of every year for five years. How should we calculate its value today?",
      correct,
      ["Add the payments without adjustment", "Divide $1,000 by the interest rate"],
      "An annuity's value is the sum of the present values of its payments.",
      Array.from({ length: 5 }, (_, index) => [`YEAR ${index + 1}`, "$1,000"]),
      { payment: 1000, periods: 5 },
      random,
    );
  }
  const payment = choose([100, 200, 500], random);
  const rate = choose([0.05, 0.1], random);
  const periods = choose([2, 3], random);
  const value = annuityPresentValue(payment, rate, periods);
  const correct = formatMoney(value);
  return makeQuestion(
    "A7",
    serial,
    "annuity",
    `You receive ${formatMoney(payment)} at each year-end for ${periods} years. At ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })}, approximately what are those payments worth today?`,
    correct,
    [formatMoney(payment * periods), formatMoney(payment / (1 + rate))],
    `Discount each payment separately and add them: ${correct}.`,
    Array.from({ length: periods }, (_, index) => [`YEAR ${index + 1}`, formatMoney(payment)]),
    { payment, rate, periods },
    random,
  );
}

function generateA8Question(
  random: RandomSource,
  serial: number,
): TimeValueQuestion {
  const payment = choose([100, 500, 1000, 50000], random);
  const rate = choose([0.04, 0.05, 0.1], random);
  const value = perpetuityValue(payment, rate);
  const correct = formatMoney(value);
  return makeQuestion(
    "A8",
    serial,
    "perpetuity",
    `An investment pays ${formatMoney(payment)} per year indefinitely. Required return is ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })}. What is its value?`,
    correct,
    [formatMoney(payment / rate / 2), formatMoney((payment / rate) * 2)],
    `Perpetuity value = annual payment ÷ required return = ${formatMoney(payment)} ÷ ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })} = ${correct}.`,
    [["YEAR 1", formatMoney(payment)], ["YEAR 2", formatMoney(payment)], ["FOREVER", formatMoney(payment)]],
    { payment, rate },
    random,
  );
}

export function generateStageQuestion(
  stageId: StageAId,
  random: RandomSource,
  serial: number,
  questionNumber: number,
): TimeValueQuestion {
  if (stageId === "A1") return generateA1Question(random, serial);
  if (stageId === "A2") return generateA2Question(random, serial, questionNumber);
  if (stageId === "A3") return generateA3Question(random, serial);
  if (stageId === "A4") return generateA4Question(random, serial);
  if (stageId === "A5") return generateA5Question(random, serial);
  if (stageId === "A6") return generateA6Question(random, serial);
  if (stageId === "A7") return generateA7Question(random, serial);
  return generateA8Question(random, serial);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidStageQuestion(value: unknown): value is TimeValueQuestion {
  if (!isRecord(value) || !isRecord(value.inputs)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.stageId !== "string" ||
    !/^A[1-8]-\d+$/.test(value.id) ||
    !value.id.startsWith(`${value.stageId}-`) ||
    typeof value.kind !== "string" ||
    typeof value.prompt !== "string" ||
    typeof value.explanation !== "string" ||
    typeof value.correctAnswer !== "string" ||
    !Array.isArray(value.choices) ||
    value.choices.length !== 3 ||
    !value.choices.every((choice) => typeof choice === "string") ||
    !Array.isArray(value.diagram) ||
    !Array.isArray(value.completedDiagram) ||
    !value.diagram.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        point.every((part) => typeof part === "string"),
    ) ||
    !value.completedDiagram.every(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        point.every((part) => typeof part === "string"),
    )
  ) return false;
  if (value.stageId === "A2") return isValidA2Question(value);
  if (value.stageId !== "A1") return isValidLaterStageQuestion(value);
  if (
    value.stageId !== A1_STAGE.id ||
    value.kind !== "one_period_interest" ||
    typeof value.inputs.principal !== "number" ||
    !Number.isFinite(value.inputs.principal) ||
    typeof value.inputs.rate !== "number" ||
    !Number.isFinite(value.inputs.rate) ||
    ![500, 1000, 2000, 5000].includes(value.inputs.principal) ||
    ![0.04, 0.05, 0.06, 0.08, 0.1].includes(value.inputs.rate) ||
    value.diagram.length !== 2
  ) {
    return false;
  }
  const principal = value.inputs.principal;
  const rate = value.inputs.rate;
  const interest = principal * rate;
  const expected = formatMoney(
    simpleFutureValue(principal, rate),
  );
  const expectedChoices = new Set([
    expected,
    formatMoney(principal),
    formatMoney(principal * (1 + rate * 2)),
  ]);
  const expectedPrompt = `You invest ${formatMoney(principal)} for one year at ${rate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 0 })}. How much money do you have after one year?`;
  return (
    new Set(value.choices).size === 3 &&
    value.choices.every((choice) => expectedChoices.has(choice)) &&
    value.choices.filter((choice) => choice === value.correctAnswer)
      .length === 1 &&
    value.correctAnswer === expected &&
    value.prompt === expectedPrompt &&
    value.explanation === `${formatMoney(principal)} + ${formatMoney(interest)} interest = ${expected}.` &&
    JSON.stringify(value.diagram) === JSON.stringify([
      ["TODAY", formatMoney(principal)],
      ["YEAR 1", "?"],
    ]) &&
    JSON.stringify(value.completedDiagram) === JSON.stringify([
      ["TODAY", formatMoney(principal)],
      ["YEAR 1", expected],
    ])
  );
}

function isValidLaterStageQuestion(value: Record<string, unknown>): boolean {
  const choices = value.choices as string[];
  const inputs = value.inputs as Record<string, number>;
  const diagram = value.diagram as [string, string][];
  const completedDiagram = value.completedDiagram as [string, string][];
  const correctAnswer = value.correctAnswer as string;
  const expectedKinds: Record<Exclude<StageAId, "A1" | "A2">, string> = {
    A3: "compound_interest",
    A4: "future_value",
    A5: "present_value",
    A6: "conceptual_discounting",
    A7: "annuity",
    A8: "perpetuity",
  };
  const stageId = value.stageId as StageAId;
  if (
    !(stageId in expectedKinds) ||
    value.kind !== expectedKinds[stageId as keyof typeof expectedKinds] ||
    !Object.values(inputs).every(Number.isFinite) ||
    new Set(choices).size !== 3 ||
    choices.filter((choice) => choice === correctAnswer).length !== 1 ||
    diagram.length !== completedDiagram.length
  ) return false;
  return diagram.every(
    ([label, shown], index) =>
      label === completedDiagram[index]?.[0] &&
      (shown === "?" || shown === completedDiagram[index]?.[1]),
  );
}

function isValidA2Question(value: Record<string, unknown>): boolean {
  const id = value.id;
  const inputs = value.inputs as Record<string, unknown>;
  const initial = inputs.initial_value;
  const ending = inputs.ending_value;
  const lossPct = inputs.loss_pct;
  const amountLost = inputs.amount_lost;
  const questionType = inputs.question_type;
  const questionNumber = inputs.question_number;
  if (
    value.kind !== "negative_return" ||
    typeof initial !== "number" ||
    typeof ending !== "number" ||
    typeof lossPct !== "number" ||
    typeof amountLost !== "number" ||
    typeof questionType !== "number" ||
    typeof questionNumber !== "number" ||
    ![0, 1, 2, 3].includes(questionType) ||
    !Number.isInteger(questionNumber) ||
    questionNumber < 1 ||
    questionNumber > 8 ||
    questionType !== (questionNumber - 1) % 4 ||
    inputs.periods !== 1 ||
    inputs.rate !== -lossPct / 100 ||
    !Number.isFinite(initial) ||
    !Number.isFinite(ending) ||
    !Number.isFinite(amountLost) ||
    !(questionNumber <= 4
      ? [5, 10, 20, 25, 50].includes(lossPct)
      : [8, 12, 15, 18, 32].includes(lossPct)) ||
    !(questionNumber <= 4
      ? [200, 400, 1000, 2000].includes(initial)
      : [640, 1250, 2400, 3750].includes(initial)) ||
    Math.abs(ending - (initial - amountLost)) > 1e-8 ||
    Math.abs(amountLost - (initial * lossPct) / 100) > 1e-8
  ) return false;
  const choices = value.choices as string[];
  const diagram = value.diagram as [string, string][];
  const completedDiagram = value.completedDiagram as [string, string][];
  const expectedCorrect = [
    moneyWithCents(ending),
    `${lossPct}%`,
    moneyWithCents(initial),
    moneyWithCents(amountLost),
  ][questionType]!;
  const expectedDiagram =
    questionType === 0
      ? [["TODAY", moneyWithCents(initial)], ["YEAR 1", moneyWithCents(ending)]]
      : questionType === 1
        ? [["TODAY", moneyWithCents(initial)], ["YEAR 1", moneyWithCents(ending)], ["LOSS", `${lossPct}%`]]
        : questionType === 2
          ? [["TODAY", moneyWithCents(initial)], ["YEAR 1", moneyWithCents(ending)]]
          : [["TODAY", moneyWithCents(initial)], ["YEAR 1", moneyWithCents(ending)], ["LOST", moneyWithCents(amountLost)]];
  const hiddenLabel =
    questionType === 0 ? "YEAR 1" : questionType === 1 ? "LOSS" : questionType === 2 ? "TODAY" : "LOST";
  const expectedQuestionDiagram = expectedDiagram.map(([label, text]) => [
    label,
    label === hiddenLabel || text === expectedCorrect ? "?" : text,
  ]);
  const fmt = moneyWithCents;
  const expectedPrompt =
    questionType === 0
      ? `An investment starts at ${fmt(initial)} and loses ${lossPct}% over one year. What is its ending value?`
      : questionType === 1
        ? `An investment falls from ${fmt(initial)} to ${fmt(ending)} over one year. What percentage of its starting value was lost?`
        : questionType === 2
          ? `After losing ${lossPct}% over one year, an investment is worth ${fmt(ending)}. What was its starting value?`
          : `An investment starts at ${fmt(initial)} and loses ${lossPct}% over one year. How many dollars were lost?`;
  const expectedExplanation =
    questionType === 0
      ? `Ending value = ${fmt(initial)} × (1 - ${lossPct}%) = ${expectedCorrect}.`
      : questionType === 1
        ? `Loss = ${fmt(initial)} - ${fmt(ending)} = ${fmt(amountLost)}. ${fmt(amountLost)} ÷ ${fmt(initial)} = ${expectedCorrect}.`
        : questionType === 2
          ? `Starting value = ${fmt(ending)} ÷ (1 - ${lossPct}%) = ${expectedCorrect}.`
          : `Amount lost = ${fmt(initial)} × ${lossPct}% = ${expectedCorrect}. Ending value = ${fmt(ending)}.`;
  const expectedDistractors =
    questionType === 0
      ? [fmt(initial + amountLost), fmt(initial)]
      : questionType === 1
        ? new Set([expectedCorrect, `${100 - lossPct}%`, `${lossPct + 5}%`]).size === 3
          ? [`${100 - lossPct}%`, `${lossPct + 5}%`]
          : [`${lossPct + 5}%`, `${lossPct + 10}%`]
        : questionType === 2
          ? [fmt(ending), fmt(ending * (1 - lossPct / 100))]
          : [fmt(initial), fmt(initial + amountLost)];
  return (
    typeof id === "string" &&
    new Set(choices).size === 3 &&
    choices.includes(value.correctAnswer as string) &&
    choices.every((choice) => choice === value.correctAnswer || expectedDistractors.includes(choice)) &&
    value.correctAnswer === expectedCorrect &&
    value.prompt === expectedPrompt &&
    value.explanation === expectedExplanation &&
    JSON.stringify(completedDiagram) === JSON.stringify(expectedDiagram) &&
    JSON.stringify(diagram) === JSON.stringify(expectedQuestionDiagram) &&
    value.id === `A2-${id.split("-")[1]}` &&
    typeof value.prompt === "string" &&
    typeof value.explanation === "string"
  );
}

export const isValidA1Question = isValidStageQuestion;
