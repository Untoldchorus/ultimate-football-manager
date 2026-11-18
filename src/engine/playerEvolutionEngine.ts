import {
  Player,
  PlayerAttributes,
  PositionCode,
  TrainingFocus,
} from './types';
import { calculateOverallRating, calculateMarketValue, calculateWeeklyWage } from './ratings';
import { SeededRng } from './rng';

export interface CoachingQualityInput {
  trainingQuality: number; // 1..100
  playerDevelopment: number; // 1..100
}

export const TRAINING_FOCUS_ATTRIBUTES: Record<TrainingFocus, (keyof PlayerAttributes)[]> = {
  attacking: ['finishing', 'positioning', 'shotPower', 'volleys', 'dribbling', 'composure'],
  defending: ['standingTackle', 'slidingTackle', 'defensiveAwareness', 'interceptions', 'headingAccuracy', 'strength'],
  passing: ['shortPassing', 'longPassing', 'vision', 'crossing', 'curve'],
  shooting: ['finishing', 'shotPower', 'longShots', 'volleys', 'penalties'],
  fitness: ['acceleration', 'sprintSpeed', 'stamina', 'strength', 'jumping', 'agility'],
  goalkeeping: ['diving', 'handling', 'kicking', 'reflexes', 'gkPositioning'],
  tactical: ['defensiveAwareness', 'interceptions', 'vision', 'reactions', 'composure', 'decisions'],
};

export const MAX_SEASON_GROWTH_POINTS = 5;

/**
 * Calculates coaching quality multiplier (0.75x to 1.45x).
 */
export function getCoachingMultiplier(coaching?: CoachingQualityInput): number {
  if (!coaching) return 1.0;
  const avg = (coaching.trainingQuality + coaching.playerDevelopment) / 2;
  return 0.75 + (avg / 100) * 0.7; // 50 -> 1.1x, 80 -> 1.31x, 95 -> 1.415x
}

/**
 * Calculates playing time factor based on appearances and squad role.
 */
export function getPlayingTimeFactor(player: Player, currentWeek: number): number {
  if (currentWeek <= 2) return 1.0;
  const expectedMinApps =
    player.roleExpectation === 'star'
      ? currentWeek * 0.7
      : player.roleExpectation === 'starter'
      ? currentWeek * 0.5
      : currentWeek * 0.2;

  const actualApps = player.stats?.appearances ?? 0;
  if (actualApps >= expectedMinApps) {
    return 1.25; // Regular starter bonus
  } else if (actualApps <= 1 && currentWeek >= 8) {
    return 0.35; // Bench stagnation penalty
  }
  return 0.9;
}

/**
 * Calculates match performance momentum multiplier.
 */
export function getPerformanceMultiplier(player: Player): number {
  const avgRating = player.stats?.averageRating ?? 6.5;
  const apps = player.stats?.appearances ?? 0;
  if (apps < 2) return 1.0;

  if (avgRating >= 7.4) return 1.3;
  if (avgRating >= 7.0) return 1.1;
  if (avgRating <= 6.2) return 0.75;
  return 1.0;
}

/**
 * Applies dynamic weekly training development to a single player.
 */
