import { FormationCode, Player, PlayerAttributes, PositionCode } from './types';

/**
 * Position-specific attribute weights for overall rating calculation.
 * Documented & unit tested as required by spec.
 */
export const POSITION_WEIGHTS: Record<PositionCode, Partial<Record<keyof PlayerAttributes, number>>> = {
  GK: {
    diving: 0.21,
    reflexes: 0.21,
    handling: 0.21,
    gkPositioning: 0.21,
    kicking: 0.11,
    reactions: 0.05,
  },
  CB: {
    standingTackle: 0.17,
    defensiveAwareness: 0.15,
    slidingTackle: 0.13,
    interceptions: 0.12,
    strength: 0.11,
    headingAccuracy: 0.10,
    jumping: 0.07,
    reactions: 0.06,
    sprintSpeed: 0.05,
    shortPassing: 0.04,
  },
  RB: {
    sprintSpeed: 0.12,
    standingTackle: 0.11,
    slidingTackle: 0.10,
    defensiveAwareness: 0.10,
    interceptions: 0.11,
    crossing: 0.10,
    stamina: 0.10,
    acceleration: 0.10,
    shortPassing: 0.08,
    reactions: 0.08,
  },
  LB: {
    sprintSpeed: 0.12,
    standingTackle: 0.11,
    slidingTackle: 0.10,
    defensiveAwareness: 0.10,
    interceptions: 0.11,
    crossing: 0.10,
    stamina: 0.10,
    acceleration: 0.10,
    shortPassing: 0.08,
    reactions: 0.08,
  },
  CDM: {
    standingTackle: 0.15,
    interceptions: 0.14,
    shortPassing: 0.12,
    defensiveAwareness: 0.12,
    strength: 0.10,
    stamina: 0.10,
    longPassing: 0.08,
    slidingTackle: 0.07,
    reactions: 0.07,
    aggression: 0.05,
  },
  CM: {
    shortPassing: 0.16,
    longPassing: 0.13,
    vision: 0.12,
    ballControl: 0.12,
    standingTackle: 0.09,
    interceptions: 0.08,
    reactions: 0.08,
    stamina: 0.08,
    dribbling: 0.06,
    positioning: 0.05,
    composure: 0.03,
  },
  CAM: {
    shortPassing: 0.16,
    vision: 0.14,
    ballControl: 0.14,
    dribbling: 0.13,
    positioning: 0.09,
    longShots: 0.08,
    longPassing: 0.08,
    finishing: 0.07,
    reactions: 0.06,
    composure: 0.05,
  },
  RW: {
    dribbling: 0.16,
    ballControl: 0.12,
    crossing: 0.12,
    acceleration: 0.10,
    sprintSpeed: 0.10,
    finishing: 0.10,
    positioning: 0.08,
    agility: 0.08,
    shortPassing: 0.07,
    reactions: 0.07,
  },
  LW: {
    dribbling: 0.16,
    ballControl: 0.12,
    crossing: 0.12,
    acceleration: 0.10,
    sprintSpeed: 0.10,
    finishing: 0.10,
    positioning: 0.08,
    agility: 0.08,
    shortPassing: 0.07,
    reactions: 0.07,
  },
  ST: {
    finishing: 0.18,
    positioning: 0.13,
    headingAccuracy: 0.10,
    shotPower: 0.10,
    ballControl: 0.10,
    reactions: 0.08,
    composure: 0.08,
    dribbling: 0.07,
    sprintSpeed: 0.06,
    acceleration: 0.05,
    volleys: 0.05,
  },
};

/**
 * Resolves an attribute value from PlayerAttributes with legacy fallbacks.
 */
