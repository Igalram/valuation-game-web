import type { StageResult } from "../../game/logic/progression";
import type { TimeValueQuestion } from "../../game/logic/questions";
import { isValidStageQuestion } from "../../game/logic/questions";
import { A0_TUTORIAL, STAGE_A, type StageAId } from "../../game/definitions/stages";
import { LIFESTYLE_ITEM_BY_ID, type LifestyleSlot } from "../../systems/lifestyle-shop/catalog";
import { MAX_PERFORMANCE_POINTS_PER_STAGE } from "../../game/logic/rewards";
import { isPlayerAvatarId, type PlayerAvatarId } from "../../game/logic/playerProfile";

export const SAVE_KEY = "valuation-game-web-save";

export type LivePhase =
  | "intro"
  | "a1-tutorial"
  | "question"
  | "feedback"
  | "summary"
  | "map"
  | "lifestyle";
export type GamePhase = "menu" | LivePhase;

export type GameSave = {
  version: 5;
  playerName: string;
  playerAvatarId: PlayerAvatarId;
  profileCreated: boolean;
  phase: GamePhase;
  resumePhase: LivePhase | null;
  currentStageId: StageAId;
  completedStages: StageAId[];
  tutorialsSeenStages: StageAId[];
  introIndex: number;
  introSeen: boolean;
  tutorialSeen: boolean;
  question: TimeValueQuestion | null;
  questionNumber: number;
  correctAnswers: number;
  streak: number;
  careerEarnings: number;
  availableCash: number;
  stageEarnings: number;
  performancePoints: number;
  stagePerformancePoints: number;
  cashCreditedStages: string[];
  ownedVehicleIds: string[];
  equippedVehicleId: string;
  ownedLifestyleIds: string[];
  lifestyleSlots: Partial<Record<LifestyleSlot, string>>;
  randomSeed: number;
  itemSerial: number;
  elapsedMs: number;
  answer: string | null;
  answerCorrect: boolean | null;
  questionPerformancePoints: number;
  feedback: string[];
  result: StageResult | null;
  audioMuted: boolean;
  tutorialReturnPhase: "question" | "feedback" | null;
};

