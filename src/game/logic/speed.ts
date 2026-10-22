import { MAX_PERFORMANCE_POINTS_PER_QUESTION } from "./rewards";

export const MAX_POTENTIAL_POINTS = MAX_PERFORMANCE_POINTS_PER_QUESTION;
export const MIN_CORRECT_POINTS = 10_000;
export const FEE_HALF_LIFE_SECONDS = 5.24;

export function potentialPoints(elapsedSeconds: number): number {
  const elapsed = Math.max(0, elapsedSeconds);
  return Math.max(
    MIN_CORRECT_POINTS,
    MAX_POTENTIAL_POINTS * Math.pow(0.5, elapsed / FEE_HALF_LIFE_SECONDS),
  );
}

function roundHalfToEven(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}

export function roundedPoints(value: number): number {
  return Math.max(0, roundHalfToEven(value / 100) * 100);
}

export function performancePointsEarned(
  elapsedSeconds: number,
  correct: boolean,
  timeFactor = 1,
): number {
  if (timeFactor <= 0) {
    throw new RangeError("time_factor must be greater than zero");
  }
  const amount = roundedPoints(potentialPoints(elapsedSeconds / timeFactor));
  return correct ? amount : -roundedPoints(amount / 3);
}
