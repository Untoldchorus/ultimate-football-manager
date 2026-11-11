import { describe, expect, it } from 'vitest';
import { generateInitialGameState } from '@/engine/generator';
import { simulateMatch } from '@/engine/matchEngine';
import { Club, Player } from '@/engine/types';

describe('Match Engine Realism Targets (1,000 Simulated Matches)', () => {
  const baseState = generateInitialGameState(12345, {
    name: 'Test Manager',
    nationality: 'England',
    tacticalStyle: 'balanced',
    difficulty: 'standard',
    startingChallenge: 'none',
    clubId: 'club-emerald',
  });

  // Pick two evenly matched average clubs (approx 75 OVR)
  const rawHomeClub = baseState.clubs.find((c) => c.id === 'club-emerald')!;
  const rawAwayClub = baseState.clubs.find((c) => c.id === 'club-solaris')!;

  const normalizePlayersToOvr = (players: Player[], targetOvr: number): Player[] =>
    players.map((p) => {
      const diff = targetOvr - p.overall;
      const newAttrs = { ...p.attributes };
      for (const k of Object.keys(newAttrs) as (keyof typeof newAttrs)[]) {
        newAttrs[k] = Math.max(20, Math.min(95, newAttrs[k] + diff));
      }
      return {
        ...p,
        overall: targetOvr,
        fitness: 98,
        morale: 80,
        form: 7,
        attributes: newAttrs,
      };
    });

  const homePlayers75 = normalizePlayersToOvr(
    baseState.players.filter((p) => p.clubId === rawHomeClub.id),
    75
  );
  const awayPlayers75 = normalizePlayersToOvr(
    baseState.players.filter((p) => p.clubId === rawAwayClub.id),
    75
  );

  const homeClubBalanced: Club = {
    ...rawHomeClub,
    tactics: {
      ...rawHomeClub.tactics,
      mentality: 'balanced',
      attackingStyle: 'balanced',
      pressing: 'medium',
    },
  };

  const awayClubBalanced: Club = {
    ...rawAwayClub,
    tactics: {
      ...rawAwayClub.tactics,
      mentality: 'balanced',
      attackingStyle: 'balanced',
      pressing: 'medium',
    },
  };

  it('meets all statistical realism bounds over 1,000 matches between equal average teams', () => {
    const N = 1000;
    let totalGoals = 0;
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let totalHomeShots = 0;
    let totalAwayShots = 0;
    let totalShotsOnTarget = 0;
    let totalYellows = 0;
    let totalReds = 0;

    for (let i = 1; i <= N; i++) {
      const res = simulateMatch(
        {
          fixtureId: `sim-${i}`,
          homeClub: homeClubBalanced,
          awayClub: awayClubBalanced,
          homePlayers: homePlayers75,
          awayPlayers: awayPlayers75,
        },
        100000 + i * 7919
      );

      totalGoals += res.homeScore + res.awayScore;
      if (res.homeScore > res.awayScore) homeWins++;
      else if (res.homeScore === res.awayScore) draws++;
      else awayWins++;

      totalHomeShots += res.homeStats.shots;
      totalAwayShots += res.awayStats.shots;
      totalShotsOnTarget += res.homeStats.shotsOnTarget + res.awayStats.shotsOnTarget;
      totalYellows += res.homeStats.yellowCards + res.awayStats.yellowCards;
      totalReds += res.homeStats.redCards + res.awayStats.redCards;
    }

    const goalsPerMatch = totalGoals / N;
    const homeWinPct = (homeWins / N) * 100;
    const drawPct = (draws / N) * 100;
    const awayWinPct = (awayWins / N) * 100;
    const shotsPerTeam = (totalHomeShots + totalAwayShots) / (2 * N);
    const sotRatio = totalShotsOnTarget / (totalHomeShots + totalAwayShots);
    const yellowsPerMatch = totalYellows / N;
    const redsPerMatch = totalReds / N;

    console.log({
      goalsPerMatch,
      homeWinPct,
      drawPct,
      awayWinPct,
      shotsPerTeam,
      sotRatio,
      yellowsPerMatch,
      redsPerMatch,
    });

    expect(goalsPerMatch).toBeGreaterThanOrEqual(2.5);
    expect(goalsPerMatch).toBeLessThanOrEqual(3.0);

    expect(homeWinPct).toBeGreaterThanOrEqual(43);
    expect(homeWinPct).toBeLessThanOrEqual(47);

    expect(drawPct).toBeGreaterThanOrEqual(24);
    expect(drawPct).toBeLessThanOrEqual(28);

    expect(awayWinPct).toBeGreaterThanOrEqual(27);
    expect(awayWinPct).toBeLessThanOrEqual(31);

    expect(shotsPerTeam).toBeGreaterThanOrEqual(10);
    expect(shotsPerTeam).toBeLessThanOrEqual(14);

    expect(sotRatio).toBeGreaterThanOrEqual(0.31);
    expect(sotRatio).toBeLessThanOrEqual(0.39);

    expect(yellowsPerMatch).toBeGreaterThanOrEqual(3.0);
    expect(yellowsPerMatch).toBeLessThanOrEqual(5.0);

    expect(redsPerMatch).toBeLessThan(0.12);
  });

  it('ensures a +10 OVR team wins clearly more often while upsets still occur (~10-15%)', () => {
    const N = 500;
    const strongPlayers82 = normalizePlayersToOvr(
      baseState.players.filter((p) => p.clubId === rawHomeClub.id),
      82
    );
    const underdogPlayers72 = normalizePlayersToOvr(
      baseState.players.filter((p) => p.clubId === rawAwayClub.id),
      72
    );

    let strongWins = 0;
    let underdogWins = 0;

    for (let i = 1; i <= N; i++) {
      const res = simulateMatch(
        {
          fixtureId: `upset-${i}`,
          homeClub: homeClubBalanced,
          awayClub: awayClubBalanced,
          homePlayers: strongPlayers82,
          awayPlayers: underdogPlayers72,
          isNeutralVenue: true,
        },
        500000 + i * 6151
      );
      if (res.homeScore > res.awayScore) strongWins++;
      else if (res.awayScore > res.homeScore) underdogWins++;
    }

    const strongWinPct = (strongWins / N) * 100;
    const upsetPct = (underdogWins / N) * 100;

    console.log({ strongWinPct, upsetPct });

    expect(strongWinPct).toBeGreaterThan(55);
    expect(upsetPct).toBeGreaterThanOrEqual(8);
    expect(upsetPct).toBeLessThanOrEqual(18);
  });
});