export function evolvePlayerWeeklyTraining(
  player: Player,
  focuses: TrainingFocus[],
  intensity: 'light' | 'balanced' | 'heavy',
  currentWeek: number,
  coaching: CoachingQualityInput,
  rng: SeededRng,
  maxAttrCap = 99
): { updatedPlayer: Player; gainedAttr?: keyof PlayerAttributes } {
  // If player is injured, they cannot participate in attribute growth
  if ((player.injuryWeeks ?? 0) > 0) {
    return { updatedPlayer: player };
  }

  // Check growth cap & eligibility
  const headroom = player.potential - player.overall;
  if (headroom <= 0 || (player.seasonGrowth ?? 0) >= MAX_SEASON_GROWTH_POINTS || player.age >= 32) {
    return { updatedPlayer: player };
  }

  // Base age development velocity
  const ageFactor =
    player.age <= 20
      ? 0.32
      : player.age <= 23
      ? 0.22
      : player.age <= 26
      ? 0.12
      : player.age <= 29
      ? 0.05
      : 0.01;

  const coachingMult = getCoachingMultiplier(coaching);
  const playingTimeMult = getPlayingTimeFactor(player, currentWeek);
  const perfMult = getPerformanceMultiplier(player);
  const intensityMult = intensity === 'heavy' ? 1.35 : intensity === 'light' ? 0.7 : 1.0;

  // Headroom diminishing returns factor
  const headroomFactor = Math.min(1.0, headroom / 6);

  const growthProbability =
    ageFactor * coachingMult * playingTimeMult * perfMult * intensityMult * headroomFactor;

  if (!rng.chance(growthProbability)) {
    return { updatedPlayer: player };
  }

  // Pick attribute from training focuses
  const chosenFocus: TrainingFocus =
    player.primaryPosition === 'GK'
      ? 'goalkeeping'
      : focuses.length > 0
      ? rng.pick(focuses)
      : 'attacking';

  const candidateAttrs = TRAINING_FOCUS_ATTRIBUTES[chosenFocus] ?? ['stamina'];
  const attrToGrow = rng.pick(candidateAttrs);
  const currentVal = player.attributes[attrToGrow] ?? 60;

  if (currentVal >= maxAttrCap) {
    return { updatedPlayer: player };
  }

  const updatedAttrs: PlayerAttributes = {
    ...player.attributes,
    [attrToGrow]: currentVal + 1,
  };

  // Synchronize legacy aliases if applicable
  if (attrToGrow === 'acceleration' || attrToGrow === 'sprintSpeed') {
    updatedAttrs.pace = Math.round((updatedAttrs.acceleration + updatedAttrs.sprintSpeed) / 2);
  } else if (attrToGrow === 'finishing' || attrToGrow === 'shotPower' || attrToGrow === 'longShots') {
    updatedAttrs.shooting = Math.round((updatedAttrs.finishing * 0.45 + updatedAttrs.shotPower * 0.25 + updatedAttrs.longShots * 0.3));
  } else if (attrToGrow === 'shortPassing' || attrToGrow === 'longPassing') {
    updatedAttrs.passing = Math.round((updatedAttrs.shortPassing * 0.5 + updatedAttrs.vision * 0.3 + updatedAttrs.longPassing * 0.2));
  } else if (attrToGrow === 'standingTackle') {
    updatedAttrs.tackling = updatedAttrs.standingTackle;
  } else if (attrToGrow === 'headingAccuracy') {
    updatedAttrs.heading = updatedAttrs.headingAccuracy;
  } else if (attrToGrow === 'defensiveAwareness') {
    updatedAttrs.marking = updatedAttrs.defensiveAwareness;
  } else if (attrToGrow === 'ballControl') {
    updatedAttrs.firstTouch = updatedAttrs.ballControl;
  }

  const newOverall = Math.min(
    player.potential,
    Math.max(player.overall, calculateOverallRating(updatedAttrs, player.primaryPosition))
  );

  const seasonGrowth = Math.min(
    MAX_SEASON_GROWTH_POINTS,
    (player.seasonGrowth ?? 0) + (newOverall > player.overall ? 1 : 0.5)
  );

  const updatedPlayer: Player = {
    ...player,
    attributes: updatedAttrs,
    overall: newOverall,
    seasonGrowth,
    marketValue: calculateMarketValue(newOverall, player.age, player.potential),
    weeklyWage: calculateWeeklyWage(newOverall, player.age),
  };

  return { updatedPlayer, gainedAttr: attrToGrow };
}

/**
 * Evaluates dynamic potential breakthroughs or regressions based on season performance.
 */
