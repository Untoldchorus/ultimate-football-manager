import { createInitialEconomyState } from './boosterEconomy';
import { createInitialClubEmpireState } from './clubEmpireEngine';
import {
  deriveSpokenLanguagesForNationality,
  resolvePlayerPersonality,
} from './chemistryEngine';
import { createRng, hashStringToSeed, SeededRng } from './rng';
import {
  calculateMarketValue,
  calculateOverallRating,
  calculateWeeklyWage,
  FORMATION_SLOTS,
} from './ratings';
import { resolvePlayerTacticalRole } from './synergyEngine';
import {
  Club,
  FinancialStatus,
  FormationCode,
  GameState,
  ManagerProfile,
  Player,
  PlayerAttributes,
  PositionCode,
  Scout,
} from './types';
import { generateSeasonFixtures } from './fixtures';
import { REAL_WORLD_CLUBS, RealClubSeed } from '@/data/realWorldDatabase';
import { GLOBAL_CLUBS_REGISTRY } from '@/data/globalClubsRegistry';
import { getPlayerPhotoManifest } from '@/data/assetManifest';

export interface ClubPreset {
  id: string;
  name: string;
  shortName: string;
  division: 1 | 2;
  countryId: string;
  city: string;
  leagueId: string;
  foundedYear: number;
  financialStatus: FinancialStatus;
  managerName: string;
  rivalClubIds: string[];
  clubHistory: string;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  stadiumCapacity: number;
  reputation: number;
  defaultFormation: FormationCode;
}

export const CLUB_PRESETS: ClubPreset[] = REAL_WORLD_CLUBS.map((c) => ({
  id: c.id,
  name: c.name,
  shortName: c.shortName,
  division: c.division,
  countryId: c.countryId,
  city: c.city,
  leagueId: c.leagueId,
  foundedYear: c.foundedYear,
  financialStatus: c.financialStatus,
  managerName: c.managerName,
  rivalClubIds: c.rivalClubIds,
  clubHistory: c.clubHistory,
  primaryColor: c.primaryColor,
  secondaryColor: c.secondaryColor,
  stadiumName: c.stadiumName,
  stadiumCapacity: c.stadiumCapacity,
  reputation: c.reputation,
  defaultFormation: c.defaultFormation,
}));

export const GLOBAL_CLUB_PRESETS: ClubPreset[] = GLOBAL_CLUBS_REGISTRY.map((c) => ({
  id: c.id,
  name: c.name,
  shortName: c.shortName,
  division: c.division,
  countryId: c.countryId,
  city: c.city,
  leagueId: c.leagueId,
  foundedYear: c.foundedYear,
  financialStatus: c.financialStatus,
  managerName: c.managerName,
  rivalClubIds: c.rivalClubIds,
  clubHistory: c.clubHistory,
  primaryColor: c.primaryColor,
  secondaryColor: c.secondaryColor,
  stadiumName: c.stadiumName,
  stadiumCapacity: c.stadiumCapacity,
  reputation: c.reputation,
  defaultFormation: c.defaultFormation,
}));

