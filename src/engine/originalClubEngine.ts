import { Club, Player } from './types';
import { createRng } from './rng';

type Position = Player['primaryPosition'];

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
  const rng = () => seeded.next();
  return SQUAD_POSITIONS.map((pos, idx) => {
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const age = 18 + Math.floor(rng() * 14);
    const overall = Math.max(55, Math.min(82, baseOvr + Math.floor((rng() - 0.45) * 10)));
    const potential = Math.min(92, overall + Math.floor(rng() * 10));
    const wage = Math.round((overall * 180 + rng() * 1500) / 100) * 100;
    const marketValue = Math.round((overall * overall * 180) / 1000) * 1000;

    return {
      id: `${clubId}-hyb-${idx + 1}-${Math.floor(rng() * 10000)}`,
      clubId,
      firstName,
      lastName,
      age,
      nationality,
      primaryPosition: pos,
      secondaryPositions: [],
      preferredFoot: rng() > 0.25 ? 'Right' : 'Left',
      overall,
      potential,
      marketValue,
      weeklyWage: wage,
      contractEndSeason: 2027 + Math.floor(rng() * 3),
      roleExpectation: idx < 11 ? 'Important' : 'Rotation',
      fitness: 95,
      fatigue: 5,
      morale: 75,
      form: 70,
      yellowCardsSeason: 0,
      redCardsSeason: 0,
      suspendedMatches: 0,
      injuredWeeks: 0,
      seasonalGrowth: 0,
      attributes: {
        pace: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        acceleration: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        stamina: Math.min(95, overall + Math.floor((rng() - 0.5) * 12)),
        strength: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        agility: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        jumping: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        passing: Math.min(95, overall + Math.floor((rng() - 0.5) * 12)),
        vision: Math.min(95, overall + Math.floor((rng() - 0.5) * 12)),
        crossing: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        dribbling: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        ballControl: Math.min(95, overall + Math.floor((rng() - 0.5) * 12)),
        finishing: Math.min(95, overall + Math.floor((rng() - 0.5) * 16)),
        shotPower: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        longShots: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        tackling: Math.min(95, overall + Math.floor((rng() - 0.5) * 16)),
        marking: Math.min(95, overall + Math.floor((rng() - 0.5) * 16)),
        interceptions: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        heading: Math.min(95, overall + Math.floor((rng() - 0.5) * 14)),
        composure: Math.min(95, overall + Math.floor((rng() - 0.5) * 12)),
        workRate: Math.min(95, overall + Math.floor((rng() - 0.5) * 12)),
        positioning: Math.min(95, overall + Math.floor((rng() - 0.5) * 12)),
        reflexes: pos === 'GK' ? overall + 4 : 30,
        handling: pos === 'GK' ? overall + 2 : 28,
        gkPositioning: pos === 'GK' ? overall + 2 : 28,
      },
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
    } as unknown as Player;
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
