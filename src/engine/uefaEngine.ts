import { GLOBAL_CLUB_PRESETS } from './generator';
import { createRng } from './rng';

export type UefaTournamentId = 'ucl' | 'uel' | 'uecl';

export type UefaStage =
  | 'league_phase'
  | 'knockout_playoffs'
  | 'round_of_16'
  | 'quarter_finals'
  | 'semi_finals'
  | 'final';

export interface UefaTeam {
  clubId: string;
  name: string;
  shortName: string;
  countryCode: string;
  reputation: number;
  pot: 1 | 2 | 3 | 4;
}

export interface UefaStanding {
  rank: number;
  clubId: string;
  clubName: string;
  shortName: string;
  countryCode: string;
  reputation: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export interface UefaScorerEvent {
  playerId: string;
  name: string;
  minute: number;
  clubId: string;
}

export interface UefaMatch {
  matchId: string;
  tournamentId: UefaTournamentId;
  stage: UefaStage;
  matchWeek: number;
  homeClubId: string;
  awayClubId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
  scorers?: UefaScorerEvent[];
}

export interface UefaKnockoutTie {
  tieId: string;
  tournamentId: UefaTournamentId;
  stage: 'knockout_playoffs' | 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final';
  clubAId: string;
  clubBId: string;
  leg1: UefaMatch;
  leg2?: UefaMatch; // final has no leg2
  winnerClubId?: string;
  aggregateScoreA?: number;
  aggregateScoreB?: number;
  penaltyScoreA?: number;
  penaltyScoreB?: number;
  decidedByPenalties?: boolean;
}

export interface UefaTournamentState {
  id: UefaTournamentId;
  name: string;
  shortName: string;
  seasonYear: number;
  currentMatchWeek: number;
  isCompleted: boolean;
  winnerClubId?: string;
  runnerUpClubId?: string;
  teams: UefaTeam[];
  leaguePhaseStandings: UefaStanding[];
  leaguePhaseMatches: UefaMatch[];
  knockoutTies: UefaKnockoutTie[];
}

export interface GlobalUefaUniverse {
  ucl: UefaTournamentState;
  uel: UefaTournamentState;
  uecl: UefaTournamentState;
  seasonYear: number;
}

// ---------------------------------------------------------------------------
// 1. QUALIFICATION & SEEDING
// ---------------------------------------------------------------------------

const EUROPEAN_COUNTRIES = new Set([
  'ENG', 'ESP', 'GER', 'ITA', 'FRA', 'POR', 'NED', 'TUR', 'BEL', 'SCO', 'AUT', 'SUI', 'DEN', 'EUR'
]);

/**
 * Derives the qualified 36 teams for UCL, UEL, and UECL based on club reputations and domestic tiers.
 */
export function qualifyUefaTeams(): {
  uclTeams: UefaTeam[];
  uelTeams: UefaTeam[];
  ueclTeams: UefaTeam[];
} {
  const europeanClubs = GLOBAL_CLUB_PRESETS.filter(
    (c) => EUROPEAN_COUNTRIES.has(c.countryId) && c.division === 1
  ).sort((a, b) => b.reputation - a.reputation);

  // UCL gets the top 36 clubs
  const uclRaw = europeanClubs.slice(0, 36);
  // UEL gets clubs 37 to 72
  const uelRaw = europeanClubs.slice(36, 72);
  // UECL gets clubs 73 to 108
  const ueclRaw = europeanClubs.slice(72, 108);

  const assignPots = (clubs: typeof uclRaw): UefaTeam[] => {
    return clubs.map((c, idx) => {
      const pot = (Math.floor(idx / 9) + 1) as 1 | 2 | 3 | 4;
      return {
        clubId: c.id,
        name: c.name,
        shortName: c.shortName,
        countryCode: c.countryId,
        reputation: c.reputation,
        pot: pot > 4 ? 4 : pot,
      };
    });
  };

  return {
    uclTeams: assignPots(uclRaw),
    uelTeams: assignPots(uelRaw),
    ueclTeams: assignPots(ueclRaw),
  };
}

// ---------------------------------------------------------------------------
// 2. SWISS LEAGUE-PHASE MATCH GENERATOR
// ---------------------------------------------------------------------------

/**
 * Generates Swiss-system 8 matchdays for UCL/UEL (or 6 for UECL).
 * Each team plays 2 teams from each pot (1 Home, 1 Away).
 */
export function generateLeaguePhaseMatches(
  tournamentId: UefaTournamentId,
  teams: UefaTeam[],
  seed = 42
): UefaMatch[] {
  const rng = createRng(seed);
  const totalWeeks = tournamentId === 'uecl' ? 6 : 8;
  const matches: UefaMatch[] = [];
  const clubMap = new Map<string, UefaTeam>(teams.map((t) => [t.clubId, t]));
  const playedPairs = new Set<string>();

  const getPairKey = (a: string, b: string) => [a, b].sort().join('::');

  for (let week = 1; week <= totalWeeks; week++) {
    const availableClubs = [...teams].sort(() => rng.next() - 0.5);
    const weekAssigned = new Set<string>();

    for (let i = 0; i < availableClubs.length; i++) {
      const home = availableClubs[i];
      if (weekAssigned.has(home.clubId)) continue;

      let bestOpponent: UefaTeam | null = null;
      for (let j = i + 1; j < availableClubs.length; j++) {
        const candidate = availableClubs[j];
        if (weekAssigned.has(candidate.clubId)) continue;
        const pairKey = getPairKey(home.clubId, candidate.clubId);
        if (!playedPairs.has(pairKey)) {
          bestOpponent = candidate;
          break;
        }
      }

      if (!bestOpponent) {
        // Fallback to any unassigned club
        bestOpponent = availableClubs.find(
          (c) => c.clubId !== home.clubId && !weekAssigned.has(c.clubId)
        ) ?? null;
      }

      if (bestOpponent) {
        weekAssigned.add(home.clubId);
        weekAssigned.add(bestOpponent.clubId);
        playedPairs.add(getPairKey(home.clubId, bestOpponent.clubId));

        matches.push({
          matchId: `${tournamentId}_LP_W${week}_${home.clubId}_${bestOpponent.clubId}`,
          tournamentId,
          stage: 'league_phase',
          matchWeek: week,
          homeClubId: home.clubId,
          awayClubId: bestOpponent.clubId,
          played: false,
        });
      }
    }
  }

  return matches;
}

// ---------------------------------------------------------------------------
// 3. LEAGUE STANDINGS CALCULATION
// ---------------------------------------------------------------------------

export function calculateUefaStandings(
  teams: UefaTeam[],
  matches: UefaMatch[]
): UefaStanding[] {
  const standingsMap = new Map<string, UefaStanding>();

  for (const t of teams) {
    standingsMap.set(t.clubId, {
      rank: 1,
      clubId: t.clubId,
      clubName: t.name,
      shortName: t.shortName,
      countryCode: t.countryCode,
      reputation: t.reputation,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    });
  }

  for (const m of matches) {
    if (!m.played || m.homeScore === undefined || m.awayScore === undefined) continue;

    const home = standingsMap.get(m.homeClubId);
    const away = standingsMap.get(m.awayClubId);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won += 1;
      home.points += 3;
      home.form.unshift('W');
      away.lost += 1;
      away.form.unshift('L');
    } else if (m.homeScore < m.awayScore) {
      away.won += 1;
      away.points += 3;
      away.form.unshift('W');
      home.lost += 1;
      home.form.unshift('L');
    } else {
      home.drawn += 1;
      home.points += 1;
      home.form.unshift('D');
      away.drawn += 1;
      away.points += 1;
      away.form.unshift('D');
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
    if (home.form.length > 5) home.form.pop();
    if (away.form.length > 5) away.form.pop();
  }

  const sorted = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.reputation - a.reputation;
  });

  return sorted.map((s, idx) => ({ ...s, rank: idx + 1 }));
}