const NATIONALITY_NAME_POOLS: Record<string, { first: string[]; last: string[] }> = {
  England: {
    first: ['Arthur', 'Callum', 'Declan', 'Ethan', 'Finley', 'Harrison', 'Jude', 'Kieran', 'Liam', 'Mason', 'Ollie', 'Reece', 'Toby', 'Zack'],
    last: ['Ashworth', 'Barker', 'Caldwell', 'Davenport', 'Ellison', 'Fletcher', 'Gallagher', 'Hawkins', 'Keating', 'Langley', 'Mercer', 'Prescott', 'Sterling', 'Vance'],
  },
  Spain: {
    first: ['Alejandro', 'Carlos', 'Diego', 'Gonzalo', 'Hugo', 'Iker', 'Javier', 'Lucas', 'Mateo', 'Nico', 'Pablo', 'Raul', 'Sergio', 'Thiago'],
    last: ['Alvarado', 'Beltran', 'Castillo', 'Delgado', 'Escobar', 'Fuentes', 'Garrido', 'Herrera', 'Mendoza', 'Navarro', 'Ortega', 'Serrano', 'Valdez', 'Zamora'],
  },
  France: {
    first: ['Adrien', 'Benoit', 'Clement', 'Kylian', 'Laurent', 'Mathis', 'Olivier', 'Quentin', 'Rayan', 'Sebastien', 'Theo', 'Warren', 'Yanis', 'Zinedine'],
    last: ['Beaumont', 'Chevalier', 'Delacroix', 'Fontaine', 'Girard', 'Laurent', 'Moreau', 'Perrin', 'Rousseau', 'Toussaint', 'Vasseur'],
  },
  Germany: {
    first: ['Bastian', 'Emil', 'Fabian', 'Jonas', 'Kai', 'Leon', 'Lukas', 'Maximilian', 'Niklas', 'Robin', 'Tim', 'Yannick'],
    last: ['Baumann', 'Brandt', 'Dietrich', 'Fischer', 'Hartmann', 'Keller', 'Kramer', 'Lehmann', 'Neumann', 'Richter', 'Schubert', 'Vogel'],
  },
  Brazil: {
    first: ['Breno', 'Caio', 'Danilo', 'Endrick', 'Fabricio', 'Gabriel', 'Heitor', 'Igor', 'Joao', 'Kaio', 'Lucas', 'Matheus', 'Pedro', 'Rafael', 'Vinicius'],
    last: ['Almeida', 'Barbosa', 'Cardoso', 'Duarte', 'Ferreira', 'Monteiro', 'Nascimento', 'Oliveira', 'Pereira', 'Ribeiro', 'Santana', 'Teixeira'],
  },
  Argentina: {
    first: ['Agustin', 'Valentin', 'Emiliano', 'Facundo', 'Julian', 'Lautaro', 'Nahuel', 'Nicolas', 'Ramiro', 'Santiago', 'Tomas'],
    last: ['Acuna', 'Bustos', 'Correa', 'Dominguez', 'Gimenez', 'Ledesma', 'Molina', 'Palacios', 'Quiroga', 'Romero', 'Villalba'],
  },
  Netherlands: {
    first: ['Daan', 'Jorrit', 'Kasper', 'Luuk', 'Matthijs', 'Quinten', 'Ruben', 'Sven', 'Teun', 'Wout', 'Xavi'],
    last: ['Bakker', 'Bos', 'De Groot', 'Hendriks', 'Jansen', 'Koopmeiners', 'Meijer', 'Smit', 'Van Dijk', 'Vermeer', 'Visser'],
  },
  Italy: {
    first: ['Alessandro', 'Davide', 'Edoardo', 'Federico', 'Giacomo', 'Lorenzo', 'Marco', 'Matteo', 'Nicolo', 'Riccardo', 'Sandro', 'Tommaso'],
    last: ['Bellini', 'Caruso', 'Conti', 'De Luca', 'Ferraro', 'Galli', 'Lombardi', 'Marchetti', 'Moretti', 'Rinaldi', 'Santoro', 'Vitale'],
  },
  Portugal: {
    first: ['Bernardo', 'Diogo', 'Goncalo', 'Joao', 'Nuno', 'Pedro', 'Rafael', 'Renato', 'Ruben', 'Tiago', 'Vitinha'],
    last: ['Azevedo', 'Carvalho', 'Coelho', 'Correia', 'Figueiredo', 'Guerreiro', 'Lopes', 'Magalhaes', 'Neves', 'Pinto', 'Tavares'],
  },
  Nigeria: {
    first: ['Ademola', 'Chidera', 'Ibrahim', 'Kelechi', 'Moses', 'Samuel', 'Taiwo', 'Victor', 'Wilfred', 'Zaidu'],
    last: ['Adebayo', 'Balogun', 'Chukwueze', 'Eze', 'Iwobi', 'Ndidi', 'Okafor', 'Onyeka', 'Osimhen', 'Sanusi'],
  },
  Japan: {
    first: ['Daichi', 'Haruto', 'Kaoru', 'Kenji', 'Koji', 'Ritsu', 'Ren', 'Shuto', 'Takefusa', 'Wataru', 'Yuki'],
    last: ['Endo', 'Fujimoto', 'Hashimoto', 'Ito', 'Kamada', 'Kubo', 'Minamino', 'Mitoma', 'Morita', 'Nakamura', 'Tanaka', 'Tomiyasu'],
  },
};

const NATIONALITIES = Object.keys(NATIONALITY_NAME_POOLS);

