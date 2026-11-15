import { GLOBAL_CLUB_PRESETS } from './generator';
import { createRng } from './rng';
import { UefaKnockoutTie, UefaMatch, UefaTournamentState } from './uefaEngine';

export interface SimulatedScorer {
  playerId: string;
  name: string;
  minute: number;
  clubId: string;
  isPenalty?: boolean;
}

export interface SimulatedAssist {
  playerId: string;
  name: string;
  minute: number;
  clubId: string;
}

export interface SimulatedCard {
  playerId: string;
  name: string;
  minute: number;
  clubId: string;
  type: 'yellow' | 'red';
}

export interface SimulatedInjury {
  playerId: string;
  name: string;
  clubId: string;
  durationWeeks: number;
  type: string;
}

export interface BackgroundMatchResult {
  matchId: string;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  extraTimePlayed?: boolean;
  decidedByPenalties?: boolean;
  scorers: SimulatedScorer[];
  assists: SimulatedAssist[];
  cards: SimulatedCard[];
  injuries: SimulatedInjury[];
}

/**
 * Deterministically simulates a single Level 3 background match between any two clubs.
 */
export function simulateBackgroundMatch(
  homeClubId: string,
  awayClubId: string,
  matchId: string,
  options: { isKnockout?: boolean; mustHaveWinner?: boolean } = {}
): BackgroundMatchResult {
  const hash = Array.from(matchId).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0);
  const rng = createRng(Math.abs(hash) || 12345);

  const homeClub = GLOBAL_CLUB_PRESETS.find((c) => c.id === homeClubId);
  const awayClub = GLOBAL_CLUB_PRESETS.find((c) => c.id === awayClubId);

  const homeRep = homeClub?.reputation ?? 70;
  const awayRep = awayClub?.reputation ?? 70;

  // Expected goals based on relative reputation + home advantage
  const homeExp = Math.max(0.4, 1.45 + (homeRep - awayRep) * 0.035 + 0.25);
  const awayExp = Math.max(0.3, 1.15 + (awayRep - homeRep) * 0.035);

  // Sample goals using Poisson approximation
  const sampleGoals = (exp: number): number => {
    let goals = 0;
    const baseP = Math.exp(-exp);
    let p = baseP;
    let cum = p;
    const u = rng.next();
    while (u > cum && goals < 9) {
      goals++;
      p = (p * exp) / goals;
      cum += p;
    }
    return goals;
  };

  let homeScore = sampleGoals(homeExp);
  let awayScore = sampleGoals(awayExp);

  let extraTimePlayed = false;
  let decidedByPenalties = false;
  let homePenalties: number | undefined;
  let awayPenalties: number | undefined;

  if (options.mustHaveWinner && homeScore === awayScore) {
    extraTimePlayed = true;
    // 30 min extra time simulation
    const etHome = rng.next() > 0.65 ? 1 : 0;
    const etAway = rng.next() > 0.75 ? 1 : 0;
    homeScore += etHome;
    awayScore += etAway;

    if (homeScore === awayScore) {
      decidedByPenalties = true;
      let pHome = 0;
      let pAway = 0;
      for (let i = 0; i < 5; i++) {
        if (rng.next() < 0.78) pHome++;
        if (rng.next() < 0.75) pAway++;
      }
      while (pHome === pAway) {
        if (rng.next() < 0.72) pHome++;
        if (rng.next() < 0.72) pAway++;
      }
      homePenalties = pHome;
      awayPenalties = pAway;
    }
  }

  // Derive goal scorers & assists
  const scorers: SimulatedScorer[] = [];
  const assists: SimulatedAssist[] = [];

  const getRosterPlayers = (club: typeof homeClub, fallbackClubId: string) => {
    if (!club) {
      return Array.from({ length: 18 }, (_, idx) => `p_${fallbackClubId}_${idx + 1}`);
    }
    const xi = (club as any).startingXI ?? Array.from({ length: 11 }, (_, idx) => `p_${club.id}_${idx + 1}`);
    const subs = (club as any).substitutes ?? Array.from({ length: 7 }, (_, idx) => `p_${club.id}_${idx + 12}`);
    return [...xi, ...subs];
  };

  const homeRoster = getRosterPlayers(homeClub, homeClubId);
  const awayRoster = getRosterPlayers(awayClub, awayClubId);

  const assignEvents = (clubId: string, count: number, roster: string[]) => {
    for (let g = 0; g < count; g++) {
      const minute = Math.floor(rng.next() * 90) + 1;
      const playerId = roster[Math.floor(rng.next() * Math.min(roster.length, 6))] ?? `p_${clubId}_${g}`;
      scorers.push({
        playerId,
        name: playerId.replace('p_', '').replace('_', ' ').toUpperCase(),
        minute,
        clubId,
      });

      if (rng.next() < 0.72) {
        const assisterId = roster.find((id) => id !== playerId) ?? `ast_${clubId}_${g}`;
        assists.push({
          playerId: assisterId,
          name: assisterId.replace('p_', '').replace('_', ' ').toUpperCase(),
          minute,
          clubId,
        });
      }
    }
  };

  assignEvents(homeClubId, homeScore, homeRoster);
  assignEvents(awayClubId, awayScore, awayRoster);

  // Cards & Injuries
  const cards: SimulatedCard[] = [];
  const yellowCount = Math.floor(rng.next() * 4) + 1;
  for (let c = 0; c < yellowCount; c++) {
    const isHome = rng.next() > 0.5;
    const cid = isHome ? homeClubId : awayClubId;
    const roster = isHome ? homeRoster : awayRoster;
    const pid = roster[Math.floor(rng.next() * roster.length)] ?? `p_${cid}`;
    cards.push({
      playerId: pid,
      name: pid.replace('p_', '').toUpperCase(),
      minute: Math.floor(rng.next() * 88) + 2,
      clubId: cid,
      type: rng.next() < 0.05 ? 'red' : 'yellow',
    });
  }

  const injuries: SimulatedInjury[] = [];
  if (rng.next() < 0.12) {
    const isHome = rng.next() > 0.5;
    const cid = isHome ? homeClubId : awayClubId;
    const roster = isHome ? homeRoster : awayRoster;
    const pid = roster[Math.floor(rng.next() * roster.length)] ?? `p_${cid}`;
    injuries.push({
      playerId: pid,
      name: pid.replace('p_', '').toUpperCase(),
      clubId: cid,
      durationWeeks: Math.floor(rng.next() * 4) + 1,
      type: rng.next() > 0.5 ? 'Hamstring Strain' : 'Ankle Sprain',
    });
  }

  return {
    matchId,
    homeClubId,
    awayClubId,
    homeScore,
    awayScore,
    homePenalties,
    awayPenalties,
    extraTimePlayed,
    decidedByPenalties,
    scorers,
    assists,
    cards,
    injuries,
  };
}

