import {
  Player,
  PlayerAttributes,
  PlayerPlayStyle,
  PositionCode,
  RatingDataSource,
  WorkRateLevel,
} from '@/engine/types';
import { createPlayStyle } from './playStylesCatalog';
import { SeededRng } from '@/engine/rng';

export interface VerifiedStarProfile {
  fullName: string;
  primaryPosition: PositionCode;
  secondaryPositions: PositionCode[];
  overall: number;
  potential: number;
  weakFoot: number;
  skillMoves: number;
  preferredFoot: 'Right' | 'Left' | 'Both';
  attackingWorkRate: WorkRateLevel;
  defensiveWorkRate: WorkRateLevel;
  traits: string[];
  playStyles: { id: string; tier: 'standard' | 'plus' }[];
  attributes: PlayerAttributes;
}

/**
 * Helper to construct a complete, validated 33-attribute profile with legacy aliases.
 */
function buildFullAttributes(a: {
  // Pace (2)
  acceleration: number;
  sprintSpeed: number;
  // Shooting (6)
  positioning: number;
  finishing: number;
  shotPower: number;
  longShots: number;
  volleys: number;
  penalties: number;
  // Passing (6)
  vision: number;
  crossing: number;
  freeKicks: number;
  shortPassing: number;
  longPassing: number;
  curve: number;
  // Dribbling (6)
  agility: number;
  balance: number;
  reactions: number;
  ballControl: number;
  dribbling: number;
  composure: number;
  // Defending (5)
  interceptions: number;
  headingAccuracy: number;
  defensiveAwareness: number;
  standingTackle: number;
  slidingTackle: number;
  // Physicality (4)
  jumping: number;
  stamina: number;
  strength: number;
  aggression: number;
  // Goalkeeping (5)
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  gkPositioning?: number;
  // Mental / Legacy
  decisions?: number;
  leadership?: number;
  workRate?: number;
}): PlayerAttributes {
  const pace = Math.round((a.acceleration + a.sprintSpeed) / 2);
  const shooting = Math.round((a.finishing * 0.45 + a.shotPower * 0.25 + a.longShots * 0.3));
  const passing = Math.round((a.shortPassing * 0.5 + a.vision * 0.3 + a.longPassing * 0.2));
  const tackling = a.standingTackle;
  const marking = a.defensiveAwareness;
  const heading = a.headingAccuracy;
  const firstTouch = a.ballControl;
  const decisions = a.decisions ?? Math.round((a.vision + a.composure) / 2);
  const leadership = a.leadership ?? 65;
  const workRate = a.workRate ?? Math.round((a.stamina + a.aggression) / 2);
  const anticipation = Math.round((a.positioning + decisions) / 2);

  const diving = a.diving ?? 20;
  const handling = a.handling ?? 20;
  const kicking = a.kicking ?? 20;
  const reflexes = a.reflexes ?? 20;
  const gkPositioning = a.gkPositioning ?? 20;

  return {
    acceleration: a.acceleration,
    sprintSpeed: a.sprintSpeed,
    pace,
    positioning: a.positioning,
    finishing: a.finishing,
    shotPower: a.shotPower,
    longShots: a.longShots,
    volleys: a.volleys,
    penalties: a.penalties,
    shooting,
    vision: a.vision,
    crossing: a.crossing,
    freeKicks: a.freeKicks,
    shortPassing: a.shortPassing,
    longPassing: a.longPassing,
    curve: a.curve,
    passing,
    agility: a.agility,
    balance: a.balance,
    reactions: a.reactions,
    ballControl: a.ballControl,
    dribbling: a.dribbling,
    composure: a.composure,
    firstTouch,
    interceptions: a.interceptions,
    headingAccuracy: a.headingAccuracy,
    heading,
    defensiveAwareness: a.defensiveAwareness,
    marking,
    standingTackle: a.standingTackle,
    slidingTackle: a.slidingTackle,
    tackling,
    jumping: a.jumping,
    stamina: a.stamina,
    strength: a.strength,
    aggression: a.aggression,
    decisions,
    leadership,
    workRate,
    anticipation,
    diving,
    handling,
    kicking,
    reflexes,
    gkPositioning,
    distribution: kicking,
    aerialAbility: Math.round((handling + a.jumping) / 2),
  };
}

/**
 * Authoritative verified EA FC ability profiles for global football superstars.
 */