const SECONDARY_MAP: Record<PositionCode, PositionCode[]> = {
  GK: [],
  LB: ['RB', 'LW'],
  RB: ['LB', 'RW'],
  CB: ['CDM'],
  CDM: ['CM', 'CB'],
  CM: ['CDM', 'CAM'],
  CAM: ['CM', 'LW', 'RW'],
  LW: ['RW', 'ST'],
  RW: ['LW', 'ST'],
  ST: ['LW', 'RW', 'CAM'],
};

function clampAttr(val: number): number {
  return Math.max(15, Math.min(96, Math.round(val)));
}

/**
 * Generates a full 31-attribute profile calibrated to the player's position and target skill.
 * Documented estimation model:
 * - Position-weighted primary attributes receive positive role offsets (+6..+10) so the
 *   resulting `calculateOverallRating` closely matches the real-world target overall.
 */
export function generatePlayerAttributes(
  rng: SeededRng,
  position: PositionCode,
  targetSkill: number
): PlayerAttributes {
  const base = (offset: number, spread = 5) =>
    clampAttr(targetSkill + offset + rng.nextInt(-spread, spread));

  const isGK = position === 'GK';
  const isDef = position === 'CB' || position === 'LB' || position === 'RB';
  const isFullback = position === 'LB' || position === 'RB';
  const isMid = position === 'CDM' || position === 'CM' || position === 'CAM';
  const isWing = position === 'LW' || position === 'RW';
  const isSt = position === 'ST';

  const passing = base(isMid ? 5 : isGK ? -16 : 0);
  const shooting = base(isSt ? 6 : isWing || position === 'CAM' ? 3 : isDef ? -15 : isGK ? -30 : -2);
  const finishing = base(isSt ? 7 : isWing ? 3 : isDef ? -18 : isGK ? -32 : -4);
  const dribbling = base(isWing ? 6 : position === 'CAM' || isSt ? 4 : isDef ? -10 : isGK ? -28 : 2);
  const firstTouch = base(isMid || isWing || isSt ? 4 : isGK ? -15 : 0);
  const crossing = base(isWing || isFullback ? 6 : isMid ? 2 : -12);
  const tackling = base(isDef || position === 'CDM' ? 6 : isMid ? 2 : isGK ? -25 : -15);
  const heading = base(position === 'CB' || isSt ? 5 : isGK ? -15 : -2);

  const pace = base(isWing || isFullback ? 6 : isSt ? 4 : position === 'CB' ? -2 : 2);
  const acceleration = base(isWing || isFullback ? 6 : isSt ? 4 : 1);
  const strength = base(position === 'CB' || position === 'CDM' || isSt ? 5 : isWing ? -4 : 0);
  const stamina = base(isFullback || isMid ? 5 : 2);
  const jumping = base(position === 'CB' || isGK || isSt ? 5 : 0);
  const agility = base(isWing || position === 'CAM' || isGK ? 5 : 0);

  const vision = base(position === 'CAM' || position === 'CM' ? 6 : isSt ? 0 : -4);
  const positioning = base(isDef || position === 'CDM' || isSt || isGK ? 5 : 2);
  const decisions = base(3);
  const composure = base(isSt || position === 'CB' || isGK ? 4 : 2);
  const leadership = clampAttr(45 + rng.nextInt(0, 46));
  const workRate = clampAttr(58 + rng.nextInt(-8, 34));
  const aggression = clampAttr(50 + rng.nextInt(-12, 36));

  const reflexes = isGK ? base(7) : clampAttr(20 + rng.nextInt(0, 20));
  const handling = isGK ? base(6) : clampAttr(20 + rng.nextInt(0, 20));
  const distribution = isGK ? base(4) : clampAttr(20 + rng.nextInt(0, 20));

  return {
    // Technical (10)
    passing,
    shooting,
    finishing,
    dribbling,
    ballControl: clampAttr((firstTouch + dribbling) / 2),
    crossing,
    tackling,
    marking: clampAttr((tackling + positioning) / 2),
    firstTouch,
    heading,
    longShots: base(position === 'CAM' || position === 'CM' || isSt ? 4 : isGK ? -30 : -6),
    freeKicks: base(position === 'CAM' || isWing ? 3 : -10, 8),
    penalties: base(isSt ? 6 : isMid ? 2 : -10, 7),
    // Physical (7)
    pace,
    acceleration,
    strength,
    stamina,
    jumping,
    balance: clampAttr((agility + strength) / 2),
    agility,
    // Mental (8)
    vision,
    positioning,
    decisions,
    composure,
    leadership,
    workRate,
    aggression,
    anticipation: clampAttr((positioning + decisions) / 2),
    // Goalkeeping (6)
    reflexes,
    handling,
    distribution,
    diving: isGK ? base(6) : clampAttr(18 + rng.nextInt(0, 18)),
    aerialAbility: isGK ? base(5) : clampAttr((jumping + heading) / 2),
    gkPositioning: isGK ? positioning : clampAttr(18 + rng.nextInt(0, 18)),
  };
}