function resolveAttrValue(attributes: PlayerAttributes, key: keyof PlayerAttributes): number {
  const direct = attributes[key];
  if (typeof direct === 'number' && !isNaN(direct)) return direct;

  // Fallbacks for legacy/mock data objects
  switch (key) {
    case 'standingTackle':
    case 'slidingTackle':
      return attributes.tackling ?? 50;
    case 'defensiveAwareness':
      return attributes.marking ?? attributes.tackling ?? 50;
    case 'headingAccuracy':
      return attributes.heading ?? 50;
    case 'sprintSpeed':
    case 'acceleration':
      return attributes.pace ?? 50;
    case 'shortPassing':
    case 'longPassing':
      return attributes.passing ?? 50;
    case 'shotPower':
    case 'longShots':
    case 'volleys':
    case 'penalties':
      return attributes.shooting ?? attributes.finishing ?? 50;
    case 'ballControl':
      return attributes.firstTouch ?? attributes.dribbling ?? 50;
    case 'reactions':
      return attributes.composure ?? attributes.decisions ?? 50;
    case 'interceptions':
      return attributes.anticipation ?? attributes.marking ?? 50;
    case 'gkPositioning':
      return attributes.positioning ?? 20;
    case 'kicking':
      return attributes.distribution ?? attributes.passing ?? 20;
    case 'diving':
      return attributes.reflexes ?? 20;
    default:
      return 50;
  }
}

