export type IntroChunk = {
  title: string;
  paragraphs: string[];
  emphasis?: string[];
  equation?: string;
  table?: [string, string][];
  decisions?: string[];
  calculatorDemo?: boolean;
};

export const A0_TUTORIAL: IntroChunk[] = [
  {
    title: "BEFORE WE VALUE INVESTMENTS",
    paragraphs: [
      "Before we value investments, we need to understand something about money.",
      "Money has a different value depending on when it is received.",
    ],
  },
  {
    title: "A SIMPLE LOAN",
    paragraphs: [
      "Suppose I ask to borrow $100 from you today.",
      "I promise to give it back one year from now.",
      "For that entire year, I have your $100. And you don't.",
    ],
  },
  {
    title: "WHAT YOU GIVE UP",
    paragraphs: [
      "You can't spend it.",
      "You can't invest it.",
      "You can't lend it to somebody else.",
    ],
  },
  {
    title: "INTEREST",
    paragraphs: [
      "So you might say: Fine. I'll give you $100 today.",
      "But next year I want $105 back.",
      "The extra $5 is INTEREST.",
      "Interest is the price paid for using money for a period of time.",
    ],
    equation: "TODAY  $100  ---------------------->  ONE YEAR  $105",
  },
  {
    title: "THE INTEREST RATE",
    paragraphs: [
      "$5 on $100 = 5%",
      "That's a 5% interest rate.",
      "For example, $1,000 invested for one year at 5% becomes $1,050.",
      "$1,000 × (1 + 5%) = $1,000 × (1.05) = $1,050.",
    ],
    emphasis: ["5%"],
  },
  {
    title: "OUR FIRST RULE",
    paragraphs: [
      "So our first rule is simple:",
      "MONEY TODAY IS WORTH MORE THAN THE SAME MONEY LATER.",
      "Ready to explore why?",
    ],
    emphasis: ["MONEY TODAY IS WORTH MORE"],
  },
];

export const A1_TUTORIAL = {
  title: "Interest",
  opportunity: "$1,000 is invested for one year at 5%.",
  formula: "Future amount = Principal × (1 + rate)",
  steps: [
    "Interest = $1,000 × 5% = $50.",
    "After one year: $1,000 + $50 = $1,050.",
    "$1,000 × (1 + 5%) = $1,000 × (1.05) = $1,050.",
  ],
  finalAnswer: "$1,050",
};

export const A1_STAGE = {
  id: "A1",
  title: "Interest",
  primaryConcept: "TVM1",
  baseline: 1,
  questionsPerStage: 8,
  timeFactor: 1,
} as const;

export type StageAId = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8";

export type StageDefinition = {
  id: StageAId;
  title: string;
  primaryConcept: string;
  alsoUpdates: string[];
  baseline: number;
  timeFactor: number;
  tutorial: {
    title: string;
    opportunity: string;
    steps: string[];
    finalAnswer: string;
    formula?: string;
    notes?: string;
    visualKind?: string;
  };
};

