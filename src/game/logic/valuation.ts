export function simpleFutureValue(principal: number, rate: number): number {
  if (principal < 0 || rate < 0) {
    throw new RangeError("Principal and rate cannot be negative");
  }
  return principal * (1 + rate);
}

export function compoundFutureValue(
  present: number,
  rate: number,
  periods: number,
): number {
  if (present < 0 || rate < 0 || periods < 0) {
    throw new RangeError("Value, rate, and periods cannot be negative");
  }
  return present * (1 + rate) ** periods;
}

export function presentValue(
  future: number,
  rate: number,
  periods: number,
): number {
  if (future < 0 || rate < 0 || periods < 0) {
    throw new RangeError("Value, rate, and periods cannot be negative");
  }
  return future / (1 + rate) ** periods;
}

export function annuityPresentValue(
  payment: number,
  rate: number,
  periods: number,
): number {
  if (payment < 0 || rate <= 0 || periods < 1) {
    throw new RangeError("Payment and periods must be positive; rate must exceed zero");
  }
  let total = 0;
  for (let period = 1; period <= periods; period += 1) {
    total += presentValue(payment, rate, period);
  }
  return total;
}

export function perpetuityValue(payment: number, requiredReturn: number): number {
  if (payment < 0 || requiredReturn <= 0) {
    throw new RangeError("Payment must be non-negative and return must be positive");
  }
  return payment / requiredReturn;
}
