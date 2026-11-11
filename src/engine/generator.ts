import { createRng, SeededRng } from './rng';
import {
  calculateMarketValue,
  calculateOverallRating,
  calculateWeeklyWage,
  FORMATION_SLOTS,
} from './ratings';
import {
  Club,
  FormationCode,
  GameState,
  ManagerProfile,
  Player,
  PlayerAttributes,
  PositionCode,
  Scout,
} from './types';
import { generateSeasonFixtures } from './fixtures';

export interface ClubPreset {
  id: string;
  name: string;
  shortName: string;
  division: 1 | 2;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  stadiumCapacity: number;
  reputation: number;
  defaultFormation: FormationCode;
}

export const CLUB_PRESETS: ClubPreset[] = [
  // Division 1 (10 clubs)
  {
    id: 'club-albion',
    name: 'Northgate Albion',
    shortName: 'NGA',
    division: 1,
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff',
    stadiumName: 'Crown Park Stadium',
    stadiumCapacity: 62000,
    reputation: 88,
    defaultFormation: '4-3-3',
  },
  {
    id: 'club-harbour',
    name: 'Port Royale Athletic',
    shortName: 'PRA',
    division: 1,
    primaryColor: '#0284c7',
    secondaryColor: '#facc15',
    stadiumName: 'Harbourfront Arena',
    stadiumCapacity: 58000,
    reputation: 86,
    defaultFormation: '4-2-3-1',
  },
  {
    id: 'club-ironworks',
    name: 'Vulcan United',
    shortName: 'VUL',
    division: 1,
    primaryColor: '#7c2d12',
    secondaryColor: '#38bdf8',
    stadiumName: 'Foundry Ground',
    stadiumCapacity: 51000,
    reputation: 82,
    defaultFormation: '4-3-3',
  },
  {
    id: 'club-kingsbridge',
    name: 'Kingsbridge Rovers',
    shortName: 'KBR',
    division: 1,
    primaryColor: '#1e3a8a',
    secondaryColor: '#f8fafc',
    stadiumName: 'Royal Arch Stadium',
    stadiumCapacity: 48500,
    reputation: 80,
    defaultFormation: '4-4-2',
  },
  {
    id: 'club-emerald',
    name: 'Verdant City FC',
    shortName: 'VER',
    division: 1,
    primaryColor: '#059669',
    secondaryColor: '#fef08a',
    stadiumName: 'Emerald Meadow',
    stadiumCapacity: 45000,
    reputation: 78,
    defaultFormation: '3-4-3',
  },
  {
    id: 'club-solaris',
    name: 'Solaris Sporting',
    shortName: 'SOL',
    division: 1,
    primaryColor: '#ea580c',
    secondaryColor: '#111827',
    stadiumName: 'Helios Bowl',
    stadiumCapacity: 43000,
    reputation: 76,
    defaultFormation: '4-2-3-1',
  },
  {
    id: 'club-valkyrie',
    name: 'Valkyrie Forest',
    shortName: 'VKF',
    division: 1,
    primaryColor: '#4f46e5',
    secondaryColor: '#e0e7ff',
    stadiumName: 'Sherwood Citadel',
    stadiumCapacity: 39000,
    reputation: 74,
    defaultFormation: '3-5-2',
  },
  {
    id: 'club-blackwater',
    name: 'Blackwater Town',
    shortName: 'BWT',
    division: 1,
    primaryColor: '#1f2937',
    secondaryColor: '#f59e0b',
    stadiumName: 'Riverside Park',
    stadiumCapacity: 36000,
    reputation: 72,
    defaultFormation: '4-1-4-1',
  },
  {
    id: 'club-highland',
    name: 'Highland Thistle',
    shortName: 'HLT',
    division: 1,
    primaryColor: '#7e22ce',
    secondaryColor: '#ffffff',
    stadiumName: 'Glen Coe Arena',
    stadiumCapacity: 33500,
    reputation: 70,
    defaultFormation: '5-3-2',
  },
  {
    id: 'club-silverstone',
    name: 'Silverstone Wanderers',
    shortName: 'SLV',
    division: 1,
    primaryColor: '#475569',
    secondaryColor: '#22d3ee',
    stadiumName: 'Apex Stadium',
    stadiumCapacity: 31000,
    reputation: 68,
    defaultFormation: '4-4-2',
  },
  // Division 2 (10 clubs)
  {
    id: 'club-redcliff',
    name: 'Redcliff Dynamo',
    shortName: 'RCD',
    division: 2,
    primaryColor: '#b91c1c',
    secondaryColor: '#fde047',
    stadiumName: 'Cliffside Ground',
    stadiumCapacity: 28000,
    reputation: 65,
    defaultFormation: '4-3-3',
  },
  {
    id: 'club-oakheart',
    name: 'Oakheart County',
    shortName: 'OAK',
    division: 2,
    primaryColor: '#15803d',
    secondaryColor: '#ffffff',
    stadiumName: 'Old Oak Lane',
    stadiumCapacity: 26500,
    reputation: 63,
    defaultFormation: '4-4-2',
  },
  {
    id: 'club-stormhaven',
    name: 'Stormhaven Mariners',
    shortName: 'STM',
    division: 2,
    primaryColor: '#0f766e',
    secondaryColor: '#f1f5f9',
    stadiumName: 'Lighthouse Road',
    stadiumCapacity: 24000,
    reputation: 62,
    defaultFormation: '4-2-3-1',
  },
  {
    id: 'club-ashford',
    name: 'Ashford Railway',
    shortName: 'ASH',
    division: 2,
    primaryColor: '#991b1b',
    secondaryColor: '#1e293b',
    stadiumName: 'Junction Park',
    stadiumCapacity: 22500,
    reputation: 60,
    defaultFormation: '4-4-2',
  },
  {
    id: 'club-westminster',
    name: 'Westbrook Rangers',
    shortName: 'WBR',
    division: 2,
    primaryColor: '#2563eb',
    secondaryColor: '#ffffff',
    stadiumName: 'Westbrook Oval',
    stadiumCapacity: 21000,
    reputation: 59,
    defaultFormation: '3-5-2',
  },
  {
    id: 'club-cobalt',
    name: 'Cobalt Stars',
    shortName: 'COB',
    division: 2,
    primaryColor: '#1d4ed8',
    secondaryColor: '#fb923c',
    stadiumName: 'Starlight Field',
    stadiumCapacity: 19500,
    reputation: 58,
    defaultFormation: '4-3-3',
  },
  {
    id: 'club-amber',
    name: 'Amber Valley FC',
    shortName: 'AMB',
    division: 2,
    primaryColor: '#d97706',
    secondaryColor: '#0f172a',
    stadiumName: 'Sunburst Valley',
    stadiumCapacity: 18000,
    reputation: 56,
    defaultFormation: '4-1-4-1',
  },
  {
    id: 'club-granite',
    name: 'Granite Ridge',
    shortName: 'GRN',
    division: 2,
    primaryColor: '#334155',
    secondaryColor: '#10b981',
    stadiumName: 'Quarry Stadium',
    stadiumCapacity: 16500,
    reputation: 55,
    defaultFormation: '5-3-2',
  },
  {
    id: 'club-meadow',
    name: 'Meadowbrook Argyle',
    shortName: 'MBA',
    division: 2,
    primaryColor: '#047857',
    secondaryColor: '#ecfdf5',
    stadiumName: 'Greenbank Park',
    stadiumCapacity: 15000,
    reputation: 53,
    defaultFormation: '4-4-2',
  },
  {
    id: 'club-falcon',
    name: 'Falconcrest FC',
    shortName: 'FLC',
    division: 2,
    primaryColor: '#be123c',
    secondaryColor: '#f8fafc',
    stadiumName: 'Eyrie Ground',
    stadiumCapacity: 14000,
    reputation: 52,
    defaultFormation: '3-4-3',
  },
];

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
    first: ['Bastian', 'Emil', 'Fabian', 'Jonas', 'Kai', 'Leon', 'Lukas', 'maximilian', 'Niklas', 'robin', 'Tim', 'Yannick'],
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
    last: [' Endo', 'Fujimoto', 'Hashimoto', 'Ito', 'Kamada', 'Kubo', 'Minamino', 'Mitoma', 'Morita', 'Nakamura', 'Tanaka', 'Tomiyasu'],
  },
};