export const VERIFIED_STAR_PROFILES: Record<string, VerifiedStarProfile> = {
  'Kylian Mbappé': {
    fullName: 'Kylian Mbappé',
    primaryPosition: 'ST',
    secondaryPositions: ['LW'],
    overall: 91,
    potential: 94,
    weakFoot: 4,
    skillMoves: 5,
    preferredFoot: 'Right',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'Low',
    traits: ['Speed Dribbler', 'Outside Foot Shot', 'Chip Shot', 'Flair'],
    playStyles: [
      { id: 'quick_step', tier: 'plus' },
      { id: 'rapid', tier: 'standard' },
      { id: 'finesse_shot', tier: 'standard' },
      { id: 'flair', tier: 'standard' },
      { id: 'trivela', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 97, sprintSpeed: 97,
      positioning: 93, finishing: 94, shotPower: 90, longShots: 83, volleys: 84, penalties: 84,
      vision: 83, crossing: 78, freeKicks: 69, shortPassing: 86, longPassing: 71, curve: 80,
      agility: 93, balance: 82, reactions: 93, ballControl: 92, dribbling: 93, composure: 88,
      interceptions: 38, headingAccuracy: 73, defensiveAwareness: 35, standingTackle: 34, slidingTackle: 32,
      jumping: 88, stamina: 88, strength: 77, aggression: 64, leadership: 82, decisions: 88,
    }),
  },

  'Erling Haaland': {
    fullName: 'Erling Haaland',
    primaryPosition: 'ST',
    secondaryPositions: [],
    overall: 91,
    potential: 94,
    weakFoot: 3,
    skillMoves: 3,
    preferredFoot: 'Left',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'Medium',
    traits: ['Power Header', 'Strength', 'Injury Prone', 'Acrobatic'],
    playStyles: [
      { id: 'acrobatic', tier: 'plus' },
      { id: 'power_shot', tier: 'standard' },
      { id: 'power_header', tier: 'standard' },
      { id: 'quick_step', tier: 'standard' },
      { id: 'aerial', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 82, sprintSpeed: 96,
      positioning: 96, finishing: 96, shotPower: 94, longShots: 86, volleys: 90, penalties: 84,
      vision: 74, crossing: 47, freeKicks: 62, shortPassing: 77, longPassing: 53, curve: 77,
      agility: 76, balance: 72, reactions: 94, ballControl: 82, dribbling: 81, composure: 87,
      interceptions: 43, headingAccuracy: 86, defensiveAwareness: 38, standingTackle: 47, slidingTackle: 29,
      jumping: 93, stamina: 76, strength: 93, aggression: 87, leadership: 78, decisions: 84,
    }),
  },

  'Rodri Hernández': {
    fullName: 'Rodri Hernández',
    primaryPosition: 'CDM',
    secondaryPositions: ['CM'],
    overall: 91,
    potential: 91,
    weakFoot: 4,
    skillMoves: 3,
    preferredFoot: 'Right',
    attackingWorkRate: 'Medium',
    defensiveWorkRate: 'High',
    traits: ['Long Passer', 'Power Shot', 'Leadership', 'Team Player'],
    playStyles: [
      { id: 'intercept', tier: 'plus' },
      { id: 'power_shot', tier: 'standard' },
      { id: 'long_ball_pass', tier: 'standard' },
      { id: 'bruiser', tier: 'standard' },
      { id: 'press_proven', tier: 'standard' },
      { id: 'relentless', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 64, sprintSpeed: 68,
      positioning: 83, finishing: 75, shotPower: 92, longShots: 91, volleys: 74, penalties: 62,
      vision: 87, crossing: 71, freeKicks: 62, shortPassing: 93, longPassing: 92, curve: 74,
      agility: 68, balance: 74, reactions: 92, ballControl: 90, dribbling: 82, composure: 92,
      interceptions: 88, headingAccuracy: 84, defensiveAwareness: 90, standingTackle: 88, slidingTackle: 82,
      jumping: 82, stamina: 92, strength: 89, aggression: 84, leadership: 89, decisions: 92,
    }),
  },

  'Vinícius Jr.': {
    fullName: 'Vinícius Jr.',
    primaryPosition: 'LW',
    secondaryPositions: ['ST'],
    overall: 90,
    potential: 94,
    weakFoot: 4,
    skillMoves: 5,
    preferredFoot: 'Right',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'Medium',
    traits: ['Speed Dribbler', 'Flair', 'Trickster', 'Outside Foot Shot'],
    playStyles: [
      { id: 'quick_step', tier: 'plus' },
      { id: 'rapid', tier: 'standard' },
      { id: 'trickster', tier: 'standard' },
      { id: 'technical', tier: 'standard' },
      { id: 'flair', tier: 'standard' },
      { id: 'trivela', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 95, sprintSpeed: 95,
      positioning: 89, finishing: 89, shotPower: 82, longShots: 79, volleys: 77, penalties: 75,
      vision: 84, crossing: 80, freeKicks: 62, shortPassing: 83, longPassing: 74, curve: 84,
      agility: 94, balance: 84, reactions: 90, ballControl: 90, dribbling: 92, composure: 84,
      interceptions: 32, headingAccuracy: 50, defensiveAwareness: 32, standingTackle: 32, slidingTackle: 29,
      jumping: 75, stamina: 84, strength: 68, aggression: 74, leadership: 74, decisions: 84,
    }),
  },

  'Jude Bellingham': {
    fullName: 'Jude Bellingham',
    primaryPosition: 'CAM',
    secondaryPositions: ['CM'],
    overall: 90,
    potential: 94,
    weakFoot: 4,
    skillMoves: 4,
    preferredFoot: 'Right',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'High',
    traits: ['Leadership', 'Playmaker', 'Late Runs', 'Relentless'],
    playStyles: [
      { id: 'relentless', tier: 'plus' },
      { id: 'incisive_pass', tier: 'standard' },
      { id: 'tiki_taka', tier: 'standard' },
      { id: 'technical', tier: 'standard' },
      { id: 'intercept', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 81, sprintSpeed: 80,
      positioning: 93, finishing: 88, shotPower: 86, longShots: 84, volleys: 83, penalties: 80,
      vision: 88, crossing: 78, freeKicks: 75, shortPassing: 90, longPassing: 85, curve: 82,
      agility: 85, balance: 82, reactions: 91, ballControl: 90, dribbling: 88, composure: 90,
      interceptions: 82, headingAccuracy: 84, defensiveAwareness: 80, standingTackle: 82, slidingTackle: 77,
      jumping: 83, stamina: 93, strength: 85, aggression: 85, leadership: 90, decisions: 89,
    }),
  },

  'Kevin De Bruyne': {
    fullName: 'Kevin De Bruyne',
    primaryPosition: 'CM',
    secondaryPositions: ['CAM'],
    overall: 90,
    potential: 90,
    weakFoot: 5,
    skillMoves: 4,
    preferredFoot: 'Right',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'Medium',
    traits: ['Long Passer', 'Playmaker', 'Outside Foot Shot', 'Leadership'],
    playStyles: [
      { id: 'incisive_pass', tier: 'plus' },
      { id: 'pinged_pass', tier: 'standard' },
      { id: 'long_ball_pass', tier: 'standard' },
      { id: 'whipped_pass', tier: 'standard' },
      { id: 'dead_ball', tier: 'standard' },
      { id: 'trivela', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 68, sprintSpeed: 67,
      positioning: 88, finishing: 85, shotPower: 92, longShots: 91, volleys: 82, penalties: 83,
      vision: 95, crossing: 94, freeKicks: 83, shortPassing: 94, longPassing: 94, curve: 89,
      agility: 74, balance: 77, reactions: 92, ballControl: 92, dribbling: 86, composure: 92,
      interceptions: 69, headingAccuracy: 55, defensiveAwareness: 68, standingTackle: 70, slidingTackle: 53,
      jumping: 63, stamina: 82, strength: 74, aggression: 75, leadership: 91, decisions: 93,
    }),
  },

  'Harry Kane': {
    fullName: 'Harry Kane',
    primaryPosition: 'ST',
    secondaryPositions: ['CAM'],
    overall: 90,
    potential: 90,
    weakFoot: 5,
    skillMoves: 3,
    preferredFoot: 'Right',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'High',
    traits: ['Finesse Shot', 'Long Passer', 'Leadership', 'Penalty Specialist'],
    playStyles: [
      { id: 'finesse_shot', tier: 'plus' },
      { id: 'incisive_pass', tier: 'standard' },
      { id: 'long_ball_pass', tier: 'standard' },
      { id: 'first_touch', tier: 'standard' },
      { id: 'power_header', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 64, sprintSpeed: 66,
      positioning: 94, finishing: 95, shotPower: 93, longShots: 87, volleys: 89, penalties: 92,
      vision: 89, crossing: 80, freeKicks: 65, shortPassing: 87, longPassing: 86, curve: 82,
      agility: 69, balance: 71, reactions: 92, ballControl: 89, dribbling: 83, composure: 92,
      interceptions: 47, headingAccuracy: 89, defensiveAwareness: 50, standingTackle: 49, slidingTackle: 38,
      jumping: 82, stamina: 83, strength: 84, aggression: 81, leadership: 92, decisions: 91,
    }),
  },

  'Mohamed Salah': {
    fullName: 'Mohamed Salah',
    primaryPosition: 'RW',
    secondaryPositions: [],
    overall: 89,
    potential: 89,
    weakFoot: 3,
    skillMoves: 4,
    preferredFoot: 'Left',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'Medium',
    traits: ['Finesse Shot', 'Speed Dribbler', 'Outside Foot Shot', 'Chip Shot'],
    playStyles: [
      { id: 'finesse_shot', tier: 'plus' },
      { id: 'rapid', tier: 'standard' },
      { id: 'technical', tier: 'standard' },
      { id: 'trivela', tier: 'standard' },
      { id: 'first_touch', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 89, sprintSpeed: 89,
      positioning: 92, finishing: 90, shotPower: 83, longShots: 85, volleys: 84, penalties: 86,
      vision: 86, crossing: 82, freeKicks: 69, shortPassing: 84, longPassing: 77, curve: 84,
      agility: 88, balance: 88, reactions: 92, ballControl: 89, dribbling: 89, composure: 87,
      interceptions: 55, headingAccuracy: 60, defensiveAwareness: 45, standingTackle: 45, slidingTackle: 41,
      jumping: 69, stamina: 85, strength: 76, aggression: 63, leadership: 85, decisions: 88,
    }),
  },

  'Virgil van Dijk': {
    fullName: 'Virgil van Dijk',
    primaryPosition: 'CB',
    secondaryPositions: [],
    overall: 89,
    potential: 89,
    weakFoot: 3,
    skillMoves: 2,
    preferredFoot: 'Right',
    attackingWorkRate: 'Medium',
    defensiveWorkRate: 'High',
    traits: ['Power Header', 'Long Passer', 'Leadership', 'Aerial Presence'],
    playStyles: [
      { id: 'aerial', tier: 'plus' },
      { id: 'block', tier: 'standard' },
      { id: 'anticipate', tier: 'standard' },
      { id: 'bruiser', tier: 'standard' },
      { id: 'long_ball_pass', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 74, sprintSpeed: 82,
      positioning: 47, finishing: 52, shotPower: 81, longShots: 64, volleys: 45, penalties: 62,
      vision: 72, crossing: 53, freeKicks: 70, shortPassing: 82, longPassing: 86, curve: 60,
      agility: 60, balance: 67, reactions: 89, ballControl: 77, dribbling: 72, composure: 90,
      interceptions: 89, headingAccuracy: 88, defensiveAwareness: 90, standingTackle: 91, slidingTackle: 86,
      jumping: 90, stamina: 78, strength: 93, aggression: 83, leadership: 93, decisions: 90,
    }),
  },

  'Alisson Becker': {
    fullName: 'Alisson Becker',
    primaryPosition: 'GK',
    secondaryPositions: [],
    overall: 89,
    potential: 89,
    weakFoot: 3,
    skillMoves: 1,
    preferredFoot: 'Right',
    attackingWorkRate: 'Medium',
    defensiveWorkRate: 'Medium',
    traits: ['Rushes Out Of Goal', 'GK Comes For Crosses', 'Leadership'],
    playStyles: [
      { id: 'cross_claimer', tier: 'plus' },
      { id: 'rush_out', tier: 'standard' },
      { id: 'far_reach', tier: 'standard' },
      { id: 'quick_reflexes', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 56, sprintSpeed: 58,
      positioning: 90, finishing: 15, shotPower: 58, longShots: 15, volleys: 15, penalties: 23,
      vision: 66, crossing: 17, freeKicks: 18, shortPassing: 55, longPassing: 58, curve: 19,
      agility: 40, balance: 37, reactions: 89, ballControl: 45, dribbling: 27, composure: 70,
      interceptions: 20, headingAccuracy: 50, defensiveAwareness: 25, standingTackle: 19, slidingTackle: 16,
      jumping: 82, stamina: 42, strength: 78, aggression: 27, leadership: 88, decisions: 88,
      diving: 86, handling: 85, kicking: 85, reflexes: 89, gkPositioning: 90,
    }),
  },

  'Thibaut Courtois': {
    fullName: 'Thibaut Courtois',
    primaryPosition: 'GK',
    secondaryPositions: [],
    overall: 89,
    potential: 89,
    weakFoot: 3,
    skillMoves: 1,
    preferredFoot: 'Left',
    attackingWorkRate: 'Medium',
    defensiveWorkRate: 'Medium',
    traits: ['GK Comes For Crosses', 'Far Reach', 'Leadership'],
    playStyles: [
      { id: 'far_reach', tier: 'plus' },
      { id: 'cross_claimer', tier: 'standard' },
      { id: 'quick_reflexes', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 46, sprintSpeed: 48,
      positioning: 90, finishing: 14, shotPower: 56, longShots: 17, volleys: 12, penalties: 27,
      vision: 44, crossing: 14, freeKicks: 20, shortPassing: 43, longPassing: 45, curve: 19,
      agility: 38, balance: 32, reactions: 88, ballControl: 35, dribbling: 23, composure: 66,
      interceptions: 15, headingAccuracy: 40, defensiveAwareness: 20, standingTackle: 18, slidingTackle: 16,
      jumping: 68, stamina: 38, strength: 70, aggression: 23, leadership: 86, decisions: 87,
      diving: 85, handling: 89, kicking: 76, reflexes: 93, gkPositioning: 90,
    }),
  },

  'William Saliba': {
    fullName: 'William Saliba',
    primaryPosition: 'CB',
    secondaryPositions: [],
    overall: 87,
    potential: 91,
    weakFoot: 3,
    skillMoves: 2,
    preferredFoot: 'Right',
    attackingWorkRate: 'Medium',
    defensiveWorkRate: 'High',
    traits: ['Strength', 'Solid Player', 'Tactical Reading'],
    playStyles: [
      { id: 'anticipate', tier: 'plus' },
      { id: 'jockey', tier: 'standard' },
      { id: 'intercept', tier: 'standard' },
      { id: 'bruiser', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 80, sprintSpeed: 84,
      positioning: 40, finishing: 42, shotPower: 68, longShots: 40, volleys: 34, penalties: 45,
      vision: 68, crossing: 44, freeKicks: 42, shortPassing: 82, longPassing: 78, curve: 55,
      agility: 68, balance: 72, reactions: 88, ballControl: 78, dribbling: 72, composure: 88,
      interceptions: 87, headingAccuracy: 84, defensiveAwareness: 88, standingTackle: 88, slidingTackle: 84,
      jumping: 83, stamina: 80, strength: 86, aggression: 80, leadership: 82, decisions: 88,
    }),
  },

  'Lamine Yamal': {
    fullName: 'Lamine Yamal',
    primaryPosition: 'RW',
    secondaryPositions: ['LW'],
    overall: 81,
    potential: 94,
    weakFoot: 3,
    skillMoves: 4,
    preferredFoot: 'Left',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'Medium',
    traits: ['Flair', 'Speed Dribbler', 'Outside Foot Shot', 'Technical'],
    playStyles: [
      { id: 'technical', tier: 'plus' },
      { id: 'finesse_shot', tier: 'standard' },
      { id: 'flair', tier: 'standard' },
      { id: 'whipped_pass', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 84, sprintSpeed: 81,
      positioning: 80, finishing: 78, shotPower: 76, longShots: 75, volleys: 72, penalties: 72,
      vision: 82, crossing: 82, freeKicks: 74, shortPassing: 82, longPassing: 76, curve: 84,
      agility: 88, balance: 84, reactions: 80, ballControl: 85, dribbling: 86, composure: 82,
      interceptions: 25, headingAccuracy: 52, defensiveAwareness: 28, standingTackle: 28, slidingTackle: 24,
      jumping: 62, stamina: 74, strength: 52, aggression: 50, leadership: 68, decisions: 80,
    }),
  },

  'Bukayo Saka': {
    fullName: 'Bukayo Saka',
    primaryPosition: 'RW',
    secondaryPositions: ['LW'],
    overall: 87,
    potential: 90,
    weakFoot: 3,
    skillMoves: 4,
    preferredFoot: 'Left',
    attackingWorkRate: 'High',
    defensiveWorkRate: 'Medium',
    traits: ['Flair', 'Speed Dribbler', 'Team Player'],
    playStyles: [
      { id: 'technical', tier: 'plus' },
      { id: 'whipped_pass', tier: 'standard' },
      { id: 'finesse_shot', tier: 'standard' },
      { id: 'relentless', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 87, sprintSpeed: 86,
      positioning: 88, finishing: 85, shotPower: 82, longShots: 80, volleys: 78, penalties: 86,
      vision: 86, crossing: 86, freeKicks: 73, shortPassing: 86, longPassing: 79, curve: 84,
      agility: 87, balance: 84, reactions: 88, ballControl: 88, dribbling: 88, composure: 86,
      interceptions: 65, headingAccuracy: 64, defensiveAwareness: 65, standingTackle: 66, slidingTackle: 62,
      jumping: 72, stamina: 86, strength: 74, aggression: 68, leadership: 84, decisions: 86,
    }),
  },

  'Cole Palmer': {
    fullName: 'Cole Palmer',
    primaryPosition: 'CAM',
    secondaryPositions: ['RW'],
    overall: 85,
    potential: 91,
    weakFoot: 3,
    skillMoves: 4,
    preferredFoot: 'Left',
    attackingWorkRate: 'Medium',
    defensiveWorkRate: 'Medium',
    traits: ['Playmaker', 'Penalty Specialist', 'Finesse Shot', 'Cold Composure'],
    playStyles: [
      { id: 'incisive_pass', tier: 'plus' },
      { id: 'finesse_shot', tier: 'standard' },
      { id: 'dead_ball', tier: 'standard' },
      { id: 'technical', tier: 'standard' },
    ],
    attributes: buildFullAttributes({
      acceleration: 80, sprintSpeed: 80,
      positioning: 87, finishing: 86, shotPower: 83, longShots: 84, volleys: 80, penalties: 91,
      vision: 88, crossing: 82, freeKicks: 82, shortPassing: 86, longPassing: 82, curve: 84,
      agility: 82, balance: 79, reactions: 86, ballControl: 88, dribbling: 86, composure: 90,
      interceptions: 52, headingAccuracy: 65, defensiveAwareness: 54, standingTackle: 55, slidingTackle: 48,
      jumping: 68, stamina: 80, strength: 68, aggression: 62, leadership: 80, decisions: 87,
    }),
  },
};

