/**
 * Pure seeded pseudo-random number generator (mulberry32).
 * Never uses Math.random or Date.now.
 */
export interface SeededRng {
  /** Returns a float in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Returns a float in [min, max) */
  nextFloat(min: number, max: number): number;
  /** Picks a random element from a non-empty array */
  pick<T>(items: readonly T[]): T;
  /** Shuffles a copy of an array deterministically */
  shuffle<T>(items: readonly T[]): T[];
  /** Returns true with probability p (0..1) */
  chance(p: number): boolean;
  /** Returns current internal state seed */
  getState(): number;
}

export function createRng(seed: number): SeededRng {
  let state = seed >>> 0;
  if (state === 0) state = 0x6d2b79f5;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (min: number, max: number): number => {
    if (max <= min) return min;
    return Math.floor(next() * (max - min + 1)) + min;
  };

  const nextFloat = (min: number, max: number): number => {
    return min + next() * (max - min);
  };

  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    const idx = nextInt(0, items.length - 1);
    return items[idx];
  };

  const shuffle = <T>(items: readonly T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = nextInt(0, i);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  };

  const chance = (p: number): boolean => {
    return next() < p;
  };

  const getState = (): number => state;

  return {
    next,
    nextInt,
    nextFloat,
    pick,
    shuffle,
    chance,
    getState,
  };
}

export function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
