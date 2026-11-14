import {
  ActivePositionBooster,
  BalanceConfiguration,
  Club,
  ExtendedPlayerAttributes,
  FormationCode,
  ManagerAttributes,
  Player,
  PositionCode,
  TacticalMatchupOutcome,
  TacticalPlayerRole,
  TacticalPlayingStyle,
  TacticsConfig,
} from './types';
import { FORMATION_SLOTS } from './ratings';

export interface TacticalStyleDefinition {
  id: TacticalPlayingStyle;
  name: string;
  philosophy: string;
  strengths: string[];
  weaknesses: string[];
  neutralAgainst: TacticalPlayingStyle[];
  staminaDrainFactor: number; // 1.0 = normal, 1.38 = high drain (Gegenpress)
  defaultPressing: TacticsConfig['pressing'];
  defaultDefensiveLine: TacticsConfig['defensiveLine'];
  defaultWidth: number;
  defaultTempo: number;
  defaultDirectness: number;
  defaultCounterPressing: boolean;
  defaultTransitionSpeed: number;
  defaultCompactness: number;
}

export const TACTICAL_STYLES_LIST: TacticalPlayingStyle[] = [
  'gegenpress',
  'tikiTaka',
  'directCounter',
  'wingPlay',
  'parkTheBus',
  'highPress',
  'longBall',
  'possession',
  'catenaccio',
  'totalFootball',
  'midBlock',
  'balanced',
];

export const ALL_12_PLAYING_STYLES: TacticalPlayingStyle[] = TACTICAL_STYLES_LIST;

export const ALL_10_FORMATIONS: FormationCode[] = [
  '4-3-3',
  '4-4-2',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '5-3-2',
  '4-1-4-1',
  '4-3-1-2',
  '4-2-2-2',
  '5-4-1',
];

export function getTacticalMatchupOutcome(
  styleA: TacticalPlayingStyle,
  styleB: TacticalPlayingStyle
): TacticalMatchupOutcome {
  return DEFAULT_TACTICAL_COUNTER_MATRIX[styleA]?.[styleB] ?? 'Neutral';
}