export function calculateOverallRating(
  attributes: PlayerAttributes,
  position: PositionCode
): number {
  const weights = POSITION_WEIGHTS[position];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [attrKey, weight] of Object.entries(weights)) {
    if (typeof weight === 'number' && weight > 0) {
      const val = resolveAttrValue(attributes, attrKey as keyof PlayerAttributes);
      weightedSum += val * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 50;
  const raw = Math.round(weightedSum / totalWeight);
  return Math.max(1, Math.min(99, raw));
}

export function calculateMarketValue(overall: number, age: number, potential: number): number {
  const base = Math.pow(Math.max(1, overall - 40), 2.65) * 850;
  const ageFactor =
    age <= 21 ? 1.35 : age <= 25 ? 1.2 : age <= 28 ? 1.0 : age <= 31 ? 0.7 : 0.4;
  const potBonus = Math.max(0, potential - overall) * 65000;
  return Math.max(50000, Math.round((base * ageFactor + potBonus) / 10000) * 10000);
}

export function calculateWeeklyWage(overall: number, age: number): number {
  const raw = Math.pow(Math.max(1, overall - 42), 2.15) * 18;
  const veteranFactor = age >= 28 ? 1.15 : 1.0;
  return Math.max(500, Math.round((raw * veteranFactor) / 100) * 100);
}

export interface FormationSlot {
  slotIndex: number;
  position: PositionCode;
  x: number; // 0..100 pitch x (left=own goal, right=opponent goal)
  y: number; // 0..100 pitch y (top to bottom)
}

export const FORMATION_SLOTS: Record<FormationCode, FormationSlot[]> = {
  '4-3-3': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'LB', x: 26, y: 15 },
    { slotIndex: 2, position: 'CB', x: 24, y: 38 },
    { slotIndex: 3, position: 'CB', x: 24, y: 62 },
    { slotIndex: 4, position: 'RB', x: 26, y: 85 },
    { slotIndex: 5, position: 'CDM', x: 45, y: 50 },
    { slotIndex: 6, position: 'CM', x: 54, y: 30 },
    { slotIndex: 7, position: 'CM', x: 54, y: 70 },
    { slotIndex: 8, position: 'LW', x: 76, y: 20 },
    { slotIndex: 9, position: 'ST', x: 82, y: 50 },
    { slotIndex: 10, position: 'RW', x: 76, y: 80 },
  ],
  '4-2-3-1': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'LB', x: 26, y: 15 },
    { slotIndex: 2, position: 'CB', x: 24, y: 38 },
    { slotIndex: 3, position: 'CB', x: 24, y: 62 },
    { slotIndex: 4, position: 'RB', x: 26, y: 85 },
    { slotIndex: 5, position: 'CDM', x: 44, y: 36 },
    { slotIndex: 6, position: 'CDM', x: 44, y: 64 },
    { slotIndex: 7, position: 'LW', x: 66, y: 20 },
    { slotIndex: 8, position: 'CAM', x: 64, y: 50 },
    { slotIndex: 9, position: 'RW', x: 66, y: 80 },
    { slotIndex: 10, position: 'ST', x: 82, y: 50 },
  ],
  '4-4-2': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'LB', x: 26, y: 15 },
    { slotIndex: 2, position: 'CB', x: 24, y: 38 },
    { slotIndex: 3, position: 'CB', x: 24, y: 62 },
    { slotIndex: 4, position: 'RB', x: 26, y: 85 },
    { slotIndex: 5, position: 'LW', x: 54, y: 16 },
    { slotIndex: 6, position: 'CM', x: 52, y: 38 },
    { slotIndex: 7, position: 'CM', x: 52, y: 62 },
    { slotIndex: 8, position: 'RW', x: 54, y: 84 },
    { slotIndex: 9, position: 'ST', x: 80, y: 38 },
    { slotIndex: 10, position: 'ST', x: 80, y: 62 },
  ],
  '3-5-2': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'CB', x: 24, y: 26 },
    { slotIndex: 2, position: 'CB', x: 22, y: 50 },
    { slotIndex: 3, position: 'CB', x: 24, y: 74 },
    { slotIndex: 4, position: 'LW', x: 52, y: 14 },
    { slotIndex: 5, position: 'CDM', x: 46, y: 38 },
    { slotIndex: 6, position: 'CAM', x: 60, y: 50 },
    { slotIndex: 7, position: 'CDM', x: 46, y: 62 },
    { slotIndex: 8, position: 'RW', x: 52, y: 86 },
    { slotIndex: 9, position: 'ST', x: 80, y: 38 },
    { slotIndex: 10, position: 'ST', x: 80, y: 62 },
  ],
  '3-4-3': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'CB', x: 24, y: 26 },
    { slotIndex: 2, position: 'CB', x: 22, y: 50 },
    { slotIndex: 3, position: 'CB', x: 24, y: 74 },
    { slotIndex: 4, position: 'LB', x: 52, y: 16 },
    { slotIndex: 5, position: 'CM', x: 50, y: 38 },
    { slotIndex: 6, position: 'CM', x: 50, y: 62 },
    { slotIndex: 7, position: 'RB', x: 52, y: 84 },
    { slotIndex: 8, position: 'LW', x: 76, y: 22 },
    { slotIndex: 9, position: 'ST', x: 82, y: 50 },
    { slotIndex: 10, position: 'RW', x: 76, y: 78 },
  ],
  '4-1-4-1': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'LB', x: 26, y: 15 },
    { slotIndex: 2, position: 'CB', x: 24, y: 38 },
    { slotIndex: 3, position: 'CB', x: 24, y: 62 },
    { slotIndex: 4, position: 'RB', x: 26, y: 85 },
    { slotIndex: 5, position: 'CDM', x: 41, y: 50 },
    { slotIndex: 6, position: 'LW', x: 58, y: 16 },
    { slotIndex: 7, position: 'CM', x: 56, y: 38 },
    { slotIndex: 8, position: 'CM', x: 56, y: 62 },
    { slotIndex: 9, position: 'RW', x: 58, y: 84 },
    { slotIndex: 10, position: 'ST', x: 82, y: 50 },
  ],
  '5-3-2': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'LB', x: 28, y: 12 },
    { slotIndex: 2, position: 'CB', x: 23, y: 32 },
    { slotIndex: 3, position: 'CB', x: 21, y: 50 },
    { slotIndex: 4, position: 'CB', x: 23, y: 68 },
    { slotIndex: 5, position: 'RB', x: 28, y: 88 },
    { slotIndex: 6, position: 'CM', x: 52, y: 30 },
    { slotIndex: 7, position: 'CDM', x: 48, y: 50 },
    { slotIndex: 8, position: 'CM', x: 52, y: 70 },
    { slotIndex: 9, position: 'ST', x: 80, y: 38 },
    { slotIndex: 10, position: 'ST', x: 80, y: 62 },
  ],
  '4-3-1-2': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'LB', x: 26, y: 15 },
    { slotIndex: 2, position: 'CB', x: 24, y: 38 },
    { slotIndex: 3, position: 'CB', x: 24, y: 62 },
    { slotIndex: 4, position: 'RB', x: 26, y: 85 },
    { slotIndex: 5, position: 'CDM', x: 44, y: 50 },
    { slotIndex: 6, position: 'CM', x: 53, y: 32 },
    { slotIndex: 7, position: 'CM', x: 53, y: 68 },
    { slotIndex: 8, position: 'CAM', x: 66, y: 50 },
    { slotIndex: 9, position: 'ST', x: 81, y: 38 },
    { slotIndex: 10, position: 'ST', x: 81, y: 62 },
  ],
  '4-2-2-2': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'LB', x: 26, y: 15 },
    { slotIndex: 2, position: 'CB', x: 24, y: 38 },
    { slotIndex: 3, position: 'CB', x: 24, y: 62 },
    { slotIndex: 4, position: 'RB', x: 26, y: 85 },
    { slotIndex: 5, position: 'CDM', x: 44, y: 36 },
    { slotIndex: 6, position: 'CDM', x: 44, y: 64 },
    { slotIndex: 7, position: 'CAM', x: 64, y: 28 },
    { slotIndex: 8, position: 'CAM', x: 64, y: 72 },
    { slotIndex: 9, position: 'ST', x: 81, y: 38 },
    { slotIndex: 10, position: 'ST', x: 81, y: 62 },
  ],
  '5-4-1': [
    { slotIndex: 0, position: 'GK', x: 8, y: 50 },
    { slotIndex: 1, position: 'LB', x: 27, y: 12 },
    { slotIndex: 2, position: 'CB', x: 22, y: 32 },
    { slotIndex: 3, position: 'CB', x: 20, y: 50 },
    { slotIndex: 4, position: 'CB', x: 22, y: 68 },
    { slotIndex: 5, position: 'RB', x: 27, y: 88 },
    { slotIndex: 6, position: 'LW', x: 52, y: 16 },
    { slotIndex: 7, position: 'CM', x: 48, y: 38 },
    { slotIndex: 8, position: 'CM', x: 48, y: 62 },
    { slotIndex: 9, position: 'RW', x: 52, y: 84 },
    { slotIndex: 10, position: 'ST', x: 80, y: 50 },
  ],
};

