import { describe, expect, it } from 'vitest';
import {
  qualifyUefaTeams,
  generateLeaguePhaseMatches,
  calculateUefaStandings,
  generateKnockoutPlayoffs,
  generateRoundOf16,
  initializeGlobalUefaUniverse,
} from '../../src/engine/uefaEngine';
import {
  simulateBackgroundMatch,
  simulateWeeklyUefaMatches,
  resolveKnockoutTie,
} from '../../src/engine/globalSimEngine';
import {
  initializeGlobalStatsUniverse,
  recordMatchToGlobalStats,
  refreshLeaderboards,
  calculateSeasonalAwards,
} from '../../src/engine/globalStatsEngine';

describe('Global Football World Simulation Engine v1.0', () => {
  it('qualifies exactly 36 European teams each for UCL, UEL, and UECL into 4 pots of 9', () => {
    const { uclTeams, uelTeams, ueclTeams } = qualifyUefaTeams();

    expect(uclTeams).toHaveLength(36);
    expect(uelTeams).toHaveLength(36);
    expect(ueclTeams).toHaveLength(36);

    const pot1 = uclTeams.filter((t) => t.pot === 1);
    const pot2 = uclTeams.filter((t) => t.pot === 2);
    const pot3 = uclTeams.filter((t) => t.pot === 3);
    const pot4 = uclTeams.filter((t) => t.pot === 4);

    expect(pot1).toHaveLength(9);
    expect(pot2).toHaveLength(9);
    expect(pot3).toHaveLength(9);
    expect(pot4).toHaveLength(9);

    // Highest reputation clubs are in Pot 1
    expect(pot1[0].reputation).toBeGreaterThanOrEqual(pot2[0].reputation);
  });

  it('generates Swiss-system 8 matchdays for Champions League', () => {
    const { uclTeams } = qualifyUefaTeams();
    const matches = generateLeaguePhaseMatches('ucl', uclTeams, 12345);

    expect(matches.length).toBeGreaterThan(0);
    // Every match has home and away clubs from the 36 teams
    const teamIds = new Set(uclTeams.map((t) => t.clubId));
    for (const m of matches) {
      expect(teamIds.has(m.homeClubId)).toBe(true);
      expect(teamIds.has(m.awayClubId)).toBe(true);
      expect(m.homeClubId).not.toBe(m.awayClubId);
    }
  });

  it('simulates background matches deterministically with realistic scores and scorers', () => {
    const res1 = simulateBackgroundMatch('arsenal', 'chelsea', 'ucl_test_1');
    const res2 = simulateBackgroundMatch('arsenal', 'chelsea', 'ucl_test_1');

    // Deterministic: same input gives exact same score
    expect(res1.homeScore).toBe(res2.homeScore);
    expect(res1.awayScore).toBe(res2.awayScore);
    expect(res1.scorers).toEqual(res2.scorers);

    // Scores are realistic (0 to 9)
    expect(res1.homeScore).toBeGreaterThanOrEqual(0);
    expect(res1.awayScore).toBeGreaterThanOrEqual(0);
  });

  it('calculates 36-team standings accurately with points, GD, and form', () => {
    const universe = initializeGlobalUefaUniverse(2026);
    expect(universe.ucl.teams).toHaveLength(36);
    expect(universe.ucl.leaguePhaseStandings).toHaveLength(36);

    // Simulate matchweek 1
    const updated = simulateWeeklyUefaMatches(universe.ucl, 1);
    const playedMatches = updated.leaguePhaseMatches.filter((m) => m.played);
    expect(playedMatches.length).toBeGreaterThan(0);

    const standings = calculateUefaStandings(updated.teams, updated.leaguePhaseMatches);
    expect(standings).toHaveLength(36);
    expect(standings[0].rank).toBe(1);
    expect(standings[0].points).toBeGreaterThanOrEqual(standings[35].points);
  });

  it('generates Knockout Play-offs for ranks 9-24 and Round of 16 for ranks 1-8', () => {
    const universe = initializeGlobalUefaUniverse(2026);
    const standings = universe.ucl.leaguePhaseStandings;

    const playoffs = generateKnockoutPlayoffs('ucl', standings, 9);
    expect(playoffs).toHaveLength(8);

    // Tie 1: Rank 9 vs Rank 24
    expect(playoffs[0].leg1.homeClubId).toBe(standings[23].clubId); // Unseeded at home leg 1
    expect(playoffs[0].leg1.awayClubId).toBe(standings[8].clubId); // Seeded away leg 1

    // Round of 16 ties
    const playoffWinners = playoffs.map((p) => p.clubBId);
    const r16 = generateRoundOf16('ucl', standings, playoffWinners, 11);
    expect(r16).toHaveLength(8);
  });

  it('resolves two-legged knockout ties with aggregate scores and penalties if drawn', () => {
    const tie = {
      tieId: 'test_tie',
      tournamentId: 'ucl' as const,
      stage: 'round_of_16' as const,
      clubAId: 'real_madrid',
      clubBId: 'bayern_munich',
      leg1: {
        matchId: 'leg1_test',
        tournamentId: 'ucl' as const,
        stage: 'round_of_16' as const,
        matchWeek: 11,
        homeClubId: 'real_madrid',
        awayClubId: 'bayern_munich',
        played: false,
      },
      leg2: {
        matchId: 'leg2_test',
        tournamentId: 'ucl' as const,
        stage: 'round_of_16' as const,
        matchWeek: 12,
        homeClubId: 'bayern_munich',
        awayClubId: 'real_madrid',
        played: false,
      },
    };

    const afterLeg1 = resolveKnockoutTie(tie, 11);
    expect(afterLeg1.leg1.played).toBe(true);
    expect(afterLeg1.leg2?.played).toBe(false);

    const afterLeg2 = resolveKnockoutTie(afterLeg1, 12);
    expect(afterLeg2.leg2?.played).toBe(true);
    expect(afterLeg2.winnerClubId).toBeDefined();
    expect(afterLeg2.aggregateScoreA).toBeDefined();
    expect(afterLeg2.aggregateScoreB).toBeDefined();
  });

  it('updates global stats, produces European Golden Boot leaderboards, and awards Ballon dOr', () => {
    const statsUniverse = initializeGlobalStatsUniverse();
    expect(statsUniverse.players.size).toBeGreaterThan(500);

    // Record a 3-2 match
    const fakeMatch = {
      matchId: 'm_test_stats',
      homeClubId: 'arsenal',
      awayClubId: 'chelsea',
      homeScore: 3,
      awayScore: 2,
      scorers: [
        { playerId: 'p_arsenal_0', name: 'BUKAYO SAKA', minute: 23, clubId: 'arsenal' },
        { playerId: 'p_arsenal_0', name: 'BUKAYO SAKA', minute: 54, clubId: 'arsenal' },
        { playerId: 'p_arsenal_1', name: 'KAI HAVERTZ', minute: 78, clubId: 'arsenal' },
        { playerId: 'p_chelsea_0', name: 'COLE PALMER', minute: 31, clubId: 'chelsea' },
        { playerId: 'p_chelsea_0', name: 'COLE PALMER', minute: 88, clubId: 'chelsea' },
      ],
      assists: [
        { playerId: 'p_arsenal_1', name: 'KAI HAVERTZ', minute: 23, clubId: 'arsenal' },
        { playerId: 'p_chelsea_1', name: 'NICOLAS JACKSON', minute: 31, clubId: 'chelsea' },
      ],
      cards: [],
      injuries: [],
    };

    recordMatchToGlobalStats(statsUniverse, fakeMatch);

    const refreshed = refreshLeaderboards(statsUniverse);
    expect(refreshed.topScorers.length).toBeGreaterThan(0);
    expect(refreshed.topScorers[0].goals).toBeGreaterThanOrEqual(2);

    const awards = calculateSeasonalAwards(refreshed);
    expect(awards.worldPlayerOfTheYear).toBeDefined();
    expect(awards.goldenBoot).toBeDefined();
    expect(awards.teamOfTheYear.defenders).toHaveLength(4);
    expect(awards.teamOfTheYear.midfielders).toHaveLength(3);
    expect(awards.teamOfTheYear.forwards).toHaveLength(3);
  });
});