export function createNewGame(): GameSave {
  return {
    version: 5,
    playerName: "",
    playerAvatarId: "alex",
    profileCreated: false,
    phase: "intro",
    resumePhase: "intro",
    currentStageId: "A1",
    completedStages: [],
    tutorialsSeenStages: [],
    introIndex: 0,
    introSeen: false,
    tutorialSeen: false,
    question: null,
    questionNumber: 0,
    correctAnswers: 0,
    streak: 0,
    careerEarnings: 0,
    availableCash: 0,
    stageEarnings: 0,
    performancePoints: 0,
    stagePerformancePoints: 0,
    cashCreditedStages: [],
    ownedVehicleIds: ["car_01"],
    equippedVehicleId: "car_01",
    ownedLifestyleIds: [],
    lifestyleSlots: {},
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
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isLifestyleItemId(value: unknown): value is string {
  return typeof value === "string" && LIFESTYLE_ITEM_BY_ID.has(value);
}

const LIFESTYLE_SLOTS: LifestyleSlot[] = [
  "vehicle",
  "clothing",
  "wrist",
  "neck",
  "eyes",
  "head",
  "bicycle",
  "two_wheeler",
  "collectible_skateboard",
  "collectible_basketball",
  "collectible_toolbox",
  "collectible_golf",
  "collectible_sports",
  "outdoor_surfboard",
  "outdoor_atv",
  "outdoor_jetski",
  "property",
];

function isGamePhase(value: unknown): value is GamePhase {
  return (
    typeof value === "string" &&
    ["menu", "intro", "a1-tutorial", "question", "feedback", "summary", "map", "lifestyle"].includes(value)
  );
}

function isLivePhase(value: unknown): value is LivePhase {
  return (
    typeof value === "string" &&
    ["intro", "a1-tutorial", "question", "feedback", "summary", "map", "lifestyle"].includes(value)
  );
}

function isStageAId(value: unknown): value is StageAId {
  return typeof value === "string" && STAGE_A.some((stage) => stage.id === value);
}

function isStageResult(value: unknown): value is StageResult {
  if (
    !isRecord(value) ||
    !isNumber(value.correctAnswers) ||
    !isNumber(value.earnings) ||
    !isNumber(value.performancePoints)
  ) {
    return false;
  }
  const expectedLabel =
    value.correctAnswers >= 8
      ? "Excellent"
      : value.correctAnswers >= 6
        ? "Good"
        : value.correctAnswers >= 4
          ? "Developing"
          : "Needs Review";
  return (
    isStageAId(value.stageId) &&
    Number.isInteger(value.correctAnswers) &&
    value.correctAnswers >= 0 &&
    value.correctAnswers <= 8 &&
    value.totalQuestions === 8 &&
    isNumber(value.accuracyPct) &&
    value.accuracyPct === Math.round((value.correctAnswers / 8) * 100) &&
    value.result === expectedLabel &&
    Math.abs(value.performancePoints) <= MAX_PERFORMANCE_POINTS_PER_STAGE &&
    isNumber(value.cashCredited) &&
    value.cashCredited >= 0 &&
    value.cashCredited <= Math.max(0, value.earnings)
  );
}

function isGameSave(value: unknown): value is GameSave {
  if (!isRecord(value)) return false;
  const ownedVehicleIds = Array.isArray(value.ownedVehicleIds) ? value.ownedVehicleIds : [];
  const ownedLifestyleIds = Array.isArray(value.ownedLifestyleIds) ? value.ownedLifestyleIds : [];
  const lifestyleSlots = isRecord(value.lifestyleSlots) ? value.lifestyleSlots : {};
  return (
    value.version === 5 &&
    typeof value.playerName === "string" &&
    value.playerName.length <= 28 &&
    isPlayerAvatarId(value.playerAvatarId) &&
    typeof value.profileCreated === "boolean" &&
    (!value.profileCreated || value.playerName.trim().length > 0) &&
    isGamePhase(value.phase) &&
    (value.resumePhase === null || isLivePhase(value.resumePhase)) &&
    isStageAId(value.currentStageId) &&
    Array.isArray(value.completedStages) &&
    value.completedStages.every(isStageAId) &&
    Array.isArray(value.tutorialsSeenStages) &&
    value.tutorialsSeenStages.every(isStageAId) &&
    isNumber(value.introIndex) &&
    Number.isInteger(value.introIndex) &&
    value.introIndex >= 0 &&
    value.introIndex < A0_TUTORIAL.length &&
    isNumber(value.questionNumber) &&
    Number.isInteger(value.questionNumber) &&
    value.questionNumber >= 0 &&
    value.questionNumber <= 8 &&
    isNumber(value.correctAnswers) &&
    Number.isInteger(value.correctAnswers) &&
    value.correctAnswers >= 0 &&
    value.correctAnswers <= 8 &&
    isNumber(value.streak) &&
    Number.isInteger(value.streak) &&
    value.streak >= 0 &&
    isNumber(value.careerEarnings) &&
    isNumber(value.availableCash) &&
    isNumber(value.stageEarnings) &&
    isNumber(value.performancePoints) &&
    isNumber(value.stagePerformancePoints) &&
    Array.isArray(value.ownedVehicleIds) &&
    ownedVehicleIds.every(isLifestyleItemId) &&
    ownedVehicleIds.every((id) => LIFESTYLE_ITEM_BY_ID.get(id)?.category === "cars") &&
    new Set(ownedVehicleIds).size === ownedVehicleIds.length &&
    isLifestyleItemId(value.equippedVehicleId) &&
    LIFESTYLE_ITEM_BY_ID.get(value.equippedVehicleId)?.category === "cars" &&
    ownedVehicleIds.includes(value.equippedVehicleId) &&
    Array.isArray(value.ownedLifestyleIds) &&
    ownedLifestyleIds.every(isLifestyleItemId) &&
    ownedLifestyleIds.every((id) => LIFESTYLE_ITEM_BY_ID.get(id)?.category !== "cars") &&
    new Set(ownedLifestyleIds).size === ownedLifestyleIds.length &&
    isRecord(value.lifestyleSlots) &&
    Object.entries(lifestyleSlots).every(([slot, id]) => {
      if (!LIFESTYLE_SLOTS.includes(slot as LifestyleSlot) || !isLifestyleItemId(id)) return false;
      const product = LIFESTYLE_ITEM_BY_ID.get(id)!;
      const isOwned = product.category === "cars"
        ? ownedVehicleIds.includes(id)
        : ownedLifestyleIds.includes(id);
      return isOwned && product.displaySlot === slot;
    }) &&
    isNumber(value.itemSerial) &&
    Number.isInteger(value.itemSerial) &&
    isNumber(value.elapsedMs) &&
    Array.isArray(value.cashCreditedStages) &&
    value.cashCreditedStages.every(isStageAId) &&
    new Set(value.cashCreditedStages).size === value.cashCreditedStages.length &&
    new Set(value.completedStages).size === value.completedStages.length &&
    new Set(value.tutorialsSeenStages).size === value.tutorialsSeenStages.length &&
    Array.isArray(value.feedback) &&
    value.feedback.every((line) => typeof line === "string") &&
    typeof value.introSeen === "boolean" &&
    typeof value.tutorialSeen === "boolean" &&
    isNumber(value.randomSeed) &&
    (value.answer === null || typeof value.answer === "string") &&
    (value.answerCorrect === null || typeof value.answerCorrect === "boolean") &&
    isNumber(value.questionPerformancePoints) &&
    typeof value.audioMuted === "boolean" &&
    (value.tutorialReturnPhase === null ||
      value.tutorialReturnPhase === "question" ||
      value.tutorialReturnPhase === "feedback") &&
    (value.question === null || isValidStageQuestion(value.question)) &&
    (value.result === null || isStageResult(value.result)) &&
    (value.phase !== "question" || (value.question !== null && value.answer === null)) &&
    (value.phase !== "feedback" ||
      (value.question !== null && value.answer !== null && value.answerCorrect !== null)) &&
    (value.phase !== "summary" ||
      (value.questionNumber === 8 &&
        value.result !== null &&
        value.result.stageId === value.currentStageId &&
        value.completedStages.includes(value.currentStageId) &&
        value.cashCreditedStages.includes(value.currentStageId) &&
        value.question !== null &&
        value.question.stageId === value.currentStageId)) &&
    ((value.phase !== "question" && value.phase !== "feedback") ||
      (value.question !== null && value.question.stageId === value.currentStageId)) &&
    (value.answer === null ||
      (value.question !== null && value.answerCorrect === (value.answer === value.question.correctAnswer)))
  );
}

function upgradeVersionOne(value: unknown): unknown {
  if (!isRecord(value) || value.version !== 1) return value;
  const question = isRecord(value.question) ? value.question : null;
  let upgradedQuestion: unknown = question;
  if (question && question.stageId === "A1" && Array.isArray(question.diagram)) {
    const completedDiagram = question.diagram;
    upgradedQuestion = {
      ...question,
      diagram: completedDiagram.map((point, index) =>
        Array.isArray(point) && index === completedDiagram.length - 1
          ? [point[0], "?"]
          : point,
      ),
      completedDiagram,
    };
  }
  const isCompletedA1 = value.phase === "summary" || value.result !== null;
  return {
    ...value,
    version: 2,
    currentStageId: "A1",
    completedStages: isCompletedA1 ? ["A1"] : [],
    tutorialsSeenStages: value.tutorialSeen === true ? ["A1"] : [],
    question: upgradedQuestion,
  };
}

function upgradeVersionTwo(value: unknown): unknown {
  if (!isRecord(value) || value.version !== 2) return value;
  return {
    ...value,
    version: 3,
    ownedVehicleIds: Array.isArray(value.ownedVehicleIds) ? value.ownedVehicleIds : ["car_01"],
    equippedVehicleId: typeof value.equippedVehicleId === "string" ? value.equippedVehicleId : "car_01",
    ownedLifestyleIds: Array.isArray(value.ownedLifestyleIds) ? value.ownedLifestyleIds : [],
    lifestyleSlots: isRecord(value.lifestyleSlots) ? value.lifestyleSlots : {},
  };
}

function upgradeVersionThree(value: unknown): unknown {
  if (!isRecord(value) || value.version !== 3) return value;
  const previousResult = isRecord(value.result) ? value.result : null;
  const resumePhase = value.phase === "menu" ? value.resumePhase : value.phase;
  const inProgress =
    resumePhase === "question" ||
    resumePhase === "feedback" ||
    resumePhase === "a1-tutorial" && value.questionNumber !== 0;
  return {
    ...value,
    version: 4,
    stagePerformancePoints: inProgress && isNumber(value.stageEarnings) ? value.stageEarnings : 0,
    stageEarnings: 0,
    performancePoints: 0,
    questionPerformancePoints: isNumber(value.feeEarned) ? value.feeEarned : 0,
    ...(previousResult ? {
      result: {
        ...previousResult,
        performancePoints: isNumber(previousResult.performancePoints)
          ? previousResult.performancePoints
          : isNumber(previousResult.earnings) ? previousResult.earnings : 0,
      },
    } : {}),
  };
}

function upgradeVersionFour(value: unknown): unknown {
  if (!isRecord(value) || value.version !== 4) return value;
  return {
    ...value,
    version: 5,
    playerName: typeof value.playerName === "string" ? value.playerName : "",
    playerAvatarId: isPlayerAvatarId(value.playerAvatarId) ? value.playerAvatarId : "alex",
    profileCreated:
      typeof value.profileCreated === "boolean" ? value.profileCreated : false,
  };
}

export function loadGame(): GameSave | null {
  const serialized = window.localStorage.getItem(SAVE_KEY);
  if (serialized === null) return null;
  const parsed: unknown = upgradeVersionFour(
    upgradeVersionThree(
      upgradeVersionTwo(upgradeVersionOne(JSON.parse(serialized))),
    ),
  );
  if (!isGameSave(parsed)) {
    throw new Error("The saved game is invalid or was created by an incompatible version.");
  }
  return parsed;
}

export function saveGame(state: GameSave): void {
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function clearGameSave(): void {
  window.localStorage.removeItem(SAVE_KEY);
}