export const TACTICAL_STYLES_CATALOG: Record<TacticalPlayingStyle, TacticalStyleDefinition> = {
  gegenpress: {
    id: 'gegenpress',
    name: 'Gegenpress',
    philosophy: 'Aggressive, coordinated pressing immediately after losing possession.',
    strengths: [
      'Disrupts short passing combinations.',
      'Forces opponents into hurried decisions.',
      'Creates opportunities through high turnovers.',
      'Can overwhelm teams with poor ball control.',
    ],
    weaknesses: [
      'Vulnerable to direct counter-attacks.',
      'Leaves spaces behind the pressing structure.',
      'Consumes significant stamina.',
      'Can become ineffective when players are exhausted.',
    ],
    neutralAgainst: ['parkTheBus', 'catenaccio', 'wingPlay', 'highPress', 'midBlock', 'balanced'],
    staminaDrainFactor: 1.42,
    defaultPressing: 'gegenpress',
    defaultDefensiveLine: 'high',
    defaultWidth: 58,
    defaultTempo: 84,
    defaultDirectness: 64,
    defaultCounterPressing: true,
    defaultTransitionSpeed: 88,
    defaultCompactness: 68,
  },
  tikiTaka: {
    id: 'tikiTaka',
    name: 'Tiki-Taka',
    philosophy: 'Short passing, possession retention and positional rotations.',
    strengths: [
      'Excellent against compact defensive blocks.',
      'Controls possession and match tempo.',
      'Creates passing triangles.',
      'Can gradually disorganise defensive structures.',
    ],
    weaknesses: [
      'Vulnerable to aggressive Gegenpressing.',
      'Requires technically gifted players.',
      'Can become predictable without movement.',
      'Vulnerable to interceptions when passing lanes are closed.',
    ],
    neutralAgainst: ['directCounter', 'wingPlay', 'longBall', 'possession', 'totalFootball', 'midBlock', 'balanced'],
    staminaDrainFactor: 1.04,
    defaultPressing: 'high',
    defaultDefensiveLine: 'high',
    defaultWidth: 52,
    defaultTempo: 74,
    defaultDirectness: 24,
    defaultCounterPressing: true,
    defaultTransitionSpeed: 58,
    defaultCompactness: 76,
  },
  directCounter: {
    id: 'directCounter',
    name: 'Direct Counter-Attack',
    philosophy: 'Defend, recover possession and attack quickly through available spaces.',
    strengths: [
      'Exploits aggressive pressing.',
      'Takes advantage of high defensive lines.',
      'Creates dangerous transitions.',
      'Benefits from pace and intelligent forward movement.',
    ],
    weaknesses: [
      'Vulnerable to compact defensive blocks.',
      'Can struggle against teams that deny transition spaces.',
      'Requires accurate forward passing.',
      'Can lose possession through rushed attacks.',
    ],
    neutralAgainst: ['tikiTaka', 'wingPlay', 'longBall', 'balanced'],
    staminaDrainFactor: 1.12,
    defaultPressing: 'medium',
    defaultDefensiveLine: 'deep',
    defaultWidth: 62,
    defaultTempo: 85,
    defaultDirectness: 84,
    defaultCounterPressing: false,
    defaultTransitionSpeed: 92,
    defaultCompactness: 78,
  },
  wingPlay: {
    id: 'wingPlay',
    name: 'Wing Play',
    philosophy: 'Exploit wide areas using wingers, fullbacks, overlaps and crosses.',
    strengths: [
      'Stretches compact defensive formations.',
      'Creates crossing opportunities.',
      'Exploits narrow defensive structures.',
      'Benefits from pace, crossing and aerial ability.',
    ],
    weaknesses: [
      'Vulnerable to well-organised mid blocks.',
      'Can leave wide defensive spaces.',
      'Depends heavily on effective wide players.',
      'Can become predictable when relying excessively on crosses.',
    ],
    neutralAgainst: ['gegenpress', 'tikiTaka', 'directCounter', 'highPress', 'possession', 'totalFootball', 'balanced'],
    staminaDrainFactor: 1.16,
    defaultPressing: 'medium',
    defaultDefensiveLine: 'standard',
    defaultWidth: 88,
    defaultTempo: 72,
    defaultDirectness: 66,
    defaultCounterPressing: false,
    defaultTransitionSpeed: 76,
    defaultCompactness: 52,
  },
  parkTheBus: {
    id: 'parkTheBus',
    name: 'Park the Bus',
    philosophy: 'Extremely compact defensive organisation with minimal space between defensive lines.',
    strengths: [
      'Frustrates direct attacking teams.',
      'Limits central penetration.',
      'Reduces space behind the defensive line.',
      'Can absorb pressure and protect leads.',
    ],
    weaknesses: [
      'Vulnerable to patient possession and positional rotations.',
      'Can struggle against sustained wide overloads.',
      'Gives opponents significant territory.',
      'Requires concentration and defensive discipline.',
    ],
    neutralAgainst: ['gegenpress', 'highPress', 'longBall', 'catenaccio', 'midBlock', 'balanced'],
    staminaDrainFactor: 0.86,
    defaultPressing: 'low',
    defaultDefensiveLine: 'deep',
    defaultWidth: 32,
    defaultTempo: 38,
    defaultDirectness: 75,
    defaultCounterPressing: false,
    defaultTransitionSpeed: 68,
    defaultCompactness: 95,
  },
  highPress: {
    id: 'highPress',
    name: 'High Press',
    philosophy: 'Apply pressure high up the pitch to prevent opponents from building attacks comfortably.',
    strengths: [
      'Disrupts possession-based teams.',
      'Forces mistakes in dangerous areas.',
      'Can restrict opposition build-up.',
      'Creates opportunities through pressing traps.',
    ],
    weaknesses: [
      'Vulnerable to long balls over the defensive line.',
      'Consumes substantial stamina.',
      'Can expose defenders to fast attackers.',
      'Requires coordinated pressing and defensive positioning.',
    ],
    neutralAgainst: ['gegenpress', 'wingPlay', 'parkTheBus', 'catenaccio', 'totalFootball', 'midBlock', 'balanced'],
    staminaDrainFactor: 1.34,
    defaultPressing: 'high',
    defaultDefensiveLine: 'high',
    defaultWidth: 60,
    defaultTempo: 78,
    defaultDirectness: 58,
    defaultCounterPressing: true,
    defaultTransitionSpeed: 80,
    defaultCompactness: 66,
  },
  longBall: {
    id: 'longBall',
    name: 'Long Ball',
    philosophy: 'Move the ball quickly into advanced areas using direct passes and aerial targets.',
    strengths: [
      'Bypasses high pressing.',
      'Exploits advanced defensive lines.',
      'Makes use of physically strong forwards.',
      'Creates second-ball opportunities.',
    ],
    weaknesses: [
      'Vulnerable to teams with strong aerial defenders and deep cover.',
      'Frequently surrenders possession.',
      'Less effective without physical forwards and midfield support.',
      'Can isolate attackers.',
    ],
    neutralAgainst: ['tikiTaka', 'directCounter', 'parkTheBus', 'possession', 'totalFootball', 'balanced'],
    staminaDrainFactor: 1.06,
    defaultPressing: 'medium',
    defaultDefensiveLine: 'deep',
    defaultWidth: 64,
    defaultTempo: 80,
    defaultDirectness: 92,
    defaultCounterPressing: false,
    defaultTransitionSpeed: 84,
    defaultCompactness: 72,
  },
  possession: {
    id: 'possession',
    name: 'Possession Football',
    philosophy: 'Control the match through patient circulation, positional discipline and territorial dominance.',
    strengths: [
      'Controls match rhythm.',
      'Wears down compact defensive structures.',
      'Reduces opponent attacking opportunities.',
      'Conserves energy when executed well.',
    ],
    weaknesses: [
      'Vulnerable to intense high pressing.',
      'Can become slow or overly cautious.',
      'Vulnerable to quick counter-attacks after turnovers.',
      'Requires composure and passing accuracy.',
    ],
    neutralAgainst: ['tikiTaka', 'wingPlay', 'longBall', 'totalFootball', 'midBlock', 'balanced'],
    staminaDrainFactor: 0.94,
    defaultPressing: 'medium',
    defaultDefensiveLine: 'standard',
    defaultWidth: 58,
    defaultTempo: 48,
    defaultDirectness: 30,
    defaultCounterPressing: true,
    defaultTransitionSpeed: 48,
    defaultCompactness: 70,
  },
  catenaccio: {
    id: 'catenaccio',
    name: 'Catenaccio',
    philosophy: 'Structured defensive organisation with strong cover, disciplined marking and calculated counter-attacks.',
    strengths: [
      'Strong defensive protection.',
      'Neutralises direct central attacks.',
      'Provides defensive cover behind markers.',
      'Effective when protecting narrow advantages.',
    ],
    weaknesses: [
      'Vulnerable to fluid positional rotations.',
      'Struggles against wide overloads and constant movement.',
      'Limited attacking presence if transitions fail.',
      'Requires disciplined defenders.',
    ],
    neutralAgainst: ['gegenpress', 'parkTheBus', 'highPress', 'midBlock', 'balanced'],
    staminaDrainFactor: 0.92,
    defaultPressing: 'low',
    defaultDefensiveLine: 'deep',
    defaultWidth: 38,
    defaultTempo: 46,
    defaultDirectness: 68,
    defaultCounterPressing: false,
    defaultTransitionSpeed: 74,
    defaultCompactness: 90,
  },
  totalFootball: {
    id: 'totalFootball',
    name: 'Total Football',
    philosophy: 'Fluid positional interchange where players can cover multiple tactical responsibilities.',
    strengths: [
      'Creates unpredictable movement.',
      'Pulls rigid defensive structures out of shape.',
      'Allows dynamic overloads.',
      'Difficult to mark man-for-man.',
    ],
    weaknesses: [
      'Vulnerable to disciplined counter-attacks if structure is lost.',
      'Requires high tactical intelligence, versatility and synergy.',
      'Demands strong stamina and positional awareness.',
      'Risky when used by poorly coordinated squads.',
    ],
    neutralAgainst: ['tikiTaka', 'wingPlay', 'highPress', 'longBall', 'possession', 'balanced'],
    staminaDrainFactor: 1.28,
    defaultPressing: 'high',
    defaultDefensiveLine: 'high',
    defaultWidth: 68,
    defaultTempo: 76,
    defaultDirectness: 46,
    defaultCounterPressing: true,
    defaultTransitionSpeed: 78,
    defaultCompactness: 64,
  },
  midBlock: {
    id: 'midBlock',
    name: 'Mid Block',
    philosophy: 'Maintain a compact, organised structure in the middle third while controlling central spaces.',
    strengths: [
      'Balances defence and transition.',
      'Limits central passing lanes.',
      'Conserves more stamina than constant high pressing.',
      'Effective against wide and predictable build-up.',
    ],
    weaknesses: [
      'Can be stretched by patient possession and quick switches of play.',
      'Less aggressive at winning the ball high.',
      'Can be pushed deep by technically superior opponents.',
      'Requires midfield discipline.',
    ],
    neutralAgainst: ['gegenpress', 'tikiTaka', 'parkTheBus', 'highPress', 'possession', 'catenaccio', 'balanced'],
    staminaDrainFactor: 0.95,
    defaultPressing: 'medium',
    defaultDefensiveLine: 'standard',
    defaultWidth: 48,
    defaultTempo: 55,
    defaultDirectness: 52,
    defaultCounterPressing: false,
    defaultTransitionSpeed: 64,
    defaultCompactness: 80,
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced Football',
    philosophy: 'Flexible, adaptable approach balancing defensive stability, possession and attacking transitions.',
    strengths: [
      'No extreme tactical weakness.',
      'Adaptable during matches.',
      'Suitable for mixed squads.',
      'Allows smooth tactical transitions.',
    ],
    weaknesses: [
      'No specialized tactical dominance.',
      'Can be outperformed by well-executed specialist systems.',
      'Relies heavily on player quality and in-match management.',
    ],
    neutralAgainst: [
      'gegenpress',
      'tikiTaka',
      'directCounter',
      'wingPlay',
      'parkTheBus',
      'highPress',
      'longBall',
      'possession',
      'catenaccio',
      'totalFootball',
      'midBlock',
      'balanced',
    ],
    staminaDrainFactor: 1.0,
    defaultPressing: 'medium',
    defaultDefensiveLine: 'standard',
    defaultWidth: 50,
    defaultTempo: 55,
    defaultDirectness: 50,
    defaultCounterPressing: false,
    defaultTransitionSpeed: 55,
    defaultCompactness: 60,
  },
};

