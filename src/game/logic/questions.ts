import { A1_STAGE, type StageAId, type StageId } from "../definitions/stages";
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
  stageId: StageId;
  kind: string;
  prompt: string;
  choices: [string, string, string];
  correctAnswer: string;
  explanation: string;
  reference?: string;
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
  stageId: StageId,
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
  if (stageId === "A8") return generateA8Question(random, serial);
  return generateYieldQuestion(stageId, random, serial);
}

const BENCHMARK_TYPES = [
  ["Build-to-Rent", 5.5], ["Cold Storage Property", 5.5], ["Holiday Park", 8],
  ["Hotel", 8], ["Industrial Property", 5.5], ["Logistics Property", 5.5],
  ["Medical Office", 5.5], ["Multifamily Property", 5.5], ["Office", 6],
  ["Rental Portfolio", 6], ["Retail Park", 6], ["Self Storage", 6],
  ["Senior Living", 6], ["Shopping Centre", 6], ["Student Housing", 5.5],
  ["Supermarket", 5.5], ["Warehouse Property", 5.5], ["Battery Storage", 8],
  ["Biogas", 8], ["Combined Heat & Power", 8], ["Community Solar", 6],
  ["District Heating", 8], ["Hydro", 6], ["Peaker", 8],
  ["Rooftop Solar", 6], ["Utility Solar", 6], ["Wind", 6],
  ["Airport Parking", 6], ["Desalination", 6], ["Ferry", 6],
  ["Pipeline", 6], ["Port Terminal", 6], ["Rail", 6],
  ["Toll Road", 5], ["Toll Tunnel", 5], ["Tram", 6],
  ["Transport", 6], ["Waste", 6], ["Water", 5],
  ["Colocation", 6], ["Data Center", 6], ["Fiber", 6],
  ["Hyperscale Data Center", 5.5], ["Telecom Towers", 6],
  ["Auto Parts", 8], ["Catering", 8], ["Childcare", 8],
  ["Dental", 8], ["Education", 8], ["Equipment Rental Business", 8],
  ["Fitness", 8], ["Food Manufacturing", 8], ["Furniture", 8],
  ["Grocery", 8], ["Healthcare", 8], ["Horticulture", 8],
  ["HVAC Services", 8], ["Industrial Manufacturing", 8],
  ["Logistics Company", 8], ["Marine Services", 8], ["Optical", 8],
  ["Packaging Company", 8], ["Recycling Services", 8],
  ["Security Services", 8], ["Software Company", 8],
  ["Specialty Chemicals", 8], ["Testing Laboratories", 8],
  ["Travel Services", 8], ["Veterinary", 8],
  ["Cold-Chain Logistics", 8], ["Equipment Leasing", 8],
  ["Farmland", 5], ["Marina", 6], ["Outdoor Advertising", 6],
  ["Parking", 6], ["Quarry", 8], ["Timber", 5],
  ["Vehicle Leasing", 8], ["Vineyard", 6],
] as const;

const RATING_CHOICES = ["BUY", "NEUTRAL", "SELL"] as const;

function classifyMispricing(mispricingPct: number): string {
  if (mispricingPct > 5) return "BUY";
  if (mispricingPct < -5) return "SELL";
  return "NEUTRAL";
}

