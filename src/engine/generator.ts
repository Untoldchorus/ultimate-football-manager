import { createInitialEconomyState } from './boosterEconomy';
import { createInitialClubEmpireState } from './clubEmpireEngine';
import { replaceClubInCareer } from './originalClubEngine';
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
  PlayerPlayStyle,
  PositionCode,
  RatingDataSource,
  Scout,
  WorkRateLevel,
} from './types';
import { generateSeasonFixtures } from './fixtures';
import { REAL_WORLD_CLUBS, RealClubSeed } from '@/data/realWorldDatabase';
import { GLOBAL_CLUBS_REGISTRY } from '@/data/globalClubsRegistry';
import { COMPETITIONS_REGISTRY } from '@/data/competitionsRegistry';
import { getPlayerPhotoManifest } from '@/data/assetManifest';
import {
  generateCalibratedAbilityProfile,
  VERIFIED_STAR_PROFILES,
} from '@/data/playerAbilityDatabase';
import { createPlayStyle } from '@/data/playStylesCatalog';

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
  const base = (offset: number, spread = 4) =>
    clampAttr(targetSkill + offset + rng.nextInt(-spread, spread));

  const isGK = position === 'GK';
  const isCB = position === 'CB';
  const isFB = position === 'LB' || position === 'RB';
  const isDM = position === 'CDM';
  const isCM = position === 'CM';
  const isAM = position === 'CAM';
  const isWing = position === 'LW' || position === 'RW';
  const isST = position === 'ST';

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
    diving = base(1);
    handling = base(0);
    kicking = base(-2);
    reflexes = base(2);
    gkPositioning = base(1);

    acceleration = clampAttr(42 + rng.nextInt(-10, 10));
    sprintSpeed = clampAttr(44 + rng.nextInt(-10, 10));
    positioning = base(-40);
    finishing = base(-50);
    shotPower = base(-20);
    longShots = base(-50);
    volleys = base(-50);
    penalties = base(-40);
    vision = base(-25);
    crossing = base(-45);
    freeKicks = base(-45);
    shortPassing = base(-20);
    longPassing = base(-15);
    curve = base(-45);
    agility = base(-30);
    balance = base(-30);
    reactions = base(2);
    ballControl = base(-35);
    dribbling = base(-40);
    composure = base(-10);
    interceptions = base(-45);
    headingAccuracy = base(-30);
    defensiveAwareness = base(-45);
    standingTackle = base(-45);
    slidingTackle = base(-50);
    jumping = base(2);
    stamina = base(-25);
    strength = base(0);
    aggression = base(-20);
  } else {
    // Pace
    const paceBonus = isWing ? 7 : isFB ? 5 : isST ? 4 : isCB ? -3 : 0;
    acceleration = base(paceBonus);
    sprintSpeed = base(paceBonus);

    // Shooting
    positioning = base(isST ? 6 : isWing || isAM ? 4 : isCB ? -20 : -5);
    finishing = base(isST ? 7 : isWing ? 3 : isAM ? 2 : isCB ? -25 : -8);
    shotPower = base(isST ? 5 : isAM || isWing ? 4 : isCB ? -6 : 0);
    longShots = base(isAM ? 6 : isST || isWing ? 4 : isCM ? 3 : -10);
    volleys = base(isST ? 5 : isWing || isAM ? 2 : -10);
    penalties = base(isST ? 5 : isAM ? 2 : -8);

    // Passing
    vision = base(isAM ? 7 : isCM ? 5 : isWing ? 2 : isCB ? -12 : 0);
    crossing = base(isWing ? 7 : isFB ? 6 : isCM ? 0 : -15);
    freeKicks = base(isAM || isWing ? 3 : -10);
    shortPassing = base(isCM || isAM ? 7 : isDM ? 5 : isFB || isWing ? 2 : isCB ? -3 : 0);
    longPassing = base(isCM ? 6 : isDM || isAM ? 4 : isCB ? 2 : -8);
    curve = base(isWing || isAM ? 5 : -8);

    // Dribbling
    agility = base(isWing ? 7 : isAM ? 4 : isCB ? -6 : 0);
    balance = base(isWing ? 5 : isCB ? -6 : 0);
    reactions = base(2);
    ballControl = base(isAM || isWing || isST ? 6 : isCM ? 4 : isCB ? -4 : 0);
    dribbling = base(isWing ? 7 : isAM ? 5 : isST ? 3 : isCB ? -14 : 0);
    composure = base(isST || isAM || isCB ? 4 : 2);

    // Defending
    interceptions = base(isDM ? 7 : isCB ? 6 : isFB ? 4 : isCM ? 0 : -20);
    headingAccuracy = base(isCB ? 7 : isST ? 5 : -8);
    defensiveAwareness = base(isCB ? 7 : isDM ? 6 : isFB ? 5 : -20);
    standingTackle = base(isCB ? 8 : isDM ? 7 : isFB ? 6 : -20);
    slidingTackle = base(isCB ? 7 : isFB ? 6 : isDM ? 5 : -22);

    // Physicality
    jumping = base(isCB ? 6 : isST ? 4 : 0);
    stamina = base(isFB || isCM || isDM ? 6 : 2);
    strength = base(isCB || isST ? 7 : isDM ? 5 : isWing ? -6 : 0);
    aggression = base(isCB || isDM ? 6 : -4);
  }

  const decisions = base(2);
  const leadership = clampAttr(45 + rng.nextInt(0, 46));
  const workRate = clampAttr(58 + rng.nextInt(-8, 34));
  const anticipation = clampAttr((positioning + decisions) / 2);

  return {
    acceleration,
    sprintSpeed,
    pace: Math.round((acceleration + sprintSpeed) / 2),
    positioning,
    finishing,
    shotPower,
    longShots,
    volleys,
    penalties,
    shooting: Math.round((finishing * 0.45 + shotPower * 0.25 + longShots * 0.3)),
    vision,
    crossing,
    freeKicks,
    shortPassing,
    longPassing,
    curve,
    passing: Math.round((shortPassing * 0.5 + vision * 0.3 + longPassing * 0.2)),
    agility,
    balance,
    reactions,
    ballControl,
    dribbling,
    composure,
    firstTouch: ballControl,
    interceptions,
    headingAccuracy,
    heading: headingAccuracy,
    defensiveAwareness,
    marking: defensiveAwareness,
    standingTackle,
    slidingTackle,
    tackling: standingTackle,
    jumping,
    stamina,
    strength,
    aggression,
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
    aerialAbility: Math.round((handling + jumping) / 2),
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
  const isW = position === 'LW' || position === 'RW';
  const isM = position === 'CAM' || position === 'CM';
  const isD = position === 'CB' || position === 'CDM' || position === 'LB' || position === 'RB';
  const isG = position === 'GK';

  const weakFoot = rng.chance(0.12) ? 5 : rng.chance(0.38) ? 4 : rng.chance(0.18) ? 2 : 3;
  const skillMoves = isG ? 1 : isW || isM ? (rng.chance(0.25) ? 5 : rng.chance(0.5) ? 4 : 3) : position === 'ST' ? (rng.chance(0.35) ? 4 : 3) : isD ? 2 : 3;
  const attackingWorkRate: WorkRateLevel = isW || position === 'ST' || position === 'CAM' ? 'High' : isD ? 'Low' : 'Medium';
  const defensiveWorkRate: WorkRateLevel = isD ? 'High' : isW || position === 'ST' ? 'Low' : 'Medium';

  return {
    id,
    firstName,
    lastName,
    age,
    dateOfBirth: `${birthYear}-05-14`,
    heightCm: position === 'GK' || position === 'CB' ? rng.nextInt(185, 197) : rng.nextInt(171, 187),
    preferredFoot: position === 'LB' || position === 'LW' ? 'Left' : 'Right',
    weakFoot,
    skillMoves,
    attackingWorkRate,
    defensiveWorkRate,
    workRates: { attacking: attackingWorkRate, defensive: defensiveWorkRate },
    traits: [],
    playStyles: [],
    ratingDataSource: 'procedural_estimated',
    scoutingAccuracy: 70,
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
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];
  const healthy = clubPlayers.filter((p) => !p.isYouth && (p.injuryWeeks ?? 0) === 0);
  const available = healthy.length >= 11 ? healthy : clubPlayers.filter((p) => (p.injuryWeeks ?? 0) === 0);
  const candidatePool = available.length >= 11 ? available : clubPlayers;
  const usedIds = new Set<string>();
  const startingXI: string[] = [];

  // Slot 0 is always GK
  const gks = candidatePool
    .filter((p) => p.primaryPosition === 'GK')
    .sort((a, b) => b.overall - a.overall);
  const allGks = clubPlayers
    .filter((p) => p.primaryPosition === 'GK')
    .sort((a, b) => b.overall - a.overall);

  const starterGk = gks[0] ?? allGks[0] ?? clubPlayers[0];
  if (starterGk) {
    startingXI.push(starterGk.id);
    usedIds.add(starterGk.id);
  }

  // Pick outfield slots 1..10
  for (let i = 1; i < slots.length; i++) {
    const slotPos = slots[i].position;
    const candidates = candidatePool
      .filter((p) => !usedIds.has(p.id) && p.primaryPosition !== 'GK')
      .sort((a, b) => {
        const aExact = a.primaryPosition === slotPos ? 8 : (a.secondaryPositions ?? []).includes(slotPos) ? 4 : 0;
        const bExact = b.primaryPosition === slotPos ? 8 : (b.secondaryPositions ?? []).includes(slotPos) ? 4 : 0;
        return b.overall + bExact - (a.overall + aExact);
      });

    const chosen =
      candidates[0] ??
      clubPlayers.find((p) => !usedIds.has(p.id) && p.primaryPosition !== 'GK') ??
      clubPlayers.find((p) => !usedIds.has(p.id));

    if (chosen) {
      startingXI.push(chosen.id);
      usedIds.add(chosen.id);
    }
  }

  // Pick 7 substitutes (1 backup GK + 6 best outfielders)
  const substitutes: string[] = [];
  const backupGk =
    candidatePool.find((p) => !usedIds.has(p.id) && p.primaryPosition === 'GK') ??
    clubPlayers.find((p) => !usedIds.has(p.id) && p.primaryPosition === 'GK');
  if (backupGk) {
    substitutes.push(backupGk.id);
    usedIds.add(backupGk.id);
  }

  // Next prioritize best remaining healthy players, then any remaining club players
  const subCandidates = [
    ...candidatePool.filter((p) => !usedIds.has(p.id)),
    ...clubPlayers.filter((p) => !usedIds.has(p.id)),
  ];
  const seenSubCandidateIds = new Set<string>();
  const remainingOutfield: Player[] = [];
  for (const p of subCandidates) {
    if (!usedIds.has(p.id) && !seenSubCandidateIds.has(p.id)) {
      seenSubCandidateIds.add(p.id);
      remainingOutfield.push(p);
    }
  }
  remainingOutfield.sort((a, b) => b.overall - a.overall);

  for (const p of remainingOutfield) {
    if (substitutes.length >= 7) break;
    substitutes.push(p.id);
    usedIds.add(p.id);
  }

  const reserves = clubPlayers.filter((p) => !usedIds.has(p.id)).map((p) => p.id);

  return { startingXI, substitutes, reserves };
}