/**
 * Generates a youth prospect or regen player when needed for academy intakes and multi-season rollovers.
 */
export function generatePlayer(
  rng: SeededRng,
  id: string,
  clubId: string,
  position: PositionCode,
  baseClubReputation: number,
  currentSeason: number,
  isYouth = false
): Player {
  const nationality = rng.pick(NATIONALITIES);
  const pool = NATIONALITY_NAME_POOLS[nationality];
  const firstName = rng.pick(pool.first).trim();
  const lastName = rng.pick(pool.last).trim();

  const age = isYouth ? rng.nextInt(16, 18) : rng.nextInt(18, 32);
  const skillOffset = isYouth ? rng.nextInt(-16, -8) : rng.nextInt(-5, 6);
  const targetSkill = Math.max(48, Math.min(88, baseClubReputation + skillOffset));

  const attributes = generatePlayerAttributes(rng, position, targetSkill);
  const overall = calculateOverallRating(attributes, position);

  const maxGrowth = age <= 20 ? rng.nextInt(8, 17) : age <= 24 ? rng.nextInt(3, 9) : rng.nextInt(0, 2);
  const potential = Math.min(95, Math.max(overall, overall + maxGrowth));

  const marketValue = calculateMarketValue(overall, age, potential);
  const weeklyWage = isYouth ? 600 : calculateWeeklyWage(overall, age);

  const possibleSecondaries = SECONDARY_MAP[position];
  const secondaryPositions =
    possibleSecondaries.length > 0 && rng.chance(0.6) ? [rng.pick(possibleSecondaries)] : [];

  const birthYear = currentSeason - age;

  return {
    id,
    firstName,
    lastName,
    age,
    dateOfBirth: `${birthYear}-05-14`,
    heightCm: position === 'GK' || position === 'CB' ? rng.nextInt(185, 197) : rng.nextInt(171, 187),
    preferredFoot: position === 'LB' || position === 'LW' ? 'Left' : 'Right',
    shirtNumber: isYouth ? rng.nextInt(41, 89) : rng.nextInt(1, 39),
    nationality,
    clubId,
    loanedFromClubId: null,
    primaryPosition: position,
    secondaryPositions,
    attributes,
    overall,
    potential,
    contractEndSeason: currentSeason + rng.nextInt(2, 5),
    weeklyWage,
    marketValue,
    releaseClause: Math.round(marketValue * 1.45),
    agentFeePct: 8,
    internationalApps: 0,
    internationalGoals: 0,
    careerHistory: [],
    fitness: rng.nextInt(92, 100),
    morale: rng.nextInt(74, 92),
    form: rng.nextInt(6, 8),
    injuryWeeks: 0,
    roleExpectation:
      overall >= baseClubReputation + 3
        ? 'star'
        : overall >= baseClubReputation - 2
          ? 'starter'
          : age <= 20
            ? 'prospect'
            : 'rotation',
    transferListed: false,
    transferRequested: false,
    isYouth,
    seasonGrowth: 0,
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

export function autoPickLineupForClub(
  formation: FormationCode,
  clubPlayers: Player[]
): { startingXI: string[]; substitutes: string[]; reserves: string[] } {
  const slots = FORMATION_SLOTS[formation];
  const available = clubPlayers.filter((p) => !p.isYouth && p.injuryWeeks === 0);
  const usedIds = new Set<string>();
  const startingXI: string[] = [];

  // Slot 0 is always GK
  const gks = available
    .filter((p) => p.primaryPosition === 'GK')
    .sort((a, b) => b.overall - a.overall);
  const allGks = clubPlayers
    .filter((p) => p.primaryPosition === 'GK')
    .sort((a, b) => b.overall - a.overall);

  const starterGk = gks[0] ?? allGks[0] ?? clubPlayers[0];
  startingXI.push(starterGk.id);
  usedIds.add(starterGk.id);

  // Pick outfield slots 1..10
  for (let i = 1; i < slots.length; i++) {
    const slotPos = slots[i].position;
    const candidates = available
      .filter((p) => !usedIds.has(p.id) && p.primaryPosition !== 'GK')
      .sort((a, b) => {
        const aExact = a.primaryPosition === slotPos ? 8 : a.secondaryPositions.includes(slotPos) ? 4 : 0;
        const bExact = b.primaryPosition === slotPos ? 8 : b.secondaryPositions.includes(slotPos) ? 4 : 0;
        return b.overall + bExact - (a.overall + aExact);
      });

    const chosen =
      candidates[0] ??
      clubPlayers.find((p) => !usedIds.has(p.id) && p.primaryPosition !== 'GK') ??
      clubPlayers.find((p) => !usedIds.has(p.id))!;

    startingXI.push(chosen.id);
    usedIds.add(chosen.id);
  }

  // Pick 7 substitutes (1 backup GK + 6 best outfielders)
  const substitutes: string[] = [];
  const backupGk = available.find((p) => !usedIds.has(p.id) && p.primaryPosition === 'GK');
  if (backupGk) {
    substitutes.push(backupGk.id);
    usedIds.add(backupGk.id);
  }

  const remainingOutfield = available
    .filter((p) => !usedIds.has(p.id))
    .sort((a, b) => b.overall - a.overall);

  for (const p of remainingOutfield) {
    if (substitutes.length >= 7) break;
    substitutes.push(p.id);
    usedIds.add(p.id);
  }

  const reserves = clubPlayers.filter((p) => !usedIds.has(p.id)).map((p) => p.id);

  return { startingXI, substitutes, reserves };
}

export function selectActiveSimulationClubSeeds(selectedClubId: string): RealClubSeed[] {
  const isFlagshipClub = REAL_WORLD_CLUBS.some((c) => c.id === selectedClubId);
  if (isFlagshipClub) {
    return REAL_WORLD_CLUBS;
  }

  const chosenClub = GLOBAL_CLUBS_REGISTRY.find((c) => c.id === selectedClubId);
  if (!chosenClub) {
    return REAL_WORLD_CLUBS;
  }

  const countryClubs = GLOBAL_CLUBS_REGISTRY.filter((c) => c.countryId === chosenClub.countryId);
  const countryDiv1 = countryClubs
    .filter((c) => c.division === 1 && c.id !== chosenClub.id)
    .sort((a, b) => b.reputation - a.reputation);
  const countryDiv2 = countryClubs
    .filter((c) => c.division === 2 && c.id !== chosenClub.id)
    .sort((a, b) => b.reputation - a.reputation);

  const tier1Pool: RealClubSeed[] = [];
  const tier2Pool: RealClubSeed[] = [];

  if (chosenClub.division === 1) {
    tier1Pool.push(chosenClub);
  } else {
    tier2Pool.push(chosenClub);
  }

  for (const c of countryDiv1) {
    if (tier1Pool.length >= 10) break;
    tier1Pool.push(c);
  }
  for (const c of countryDiv2) {
    if (tier2Pool.length >= 10) break;
    tier2Pool.push(c);
  }

  // Fallback fill from REAL_WORLD_CLUBS if a country has fewer than 10 clubs in a division
  for (const c of REAL_WORLD_CLUBS) {
    if (c.division === 1 && tier1Pool.length < 10 && !tier1Pool.some((x) => x.id === c.id)) {
      tier1Pool.push(c);
    }
    if (c.division === 2 && tier2Pool.length < 10 && !tier2Pool.some((x) => x.id === c.id)) {
      tier2Pool.push(c);
    }
  }

  return [...tier1Pool.slice(0, 10), ...tier2Pool.slice(0, 10)];
}

export function generateInitialGameState(
  worldSeed: number,
  manager: ManagerProfile
): GameState {
  const rng = createRng(worldSeed);
  const currentSeason = 2026;
  const clubs: Club[] = [];
  const players: Player[] = [];

  let playerCounter = 1;
  const activeClubSeeds = selectActiveSimulationClubSeeds(manager.clubId);

  for (const clubSeed of activeClubSeeds) {
    const clubPlayers: Player[] = [];

    // Populate all 25 real senior footballers for this club
    for (const tuple of clubSeed.squad) {
      const [firstName, lastName, pos, age, targetOvr, nationality, shirtNumber, foot, heightCm, intlCaps] = tuple;
      const pId = `player-${playerCounter++}`;
      const pRng = createRng((worldSeed ^ hashStringToSeed(`${clubSeed.id}-${firstName}-${lastName}`)) >>> 0);

      const rawAttrs = generatePlayerAttributes(pRng, pos, targetOvr - 4);
      const computedOvr = calculateOverallRating(rawAttrs, pos);
      const ovrDelta = targetOvr - computedOvr;

      // Fine-tune attributes so overall matches the real footballer's calibrated rating
      const attributes = { ...rawAttrs };
      for (const k of Object.keys(attributes) as (keyof PlayerAttributes)[]) {
        attributes[k] = clampAttr(attributes[k] + ovrDelta);
      }
      const overall = calculateOverallRating(attributes, pos);
      const agePotentialBonus = age <= 20 ? 9 : age <= 23 ? 5 : age <= 26 ? 2 : 0;
      const potential = Math.min(95, Math.max(overall, targetOvr + agePotentialBonus));

      const marketValue = calculateMarketValue(overall, age, potential);
      const weeklyWage = calculateWeeklyWage(overall, age);
      const possibleSecondaries = SECONDARY_MAP[pos];
      const secondaryPositions = possibleSecondaries.length > 0 ? [possibleSecondaries[0]] : [];

      const birthMonth = ((playerCounter % 12) + 1).toString().padStart(2, '0');
      const birthDay = (((playerCounter * 3) % 27) + 1).toString().padStart(2, '0');
      const photoMeta = getPlayerPhotoManifest(firstName, lastName);

      const realPlayer: Player = {
        id: pId,
        firstName,
        lastName,
        age,
        dateOfBirth: `${currentSeason - age}-${birthMonth}-${birthDay}`,
        heightCm,
        preferredFoot: foot,
        shirtNumber,
        nationality,
        clubId: clubSeed.id,
        loanedFromClubId: null,
        primaryPosition: pos,
        secondaryPositions,
        attributes,
        overall,
        potential,
        contractEndSeason: currentSeason + ((playerCounter % 4) + 1),
        weeklyWage,
        marketValue,
        releaseClause: Math.round(marketValue * 1.45),
        agentFeePct: overall >= 85 ? 12 : 8,
        internationalApps: intlCaps,
        internationalGoals: pos === 'ST' || pos === 'LW' || pos === 'RW' ? Math.round(intlCaps * 0.35) : Math.round(intlCaps * 0.08),
        photoUrl: photoMeta?.url,
        photoAssetId: photoMeta ? `photo-${firstName.toLowerCase()}-${lastName.toLowerCase()}` : undefined,
        careerHistory: [
          {
            season: '2024/25',
            clubId: clubSeed.id,
            clubName: clubSeed.name,
            appearances: Math.max(8, Math.min(38, 22 + (playerCounter % 15))),
            goals: pos === 'ST' ? 14 : pos === 'LW' || pos === 'RW' ? 8 : pos === 'CAM' ? 6 : 2,
            assists: pos === 'CAM' || pos === 'LW' || pos === 'RW' ? 7 : 3,
          },
        ],
        fitness: rng.nextInt(93, 100),
        morale: rng.nextInt(76, 92),
        form: rng.nextInt(6, 8),
        injuryWeeks: 0,
        roleExpectation:
          overall >= clubSeed.reputation + 1
            ? 'star'
            : overall >= clubSeed.reputation - 4
              ? 'starter'
              : age <= 21
                ? 'prospect'
                : 'rotation',
        transferListed: false,
        transferRequested: false,
        isYouth: false,
        seasonGrowth: 0,
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

      clubPlayers.push(realPlayer);
      players.push(realPlayer);
    }

    // Plus 3 youth academy prospects per club
    const youthPositions: PositionCode[] = ['CM', 'LW', 'ST'];
    for (const yPos of youthPositions) {
      const yId = `youth-${clubSeed.id}-${yPos}-${playerCounter++}`;
      const youthPlayer = generatePlayer(rng, yId, clubSeed.id, yPos, clubSeed.reputation, currentSeason, true);
      clubPlayers.push(youthPlayer);
      players.push(youthPlayer);
    }

    const formation =
      clubSeed.id === manager.clubId && manager.tacticalStyle === 'tikiTaka'
        ? '4-3-3'
        : clubSeed.defaultFormation;

    const { startingXI, substitutes, reserves } = autoPickLineupForClub(formation, clubPlayers);
    const currentWageBillWeekly = clubPlayers.reduce((sum, p) => sum + p.weeklyWage, 0);

    // Pick captain & vice-captain by highest leadership among starters
    const sortedLeaders = [...clubPlayers]
      .filter((p) => startingXI.includes(p.id))
      .sort((a, b) => b.attributes.leadership + b.age - (a.attributes.leadership + a.age));

    const isDiv1 = clubSeed.division === 1;
    let transferBudget = isDiv1
      ? Math.round((clubSeed.reputation - 55) * 1800000)
      : Math.round((clubSeed.reputation - 45) * 750000);

    if (clubSeed.id === manager.clubId) {
      if (manager.startingChallenge === 'financialCrisis') {
        transferBudget = Math.round(transferBudget * 0.25);
      } else if (manager.difficulty === 'relaxed') {
        transferBudget = Math.round(transferBudget * 1.35);
      } else if (manager.difficulty === 'hardcore') {
        transferBudget = Math.round(transferBudget * 0.7);
      }
    }

    const club: Club = {
      id: clubSeed.id,
      name: clubSeed.name,
      shortName: clubSeed.shortName,
      division: clubSeed.division,
      countryId: clubSeed.countryId,
      city: clubSeed.city,
      leagueId: clubSeed.leagueId,
      foundedYear: clubSeed.foundedYear,
      financialStatus: clubSeed.financialStatus,
      managerName: clubSeed.id === manager.clubId ? manager.name : clubSeed.managerName,
      rivalClubIds: clubSeed.rivalClubIds,
      clubHistory: clubSeed.clubHistory,
      badgeAssetId: `crest-${clubSeed.id}`,
      captainId: sortedLeaders[0]?.id,
      viceCaptainId: sortedLeaders[1]?.id,
      primaryColor: clubSeed.primaryColor,
      secondaryColor: clubSeed.secondaryColor,
      stadiumName: clubSeed.stadiumName,
      stadiumCapacity: clubSeed.stadiumCapacity,
      reputation: clubSeed.reputation,
      tactics: {
        formation,
        attackingStyle:
          clubSeed.id === manager.clubId
            ? manager.tacticalStyle
            : rng.pick(['possession', 'wingPlay', 'directCounter', 'balanced']),
        pressing: rng.pick(['medium', 'high']),
        defensiveLine: 'standard',
        width: 55,
        tempo: 60,
        directness: 50,
        mentality: 'balanced',
        counterPressing: true,
        offsideTrap: false,
      },
      startingXI,
      substitutes,
      reserves,
      training: {
        monday: 'fitness',
        tuesday: 'tactical',
        wednesday: 'passing',
        thursday: 'attacking',
        friday: 'defending',
        intensity: 'balanced',
      },
      finances: {
        transferBudget,
        wageBudgetWeekly: Math.round(currentWageBillWeekly * 1.25),
        currentWageBillWeekly,
        cashBalance: transferBudget + 8000000,
        matchdayRevenuePerHomeGame: clubSeed.stadiumCapacity * 38,
        weeklySponsorIncome: isDiv1 ? 450000 : 185000,
        weeklyStaffAndStadiumCost: isDiv1 ? 185000 : 75000,
        seasonPrizeMoneyEarned: 0,
        ledger: [
          {
            id: `tx-init-${clubSeed.id}`,
            week: 1,
            season: currentSeason,
            category: 'sponsorship',
            description: 'Initial Season Broadcast & Commercial Partner Advance',
            amount: isDiv1 ? 3500000 : 1250000,
          },
        ],
      },
    };

    clubs.push(club);
  }

  const fixtures = generateSeasonFixtures(clubs, currentSeason, worldSeed);

  const scouts: Scout[] = [
    {
      id: 'scout-1',
      name: 'Monchi Rodríguez',
      nationality: 'Spain',
      rating: 88,
      assignedRegion: 'Western Europe',
      assignedPosition: 'ALL',
    },
    {
      id: 'scout-2',
      name: 'Juni Calafat',
      nationality: 'Brazil',
      rating: 90,
      assignedRegion: 'South America',
      assignedPosition: 'ST',
    },
    {
      id: 'scout-3',
      name: 'Paul Mitchell',
      nationality: 'England',
      rating: 84,
      assignedRegion: 'Domestic League',
      assignedPosition: 'CM',
    },
  ];

  const userClub = clubs.find((c) => c.id === manager.clubId) ?? clubs[0];
  const divClubs = clubs
    .filter((c) => c.division === userClub.division)
    .sort((a, b) => b.reputation - a.reputation);
  const rankIdx = divClubs.findIndex((c) => c.id === userClub.id);
  const targetLeaguePosition =
    manager.startingChallenge === 'titleOrBust' ? 1 : Math.max(1, Math.min(8, rankIdx + 2));

  // Populate spokenLanguages, personality, and tacticalRole on all generated players without consuming rng
  const enrichedPlayers = players.map((p) => ({
    ...p,
    spokenLanguages: p.spokenLanguages ?? deriveSpokenLanguagesForNationality(p.nationality),
    personality: p.personality ?? resolvePlayerPersonality(p),
    tacticalRole: p.tacticalRole ?? resolvePlayerTacticalRole(p, p.primaryPosition),
  }));

  const userClubPlayers = enrichedPlayers.filter((p) => p.clubId === userClub.id);
  const initialEconomy = createInitialEconomyState(
    userClub,
    userClubPlayers,
    worldSeed,
    currentSeason,
    1
  );

  const careerType = manager.careerType ?? 'real_club';
  const origCfg = careerType === 'original_team' ? manager.originalClubConfig : undefined;
  const finalClubs = origCfg
    ? clubs.map((c) =>
        c.id === userClub.id
          ? {
              ...c,
              name: origCfg.name || c.name,
              shortName: origCfg.shortName || c.shortName,
              primaryColor: origCfg.primaryColor || c.primaryColor,
              secondaryColor: origCfg.secondaryColor || c.secondaryColor,
              stadiumName: origCfg.stadiumName || c.stadiumName,
              stadiumCapacity: 2000,
              reputation: 48,
            }
          : c
      )
    : clubs;
  const finalUserClub = finalClubs.find((c) => c.id === userClub.id) ?? userClub;

  return {
    saveVersion: 2,
    worldSeed,
    careerType,
    currentSeason,
    currentWeek: 1,
    maxWeeksPerSeason: 22,
    manager: {
      ...manager,
      careerType,
      clubId: finalUserClub.id,
    },
    clubs: finalClubs,
    players: enrichedPlayers,
    fixtures,
    shortlistPlayerIds: [],
    scouts,
    scoutingReports: [],
    board: {
      confidence: 82,
      targetLeaguePosition,
      targetCupRound: 'Quarter-Final',
      wageBudgetStrictness: 75,
      expectationsText:
        manager.startingChallenge === 'titleOrBust'
          ? 'Win the league title this season at all costs.'
          : `Finish inside the Top ${targetLeaguePosition} of ${finalUserClub.division === 1 ? 'Tier 1' : 'Tier 2'} and compete deep into the Cup.`,
      warningsCount: 0,
      isSacked: false,
    },
    transfers: [],
    trophies: [],
    seasonHistory: [],
    news: [
      {
        id: 'news-welcome',
        week: 1,
        season: currentSeason,
        title: `${manager.name} appointed manager of ${finalUserClub.name}`,
        body: `Supporters at ${finalUserClub.stadiumName} (${finalUserClub.city}) welcome ${manager.name} ahead of the ${currentSeason}/${currentSeason + 1} campaign. The board expects a Top ${targetLeaguePosition} finish.`,
        category: 'board',
      },
    ],
    economy: initialEconomy,
    clubEmpire:
      careerType === 'original_team'
        ? createInitialClubEmpireState(`career-${worldSeed}-${finalUserClub.id}`)
        : undefined,
  };
}