// ---------------------------------------------------------------------------
// 4. KNOCKOUT BRACKET GENERATION
// ---------------------------------------------------------------------------

/**
 * Initializes knockout phase play-offs once the league phase concludes.
 * Ranks 1-8 receive a bye straight to Round of 16.
 * Ranks 9-16 (seeded) play ranks 17-24 (unseeded).
 */
export function generateKnockoutPlayoffs(
  tournamentId: UefaTournamentId,
  standings: UefaStanding[],
  startWeek = 9
): UefaKnockoutTie[] {
  const ties: UefaKnockoutTie[] = [];
  const seeded = standings.slice(8, 16); // Ranks 9-16
  const unseeded = standings.slice(16, 24); // Ranks 17-24

  for (let i = 0; i < seeded.length; i++) {
    const seedTeam = seeded[i];
    const unseedTeam = unseeded[unseeded.length - 1 - i]; // 9 vs 24, 10 vs 23, etc.
    const tieId = `${tournamentId}_PO_${i + 1}`;

    ties.push({
      tieId,
      tournamentId,
      stage: 'knockout_playoffs',
      clubAId: unseedTeam.clubId,
      clubBId: seedTeam.clubId,
      leg1: {
        matchId: `${tieId}_leg1`,
        tournamentId,
        stage: 'knockout_playoffs',
        matchWeek: startWeek,
        homeClubId: unseedTeam.clubId,
        awayClubId: seedTeam.clubId,
        played: false,
      },
      leg2: {
        matchId: `${tieId}_leg2`,
        tournamentId,
        stage: 'knockout_playoffs',
        matchWeek: startWeek + 1,
        homeClubId: seedTeam.clubId,
        awayClubId: unseedTeam.clubId,
        played: false,
      },
    });
  }

  return ties;
}

