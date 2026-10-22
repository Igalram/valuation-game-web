export type RandomSource = () => number;

export function createRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function choose<T>(values: readonly T[], random: RandomSource): T {
  if (values.length === 0) {
    throw new RangeError("Cannot choose from an empty collection");
  }
  return values[Math.floor(random() * values.length)]!;
}

export function shuffle<T>(values: readonly T[], random: RandomSource): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other]!, shuffled[index]!];
  }
  return shuffled;
}