/**
 * Simulates all UEFA matches for the given matchWeek across UCL, UEL, and UECL.
 */
export function simulateWeeklyUefaMatches(
  tournament: UefaTournamentState,
  matchWeek: number
): UefaTournamentState {
  const updatedMatches: UefaMatch[] = tournament.leaguePhaseMatches.map((m) => {
    if (m.matchWeek !== matchWeek || m.played) return m;

    const res = simulateBackgroundMatch(m.homeClubId, m.awayClubId, m.matchId);
    return {
      ...m,
      homeScore: res.homeScore,
      awayScore: res.awayScore,
      played: true,
      scorers: res.scorers,
    };
  });

  return {
    ...tournament,
    leaguePhaseMatches: updatedMatches,
    currentMatchWeek: Math.max(tournament.currentMatchWeek, matchWeek + 1),
  };
}

/**
 * Resolves a two-legged or single-leg knockout tie.
 */
export function resolveKnockoutTie(
  tie: UefaKnockoutTie,
  weekToPlay: number
): UefaKnockoutTie {
  let updatedLeg1 = { ...tie.leg1 };
  let updatedLeg2 = tie.leg2 ? { ...tie.leg2 } : undefined;

  if (updatedLeg1.matchWeek === weekToPlay && !updatedLeg1.played) {
    const res1 = simulateBackgroundMatch(
      updatedLeg1.homeClubId,
      updatedLeg1.awayClubId,
      updatedLeg1.matchId
    );
    updatedLeg1 = {
      ...updatedLeg1,
      homeScore: res1.homeScore,
      awayScore: res1.awayScore,
      played: true,
      scorers: res1.scorers,
    };
  }

  if (updatedLeg2 && updatedLeg2.matchWeek === weekToPlay && !updatedLeg2.played) {
    const res2 = simulateBackgroundMatch(
      updatedLeg2.homeClubId,
      updatedLeg2.awayClubId,
      updatedLeg2.matchId
    );
    updatedLeg2 = {
      ...updatedLeg2,
      homeScore: res2.homeScore,
      awayScore: res2.awayScore,
      played: true,
      scorers: res2.scorers,
    };
  }

  // Check aggregate completion
  const isFinal = tie.stage === 'final';
  const bothPlayed = isFinal ? updatedLeg1.played : (updatedLeg1.played && updatedLeg2?.played);

  if (bothPlayed) {
    let aggA = 0;
    let aggB = 0;

    if (isFinal) {
      aggA = updatedLeg1.homeScore ?? 0;
      aggB = updatedLeg1.awayScore ?? 0;
    } else if (updatedLeg2) {
      // Club A: Leg 1 Home, Leg 2 Away
      aggA = (updatedLeg1.homeScore ?? 0) + (updatedLeg2.awayScore ?? 0);
      aggB = (updatedLeg1.awayScore ?? 0) + (updatedLeg2.homeScore ?? 0);
    }

    let winnerClubId: string;
    let penaltyScoreA: number | undefined;
    let penaltyScoreB: number | undefined;
    let decidedByPenalties = false;

    if (aggA > aggB) {
      winnerClubId = tie.clubAId;
    } else if (aggB > aggA) {
      winnerClubId = tie.clubBId;
    } else {
      // Tied on aggregate -> Penalty Shootout
      decidedByPenalties = true;
      const resPen = simulateBackgroundMatch(tie.clubAId, tie.clubBId, `${tie.tieId}_pens`, {
        mustHaveWinner: true,
      });
      penaltyScoreA = resPen.homePenalties ?? 5;
      penaltyScoreB = resPen.awayPenalties ?? 4;
      winnerClubId = penaltyScoreA > penaltyScoreB ? tie.clubAId : tie.clubBId;
    }

    return {
      ...tie,
      leg1: updatedLeg1,
      leg2: updatedLeg2,
      aggregateScoreA: aggA,
      aggregateScoreB: aggB,
      winnerClubId,
      penaltyScoreA,
      penaltyScoreB,
      decidedByPenalties,
    };
  }

  return {
    ...tie,
    leg1: updatedLeg1,
    leg2: updatedLeg2,
  };
}
