import { STAGE_A } from "../definitions/stages";

export type CareerStageId = `A${number}` | `B${number}`;

export type CareerLevel = {
  level: number;
  title: string;
  completedStages: readonly CareerStageId[];
};

const STAGE_A_IDS = STAGE_A.map(({ id }) => id) as CareerStageId[];
const STAGE_B_IDS = ["B1", "B2", "B3", "B4", "B5"] as const;
const A_THROUGH_A4 = STAGE_A_IDS.slice(0, 4);
const A_AND_B2 = [...STAGE_A_IDS, "B1", "B2"] as const;
const A_AND_B5 = [...STAGE_A_IDS, ...STAGE_B_IDS] as const;

export const CAREER_LEVELS: readonly CareerLevel[] = [
  { level: 1, title: "Intern", completedStages: [] },
  { level: 2, title: "Trainee Analyst", completedStages: ["A1"] },
  { level: 3, title: "Junior Analyst", completedStages: A_THROUGH_A4 },
  { level: 4, title: "Analyst", completedStages: STAGE_A_IDS },
  { level: 5, title: "Investment Associate", completedStages: A_AND_B2 },
  { level: 6, title: "Investment Associate", completedStages: A_AND_B5 },
];

export function getCareerLevel(completedStages: readonly string[]): CareerLevel {
  const completed = new Set(completedStages);
  const eligible = CAREER_LEVELS.filter((milestone) =>
    milestone.completedStages.every((stageId) => completed.has(stageId)),
  );
  return eligible[eligible.length - 1]!;
}

export function getPromotionForCompletion(
  completedStages: readonly string[],
  newlyCompletedStage: string,
): CareerLevel | null {
  if (completedStages.includes(newlyCompletedStage)) return null;
  const previousLevel = getCareerLevel(completedStages);
  const nextLevel = getCareerLevel([...completedStages, newlyCompletedStage]);
  return nextLevel.level > previousLevel.level ? nextLevel : null;
}