/**
 * Exact 12 x 12 Tactical Counter Matrix from Section 2.
 * Row = Team A style, Column = Team B style.
 * Balanced Football has NO automatic predetermined advantage or disadvantage.
 */
export const DEFAULT_TACTICAL_COUNTER_MATRIX: Record<
  TacticalPlayingStyle,
  Record<TacticalPlayingStyle, TacticalMatchupOutcome>
> = {
  gegenpress: {
    gegenpress: 'Neutral',
    tikiTaka: 'Strong',
    directCounter: 'Weak',
    wingPlay: 'Neutral',
    parkTheBus: 'Neutral',
    highPress: 'Neutral',
    longBall: 'Weak',
    possession: 'Strong',
    catenaccio: 'Neutral',
    totalFootball: 'Strong',
    midBlock: 'Neutral',
    balanced: 'Neutral',
  },
  tikiTaka: {
    gegenpress: 'Weak',
    tikiTaka: 'Neutral',
    directCounter: 'Neutral',
    wingPlay: 'Neutral',
    parkTheBus: 'Strong',
    highPress: 'Weak',
    longBall: 'Neutral',
    possession: 'Neutral',
    catenaccio: 'Strong',
    totalFootball: 'Neutral',
    midBlock: 'Neutral',
    balanced: 'Neutral',
  },
  directCounter: {
    gegenpress: 'Strong',
    tikiTaka: 'Neutral',
    directCounter: 'Neutral',
    wingPlay: 'Neutral',
    parkTheBus: 'Weak',
    highPress: 'Strong',
    longBall: 'Neutral',
    possession: 'Strong',
    catenaccio: 'Weak',
    totalFootball: 'Strong',
    midBlock: 'Weak',
    balanced: 'Neutral',
  },
  wingPlay: {
    gegenpress: 'Neutral',
    tikiTaka: 'Neutral',
    directCounter: 'Neutral',
    wingPlay: 'Neutral',
    parkTheBus: 'Strong',
    highPress: 'Neutral',
    longBall: 'Weak',
    possession: 'Neutral',
    catenaccio: 'Strong',
    totalFootball: 'Neutral',
    midBlock: 'Weak',
    balanced: 'Neutral',
  },
  parkTheBus: {
    gegenpress: 'Neutral',
    tikiTaka: 'Weak',
    directCounter: 'Strong',
    wingPlay: 'Weak',
    parkTheBus: 'Neutral',
    highPress: 'Neutral',
    longBall: 'Neutral',
    possession: 'Weak',
    catenaccio: 'Neutral',
    totalFootball: 'Weak',
    midBlock: 'Neutral',
    balanced: 'Neutral',
  },
  highPress: {
    gegenpress: 'Neutral',
    tikiTaka: 'Strong',
    directCounter: 'Weak',
    wingPlay: 'Neutral',
    parkTheBus: 'Neutral',
    highPress: 'Neutral',
    longBall: 'Weak',
    possession: 'Strong',
    catenaccio: 'Neutral',
    totalFootball: 'Neutral',
    midBlock: 'Neutral',
    balanced: 'Neutral',
  },
  longBall: {
    gegenpress: 'Strong',
    tikiTaka: 'Neutral',
    directCounter: 'Neutral',
    wingPlay: 'Strong',
    parkTheBus: 'Neutral',
    highPress: 'Strong',
    longBall: 'Neutral',
    possession: 'Neutral',
    catenaccio: 'Weak',
    totalFootball: 'Neutral',
    midBlock: 'Weak',
    balanced: 'Neutral',
  },
  possession: {
    gegenpress: 'Weak',
    tikiTaka: 'Neutral',
    directCounter: 'Weak',
    wingPlay: 'Neutral',
    parkTheBus: 'Strong',
    highPress: 'Weak',
    longBall: 'Neutral',
    possession: 'Neutral',
    catenaccio: 'Strong',
    totalFootball: 'Neutral',
    midBlock: 'Neutral',
    balanced: 'Neutral',
  },
  catenaccio: {
    gegenpress: 'Neutral',
    tikiTaka: 'Weak',
    directCounter: 'Strong',
    wingPlay: 'Weak',
    parkTheBus: 'Neutral',
    highPress: 'Neutral',
    longBall: 'Strong',
    possession: 'Weak',
    catenaccio: 'Neutral',
    totalFootball: 'Weak',
    midBlock: 'Neutral',
    balanced: 'Neutral',
  },
  totalFootball: {
    gegenpress: 'Weak',
    tikiTaka: 'Neutral',
    directCounter: 'Weak',
    wingPlay: 'Neutral',
    parkTheBus: 'Strong',
    highPress: 'Neutral',
    longBall: 'Neutral',
    possession: 'Neutral',
    catenaccio: 'Strong',
    totalFootball: 'Neutral',
    midBlock: 'Strong',
    balanced: 'Neutral',
  },
  midBlock: {
    gegenpress: 'Neutral',
    tikiTaka: 'Neutral',
    directCounter: 'Strong',
    wingPlay: 'Strong',
    parkTheBus: 'Neutral',
    highPress: 'Neutral',
    longBall: 'Strong',
    possession: 'Neutral',
    catenaccio: 'Neutral',
    totalFootball: 'Weak',
    midBlock: 'Neutral',
    balanced: 'Neutral',
  },
  balanced: {
    gegenpress: 'Neutral',
    tikiTaka: 'Neutral',
    directCounter: 'Neutral',
    wingPlay: 'Neutral',
    parkTheBus: 'Neutral',
    highPress: 'Neutral',
    longBall: 'Neutral',
    possession: 'Neutral',
    catenaccio: 'Neutral',
    totalFootball: 'Neutral',
    midBlock: 'Neutral',
    balanced: 'Neutral',
  },
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Resolves a club's canonical 12-style philosophy from TacticsConfig,
 * preserving 100% compatibility with existing saves and tests.
 */
export function resolveTacticalPlayingStyle(tactics: TacticsConfig): TacticalPlayingStyle {
  if (tactics.playingStyle && tactics.playingStyle in TACTICAL_STYLES_CATALOG) {
    return tactics.playingStyle;
  }
  if (tactics.attackingStyle && tactics.attackingStyle in TACTICAL_STYLES_CATALOG) {
    return tactics.attackingStyle;
  }
  return 'balanced';
}

export const resolvePlayingStyle = resolveTacticalPlayingStyle;

/**
 * Applies a core playing style's recommended tactical instructions while allowing
 * manager customization.
 */
export function applyPlayingStyleDefaults(
  current: TacticsConfig,
  style: TacticalPlayingStyle
): TacticsConfig {
  const def = TACTICAL_STYLES_CATALOG[style];
  return {
    ...current,
    attackingStyle: style,
    playingStyle: style,
    pressing: def.defaultPressing,
    defensiveLine: def.defaultDefensiveLine,
    width: def.defaultWidth,
    tempo: def.defaultTempo,
    directness: def.defaultDirectness,
    counterPressing: def.defaultCounterPressing,
    transitionSpeed: def.defaultTransitionSpeed,
    defensiveCompactness: def.defaultCompactness,
  };
}

/**
 * Resolves all 55 detailed player attributes (Technical, Physical, Mental, Defensive, Goalkeeping)
 * on a 0..100 scale from the player's core attributes, age, and personality.
 */
export function resolveExtendedPlayerAttributes(player: Player): ExtendedPlayerAttributes {
  const a = player.attributes;
  const personalityBonus =
    player.personality === 'ModelProfessional' || player.personality === 'Leader'
      ? 4
      : player.personality === 'TeamPlayer'
      ? 2
      : player.personality === 'Temperamental'
      ? -3
      : 0;

  return {
    ...a,
    // Technical extensions
    shortPassing: clamp(Math.round(a.passing * 0.65 + a.firstTouch * 0.25 + a.vision * 0.1), 1, 100),
    longPassing: clamp(Math.round(a.passing * 0.6 + a.vision * 0.25 + a.crossing * 0.15), 1, 100),
    throughBalls: clamp(Math.round(a.vision * 0.5 + a.passing * 0.35 + a.decisions * 0.15), 1, 100),
    setPieces: clamp(Math.round(a.freeKicks * 0.6 + a.crossing * 0.25 + a.shooting * 0.15), 1, 100),
    technique: clamp(Math.round(a.ballControl * 0.45 + a.firstTouch * 0.35 + a.dribbling * 0.2), 1, 100),
    curve: clamp(Math.round(a.freeKicks * 0.45 + a.crossing * 0.35 + a.longShots * 0.2), 1, 100),
    // Physical extensions
    sprintSpeed: clamp(Math.round(a.pace * 0.75 + a.acceleration * 0.25), 1, 100),
    naturalFitness: clamp(
      Math.round(a.stamina * 0.65 + a.balance * 0.2 + (player.age <= 27 ? 12 : player.age >= 33 ? 4 : 8)),
      25,
      99
    ),
    recovery: clamp(
      Math.round(a.stamina * 0.55 + (player.age <= 24 ? 28 : player.age <= 29 ? 20 : 10) + personalityBonus),
      25,
      99
    ),
    // Mental extensions
    concentration: clamp(Math.round(a.composure * 0.45 + a.decisions * 0.35 + a.positioning * 0.2 + personalityBonus), 1, 100),
    determination: clamp(Math.round(a.workRate * 0.45 + a.aggression * 0.25 + a.leadership * 0.3 + personalityBonus), 1, 100),
    teamwork: clamp(Math.round(a.workRate * 0.5 + a.passing * 0.25 + a.decisions * 0.25 + personalityBonus), 1, 100),
    offTheBall: clamp(Math.round(a.positioning * 0.45 + a.anticipation * 0.35 + a.acceleration * 0.2), 1, 100),
    bravery: clamp(Math.round(a.aggression * 0.5 + a.strength * 0.3 + a.heading * 0.2), 1, 100),
    tacticalIntelligence: clamp(Math.round(a.decisions * 0.4 + a.vision * 0.3 + a.positioning * 0.3), 1, 100),
    consistency: clamp(Math.round(a.composure * 0.5 + a.workRate * 0.3 + a.decisions * 0.2 + personalityBonus), 1, 100),
    // Defensive extensions
    interceptions: clamp(Math.round(a.anticipation * 0.45 + a.marking * 0.3 + a.positioning * 0.25), 1, 100),
    defensivePositioning: clamp(Math.round(a.positioning * 0.5 + a.marking * 0.35 + a.decisions * 0.15), 1, 100),
    defensiveAwareness: clamp(Math.round(a.marking * 0.45 + a.anticipation * 0.35 + a.tackling * 0.2), 1, 100),
    slidingTackles: clamp(Math.round(a.tackling * 0.65 + a.agility * 0.2 + a.aggression * 0.15), 1, 100),
    // Goalkeeping extensions
    oneOnOnes: clamp(Math.round(a.reflexes * 0.45 + a.composure * 0.3 + a.agility * 0.25), 1, 100),
    commandOfArea: clamp(Math.round(a.aerialAbility * 0.5 + a.handling * 0.3 + a.leadership * 0.2), 1, 100),
    communication: clamp(Math.round(a.leadership * 0.5 + a.gkPositioning * 0.3 + a.distribution * 0.2), 1, 100),
    kicking: clamp(Math.round(a.distribution * 0.65 + a.passing * 0.35), 1, 100),
  };
}

/**
 * Resolves a manager's 8 core attributes on a 0..100 scale.
 */
export function resolveManagerAttributes(
  clubReputation: number = 70,
  explicit?: ManagerAttributes
): ManagerAttributes {
  if (explicit) return explicit;
  const base = clamp(Math.round(clubReputation * 0.85 + 10), 45, 94);
  return {
    tacticalIntelligence: base,
    tacticalAdaptability: clamp(base - 1, 40, 95),
    manManagement: clamp(base + 1, 40, 95),
    motivationalAbility: base,
    trainingQuality: clamp(base - 2, 40, 95),
    playerDevelopment: clamp(base - 1, 40, 95),
    matchPreparation: base,
    tacticalFlexibility: clamp(base + 1, 40, 95),
  };
}

const ADJACENT_POSITION_GROUPS: Record<PositionCode, PositionCode[]> = {
  GK: [],
  CB: ['CDM', 'RB', 'LB'],
  RB: ['LB', 'CB', 'RW', 'CDM'],
  LB: ['RB', 'CB', 'LW', 'CDM'],
  CDM: ['CM', 'CB', 'RB', 'LB'],
  CM: ['CDM', 'CAM', 'RW', 'LW'],
  CAM: ['CM', 'RW', 'LW', 'ST'],
  RW: ['LW', 'CAM', 'ST', 'RB'],
  LW: ['RW', 'CAM', 'ST', 'LB'],
  ST: ['CAM', 'RW', 'LW'],
};

export interface PositionalSuitabilityEvaluation {
  playerId: string;
  naturalPosition: PositionCode;
  assignedPosition: PositionCode;
  familiarityScore: number; // 0..100
  isNatural: boolean;
  isSecondary: boolean;
  isBoosterUnlocked: boolean;
  boosterTypeUsed?: 'season_position' | 'temporary_position';
  chemistryPenaltyPoints: number; // 0..38 subtracted from individual/partnership chemistry
  tacticalExecutionMultiplier: number; // 0.62..1.02
  summaryLabel: 'Natural' | 'Familiar' | 'Boosted' | 'Adjacent Adaptation' | 'Severe Out-of-Position';
}

/**
 * Evaluates a player's suitability for an assigned pitch position, accounting for:
 * - Natural position (100% familiarity, 0 penalty)
 * - Secondary positions & learned familiarity (>=80% familiarity, 0 penalty when moving between familiar positions)
 * - Active Season Position Booster (1-season duration) or Temporary Position Booster (3-match duration)
 * - Compatible/adjacent positions (moderate penalty)
 * - Incompatible positions (e.g. ST at CB or outfielder at GK -> severe penalty)
 */
export function evaluateDetailedPositionalSuitability(
  player: Player,
  assignedPosition: PositionCode,
  activePositionBoosters: ActivePositionBooster[] = [],
  currentSeason?: number
): PositionalSuitabilityEvaluation {
  const learned = player.positionalFamiliarity?.[assignedPosition] ?? 0;

  if (player.primaryPosition === assignedPosition) {
    return {
      playerId: player.id,
      naturalPosition: player.primaryPosition,
      assignedPosition,
      familiarityScore: 100,
      isNatural: true,
      isSecondary: false,
      isBoosterUnlocked: false,
      chemistryPenaltyPoints: 0,
      tacticalExecutionMultiplier: 1.0,
      summaryLabel: 'Natural',
    };
  }

  // Check active Season or Temporary Position Boosters
  const matchingBooster = activePositionBoosters.find(
    (b) =>
      b.playerId === player.id &&
      b.unlockedPosition === assignedPosition &&
      b.status === 'active' &&
      (b.boosterType === 'season_position'
        ? currentSeason === undefined || b.expiresAtEndOfSeason === undefined || currentSeason <= b.expiresAtEndOfSeason
        : (b.remainingMatches ?? 0) > 0)
  );

  if (matchingBooster) {
    const score = clamp(Math.max(learned, matchingBooster.familiarityGranted || 92), 85, 98);
    return {
      playerId: player.id,
      naturalPosition: player.primaryPosition,
      assignedPosition,
      familiarityScore: score,
      isNatural: false,
      isSecondary: player.secondaryPositions.includes(assignedPosition),
      isBoosterUnlocked: true,
      boosterTypeUsed: matchingBooster.boosterType,
      chemistryPenaltyPoints: 0,
      tacticalExecutionMultiplier: 0.99,
      summaryLabel: 'Boosted',
    };
  }

  // Secondary position or already-learned familiar position (>= 80) -> NO chemistry penalty
  if (player.secondaryPositions.includes(assignedPosition) || learned >= 80) {
    const score = clamp(Math.max(86, learned), 80, 96);
    return {
      playerId: player.id,
      naturalPosition: player.primaryPosition,
      assignedPosition,
      familiarityScore: score,
      isNatural: false,
      isSecondary: true,
      isBoosterUnlocked: false,
      chemistryPenaltyPoints: 0,
      tacticalExecutionMultiplier: 0.98,
      summaryLabel: 'Familiar',
    };
  }

  // Adjacent / compatible position (e.g. RW at LW, CDM at CM)
  const isAdjacent = ADJACENT_POSITION_GROUPS[player.primaryPosition]?.includes(assignedPosition) ?? false;
  if (isAdjacent) {
    const baseFam = Math.max(58, learned);
    const penalty = Math.max(2, Math.round((80 - baseFam) * 0.45)); // ~10 points penalty
    return {
      playerId: player.id,
      naturalPosition: player.primaryPosition,
      assignedPosition,
      familiarityScore: baseFam,
      isNatural: false,
      isSecondary: false,
      isBoosterUnlocked: false,
      chemistryPenaltyPoints: penalty,
      tacticalExecutionMultiplier: clamp(0.88 + (baseFam - 58) * 0.004, 0.85, 0.96),
      summaryLabel: 'Adjacent Adaptation',
    };
  }

  // Incompatible / Severe out-of-position (e.g. ST at CB, GK outfield)
  const isGkMismatch = player.primaryPosition === 'GK' || assignedPosition === 'GK';
  const baseFam = isGkMismatch ? Math.max(10, learned) : Math.max(22, learned);
  const severePenalty = isGkMismatch ? 38 : Math.max(18, Math.round((80 - baseFam) * 0.52)); // ~30 points penalty
  return {
    playerId: player.id,
    naturalPosition: player.primaryPosition,
    assignedPosition,
    familiarityScore: baseFam,
    isNatural: false,
    isSecondary: false,
    isBoosterUnlocked: false,
    chemistryPenaltyPoints: severePenalty,
    tacticalExecutionMultiplier: isGkMismatch ? 0.58 : clamp(0.68 + (baseFam - 22) * 0.004, 0.66, 0.84),
    summaryLabel: 'Severe Out-of-Position',
  };
}

/**
 * Progresses a player's positional familiarity when they play or train in a non-natural position.
 */
export function progressPositionalFamiliarity(
  player: Player,
  playedPosition: PositionCode,
  minutesPlayed: number,
  fromTraining: boolean = false
): Player {
  if (player.primaryPosition === playedPosition) return player;
  const currentMap = { ...(player.positionalFamiliarity ?? {}) };
  const isSecondary = player.secondaryPositions.includes(playedPosition);
  const isAdjacent = ADJACENT_POSITION_GROUPS[player.primaryPosition]?.includes(playedPosition) ?? false;
  const baseStart = isSecondary ? 84 : isAdjacent ? 58 : 22;
  const currentVal = currentMap[playedPosition] ?? baseStart;

  const ext = resolveExtendedPlayerAttributes(player);
  const iqFactor = 0.75 + ext.tacticalIntelligence / 200; // 0.8..1.25
  const rawGain = fromTraining
    ? 1.4 * iqFactor
    : clamp(minutesPlayed / 90, 0.2, 1.0) * (isAdjacent ? 3.2 : 2.2) * iqFactor;

  const nextVal = clamp( Number((currentVal + rawGain).toFixed(2)), 0, 96);
  currentMap[playedPosition] = nextVal;

  // Once a player reaches >= 82 familiarity in an unfamiliar position, add it to secondaryPositions if not present
  const updatedSecondaries =
    nextVal >= 82 && !player.secondaryPositions.includes(playedPosition)
      ? [...player.secondaryPositions, playedPosition]
      : player.secondaryPositions;

  return {
    ...player,
    positionalFamiliarity: currentMap,
    secondaryPositions: updatedSecondaries,
  };
}

export interface StaminaFatigueTickResult {
  staminaRemaining: number; // 0..100
  fatigueAccumulated: number; // 0..100
  effectiveAttributeMultiplier: number; // 0.72..1.0
  sprintSpeedMultiplier: number; // 0.68..1.0
  concentrationMultiplier: number; // 0.65..1.0
  injuryProbabilityMultiplier: number; // 1.0..3.2
}

/**
 * Computes in-match stamina drain and effective performance penalties for a player at a given minute.
 * Separate Stamina (immediate in-match energy) and Accumulated Fatigue (persisting exhaustion).
 */
export function evaluatePlayerInMatchPhysicalState(
  player: Player,
  playingStyle: TacticalPlayingStyle,
  minute: number,
  config?: BalanceConfiguration
): StaminaFatigueTickResult {
  const ext = resolveExtendedPlayerAttributes(player);
  const styleDef = TACTICAL_STYLES_CATALOG[playingStyle] ?? TACTICAL_STYLES_CATALOG.balanced;
  const globalDrainMult = config?.staminaDrainMultiplier ?? 1.0;

  const initialFatigue = clamp(player.fatigue ?? Math.max(0, 100 - player.fitness), 0, 100);
  const startingStaminaCap = clamp((player.stamina ?? player.fitness) - initialFatigue * 0.35, 35, 100);

  // Role workload factor
  const role = player.tacticalRole;
  const roleWorkload =
    role === 'BoxToBox' || role === 'Wingback' || role === 'AttackingFullback' || role === 'BallWinningMidfielder'
      ? 1.15
      : role === 'SweeperKeeper' || role === 'ShotStopper' || player.primaryPosition === 'GK'
      ? 0.32
      : role === 'Poacher' || role === 'AnchorMan'
      ? 0.92
      : 1.0;

  // Stamina attribute & age mitigation
  const staminaResistance = 1.28 - (aOrDefault(player.attributes.stamina, 70) / 100) * 0.48; // 0.80..1.28
  const ageDrainFactor = player.age >= 33 ? 1.16 : player.age >= 30 ? 1.08 : 1.0;

  const totalMatchDrainAt90 =
    34 *
    styleDef.staminaDrainFactor *
    roleWorkload *
    staminaResistance *
    ageDrainFactor *
    globalDrainMult;

  const currentDrain = ( clamp(minute, 0, 120) / 90 ) * totalMatchDrainAt90;
  const staminaRemaining = clamp(Number((startingStaminaCap - currentDrain).toFixed(1)), 5, 100);

  // Fatigue added so far in the match
  const fatigueAdded = (currentDrain * 0.42) * (1.2 - ext.naturalFitness / 250);
  const fatigueAccumulated = clamp(Number((initialFatigue + fatigueAdded).toFixed(1)), 0, 100);

  // Performance penalties when Stamina drops or Fatigue is high
  const lowStaminaPenalty = staminaRemaining < 55 ? (55 - staminaRemaining) / 160 : 0; // up to ~0.31
  const highFatiguePenalty = fatigueAccumulated > 35 ? (fatigueAccumulated - 35) / 220 : 0; // up to ~0.29

  const effectiveAttributeMultiplier = clamp(1.0 - lowStaminaPenalty * 0.55 - highFatiguePenalty * 0.5, 0.72, 1.0);
  const sprintSpeedMultiplier = clamp(1.0 - lowStaminaPenalty * 0.7 - highFatiguePenalty * 0.55, 0.68, 1.0);
  const concentrationMultiplier = clamp(1.0 - lowStaminaPenalty * 0.65 - highFatiguePenalty * 0.65, 0.65, 1.0);
  const injuryProbabilityMultiplier = clamp(
    1.0 + Math.max(0, (55 - staminaRemaining) * 0.025) + Math.max(0, (fatigueAccumulated - 30) * 0.028),
    1.0,
    3.5
  );

  return {
    staminaRemaining,
    fatigueAccumulated,
    effectiveAttributeMultiplier,
    sprintSpeedMultiplier,
    concentrationMultiplier,
    injuryProbabilityMultiplier,
  };
}

function aOrDefault(val: number | undefined, fallback: number): number {
  return typeof val === 'number' && !Number.isNaN(val) ? val : fallback;
}

/**
 * Calculates a team's Formation Compatibility score (0..100) for a given playing style.
 */
export function evaluateFormationStyleCompatibility(
  formation: FormationCode,
  style: TacticalPlayingStyle
): number {
  const map: Partial<Record<TacticalPlayingStyle, Partial<Record<FormationCode, number>>>> = {
    gegenpress: { '4-3-3': 92, '4-2-3-1': 90, '4-2-2-2': 88, '3-4-3': 85, '5-4-1': 55 },
    tikiTaka: { '4-3-3': 95, '3-4-3': 90, '4-2-3-1': 86, '4-1-4-1': 84, '5-3-2': 60 },
    directCounter: { '4-4-2': 90, '4-2-3-1': 88, '3-5-2': 86, '5-3-2': 85, '4-3-1-2': 84 },
    wingPlay: { '4-3-3': 92, '3-4-3': 90, '4-4-2': 88, '4-2-3-1': 86, '4-3-1-2': 58 },
    parkTheBus: { '5-4-1': 96, '5-3-2': 92, '4-1-4-1': 88, '4-4-2': 84, '3-4-3': 55 },
    highPress: { '4-3-3': 92, '4-2-3-1': 89, '3-4-3': 88, '4-2-2-2': 86, '5-4-1': 56 },
    longBall: { '4-4-2': 94, '3-5-2': 89, '5-3-2': 86, '4-3-1-2': 84, '4-3-3': 70 },
    possession: { '4-3-3': 92, '4-2-3-1': 90, '4-1-4-1': 88, '3-5-2': 84, '4-4-2': 72 },
    catenaccio: { '5-3-2': 95, '5-4-1': 93, '3-5-2': 88, '4-1-4-1': 84, '3-4-3': 58 },
    totalFootball: { '4-3-3': 95, '3-4-3': 94, '4-2-3-1': 86, '5-4-1': 54 },
    midBlock: { '4-4-2': 92, '4-1-4-1': 91, '4-2-3-1': 88, '3-5-2': 85, '4-3-1-2': 82 },
    balanced: {
      '4-3-3': 86,
      '4-2-3-1': 86,
      '4-4-2': 86,
      '3-5-2': 85,
      '3-4-3': 84,
      '4-1-4-1': 85,
      '5-3-2': 84,
      '4-3-1-2': 84,
      '4-2-2-2': 84,
      '5-4-1': 83,
    },
  };
  return map[style]?.[formation] ?? 78;
}

/**
 * Exact Section 8 Tactical Adaptation Score formula:
 * Team Synergy (30%) + Positional Unit Synergy (25%) + Tactical Familiarity (25%)
 * + Formation Compatibility (10%) + Manager Adaptability (10%),
 * plus stamina/fatigue physical readiness adjustment.
 */
export function calculateTacticalAdaptationScore(params: {
  teamSynergy: number;
  positionalUnitSynergy: number;
  tacticalFamiliarity: number;
  formationCompatibility: number;
  managerAdaptability: number;
  avgStamina?: number;
  avgFatigue?: number;
}): {
  score: number;
  transitionReadiness: 'Smooth' | 'Moderate' | 'Disorganized';
  disorganizationRiskPct: number;
} {
  const baseScore =
    params.teamSynergy * 0.30 +
    params.positionalUnitSynergy * 0.25 +
    params.tacticalFamiliarity * 0.25 +
    params.formationCompatibility * 0.10 +
    params.managerAdaptability * 0.10;

  const stamina = params.avgStamina ?? 85;
  const fatigue = params.avgFatigue ?? 10;
  const physicalMod = (stamina - 70) * 0.08 - Math.max(0, fatigue - 25) * 0.12;

  const score = clamp(Number((baseScore + physicalMod).toFixed(1)), 15, 100);
  const transitionReadiness =
    score >= 74 ? 'Smooth' : score >= 52 ? 'Moderate' : 'Disorganized';
  const disorganizationRiskPct = clamp(Math.round(Math.max(2, (88 - score) * 0.65)), 2, 55);

  return {
    score,
    transitionReadiness,
    disorganizationRiskPct,
  };
}

export interface TacticalMatchupEvaluation {
  teamAStyle: TacticalPlayingStyle;
  teamBStyle: TacticalPlayingStyle;
  teamAOutcome: TacticalMatchupOutcome;
  teamBOutcome: TacticalMatchupOutcome;
  /** Situational tactical modifier in percent, e.g. +5.0%, 0%, -5.0% scaled by execution */
  teamASituationalModifierPct: number;
  teamBSituationalModifierPct: number;
  teamAAdaptationScore: number;
  teamBAdaptationScore: number;
  teamAPressingSuccessBonus: number;
  teamBPressingSuccessBonus: number;
  teamATransitionThreatBonus: number;
  teamBTransitionThreatBonus: number;
  teamAPassAccuracyBonus: number;
  teamBPassAccuracyBonus: number;
  matchupHeadline: string;
  keyBattleNotes: string[];
}

/**
 * Evaluates the tactical matchup between two teams using the 12x12 Tactical Counter Matrix,
 * team execution quality, positional suitability, synergy, and manager intelligence.
 */
export function evaluateTacticalMatchup(params: {
  homeClub: Club;
  awayClub: Club;
  homePlayers: Player[];
  awayPlayers: Player[];
  homeSynergyScore?: number;
  awaySynergyScore?: number;
  homeChemistryScore?: number;
  awayChemistryScore?: number;
  homeManager?: ManagerAttributes;
  awayManager?: ManagerAttributes;
  config?: BalanceConfiguration;
}): TacticalMatchupEvaluation {
  const homeStyle = resolveTacticalPlayingStyle(params.homeClub.tactics);
  const awayStyle = resolveTacticalPlayingStyle(params.awayClub.tactics);

  const homeOutcome = DEFAULT_TACTICAL_COUNTER_MATRIX[homeStyle]?.[awayStyle] ?? 'Neutral';
  const awayOutcome = DEFAULT_TACTICAL_COUNTER_MATRIX[awayStyle]?.[homeStyle] ?? 'Neutral';

  const strongPct = params.config?.tacticalStrongAdvantagePct ?? 5.0;
  const weakPct = params.config?.tacticalWeakDisadvantagePct ?? -5.0;

  const homeMgr = resolveManagerAttributes(params.homeClub.reputation, params.homeManager);
  const awayMgr = resolveManagerAttributes(params.awayClub.reputation, params.awayManager);

  const homeFormCompat = evaluateFormationStyleCompatibility(params.homeClub.tactics.formation, homeStyle);
  const awayFormCompat = evaluateFormationStyleCompatibility(params.awayClub.tactics.formation, awayStyle);

  const homeSynergy = params.homeSynergyScore ?? 68;
  const awaySynergy = params.awaySynergyScore ?? 68;
  const homeChem = params.homeChemistryScore ?? 68;
  const awayChem = params.awayChemistryScore ?? 68;

  const homeAdapt = calculateTacticalAdaptationScore({
    teamSynergy: homeSynergy,
    positionalUnitSynergy: homeSynergy,
    tacticalFamiliarity: (homeChem + homeFormCompat) / 2,
    formationCompatibility: homeFormCompat,
    managerAdaptability: homeMgr.tacticalAdaptability + (homeStyle === 'balanced' ? 8 : 0),
  });

  const awayAdapt = calculateTacticalAdaptationScore({
    teamSynergy: awaySynergy,
    positionalUnitSynergy: awaySynergy,
    tacticalFamiliarity: (awayChem + awayFormCompat) / 2,
    formationCompatibility: awayFormCompat,
    managerAdaptability: awayMgr.tacticalAdaptability + (awayStyle === 'balanced' ? 8 : 0),
  });

  // Scale the +5% / -5% matrix modifier by execution quality (0.75..1.20)
  const homeExecScale = clamp(0.75 + (homeAdapt.score - 60) * 0.008 + (homeMgr.tacticalIntelligence - 70) * 0.004, 0.7, 1.25);
  const awayExecScale = clamp(0.75 + (awayAdapt.score - 60) * 0.008 + (awayMgr.tacticalIntelligence - 70) * 0.004, 0.7, 1.25);

  const homeBasePct =
    homeOutcome === 'Strong'
      ? strongPct * homeExecScale
      : homeOutcome === 'Weak'
      ? weakPct / Math.max(0.8, homeExecScale)
      : 0;

  const awayBasePct =
    awayOutcome === 'Strong'
      ? strongPct * awayExecScale
      : awayOutcome === 'Weak'
      ? weakPct / Math.max(0.8, awayExecScale)
      : 0;

  const homeDef = TACTICAL_STYLES_CATALOG[homeStyle];
  const awayDef = TACTICAL_STYLES_CATALOG[awayStyle];

  const keyBattleNotes: string[] = [];
  if (homeOutcome === 'Strong') {
    keyBattleNotes.push(
      `${params.homeClub.shortName}'s ${homeDef.name} counters ${params.awayClub.shortName}'s ${awayDef.name} (+${homeBasePct.toFixed(1)}% situational edge).`
    );
  } else if (awayOutcome === 'Strong') {
    keyBattleNotes.push(
      `${params.awayClub.shortName}'s ${awayDef.name} counters ${params.homeClub.shortName}'s ${homeDef.name} (+${awayBasePct.toFixed(1)}% situational edge).`
    );
  } else {
    keyBattleNotes.push(
      `Neutral tactical matchup (${homeDef.name} vs ${awayDef.name}) — individual ability, synergy, and stamina will decide the contest.`
    );
  }

  return {
    teamAStyle: homeStyle,
    teamBStyle: awayStyle,
    teamAOutcome: homeOutcome,
    teamBOutcome: awayOutcome,
    teamASituationalModifierPct: Number(homeBasePct.toFixed(2)),
    teamBSituationalModifierPct: Number(awayBasePct.toFixed(2)),
    teamAAdaptationScore: homeAdapt.score,
    teamBAdaptationScore: awayAdapt.score,
    teamAPressingSuccessBonus:
      homeStyle === 'gegenpress' || homeStyle === 'highPress' ? 8 + homeBasePct : homeBasePct * 0.5,
    teamBPressingSuccessBonus:
      awayStyle === 'gegenpress' || awayStyle === 'highPress' ? 8 + awayBasePct : awayBasePct * 0.5,
    teamATransitionThreatBonus:
      homeStyle === 'directCounter' || homeStyle === 'longBall' ? 7 + homeBasePct : homeBasePct * 0.5,
    teamBTransitionThreatBonus:
      awayStyle === 'directCounter' || awayStyle === 'longBall' ? 7 + awayBasePct : awayBasePct * 0.5,
    teamAPassAccuracyBonus:
      homeStyle === 'tikiTaka' || homeStyle === 'possession' || homeStyle === 'totalFootball'
        ? 4 + homeBasePct * 0.6
        : homeBasePct * 0.35,
    teamBPassAccuracyBonus:
      awayStyle === 'tikiTaka' || awayStyle === 'possession' || awayStyle === 'totalFootball'
        ? 4 + awayBasePct * 0.6
        : awayBasePct * 0.35,
    matchupHeadline: `${homeDef.name} vs ${awayDef.name}`,
    keyBattleNotes,
  };
}

/**
 * AI Opposition Manager decision-making:
 * Evaluates whether an AI manager should switch playing style before or during a match
 * to counter the opponent or conserve stamina when leading/exhausted.
 */
export function selectOptimalCounterPlayingStyle(
  opponentStyle: TacticalPlayingStyle,
  managerAttrs: ManagerAttributes,
  teamAvgStamina: number = 85,
  scoreDiff: number = 0
): TacticalPlayingStyle {
  // If protecting a lead late with low stamina, smart managers shift to Mid Block, Park the Bus, or Catenaccio
  if (scoreDiff > 0 && teamAvgStamina < 58 && managerAttrs.tacticalIntelligence >= 65) {
    if (DEFAULT_TACTICAL_COUNTER_MATRIX.midBlock[opponentStyle] === 'Strong') return 'midBlock';
    if (DEFAULT_TACTICAL_COUNTER_MATRIX.catenaccio[opponentStyle] === 'Strong') return 'catenaccio';
    return 'midBlock';
  }

  // Find styles that are Strong against opponentStyle
  const strongCounters = TACTICAL_STYLES_LIST.filter(
    (s) => DEFAULT_TACTICAL_COUNTER_MATRIX[s][opponentStyle] === 'Strong'
  );

  // Filter out high-drain styles if squad is already tired
  const viableCounters =
    teamAvgStamina < 62
      ? strongCounters.filter((s) => TACTICAL_STYLES_CATALOG[s].staminaDrainFactor <= 1.15)
      : strongCounters;

  if (viableCounters.length > 0 && managerAttrs.tacticalIntelligence >= 62) {
    return viableCounters[0];
  }

  return 'balanced';
}

/**
 * Recommends intelligent substitutions based on live player stamina, accumulated fatigue,
 * and positional compatibility on the bench.
 */
export function getRecommendedSubstitutions(
  starters: Player[],
  bench: Player[],
  formation: FormationCode,
  minute: number = 65
): {
  subOut: Player;
  subIn: Player;
  slotPosition: PositionCode;
  reason: string;
}[] {
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];
  const recommendations: {
    subOut: Player;
    subIn: Player;
    slotPosition: PositionCode;
    reason: string;
  }[] = [];
  const usedBenchIds = new Set<string>();

  const candidates = starters
    .map((p, idx) => {
      const slotPos = slots[idx]?.position ?? p.primaryPosition;
      const phys = evaluatePlayerInMatchPhysicalState(p, 'balanced', minute);
      return { player: p, slotPos, phys };
    })
    .filter((c) => c.player.primaryPosition !== 'GK')
    .sort((a, b) => a.phys.staminaRemaining - b.phys.staminaRemaining);

  for (const cand of candidates.slice(0, 3)) {
    if (cand.phys.staminaRemaining > 68 && cand.phys.fatigueAccumulated < 45) continue;
    const bestSub = bench
      .filter((b) => !usedBenchIds.has(b.id) && b.injuryWeeks === 0 && b.primaryPosition !== 'GK')
      .sort((a, b) => {
        const suitA = evaluateDetailedPositionalSuitability(a, cand.slotPos).familiarityScore;
        const suitB = evaluateDetailedPositionalSuitability(b, cand.slotPos).familiarityScore;
        return suitB + b.overall * 0.5 - (suitA + a.overall * 0.5);
      })[0];

    if (bestSub) {
      usedBenchIds.add(bestSub.id);
      recommendations.push({
        subOut: cand.player,
        subIn: bestSub,
        slotPosition: cand.slotPos,
        reason: `Stamina at ${Math.round(cand.phys.staminaRemaining)}% (Fatigue ${Math.round(
          cand.phys.fatigueAccumulated
        )}%) — fresh ${cand.slotPos} legs needed.`,
      });
    }
  }

  return recommendations;
}