const NATIONALITIES = Object.keys(NATIONALITY_NAME_POOLS);

// 25-man squad position distribution per club
const SQUAD_POSITIONS_TEMPLATE: PositionCode[] = [
  'GK', 'GK', 'GK',
  'LB', 'LB',
  'CB', 'CB', 'CB', 'CB',
  'RB', 'RB',
  'CDM', 'CDM',
  'CM', 'CM', 'CM', 'CM',
  'CAM', 'CAM',
  'LW', 'LW',
  'RW', 'RW',
  'ST', 'ST',
];

function clampAttr(val: number): number {
  return Math.max(15, Math.min(96, Math.round(val)));
}

export function generatePlayerAttributes(
  rng: SeededRng,
  position: PositionCode,
  targetSkill: number
): PlayerAttributes {
  const base = (offset: number, spread = 8) =>
    clampAttr(targetSkill + offset + rng.nextInt(-spread, spread));

  const isGK = position === 'GK';
  const isDef = position === 'CB' || position === 'LB' || position === 'RB';
  const isFullback = position === 'LB' || position === 'RB';
  const isMid = position === 'CDM' || position === 'CM' || position === 'CAM';
  const isWing = position === 'LW' || position === 'RW';
  const isSt = position === 'ST';

  return {
    passing: base(isMid ? 6 : isGK ? -18 : 0),
    shooting: base(isSt ? 8 : isWing || position === 'CAM' ? 4 : isDef ? -15 : isGK ? -30 : -2),
    finishing: base(isSt ? 10 : isWing ? 4 : isDef ? -18 : isGK ? -32 : -4),
    dribbling: base(isWing ? 9 : position === 'CAM' || isSt ? 5 : isDef ? -10 : isGK ? -28 : 2),
    crossing: base(isWing || isFullback ? 8 : isMid ? 2 : -12),
    tackling: base(isDef || position === 'CDM' ? 9 : isMid ? 2 : isGK ? -25 : -15),
    firstTouch: base(isMid || isWing || isSt ? 5 : isGK ? -15 : 0),
    heading: base(position === 'CB' || isSt ? 7 : isGK ? -15 : -2),
    pace: base(isWing || isFullback ? 9 : isSt ? 5 : position === 'CB' ? -3 : 2),
    acceleration: base(isWing || isFullback ? 9 : isSt ? 5 : 1),
    strength: base(position === 'CB' || position === 'CDM' || isSt ? 6 : isWing ? -4 : 0),
    stamina: base(isFullback || isMid ? 7 : 2),
    jumping: base(position === 'CB' || isGK || isSt ? 6 : 0),
    agility: base(isWing || position === 'CAM' || isGK ? 6 : 0),
    vision: base(position === 'CAM' || position === 'CM' ? 8 : isSt ? 0 : -4),
    positioning: base(isDef || position === 'CDM' || isSt || isGK ? 6 : 2),
    decisions: base(4),
    composure: base(isSt || position === 'CB' || isGK ? 5 : 2),
    leadership: clampAttr(40 + rng.nextInt(0, 50)),
    workRate: clampAttr(50 + rng.nextInt(-10, 40)),
    aggression: clampAttr(45 + rng.nextInt(-15, 40)),
    reflexes: isGK ? base(10) : clampAttr(20 + rng.nextInt(0, 20)),
    handling: isGK ? base(9) : clampAttr(20 + rng.nextInt(0, 20)),
    distribution: isGK ? base(5) : clampAttr(20 + rng.nextInt(0, 20)),
  };
}

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

  const age = isYouth ? rng.nextInt(16, 18) : rng.nextInt(18, 33);
  const skillOffset = isYouth ? rng.nextInt(-16, -8) : rng.nextInt(-6, 7);
  const targetSkill = Math.max(48, Math.min(88, baseClubReputation + skillOffset));

  const attributes = generatePlayerAttributes(rng, position, targetSkill);
  const overall = calculateOverallRating(attributes, position);

  const maxGrowth = age <= 20 ? rng.nextInt(8, 18) : age <= 24 ? rng.nextInt(3, 10) : rng.nextInt(0, 2);
  const potential = Math.min(95, Math.max(overall, overall + maxGrowth));

  const marketValue = calculateMarketValue(overall, age, potential);
  const weeklyWage = isYouth ? 400 : calculateWeeklyWage(overall, age);

  const secondaryMap: Record<PositionCode, PositionCode[]> = {
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
  const possibleSecondaries = secondaryMap[position];
  const secondaryPositions =
    possibleSecondaries.length > 0 && rng.chance(0.6) ? [rng.pick(possibleSecondaries)] : [];

  return {
    id,
    firstName,
    lastName,
    age,
    nationality,
    clubId,
    loanedFromClubId: null,
    primaryPosition: position,
    secondaryPositions,
    attributes,
    overall,
    potential,
    contractEndSeason: currentSeason + rng.nextInt(1, 4),
    weeklyWage,
    marketValue,
    fitness: rng.nextInt(92, 100),
    morale: rng.nextInt(72, 90),
    form: rng.nextInt(6, 8),
    injuryWeeks: 0,
    roleExpectation: overall >= baseClubReputation + 3 ? 'star' : overall >= baseClubReputation - 2 ? 'starter' : age <= 20 ? 'prospect' : 'rotation',
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

export function generateInitialGameState(
  worldSeed: number,
  manager: ManagerProfile
): GameState {
  const rng = createRng(worldSeed);
  const currentSeason = 2026;
  const clubs: Club[] = [];
  const players: Player[] = [];

  let playerCounter = 1;

  for (const preset of CLUB_PRESETS) {
    const clubPlayers: Player[] = [];
    // Exactly 25 senior players per club = 500 senior players across 20 clubs
    for (const pos of SQUAD_POSITIONS_TEMPLATE) {
      const pId = `player-${playerCounter++}`;
      const player = generatePlayer(rng, pId, preset.id, pos, preset.reputation, currentSeason, false);
      clubPlayers.push(player);
      players.push(player);
    }

    // Plus 3 youth academy prospects per club
    const youthPositions: PositionCode[] = ['CM', 'LW', 'ST'];
    for (const yPos of youthPositions) {
      const yId = `youth-${preset.id}-${yPos}-${playerCounter++}`;
      const youthPlayer = generatePlayer(rng, yId, preset.id, yPos, preset.reputation, currentSeason, true);
      clubPlayers.push(youthPlayer);
      players.push(youthPlayer);
    }

    const formation =
      preset.id === manager.clubId && manager.tacticalStyle === 'tikiTaka'
        ? '4-3-3'
        : preset.defaultFormation;

    const { startingXI, substitutes, reserves } = autoPickLineupForClub(formation, clubPlayers);
    const currentWageBillWeekly = clubPlayers.reduce((sum, p) => sum + p.weeklyWage, 0);

    const isDiv1 = preset.division === 1;
    let transferBudget = isDiv1
      ? Math.round((preset.reputation - 55) * 1200000)
      : Math.round((preset.reputation - 45) * 450000);

    if (preset.id === manager.clubId) {
      if (manager.startingChallenge === 'financialCrisis') {
        transferBudget = Math.round(transferBudget * 0.25);
      } else if (manager.difficulty === 'relaxed') {
        transferBudget = Math.round(transferBudget * 1.35);
      } else if (manager.difficulty === 'hardcore') {
        transferBudget = Math.round(transferBudget * 0.7);
      }
    }

    const club: Club = {
      id: preset.id,
      name: preset.name,
      shortName: preset.shortName,
      division: preset.division,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      stadiumName: preset.stadiumName,
      stadiumCapacity: preset.stadiumCapacity,
      reputation: preset.reputation,
      tactics: {
        formation,
        attackingStyle: preset.id === manager.clubId ? manager.tacticalStyle : rng.pick(['possession', 'wingPlay', 'directCounter', 'balanced']),
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
        cashBalance: transferBudget + 5000000,
        matchdayRevenuePerHomeGame: preset.stadiumCapacity * 32,
        weeklySponsorIncome: isDiv1 ? 380000 : 140000,
        weeklyStaffAndStadiumCost: isDiv1 ? 165000 : 65000,
        seasonPrizeMoneyEarned: 0,
        ledger: [
          {
            id: `tx-init-${preset.id}`,
            week: 1,
            season: currentSeason,
            category: 'sponsorship',
            description: 'Initial Season Broadcast & Sponsor Advance',
            amount: isDiv1 ? 2500000 : 900000,
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
      name: 'Marco Bellini',
      nationality: 'Italy',
      rating: 84,
      assignedRegion: 'Western Europe',
      assignedPosition: 'ALL',
    },
    {
      id: 'scout-2',
      name: 'Paulo Monteiro',
      nationality: 'Brazil',
      rating: 78,
      assignedRegion: 'South America',
      assignedPosition: 'ST',
    },
    {
      id: 'scout-3',
      name: 'Liam Gallagher',
      nationality: 'England',
      rating: 74,
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

  return {
    saveVersion: 1,
    worldSeed,
    currentSeason,
    currentWeek: 1,
    maxWeeksPerSeason: 22,
    manager: {
      ...manager,
      clubId: userClub.id,
    },
    clubs,
    players,
    fixtures,
    shortlistPlayerIds: [],
    scouts,
    scoutingReports: [],
    board: {
      confidence: 80,
      targetLeaguePosition,
      targetCupRound: 'Quarter-Final',
      wageBudgetStrictness: 75,
      expectationsText:
        manager.startingChallenge === 'titleOrBust'
          ? 'Win the league title this season at all costs.'
          : `Finish inside the Top ${targetLeaguePosition} of Division ${userClub.division} and maintain healthy finances.`,
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
        title: `${manager.name} appointed manager of ${userClub.name}`,
        body: `Supporters at ${userClub.stadiumName} welcome ${manager.name} ahead of the ${currentSeason}/${currentSeason + 1} campaign. The board expects a Top ${targetLeaguePosition} finish.`,
        category: 'board',
      },
    ],
  };
}
