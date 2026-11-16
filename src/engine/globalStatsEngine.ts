import { GLOBAL_CLUB_PRESETS } from './generator';
import { BackgroundMatchResult } from './globalSimEngine';

export interface GlobalPlayerStats {
  playerId: string;
  name: string;
  clubId: string;
  clubName: string;
  countryCode: string;
  leagueId: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  averageRating: number;
  ratingSum: number;
  ratingsCount: number;
  goldenBootPoints: number; // goals * coefficient
}

export interface SeasonalAwards {
  worldPlayerOfTheYear: {
    playerId: string;
    playerName: string;
    clubName: string;
    points: number;
    statsSummary: string;
  };
  goldenBoot: {
    playerId: string;
    playerName: string;
    clubName: string;
    goals: number;
    points: number;
  };
  goldenBoy: {
    playerId: string;
    playerName: string;
    clubName: string;
    age: number;
    rating: number;
  };
  teamOfTheYear: {
    formation: string;
    goalkeeper: GlobalPlayerStats;
    defenders: GlobalPlayerStats[];
    midfielders: GlobalPlayerStats[];
    forwards: GlobalPlayerStats[];
  };
}

export interface GlobalStatsUniverse {
  players: Map<string, GlobalPlayerStats>;
  topScorers: GlobalPlayerStats[];
  topAssists: GlobalPlayerStats[];
  topCleanSheets: GlobalPlayerStats[];
  highestRated: GlobalPlayerStats[];
  awards?: SeasonalAwards;
}

const TOP_FIVE_LEAGUES = new Set(['division1', 'esp-ll1', 'ger-bl1', 'ita-sa', 'fra-l1']);

export function getLeagueCoefficient(leagueId: string): number {
  if (TOP_FIVE_LEAGUES.has(leagueId)) return 2.0;
  return 1.5;
}

export function initializeGlobalStatsUniverse(): GlobalStatsUniverse {
  const players = new Map<string, GlobalPlayerStats>();

  for (const club of GLOBAL_CLUB_PRESETS) {
    const rawXi = (club as any).startingXI;
    const rawSubs = (club as any).substitutes;
    const allRoster: string[] = Array.isArray(rawXi) && Array.isArray(rawSubs)
      ? [...rawXi, ...rawSubs]
      : Array.from({ length: 18 }, (_, idx) => `p_${club.id}_${idx + 1}`);

    for (let i = 0; i < allRoster.length; i++) {
      const pid = allRoster[i];
      let pos: 'GK' | 'DEF' | 'MID' | 'FWD' = 'MID';
      if (i === 0) pos = 'GK';
      else if (i >= 1 && i <= 4) pos = 'DEF';
      else if (i >= 5 && i <= 7) pos = 'MID';
      else pos = 'FWD';

      players.set(pid, {
        playerId: pid,
        name: pid.replace('p_', '').replace(/_/g, ' ').toUpperCase(),
        clubId: club.id,
        clubName: club.name,
        countryCode: club.countryId,
        leagueId: club.leagueId,
        position: pos,
        appearances: 0,
        minutes: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        averageRating: 6.5,
        ratingSum: 0,
        ratingsCount: 0,
        goldenBootPoints: 0,
      });
    }
  }

  return {
    players,
    topScorers: [],
    topAssists: [],
    topCleanSheets: [],
    highestRated: [],
  };
}

export function recordMatchToGlobalStats(
  universe: GlobalStatsUniverse,
  match: BackgroundMatchResult
): void {
  const coeffHome = getLeagueCoefficient(
    GLOBAL_CLUB_PRESETS.find((c) => c.id === match.homeClubId)?.leagueId ?? 'division1'
  );
  const coeffAway = getLeagueCoefficient(
    GLOBAL_CLUB_PRESETS.find((c) => c.id === match.awayClubId)?.leagueId ?? 'division1'
  );

  // Record Scorers
  for (const s of match.scorers) {
    let p = universe.players.get(s.playerId);
    if (!p) {
      p = {
        playerId: s.playerId,
        name: s.name,
        clubId: s.clubId,
        clubName: GLOBAL_CLUB_PRESETS.find((c) => c.id === s.clubId)?.name ?? s.clubId,
        countryCode: 'ENG',
        leagueId: 'division1',
        position: 'FWD',
        appearances: 1,
        minutes: 90,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        yellowCards: 0,
        redCards: 0,
        averageRating: 7.0,
        ratingSum: 7.0,
        ratingsCount: 1,
        goldenBootPoints: 0,
      };
      universe.players.set(s.playerId, p);
    }
    p.goals += 1;
    const coeff = s.clubId === match.homeClubId ? coeffHome : coeffAway;
    p.goldenBootPoints = p.goals * coeff;
  }

  // Record Assists
  for (const a of match.assists) {
    const p = universe.players.get(a.playerId);
    if (p) p.assists += 1;
  }

  // Record Clean Sheets
  if (match.awayScore === 0) {
    const homeClub = GLOBAL_CLUB_PRESETS.find((c) => c.id === match.homeClubId);
    const gkId = (homeClub as any)?.startingXI?.[0] ?? `p_${match.homeClubId}_1`;
    const gk = universe.players.get(gkId);
    if (gk) gk.cleanSheets += 1;
  }
  if (match.homeScore === 0) {
    const awayClub = GLOBAL_CLUB_PRESETS.find((c) => c.id === match.awayClubId);
    const gkId = (awayClub as any)?.startingXI?.[0] ?? `p_${match.awayClubId}_1`;
    const gk = universe.players.get(gkId);
    if (gk) gk.cleanSheets += 1;
  }

  // Record Cards
  for (const c of match.cards) {
    const p = universe.players.get(c.playerId);
    if (p) {
      if (c.type === 'yellow') p.yellowCards += 1;
      else p.redCards += 1;
    }
  }
}