export function selectActiveSimulationClubSeeds(selectedClubId: string): RealClubSeed[] {
  // Find chosen club either in GLOBAL_CLUBS_REGISTRY or REAL_WORLD_CLUBS
  const chosenClub =
    GLOBAL_CLUBS_REGISTRY.find((c) => c.id === selectedClubId) ??
    REAL_WORLD_CLUBS.find((c) => c.id === selectedClubId) ??
    GLOBAL_CLUBS_REGISTRY[0];

  const targetCountryId = chosenClub.countryId || 'ENG';
  const t1Comp = COMPETITIONS_REGISTRY.find((c) => c.countryId === targetCountryId && c.tier === 1);
  const t2Comp = COMPETITIONS_REGISTRY.find((c) => c.countryId === targetCountryId && c.tier === 2);

  // Retrieve clubs strictly from that country to maintain 100% domestic league purity
  const countryClubs = GLOBAL_CLUBS_REGISTRY.filter((c) => c.countryId === targetCountryId);
  const countryDiv1 = countryClubs
    .filter((c) => c.division === 1 && c.id !== chosenClub.id)
    .sort((a, b) => b.reputation - a.reputation);
  const countryDiv2 = countryClubs
    .filter((c) => c.division === 2 && c.id !== chosenClub.id)
    .sort((a, b) => b.reputation - a.reputation);

  const tier1Pool: RealClubSeed[] = [];
  const tier2Pool: RealClubSeed[] = [];

  if (chosenClub.division === 1) {
    tier1Pool.push({
      ...chosenClub,
      division: 1,
      leagueId: t1Comp?.id ?? chosenClub.leagueId ?? 'division1',
    });
  } else {
    tier2Pool.push({
      ...chosenClub,
      division: 2,
      leagueId: t2Comp?.id ?? chosenClub.leagueId ?? 'division2',
    });
  }

  for (const c of countryDiv1) {
    if (tier1Pool.length >= 10) break;
    tier1Pool.push({
      ...c,
      division: 1,
      leagueId: t1Comp?.id ?? c.leagueId ?? 'division1',
    });
  }
  for (const c of countryDiv2) {
    if (tier2Pool.length >= 10) break;
    tier2Pool.push({
      ...c,
      division: 2,
      leagueId: t2Comp?.id ?? c.leagueId ?? 'division2',
    });
  }

  // Defensive fallback: If a country has fewer than 10 clubs in a division,
  // NEVER cross country borders! Clone within that nation with distinct IDs
  if (tier1Pool.length < 10) {
    const existing = [...tier1Pool];
    let cloneCounter = 1;
    while (tier1Pool.length < 10 && existing.length > 0) {
      const src = existing[(cloneCounter - 1) % existing.length];
      tier1Pool.push({
        ...src,
        id: `${src.id}-reg-${cloneCounter++}`,
        name: `${src.name} Rovers`,
        shortName: `${src.shortName}R`.slice(0, 4),
        division: 1,
        countryId: targetCountryId,
        leagueId: t1Comp?.id ?? 'division1',
      });
    }
  }

  if (tier2Pool.length < 10) {
    const existing = [...tier2Pool];
    let cloneCounter = 1;
    while (tier2Pool.length < 10 && existing.length > 0) {
      const src = existing[(cloneCounter - 1) % existing.length];
      tier2Pool.push({
        ...src,
        id: `${src.id}-reg-${cloneCounter++}`,
        name: `${src.name} Athletic`,
        shortName: `${src.shortName}A`.slice(0, 4),
        division: 2,
        countryId: targetCountryId,
        leagueId: t2Comp?.id ?? 'division2',
      });
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

      const fullName = `${firstName} ${lastName}`.trim();
      const verifiedProfile = VERIFIED_STAR_PROFILES[fullName];

      let attributes: PlayerAttributes;
      let overall: number;
      let potential: number;
      let weakFoot: number;
      let skillMoves: number;
      let preferredFoot: 'Right' | 'Left' | 'Both' = foot;
      let attWr: WorkRateLevel;
      let defWr: WorkRateLevel;
      let traits: string[];
      let playStyles: PlayerPlayStyle[];
      let ratingDataSource: RatingDataSource;
      let scoutingAccuracy: number;

      if (verifiedProfile) {
        attributes = { ...verifiedProfile.attributes };
        overall = verifiedProfile.overall;
        potential = verifiedProfile.potential;
        weakFoot = verifiedProfile.weakFoot;
        skillMoves = verifiedProfile.skillMoves;
        preferredFoot = verifiedProfile.preferredFoot;
        attWr = verifiedProfile.attackingWorkRate;
        defWr = verifiedProfile.defensiveWorkRate;
        traits = [...verifiedProfile.traits];
        playStyles = verifiedProfile.playStyles
          .map((ps) => createPlayStyle(ps.id, ps.tier))
          .filter((p): p is PlayerPlayStyle => !!p);
        ratingDataSource = 'verified_scouted';
        scoutingAccuracy = 99;
      } else {
        const calibrated = generateCalibratedAbilityProfile(
          pos,
          targetOvr,
          age,
          foot,
          heightCm,
          pRng
        );
        attributes = calibrated.attributes;
        overall = calculateOverallRating(attributes, pos);
        const agePotentialBonus = age <= 20 ? 9 : age <= 23 ? 5 : age <= 26 ? 2 : 0;
        potential = Math.min(95, Math.max(overall, targetOvr + agePotentialBonus));
        weakFoot = calibrated.weakFoot;
        skillMoves = calibrated.skillMoves;
        preferredFoot = calibrated.preferredFoot;
        attWr = calibrated.attackingWorkRate;
        defWr = calibrated.defensiveWorkRate;
        traits = calibrated.traits;
        playStyles = calibrated.playStyles;
        ratingDataSource = 'calibrated_model';
        scoutingAccuracy = calibrated.scoutingAccuracy;
      }

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
        preferredFoot,
        weakFoot,
        skillMoves,
        attackingWorkRate: attWr,
        defensiveWorkRate: defWr,
        workRates: { attacking: attWr, defensive: defWr },
        traits,
        playStyles,
        ratingDataSource,
        scoutingAccuracy,
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

  let finalClubs = clubs;
  let finalPlayers: Player[] = enrichedPlayers;
  let finalUserClub = userClub;

  if (careerType === 'original_team' && origCfg) {
    const replacement = replaceClubInCareer(
      clubs,
      enrichedPlayers,
      userClub.id,
      {
        name: origCfg.name || 'FC Nova',
        shortName: origCfg.shortName || 'NOV',
        country: userClub.countryId || manager.nationality || 'England',
        city: userClub.city || 'Capital City',
        primaryColor: origCfg.primaryColor || '#84cc16',
        secondaryColor: origCfg.secondaryColor || '#070a12',
        stadiumName: origCfg.stadiumName || 'Nova Arena',
        stadiumCapacity: 5000,
      },
      worldSeed,
      true
    );
    finalClubs = replacement.updatedClubs;
    finalPlayers = replacement.updatedPlayers;
    finalUserClub = replacement.newClub;
  }

  const resolvedEnrichedPlayers = finalPlayers.map((p) => ({
    ...p,
    spokenLanguages: p.spokenLanguages ?? deriveSpokenLanguagesForNationality(p.nationality),
    personality: p.personality ?? resolvePlayerPersonality(p),
    tacticalRole: p.tacticalRole ?? resolvePlayerTacticalRole(p, p.primaryPosition),
  }));

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
    players: resolvedEnrichedPlayers,
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
