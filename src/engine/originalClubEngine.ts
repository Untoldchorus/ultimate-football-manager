import { Club, Player, PositionCode } from './types';
import { createRng } from './rng';
import { generatePlayerAttributes } from './generator';
import {
  calculateOverallRating,
  calculateMarketValue,
  calculateWeeklyWage,
} from './ratings';

type Position = PositionCode;

export interface OriginalClubIdentity {
  name: string;
  shortName: string;
  country: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  stadiumCapacity: number;
}

export interface ClubReplacementResult {
  updatedClubs: Club[];
  updatedPlayers: Player[];
  releasedPlayerIds: string[];
  newClub: Club;
}

const FIRST_NAMES = [
  'Lucas', 'Mateo', 'Liam', 'Noah', 'Ethan', 'Julian', 'Soren', 'Kieran',
  'Tariq', 'Samuel', 'Daniel', 'Gabriel', 'Victor', 'Marco', 'Hugo', 'Leo',
  'Rafael', 'Oscar', 'Adrian', 'Ivan', 'Nolan', 'Caleb', 'Felix', 'Ruben',
];

const LAST_NAMES = [
  'Vance', 'Silva', 'Moreau', 'Kovacs', 'Lindqvist', 'Okafor', 'Benitez',
  'Rossi', 'Keller', 'Navarro', 'Diallo', 'Mercer', 'Costa', 'Bauer',
  'Sato', 'Mendes', 'al-Mansoor', 'Novak', 'henriksen', 'Almeida', 'Sterling',
  'Delgado', 'Petrov', 'okafor',
];

const SQUAD_POSITIONS: Position[] = [
  'GK', 'GK', 'GK',
  'LB', 'CB', 'CB', 'CB', 'CB', 'RB', 'RB', 'LB',
  'CDM', 'CM', 'CM', 'CM', 'CAM', 'CM',
  'LW', 'RW', 'ST', 'ST', 'ST', 'RW',
];

export function generateHybridSquad(
  clubId: string,
  nationality: string,
  seed: number,
  baseOvr = 66
): Player[] {
  const seeded = createRng(seed);
  return SQUAD_POSITIONS.map((pos, idx) => {
    const firstName = FIRST_NAMES[seeded.nextInt(0, FIRST_NAMES.length - 1)];
    const lastName = LAST_NAMES[seeded.nextInt(0, LAST_NAMES.length - 1)];
    const age = seeded.nextInt(18, 31);
    const targetSkill = Math.max(50, Math.min(80, baseOvr + seeded.nextInt(-5, 5)));
    const attributes = generatePlayerAttributes(seeded, pos, targetSkill);
    const overall = calculateOverallRating(attributes, pos);
    const potential = Math.min(92, Math.max(overall, overall + (age <= 22 ? seeded.nextInt(4, 12) : seeded.nextInt(1, 4))));
    const weeklyWage = calculateWeeklyWage(overall, age);
    const marketValue = calculateMarketValue(overall, age, potential);

    const roleExpectation: Player['roleExpectation'] =
      idx < 11 ? (overall >= baseOvr + 2 ? 'star' : 'starter') : idx < 18 ? 'rotation' : 'prospect';

    return {
      id: `${clubId}-hyb-${idx + 1}-${seeded.nextInt(1000, 9999)}`,
      clubId,
      firstName,
      lastName,
      age,
      nationality,
      primaryPosition: pos,
      secondaryPositions: [],
      preferredFoot: seeded.chance(0.25) ? 'Left' : 'Right',
      overall,
      potential,
      marketValue,
      weeklyWage,
      contractEndSeason: 2028 + seeded.nextInt(0, 2),
      roleExpectation,
      fitness: 96,
      stamina: 96,
      fatigue: 4,
      morale: 80,
      form: 7.0,
      injuryWeeks: 0,
      isYouth: false,
      seasonGrowth: 0,
      consecutiveMatches: 0,
      transferListed: false,
      transferRequested: false,
      attributes,
      stats: {
        appearances: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        averageRating: 6.5,
        minutesPlayed: 0,
      },
    };
  });
}

export function generateDraftPool(
  nationality: string,
  seed: number,
  maxOvr = 74
): Player[] {
  const seeded = createRng(seed + 991);
  const rng = () => seeded.next();
  const positions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
  return Array.from({ length: 12 }, (_, idx) => {
    const pos = positions[idx % positions.length];
    const squad = generateHybridSquad('free-agent', nationality, seed + idx * 37, maxOvr - 4);
    const base = squad.find((p) => p.primaryPosition === pos) ?? squad[0];
    return {
      ...base,
      id: `draft-${idx + 1}-${Math.floor(rng() * 10000)}`,
      clubId: 'free-agent',
      overall: Math.min(maxOvr, base.overall + 2),
    };
  });
}

/**
 * Replaces a displaced club in an individual career save, releasing its players
 * into the career's Free Agent Market without mutating global registries.
 */
export function replaceClubInCareer(
  clubs: Club[],
  players: Player[],
  displacedClubId: string,
  identity: OriginalClubIdentity,
  seed: number,
  preserveClubId = false
): ClubReplacementResult {
  const displaced = clubs.find((c) => c.id === displacedClubId);
  if (!displaced) {
    throw new Error(`Displaced club "${displacedClubId}" not found in career.`);
  }

  const newClubId = preserveClubId ? displacedClubId : `orig_${Date.now().toString(36)}`;
  const hybridSquad = generateHybridSquad(newClubId, identity.country, seed, 66);
  const startingXI = hybridSquad.slice(0, 11).map((p) => p.id);
  const substitutes = hybridSquad.slice(11, 18).map((p) => p.id);
  const reserves = hybridSquad.slice(18).map((p) => p.id);

  const newClub: Club = {
    ...displaced,
    id: newClubId,
    name: identity.name.trim(),
    shortName: identity.shortName.trim().toUpperCase().slice(0, 4),
    primaryColor: identity.primaryColor,
    secondaryColor: identity.secondaryColor,
    stadiumName: identity.stadiumName.trim(),
    stadiumCapacity: identity.stadiumCapacity || 2000,
    reputation: 48,
    startingXI,
    substitutes,
    reserves,
    captainId: startingXI[1] ?? hybridSquad[0]?.id,
    viceCaptainId: startingXI[2] ?? hybridSquad[1]?.id,
  };

  const releasedPlayerIds: string[] = [];
  const updatedPlayers = players.map((p) => {
    if (p.clubId === displacedClubId) {
      releasedPlayerIds.push(p.id);
      return {
        ...p,
        clubId: 'free-agent',
        formerClubName: displaced.name,
      } as Player;
    }
    return p;
  });

  return {
    updatedClubs: clubs.map((c) => (c.id === displacedClubId ? newClub : c)),
    updatedPlayers: [...updatedPlayers, ...hybridSquad],
    releasedPlayerIds,
    newClub,
  };
}