/**
 * Procedural Scouting Ability Model:
 * Generates an authentic EA FC 33-attribute profile, weak foot, skill moves, work rates,
 * traits, and PlayStyles for any player given their position, target overall, and physical specs.
 */
export function generateCalibratedAbilityProfile(
  position: PositionCode,
  targetOvr: number,
  age: number,
  preferredFoot: 'Right' | 'Left' | 'Both' = 'Right',
  heightCm = 180,
  rng: SeededRng
): {
  attributes: PlayerAttributes;
  weakFoot: number;
  skillMoves: number;
  preferredFoot: 'Right' | 'Left' | 'Both';
  attackingWorkRate: WorkRateLevel;
  defensiveWorkRate: WorkRateLevel;
  traits: string[];
  playStyles: PlayerPlayStyle[];
  ratingDataSource: RatingDataSource;
  scoutingAccuracy: number;
} {
  const isGK = position === 'GK';
  const isCB = position === 'CB';
  const isFB = position === 'LB' || position === 'RB';
  const isDM = position === 'CDM';
  const isCM = position === 'CM';
  const isAM = position === 'CAM';
  const isWing = position === 'LW' || position === 'RW';
  const isST = position === 'ST';

  const base = (offset: number, variance = 4) => {
    const raw = targetOvr + offset + rng.nextInt(-variance, variance);
    return Math.max(15, Math.min(99, Math.round(raw)));
  };

  // 1. Attributes Generation
  let acceleration: number;
  let sprintSpeed: number;
  let positioning: number;
  let finishing: number;
  let shotPower: number;
  let longShots: number;
  let volleys: number;
  let penalties: number;
  let vision: number;
  let crossing: number;
  let freeKicks: number;
  let shortPassing: number;
  let longPassing: number;
  let curve: number;
  let agility: number;
  let balance: number;
  let reactions: number;
  let ballControl: number;
  let dribbling: number;
  let composure: number;
  let interceptions: number;
  let headingAccuracy: number;
  let defensiveAwareness: number;
  let standingTackle: number;
  let slidingTackle: number;
  let jumping: number;
  let stamina: number;
  let strength: number;
  let aggression: number;

  let diving = 20;
  let handling = 20;
  let kicking = 20;
  let reflexes = 20;
  let gkPositioning = 20;

  if (isGK) {
    diving = base(0);
    handling = base(0);
    kicking = base(-3);
    reflexes = base(2);
    gkPositioning = base(1);

    acceleration = Math.max(30, Math.min(65, base(-30)));
    sprintSpeed = Math.max(30, Math.min(65, base(-30)));
    positioning = base(-50);
    finishing = base(-65);
    shotPower = base(-25);
    longShots = base(-65);
    volleys = base(-65);
    penalties = base(-50);
    vision = base(-30);
    crossing = base(-60);
    freeKicks = base(-55);
    shortPassing = base(-25);
    longPassing = base(-20);
    curve = base(-60);
    agility = base(-40);
    balance = base(-40);
    reactions = base(0);
    ballControl = base(-45);
    dribbling = base(-50);
    composure = base(-15);
    interceptions = base(-60);
    headingAccuracy = base(-40);
    defensiveAwareness = base(-55);
    standingTackle = base(-65);
    slidingTackle = base(-65);
    jumping = base(0);
    stamina = base(-35);
    strength = base(-5);
    aggression = base(-35);
  } else {
    // Pace
    const paceBonus = isWing ? 8 : isFB ? 6 : isST ? 4 : isCB ? -4 : 0;
    acceleration = base(paceBonus);
    sprintSpeed = base(paceBonus + (heightCm > 185 ? 2 : -1));

    // Shooting
    positioning = base(isST ? 6 : isWing || isAM ? 4 : isCB ? -25 : -8);
    finishing = base(isST ? 6 : isWing ? 3 : isAM ? 2 : isCB ? -30 : -10);
    shotPower = base(isST ? 5 : isAM || isWing ? 4 : isCB ? -10 : -2);
    longShots = base(isAM ? 6 : isST || isWing ? 4 : isCM ? 3 : -15);
    volleys = base(isST ? 5 : isWing || isAM ? 2 : -15);
    penalties = base(isST ? 4 : isAM ? 2 : -10);

    // Passing
    vision = base(isAM ? 7 : isCM ? 5 : isWing ? 2 : isCB ? -15 : 0);
    crossing = base(isWing ? 7 : isFB ? 6 : isCM ? 0 : -20);
    freeKicks = base(isAM || isWing ? 2 : -15);
    shortPassing = base(isCM || isAM ? 7 : isDM ? 5 : isFB || isWing ? 2 : isCB ? -4 : 0);
    longPassing = base(isCM ? 6 : isDM || isAM ? 4 : isCB ? 2 : -10);
    curve = base(isWing || isAM ? 5 : -10);

    // Dribbling
    agility = base(isWing ? 8 : isAM ? 5 : heightCm > 188 ? -8 : 0);
    balance = base(isWing ? 6 : heightCm > 188 ? -8 : 0);
    reactions = base(2);
    ballControl = base(isAM || isWing || isST ? 6 : isCM ? 4 : isCB ? -6 : 0);
    dribbling = base(isWing ? 8 : isAM ? 6 : isST ? 3 : isCB ? -18 : 0);
    composure = base(isST || isAM || isCB ? 4 : 2);

    // Defending
    interceptions = base(isDM ? 7 : isCB ? 6 : isFB ? 4 : isCM ? 0 : -25);
    headingAccuracy = base(isCB ? 7 : isST ? 5 : heightCm > 185 ? 3 : -10);
    defensiveAwareness = base(isCB ? 7 : isDM ? 6 : isFB ? 5 : -25);
    standingTackle = base(isCB ? 8 : isDM ? 7 : isFB ? 6 : -25);
    slidingTackle = base(isCB ? 7 : isFB ? 6 : isDM ? 5 : -28);

    // Physicality
    jumping = base(isCB ? 6 : isST ? 4 : 0);
    stamina = base(isFB || isCM || isDM ? 7 : 3);
    strength = base(isCB || isST ? 7 : isDM ? 5 : isWing ? -8 : 0);
    aggression = base(isCB || isDM ? 6 : -5);
  }

  const attributes = buildFullAttributes({
    acceleration, sprintSpeed,
    positioning, finishing, shotPower, longShots, volleys, penalties,
    vision, crossing, freeKicks, shortPassing, longPassing, curve,
    agility, balance, reactions, ballControl, dribbling, composure,
    interceptions, headingAccuracy, defensiveAwareness, standingTackle, slidingTackle,
    jumping, stamina, strength, aggression,
    diving, handling, kicking, reflexes, gkPositioning,
    decisions: base(2),
    leadership: Math.max(30, Math.min(95, 45 + rng.nextInt(0, 45))),
    workRate: Math.max(40, Math.min(99, stamina)),
  });

  // 2. Weak Foot & Skill Moves
  let weakFoot = 3;
  if (rng.chance(0.12)) weakFoot = 5;
  else if (rng.chance(0.38)) weakFoot = 4;
  else if (rng.chance(0.18)) weakFoot = 2;

  let skillMoves = 2;
  if (isWing || isAM) {
    skillMoves = rng.chance(0.3) ? 5 : rng.chance(0.55) ? 4 : 3;
  } else if (isST || isCM) {
    skillMoves = rng.chance(0.4) ? 4 : 3;
  } else if (isFB) {
    skillMoves = rng.chance(0.35) ? 3 : 2;
  } else if (isCB) {
    skillMoves = 2;
  } else if (isGK) {
    skillMoves = 1;
  }

  // 3. Work Rates
  const attWr: WorkRateLevel = isST || isWing
    ? 'High'
    : isAM
    ? 'High'
    : isDM || isCB
    ? (rng.chance(0.7) ? 'Medium' : 'Low')
    : 'Medium';

  const defWr: WorkRateLevel = isCB || isDM
    ? 'High'
    : isFB
    ? (rng.chance(0.65) ? 'High' : 'Medium')
    : isST || isWing
    ? (rng.chance(0.7) ? 'Low' : 'Medium')
    : 'Medium';

  // 4. Traits
  const traits: string[] = [];
  if (finishing >= 80) traits.push('Finesse Shot');
  if (headingAccuracy >= 82) traits.push('Power Header');
  if (acceleration >= 86) traits.push('Speed Dribbler');
  if (vision >= 84) traits.push('Playmaker');
  if (longPassing >= 82) traits.push('Long Passer');
  if (strength >= 84) traits.push('Solid Player');
  if (isGK) traits.push(rng.chance(0.5) ? 'GK Comes For Crosses' : 'Rushes Out Of Goal');

  // 5. PlayStyles
  const playStyles: PlayerPlayStyle[] = [];
  if (isST) {
    if (finishing >= 82) {
      const ps = createPlayStyle('finesse_shot', targetOvr >= 85 ? 'plus' : 'standard');
      if (ps) playStyles.push(ps);
    }
    if (headingAccuracy >= 80) {
      const ps = createPlayStyle('power_header', 'standard');
      if (ps) playStyles.push(ps);
    }
    if (acceleration >= 85) {
      const ps = createPlayStyle('quick_step', 'standard');
      if (ps) playStyles.push(ps);
    }
  } else if (isWing) {
    if (dribbling >= 82) {
      const ps = createPlayStyle('technical', targetOvr >= 85 ? 'plus' : 'standard');
      if (ps) playStyles.push(ps);
    }
    if (crossing >= 80) {
      const ps = createPlayStyle('whipped_pass', 'standard');
      if (ps) playStyles.push(ps);
    }
    if (acceleration >= 88) {
      const ps = createPlayStyle('rapid', 'standard');
      if (ps) playStyles.push(ps);
    }
  } else if (isAM || isCM) {
    if (shortPassing >= 82) {
      const ps = createPlayStyle('incisive_pass', targetOvr >= 86 ? 'plus' : 'standard');
      if (ps) playStyles.push(ps);
    }
    if (longPassing >= 80) {
      const ps = createPlayStyle('long_ball_pass', 'standard');
      if (ps) playStyles.push(ps);
    }
    if (ballControl >= 82) {
      const ps = createPlayStyle('tiki_taka', 'standard');
      if (ps) playStyles.push(ps);
    }
  } else if (isDM || isCB || isFB) {
    if (standingTackle >= 80) {
      const ps = createPlayStyle('anticipate', targetOvr >= 85 ? 'plus' : 'standard');
      if (ps) playStyles.push(ps);
    }
    if (interceptions >= 80) {
      const ps = createPlayStyle('intercept', 'standard');
      if (ps) playStyles.push(ps);
    }
    if (strength >= 82) {
      const ps = createPlayStyle('bruiser', 'standard');
      if (ps) playStyles.push(ps);
    }
    if (isCB && jumping >= 82) {
      const ps = createPlayStyle('aerial', 'standard');
      if (ps) playStyles.push(ps);
    }
  } else if (isGK) {
    if (reflexes >= 82) {
      const ps = createPlayStyle('quick_reflexes', targetOvr >= 85 ? 'plus' : 'standard');
      if (ps) playStyles.push(ps);
    }
    const ps2 = createPlayStyle('cross_claimer', 'standard');
    if (ps2) playStyles.push(ps2);
  }

  return {
    attributes,
    weakFoot,
    skillMoves,
    preferredFoot,
    attackingWorkRate: attWr,
    defensiveWorkRate: defWr,
    traits,
    playStyles,
    ratingDataSource: 'calibrated_model',
    scoutingAccuracy: Math.min(99, Math.max(75, 78 + (targetOvr >= 80 ? 12 : 5))),
  };
}