export function evaluateDynamicPotential(player: Player, currentSeason: number): Player {
  const apps = player.stats?.appearances ?? 0;
  const avgRating = player.stats?.averageRating ?? 6.5;

  let potDelta = 0;

  // Breakthrough season for young players
  if (player.age <= 23 && apps >= 18 && avgRating >= 7.35) {
    potDelta = avgRating >= 7.7 ? 2 : 1;
  } else if (player.age <= 24 && apps >= 25 && (player.stats?.goals ?? 0) >= 15) {
    potDelta = 1;
  } else if (player.age <= 25 && apps === 0 && player.potential >= 84) {
    // Zero appearances causes slight potential stagnation
    potDelta = -1;
  }

  if (potDelta !== 0) {
    const nextPotential = Math.min(99, Math.max(player.overall, player.potential + potDelta));
    return {
      ...player,
      potential: nextPotential,
    };
  }

  return player;
}

/**
 * Natural end-of-season aging, maturation, and decline.
 */
export function evolvePlayerSeasonEnd(
  player: Player,
  nextSeason: number,
  rng: SeededRng
): Player {
  const newAge = player.age + 1;
  let nextAttrs = { ...player.attributes };

  // 1. Maturation for youngsters (17..22)
  if (newAge <= 22) {
    nextAttrs.stamina = Math.min(95, (nextAttrs.stamina ?? 70) + rng.nextInt(0, 2));
    nextAttrs.strength = Math.min(95, (nextAttrs.strength ?? 68) + rng.nextInt(0, 2));
    nextAttrs.reactions = Math.min(95, (nextAttrs.reactions ?? 68) + rng.nextInt(0, 2));
    nextAttrs.composure = Math.min(95, (nextAttrs.composure ?? 65) + rng.nextInt(0, 2));
  }
  // 2. Natural physical decline for veterans (31+)
  else if (newAge >= 31) {
    const paceDrop = newAge >= 34 ? rng.nextInt(1, 3) : rng.nextInt(0, 2);
    const staminaDrop = newAge >= 33 ? rng.nextInt(1, 2) : rng.nextInt(0, 1);
    const agilityDrop = newAge >= 33 ? rng.nextInt(1, 2) : 0;

    nextAttrs.acceleration = Math.max(25, (nextAttrs.acceleration ?? 65) - paceDrop);
    nextAttrs.sprintSpeed = Math.max(25, (nextAttrs.sprintSpeed ?? 65) - paceDrop);
    nextAttrs.pace = Math.round((nextAttrs.acceleration + nextAttrs.sprintSpeed) / 2);
    nextAttrs.stamina = Math.max(30, (nextAttrs.stamina ?? 65) - staminaDrop);
    nextAttrs.agility = Math.max(25, (nextAttrs.agility ?? 65) - agilityDrop);

    // Mental attributes compensate slightly
    nextAttrs.vision = Math.min(99, (nextAttrs.vision ?? 70) + (rng.chance(0.4) ? 1 : 0));
    nextAttrs.composure = Math.min(99, (nextAttrs.composure ?? 70) + (rng.chance(0.5) ? 1 : 0));
    nextAttrs.defensiveAwareness = Math.min(99, (nextAttrs.defensiveAwareness ?? 70) + (rng.chance(0.4) ? 1 : 0));
  }

  // Dynamic potential update from season performance
  const potentialUpdated = evaluateDynamicPotential(player, nextSeason);
  const nextOverall = Math.max(45, Math.min(potentialUpdated.potential, calculateOverallRating(nextAttrs, player.primaryPosition)));

  return {
    ...potentialUpdated,
    age: newAge,
    attributes: nextAttrs,
    overall: nextOverall,
    seasonGrowth: 0,
    fitness: 100,
    injuryWeeks: 0,
    marketValue: calculateMarketValue(nextOverall, newAge, potentialUpdated.potential),
    weeklyWage: calculateWeeklyWage(nextOverall, newAge),
    stats: {
      appearances: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
      averageRating: 0,
      minutesPlayed: 0,
    },
  };
}