export interface LineupValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a lineup has:
 * 1. Exactly 11 starters
 * 2. No duplicate player IDs across starters or substitutes
 * 3. Exactly 1 GK in the starting XI (slot 0 or primaryPosition === 'GK')
 * 4. No injured players in starting XI
 */
export function validateLineup(
  startingXI: string[],
  substitutes: string[],
  clubPlayers: Player[]
): LineupValidationResult {
  const errors: string[] = [];

  if (startingXI.length !== 11) {
    errors.push(`Starting XI must have exactly 11 players (currently ${startingXI.length}).`);
  }

  const uniqueStarters = new Set(startingXI);
  if (uniqueStarters.size !== startingXI.length) {
    errors.push('Starting XI contains duplicate players.');
  }

  const uniqueSubs = new Set(substitutes);
  if (uniqueSubs.size !== substitutes.length) {
    errors.push('Substitutes bench contains duplicate players.');
  }

  for (const subId of substitutes) {
    if (uniqueStarters.has(subId)) {
      errors.push('A player cannot be in both Starting XI and Substitutes.');
      break;
    }
  }

  const playerMap = new Map(clubPlayers.map((p) => [p.id, p]));
  let gkCount = 0;

  for (const id of startingXI) {
    const p = playerMap.get(id);
    if (!p) {
      errors.push(`Player ${id} does not belong to this club.`);
      continue;
    }
    if (p.primaryPosition === 'GK') {
      gkCount++;
    }
    if (p.injuryWeeks > 0) {
      errors.push(`${p.firstName} ${p.lastName} is injured (${p.injuryWeeks}w) and cannot start.`);
    }
  }

  if (startingXI.length === 11 && gkCount !== 1) {
    errors.push(`Starting XI must contain exactly 1 Goalkeeper (currently ${gkCount}).`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
