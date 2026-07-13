const NON_ZERO_FALLBACK = 0x6d2b79f5;

export function normalizeSeed(seed: number): number {
  const normalized = Number.isFinite(seed) ? Math.trunc(seed) >>> 0 : NON_ZERO_FALLBACK;
  return normalized === 0 ? NON_ZERO_FALLBACK : normalized;
}

export function mixSeed(seed: number, index: number): number {
  let value = (normalizeSeed(seed) ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value === 0 ? NON_ZERO_FALLBACK : value >>> 0;
}

export interface RandomStep {
  readonly state: number;
  readonly value: number;
}

export function nextRandom(state: number): RandomStep {
  let value = normalizeSeed(state);
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  value >>>= 0;
  return { state: value === 0 ? NON_ZERO_FALLBACK : value, value: value >>> 0 };
}

export function randomInt(state: number, maximumExclusive: number): RandomStep {
  if (!Number.isInteger(maximumExclusive) || maximumExclusive <= 0) {
    throw new Error("maximumExclusive must be a positive integer");
  }
  const step = nextRandom(state);
  return { state: step.state, value: step.value % maximumExclusive };
}