function generateYieldQuestion(
  stageId: Extract<StageId, "B1" | "B2" | "B3" | "B4" | "B5">,
  random: RandomSource,
  serial: number,
): TimeValueQuestion {
  if (stageId === "B4") {
    const yieldPct = choose([4, 5, 6, 7, 8], random);
    const price = choose([1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000], random);
    const income = price * yieldPct / 100;
    const choices = shuffle([yieldPct - 1, yieldPct, yieldPct + 1], random);
    const question: TimeValueQuestion = {
      id: `${stageId}-${serial}`,
      stageId,
      kind: "implied_yield",
      prompt: `An asset earns ${formatMoney(income)} annually and is offered for ${formatMoney(price)}. What is its implied yield?`,
      choices: [choices[0]!.toFixed(1) + "%", choices[1]!.toFixed(1) + "%", choices[2]!.toFixed(1) + "%"],
      correctAnswer: `${yieldPct.toFixed(1)}%`,
      explanation: `Implied yield = annual income ÷ price = ${formatMoney(income)} ÷ ${formatMoney(price)} = ${yieldPct.toFixed(1)}%.`,
      diagram: [["ANNUAL INCOME", formatMoney(income)], ["OFFER PRICE", formatMoney(price)], ["IMPLIED YIELD", "?"]],
      completedDiagram: [["ANNUAL INCOME", formatMoney(income)], ["OFFER PRICE", formatMoney(price)], ["IMPLIED YIELD", `${yieldPct.toFixed(1)}%`]],
      inputs: { annual_income: income, price, fair_value: price, implied_yield_pct: yieldPct },
    };
    if (!isValidStageQuestion(question)) throw new Error("B4 question generator produced an invalid question");
    return question;
  }

  let income: number;
  let yieldPct: number;
  let fairValue: number;
  let detail: string;
  let kind: string;
  let reference: string | undefined;
  let inputs: Record<string, number>;
  if (stageId === "B1") {
    income = choose([50_000, 75_000, 100_000, 125_000, 150_000, 200_000], random);
    yieldPct = choose([4, 5, 6, 8, 10], random);
    fairValue = income / (yieldPct / 100);
    detail = `the required yield is ${yieldPct}%`;
    kind = "simple_yield_valuation";
    inputs = { annual_income: income, required_yield_pct: yieldPct };
  } else if (stageId === "B2") {
    income = choose(Array.from({ length: 23 }, (_, index) => (index + 3) * 10_000), random);
    const benchmarkIndex = Math.floor(random() * BENCHMARK_TYPES.length);
    const [benchmarkName, benchmarkYield] = BENCHMARK_TYPES[benchmarkIndex]!;
    yieldPct = benchmarkYield;
    fairValue = income / (yieldPct / 100);
    detail = `the benchmark yield is ${yieldPct}%`;
    kind = "benchmark_yield_valuation";
    reference = `MARKET YIELD SHEET · ${benchmarkName}: ${yieldPct}%`;
    inputs = { annual_income: income, required_yield_pct: yieldPct, benchmark_type_index: benchmarkIndex };
  } else if (stageId === "B3") {
    income = choose(Array.from({ length: 11 }, (_, index) => (index + 5) * 10_000), random);
    const multiple = choose([8, 10, 12.5, 15, 20], random);
    yieldPct = 100 / multiple;
    fairValue = income * multiple;
    detail = `the justified income multiple is ${multiple}x`;
    kind = "yield_multiple_valuation";
    inputs = { annual_income: income, multiple, equivalent_yield_pct: yieldPct };
  } else {
    income = choose(Array.from({ length: 1099 }, (_, index) => (index + 401) * 100), random);
    yieldPct = choose(Array.from({ length: 49 }, (_, index) => (index + 41) / 10), random);
    fairValue = income / (yieldPct / 100);
    detail = `the required yield is ${yieldPct.toFixed(1)}%`;
    kind = "harder_yield_valuation";
    inputs = { annual_income: income, required_yield_pct: yieldPct };
  }

  const targetRating = RATING_CHOICES[(serial - 1) % RATING_CHOICES.length]!;
  const targetMispricing = stageId === "B1" && targetRating !== "NEUTRAL"
    ? targetRating === "BUY" ? 25 : -25
    : targetRating === "BUY" ? 10 : targetRating === "SELL" ? -10 : 0;
  const price = fairValue * (1 - targetMispricing / 100);
  const mispricing = (fairValue - price) / fairValue * 100;
  const correctAnswer = classifyMispricing(mispricing);
  const question: TimeValueQuestion = {
    id: `${stageId}-${serial}`,
    stageId,
    kind,
    prompt: stageId === "B2"
      ? `A ${reference!.split(" · ")[1]!.split(":")[0]} generates ${formatMoney(income)} annually and is offered for ${formatMoney(price)}. How is it rated?`
      : `An asset generates ${formatMoney(income)} annually and is offered for ${formatMoney(price)}. If ${detail}, how is it rated?`,
    choices: shuffle([...RATING_CHOICES], random) as [string, string, string],
    correctAnswer,
    explanation: stageId === "B3"
      ? `Fair value = ${formatMoney(income)} × ${inputs.multiple} = ${formatMoney(fairValue)}. The offer is ${correctAnswer === "BUY" ? "below" : correctAnswer === "SELL" ? "above" : "at"} fair value, so rate it ${correctAnswer}.`
      : `Fair value = ${formatMoney(income)} ÷ ${yieldPct}% = ${formatMoney(fairValue)}. The offer is ${correctAnswer === "BUY" ? "below" : correctAnswer === "SELL" ? "above" : "at"} fair value, so rate it ${correctAnswer}.`,
    ...(reference ? { reference } : {}),
    diagram: [["ANNUAL INCOME", formatMoney(income)], ["OFFER PRICE", formatMoney(price)], ["FAIR VALUE", "?"]],
    completedDiagram: [["ANNUAL INCOME", formatMoney(income)], ["OFFER PRICE", formatMoney(price)], ["FAIR VALUE", formatMoney(fairValue)]],
    inputs: { ...inputs, fair_value: fairValue, price },
  };
  if (!isValidStageQuestion(question)) throw new Error(`${stageId} question generator produced an invalid question`);
  return question;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidStageQuestion(value: unknown): value is TimeValueQuestion {
  if (!isRecord(value) || !isRecord(value.inputs)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.stageId !== "string" ||
    !/^[AB][1-8]-\d+$/.test(value.id) ||
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
  if (value.stageId === "B1" || value.stageId === "B2" || value.stageId === "B3" || value.stageId === "B4" || value.stageId === "B5") {
    return isValidYieldQuestion(value);
  }
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

function isValidYieldQuestion(value: Record<string, unknown>): boolean {
  const inputs = value.inputs as Record<string, unknown>;
  const choices = value.choices as string[];
  const diagram = value.diagram as [string, string][];
  const completedDiagram = value.completedDiagram as [string, string][];
  const stageId = value.stageId as StageId;
  const income = inputs.annual_income;
  const price = inputs.price;
  if (
    typeof income !== "number" || !Number.isFinite(income) ||
    typeof price !== "number" || !Number.isFinite(price) ||
    new Set(choices).size !== 3 ||
    choices.filter((choice) => choice === value.correctAnswer).length !== 1 ||
    diagram.length !== 3 || completedDiagram.length !== 3 ||
    diagram[0]?.[0] !== "ANNUAL INCOME" ||
    diagram[1]?.[0] !== "OFFER PRICE" ||
    completedDiagram[0]?.[1] !== formatMoney(income) ||
    completedDiagram[1]?.[1] !== formatMoney(price)
  ) return false;

  if (stageId === "B4") {
    const yieldPct = inputs.implied_yield_pct;
    return typeof yieldPct === "number" &&
      [4, 5, 6, 7, 8].includes(yieldPct) &&
      inputs.fair_value === price &&
      price === [1_000_000, 1_500_000, 2_000_000, 2_500_000, 3_000_000].find((item) => item === price) &&
      income === price * yieldPct / 100 &&
      value.kind === "implied_yield" &&
      value.prompt === `An asset earns ${formatMoney(income)} annually and is offered for ${formatMoney(price)}. What is its implied yield?` &&
      value.correctAnswer === `${yieldPct.toFixed(1)}%` &&
      choices.includes(value.correctAnswer as string) &&
      choices.every((choice) => [yieldPct - 1, yieldPct, yieldPct + 1].map((item) => `${item.toFixed(1)}%`).includes(choice)) &&
      diagram[2]?.[0] === "IMPLIED YIELD" &&
      diagram[2]?.[1] === "?" &&
      completedDiagram[2]?.[0] === "IMPLIED YIELD" &&
      completedDiagram[2]?.[1] === `${yieldPct.toFixed(1)}%` &&
      value.explanation === `Implied yield = annual income ÷ price = ${formatMoney(income)} ÷ ${formatMoney(price)} = ${yieldPct.toFixed(1)}%.`;
  }

  const fairValue = inputs.fair_value;
  if (typeof fairValue !== "number" || !Number.isFinite(fairValue)) return false;
  const yieldPct = inputs.required_yield_pct;
  const multiple = inputs.multiple;
  const expectedFair = stageId === "B3" && typeof multiple === "number"
    ? income * multiple
    : typeof yieldPct === "number" ? income / (yieldPct / 100) : Number.NaN;
  if (Math.abs(fairValue - expectedFair) > 1e-8) return false;
  const serial = Number((value.id as string).split("-")[1]);
  const targetRating = RATING_CHOICES[(serial - 1) % RATING_CHOICES.length];
  const targetMispricing = stageId === "B1" && targetRating !== "NEUTRAL"
    ? targetRating === "BUY" ? 25 : -25
    : targetRating === "BUY" ? 10 : targetRating === "SELL" ? -10 : 0;
  if (Math.abs(price - expectedFair * (1 - targetMispricing / 100)) > 1e-8) return false;
  if (stageId === "B1" &&
      (![50_000, 75_000, 100_000, 125_000, 150_000, 200_000].includes(income) ||
       ![4, 5, 6, 8, 10].includes(yieldPct as number))) return false;
  if (stageId === "B2") {
    const typeIndex = inputs.benchmark_type_index;
    if (
      typeof typeIndex !== "number" || !Number.isInteger(typeIndex) ||
      !BENCHMARK_TYPES[typeIndex] ||
      income < 30_000 || income > 250_000 || income % 10_000 !== 0 ||
      yieldPct !== BENCHMARK_TYPES[typeIndex][1] ||
      value.reference !== `MARKET YIELD SHEET · ${BENCHMARK_TYPES[typeIndex][0]}: ${yieldPct}%`
    ) return false;
  }
  if (stageId === "B3" &&
      (income < 50_000 || income > 150_000 || income % 10_000 !== 0 ||
       ![8, 10, 12.5, 15, 20].includes(multiple as number) ||
       inputs.equivalent_yield_pct !== 100 / (multiple as number))) return false;
  if (stageId === "B5" &&
      (income < 40_100 || income > 149_900 || income % 100 !== 0 ||
       typeof yieldPct !== "number" || yieldPct < 4.1 || yieldPct > 8.9 ||
       Math.round(yieldPct * 10) !== yieldPct * 10)) return false;
  const expectedKind = {
    B1: "simple_yield_valuation",
    B2: "benchmark_yield_valuation",
    B3: "yield_multiple_valuation",
    B5: "harder_yield_valuation",
  }[stageId as "B1" | "B2" | "B3" | "B5"];
  if (value.kind !== expectedKind) return false;
  const rating = classifyMispricing((fairValue - price) / fairValue * 100);
  return (
    value.correctAnswer === rating &&
    choices.every((choice) => RATING_CHOICES.includes(choice as typeof RATING_CHOICES[number])) &&
    diagram[2]?.[0] === "FAIR VALUE" &&
    diagram[2]?.[1] === "?" &&
    completedDiagram[2]?.[0] === "FAIR VALUE" &&
    completedDiagram[2]?.[1] === formatMoney(fairValue) &&
    value.explanation === (
      stageId === "B3"
        ? `Fair value = ${formatMoney(income)} × ${multiple} = ${formatMoney(fairValue)}. The offer is ${rating === "BUY" ? "below" : rating === "SELL" ? "above" : "at"} fair value, so rate it ${rating}.`
        : `Fair value = ${formatMoney(income)} ÷ ${yieldPct}% = ${formatMoney(fairValue)}. The offer is ${rating === "BUY" ? "below" : rating === "SELL" ? "above" : "at"} fair value, so rate it ${rating}.`
    )
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