/**
 * Generates Round of 16 once playoffs conclude.
 */
export function generateRoundOf16(
  tournamentId: UefaTournamentId,
  topEightStandings: UefaStanding[],
  playoffWinners: string[],
  startWeek = 11
): UefaKnockoutTie[] {
  const ties: UefaKnockoutTie[] = [];
  const top8 = topEightStandings.slice(0, 8);

  for (let i = 0; i < 8; i++) {
    const seedClubId = top8[i].clubId;
    const winnerClubId = playoffWinners[i] ?? top8[7 - i].clubId;
    const tieId = `${tournamentId}_R16_${i + 1}`;

    ties.push({
      tieId,
      tournamentId,
      stage: 'round_of_16',
      clubAId: winnerClubId,
      clubBId: seedClubId,
      leg1: {
        matchId: `${tieId}_leg1`,
        tournamentId,
        stage: 'round_of_16',
        matchWeek: startWeek,
        homeClubId: winnerClubId,
        awayClubId: seedClubId,
        played: false,
      },
      leg2: {
        matchId: `${tieId}_leg2`,
        tournamentId,
        stage: 'round_of_16',
        matchWeek: startWeek + 1,
        homeClubId: seedClubId,
        awayClubId: winnerClubId,
        played: false,
      },
    });
  }

  return ties;
}

/**
 * Generates Quarter-Finals, Semi-Finals, and Final brackets.
 */
export function generateNextKnockoutStage(
  tournamentId: UefaTournamentId,
  previousWinners: string[],
  stage: 'quarter_finals' | 'semi_finals' | 'final',
  startWeek: number
): UefaKnockoutTie[] {
  const ties: UefaKnockoutTie[] = [];
  const count = previousWinners.length / 2;

  for (let i = 0; i < count; i++) {
    const clubA = previousWinners[i * 2];
    const clubB = previousWinners[i * 2 + 1];
    const tieId = `${tournamentId}_${stage.toUpperCase()}_${i + 1}`;

    if (stage === 'final') {
      // Single match neutral final
      ties.push({
        tieId,
        tournamentId,
        stage: 'final',
        clubAId: clubA,
        clubBId: clubB,
        leg1: {
          matchId: `${tieId}_final`,
          tournamentId,
          stage: 'final',
          matchWeek: startWeek,
          homeClubId: clubA,
          awayClubId: clubB,
          played: false,
        },
      });
    } else {
      ties.push({
        tieId,
        tournamentId,
        stage,
        clubAId: clubA,
        clubBId: clubB,
        leg1: {
          matchId: `${tieId}_leg1`,
          tournamentId,
          stage,
          matchWeek: startWeek,
          homeClubId: clubA,
          awayClubId: clubB,
          played: false,
        },
        leg2: {
          matchId: `${tieId}_leg2`,
          tournamentId,
          stage,
          matchWeek: startWeek + 1,
          homeClubId: clubB,
          awayClubId: clubA,
          played: false,
        },
      });
    }
  }

  return ties;
}

// ---------------------------------------------------------------------------
// 5. INITIALIZE GLOBAL UEFA UNIVERSE
// ---------------------------------------------------------------------------

export function initializeGlobalUefaUniverse(seasonYear = 2026): GlobalUefaUniverse {
  const { uclTeams, uelTeams, ueclTeams } = qualifyUefaTeams();

  const createTournament = (
    id: UefaTournamentId,
    name: string,
    shortName: string,
    teams: UefaTeam[],
    seed: number
  ): UefaTournamentState => {
    const matches = generateLeaguePhaseMatches(id, teams, seed);
    const standings = calculateUefaStandings(teams, matches);

    return {
      id,
      name,
      shortName,
      seasonYear,
      currentMatchWeek: 1,
      isCompleted: false,
      teams,
      leaguePhaseStandings: standings,
      leaguePhaseMatches: matches,
      knockoutTies: [],
    };
  };

  return {
    ucl: createTournament('ucl', 'UEFA Champions League', 'Champions League', uclTeams, 101),
    uel: createTournament('uel', 'UEFA Europa League', 'Europa League', uelTeams, 202),
    uecl: createTournament('uecl', 'UEFA Conference League', 'Conference League', ueclTeams, 303),
    seasonYear,
  };
}