export function refreshLeaderboards(universe: GlobalStatsUniverse): GlobalStatsUniverse {
  const rawList =
    universe.players instanceof Map
      ? Array.from(universe.players.values())
      : typeof universe.players === 'object' && universe.players !== null
        ? Object.values(universe.players)
        : [];
  const all = (rawList as (GlobalPlayerStats | undefined)[]).filter(
    (p): p is GlobalPlayerStats => Boolean(p && typeof p === 'object' && p.playerId)
  );

  const topScorers = [...all]
    .filter((p) => (p.goals ?? 0) > 0)
    .sort((a, b) => (b.goldenBootPoints ?? 0) - (a.goldenBootPoints ?? 0) || (b.goals ?? 0) - (a.goals ?? 0))
    .slice(0, 30);

  const topAssists = [...all]
    .filter((p) => (p.assists ?? 0) > 0)
    .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0) || (b.goals ?? 0) - (a.goals ?? 0))
    .slice(0, 30);

  const topCleanSheets = [...all]
    .filter((p) => p.position === 'GK')
    .sort((a, b) => (b.cleanSheets ?? 0) - (a.cleanSheets ?? 0))
    .slice(0, 20);

  const highestRated = [...all]
    .filter((p) => (p.goals ?? 0) + (p.assists ?? 0) > 0 || (p.cleanSheets ?? 0) > 0)
    .sort(
      (a, b) =>
        ((b.goals ?? 0) * 2 + (b.assists ?? 0) * 1.5 + (b.cleanSheets ?? 0)) -
        ((a.goals ?? 0) * 2 + (a.assists ?? 0) * 1.5 + (a.cleanSheets ?? 0))
    )
    .slice(0, 25);

  return {
    ...universe,
    topScorers,
    topAssists,
    topCleanSheets,
    highestRated,
  };
}

export function calculateSeasonalAwards(universe: GlobalStatsUniverse): SeasonalAwards {
  const rawList =
    universe.players instanceof Map
      ? Array.from(universe.players.values())
      : typeof universe.players === 'object' && universe.players !== null
        ? Object.values(universe.players)
        : [];
  const all = (rawList as (GlobalPlayerStats | undefined)[]).filter(
    (p): p is GlobalPlayerStats => Boolean(p && typeof p === 'object' && p.playerId)
  );
  const sortedPerformers = [...all].sort(
    (a, b) => ((b.goals ?? 0) * 2 + (b.assists ?? 0) * 1.5 + (b.cleanSheets ?? 0) * 3) - ((a.goals ?? 0) * 2 + (a.assists ?? 0) * 1.5 + (a.cleanSheets ?? 0) * 3)
  );

  const fallbackPlayer: GlobalPlayerStats = {
    playerId: 'p_world_star',
    name: 'Erling Haaland',
    clubId: 'c_mci',
    clubName: 'Manchester City',
    countryCode: 'ENG',
    leagueId: 'division1',
    position: 'FWD',
    appearances: 38,
    minutes: 3200,
    goals: 34,
    assists: 8,
    cleanSheets: 0,
    yellowCards: 2,
    redCards: 0,
    averageRating: 8.1,
    ratingSum: 307.8,
    ratingsCount: 38,
    goldenBootPoints: 68,
  };

  const winner = sortedPerformers[0] ?? all[0] ?? fallbackPlayer;
  const goldenBootWinner = [...all].sort((a, b) => (b.goldenBootPoints ?? 0) - (a.goldenBootPoints ?? 0))[0] ?? winner;

  const gks = all.filter((p) => p.position === 'GK').sort((a, b) => (b.cleanSheets ?? 0) - (a.cleanSheets ?? 0));
  const defs = all.filter((p) => p.position === 'DEF').sort((a, b) => (b.cleanSheets ?? 0) * 2 + (b.goals ?? 0) - ((a.cleanSheets ?? 0) * 2 + (a.goals ?? 0)));
  const mids = all.filter((p) => p.position === 'MID').sort((a, b) => (b.assists ?? 0) * 2 + (b.goals ?? 0) - ((a.assists ?? 0) * 2 + (a.goals ?? 0)));
  const fwds = all.filter((p) => p.position === 'FWD').sort((a, b) => (b.goals ?? 0) * 2 + (b.assists ?? 0) - ((a.goals ?? 0) * 2 + (a.assists ?? 0)));

  return {
    worldPlayerOfTheYear: {
      playerId: winner.playerId,
      playerName: winner.name,
      clubName: winner.clubName,
      points: Math.round((winner.goals ?? 0) * 25 + (winner.assists ?? 0) * 18 + (winner.cleanSheets ?? 0) * 15 + 850),
      statsSummary: `${winner.goals ?? 0} Goals • ${winner.assists ?? 0} Assists • ${winner.averageRating?.toFixed(2) ?? '7.95'} Avg Rating`,
    },
    goldenBoot: {
      playerId: goldenBootWinner.playerId,
      playerName: goldenBootWinner.name,
      clubName: goldenBootWinner.clubName,
      goals: goldenBootWinner.goals ?? 0,
      points: goldenBootWinner.goldenBootPoints ?? 0,
    },
    goldenBoy: {
      playerId: fwds[1]?.playerId ?? winner.playerId,
      playerName: fwds[1]?.name ?? winner.name,
      clubName: fwds[1]?.clubName ?? winner.clubName,
      age: 20,
      rating: 7.82,
    },
    teamOfTheYear: {
      formation: '4-3-3',
      goalkeeper: gks[0] ?? winner,
      defenders: defs.slice(0, 4),
      midfielders: mids.slice(0, 3),
      forwards: fwds.slice(0, 3),
    },
  };
}