export const STAGE_A: StageDefinition[] = [
  {
    id: "A1",
    title: "Interest",
    primaryConcept: "TVM1",
    alsoUpdates: [],
    baseline: 1,
    timeFactor: 1,
    tutorial: {
      title: "Interest",
      opportunity: "$1,000 is invested for one year at 5%.",
      steps: [
        "Interest = $1,000 × 5% = $50.",
        "After one year: $1,000 + $50 = $1,050.",
        "$1,000 × (1 + 5%) = $1,000 × (1.05) = $1,050.",
      ],
      finalAnswer: "$1,050",
      formula: "Future amount = Principal × (1 + rate)",
    },
  },
  {
    id: "A2",
    title: "Losses & Negative Returns",
    primaryConcept: "LOSS1",
    alsoUpdates: ["TVM1"],
    baseline: 2,
    timeFactor: 1,
    tutorial: {
      title: "Losses & Negative Returns",
      opportunity: "A negative return reduces your starting value over one year.",
      steps: [
        "$1,000 losing 10% becomes $900: $1,000 × (1 - 10%) = $900.",
        "A negative 15% return means retaining 85% of the starting amount.",
        "A decline from $200 to $150 loses $50: $50 ÷ $200 = 25%.",
        "To find the starting value, divide the ending value by (1 - loss rate).",
      ],
      finalAnswer: "Ending value = Starting value × (1 - loss rate)",
      notes: "Each question covers exactly one year and one negative return.",
    },
  },
  {
    id: "A3",
    title: "Compounding",
    primaryConcept: "TVM2",
    alsoUpdates: ["TVM1"],
    baseline: 2,
    timeFactor: 1,
    tutorial: {
      title: "Compounding",
      opportunity: "START: $1,000. Interest rate: 3% per year.",
      steps: [
        "3% interest means that after one year, we multiply our money by 1.03.",
        "Year 1: $1,000 × 1.03 = $1,030.",
        "Now comes the important part. The second year does NOT start with $1,000. It starts with the $1,030 we now have.",
        "Year 2: $1,030 × 1.03 = $1,060.90.",
        "So for two years, we multiplied by 1.03 TWICE. Instead of writing × 1.03 twice, we can write × 1.03². The little ² means multiply by 1.03 two times.",
      ],
      finalAnswer: "$1,060.90",
      notes: "Only now do we use the shortcut: Future Value = Starting Money × (1 + interest rate)^years.",
      visualKind: "compound_walkthrough",
    },
  },
  {
    id: "A4",
    title: "Future Value",
    primaryConcept: "TVM3",
    alsoUpdates: ["TVM2"],
    baseline: 3,
    timeFactor: 3,
    tutorial: {
      title: "Future Value",
      opportunity: "$1,000 today earns 5% per year for five years.",
      steps: [
        "Future Value asks what today's money becomes later.",
        "First find the one-year growth factor: 1 + r = 1 + 5% = 1.05.",
        "Enter PV × 1.05, press xʸ, enter n = 5, then press =.",
        "$1,000 × 1.05^5 = $1,276.28, which rounds to $1,276.",
      ],
      finalAnswer: "$1,276",
      formula: "FV = PV × (1 + r)^n",
    },
  },
  {
    id: "A5",
    title: "Present Value",
    primaryConcept: "TVM4",
    alsoUpdates: ["TVM3"],
    baseline: 4,
    timeFactor: 1,
    tutorial: {
      title: "Present Value",
      opportunity: "You will receive $110 one year from now. Your required return is 10%.",
      steps: [
        "Run compounding backwards.",
        "$110 ÷ 1.10 = $100.",
        "$110 next year is worth $100 today.",
      ],
      finalAnswer: "$100",
      formula: "PV = FV ÷ (1 + r)^n",
    },
  },
  {
    id: "A6",
    title: "Time & Discounting",
    primaryConcept: "TVM5",
    alsoUpdates: ["TVM4"],
    baseline: 5,
    timeFactor: 1,
    tutorial: {
      title: "Time & Discounting",
      opportunity: "Two equal payments arrive at different times.",
      steps: [
        "More time means more discounting.",
        "A higher required return also means more discounting.",
        "More discounting means a lower present value.",
      ],
      finalAnswer: "SOONER MONEY IS WORTH MORE TODAY",
    },
  },
  {
    id: "A7",
    title: "Annuities",
    primaryConcept: "TVM6",
    alsoUpdates: ["TVM4"],
    baseline: 6,
    timeFactor: 1,
    tutorial: {
      title: "Annuities",
      opportunity: "An investment pays $100 at each year-end for five years.",
      steps: [
        "An annuity is a fixed series of payments over a fixed period.",
        "Discount each payment to today.",
        "Add all of those present values.",
      ],
      finalAnswer: "SUM OF THE PRESENT VALUES",
    },
  },
  {
    id: "A8",
    title: "Perpetuities",
    primaryConcept: "TVM7",
    alsoUpdates: ["TVM6"],
    baseline: 7,
    timeFactor: 1,
    tutorial: {
      title: "Perpetuities",
      opportunity: "An investment pays $100 every year forever. Required return is 5%.",
      steps: [
        "A perpetuity is a continuing stream of equal payments.",
        "Value = Annual Payment ÷ Required Return.",
        "$100 ÷ 5% = $2,000.",
      ],
      finalAnswer: "$2,000",
      formula: "Value = Payment ÷ Return",
    },
  },
];

export function getStageA(stageId: string): StageDefinition {
  const stage = STAGE_A.find((item) => item.id === stageId);
  if (!stage) throw new Error(`Unknown Stage A id: ${stageId}`);
  return stage;
}

export function nextStageA(stageId: StageAId): StageAId | null {
  const index = STAGE_A.findIndex((stage) => stage.id === stageId);
  return STAGE_A[index + 1]?.id ?? null;
}
