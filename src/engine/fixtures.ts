import { createRng } from './rng';
import { Club, CompetitionType, Fixture } from './types';

/**
 * Generates a double round-robin schedule for an even number of clubs using the Circle Method.
 * For 10 clubs in a division:
 * - First half: 9 rounds (5 matches per round = 45 matches)
 * - Second half: 9 rounds with reversed home/away (45 matches)
 * - Total: 18 league rounds (90 matches per division), zero duplicates, every pair plays once home and once away.
 */
export function generateDoubleRoundRobinFixtures(
  clubIds: string[],
  competition: CompetitionType,
  season: number,
  seed: number,
  weekMapping?: number[]
): Fixture[] {
  const rng = createRng(seed);
  const shuffled = rng.shuffle(clubIds);
  const n = shuffled.length;
  if (n % 2 !== 0 || n < 2) {
    throw new Error('Double round-robin requires an even number of clubs >= 2.');
  }

  const numRoundsOneWay = n - 1;
  const halfSize = n / 2;
  const fixtures: Fixture[] = [];

  const rotating = shuffled.slice(1);

  // First half of season
  const firstHalfRounds: Array<Array<{ home: string; away: string }>> = [];

  for (let round = 0; round < numRoundsOneWay; round++) {
    const roundMatches: Array<{ home: string; away: string }> = [];
    const currentCircle = [shuffled[0], ...rotating];

    for (let i = 0; i < halfSize; i++) {
      const teamA = currentCircle[i];
      const teamB = currentCircle[n - 1 - i];
      if (i === 0 && round % 2 === 1) {
        roundMatches.push({ home: teamB, away: teamA });
      } else {
        roundMatches.push({ home: teamA, away: teamB });
      }
    }

    firstHalfRounds.push(roundMatches);

    // Rotate clockwise
    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  const allRounds = [
    ...firstHalfRounds,
    ...firstHalfRounds.map((r) => r.map((m) => ({ home: m.away, away: m.home }))),
  ];

  allRounds.forEach((roundMatches, idx) => {
    const week = weekMapping ? weekMapping[idx] : idx + 1;
    roundMatches.forEach((match, mIdx) => {
      fixtures.push({
        id: `fix-${season}-${competition}-r${idx + 1}-m${mIdx + 1}`,
        season,
        week,
        competition,
        roundName: `Matchday ${idx + 1}`,
        homeClubId: match.home,
        awayClubId: match.away,
        played: false,
      });
    });
  });

  return fixtures;
}

/**
 * Generates the full 22-week season schedule:
 * - 18 League Matchdays (Weeks 1,2,3, 5,6,7,8, 10,11,12,13, 15,16,17,18, 20,21,22)
 * - Domestic Cup rounds on Weeks 4 (R16), 9 (QF), 14 (SF), 19 (Final)
 * - Champions Cup knockout for top Division 1 clubs & Super Cup
 */
export function generateSeasonFixtures(
  clubs: Club[],
  season: number,
  seed: number
): Fixture[] {
  const leagueWeeks = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20, 21, 22];

  const div1Ids = clubs.filter((c) => c.division === 1).map((c) => c.id);
  const div2Ids = clubs.filter((c) => c.division === 2).map((c) => c.id);

  const div1Fixtures = generateDoubleRoundRobinFixtures(
    div1Ids,
    'division1',
    season,
    seed ^ 0x1111,
    leagueWeeks
  );
  const div2Fixtures = generateDoubleRoundRobinFixtures(
    div2Ids,
    'division2',
    season,
    seed ^ 0x2222,
    leagueWeeks
  );

  // Domestic Cup Round of 16 on Week 4 (16 top clubs by reputation across both divisions)
  const rng = createRng(seed ^ 0x3333);
  const sortedByRep = [...clubs].sort((a, b) => b.reputation - a.reputation);
  const cup16 = rng.shuffle(sortedByRep.slice(0, 16).map((c) => c.id));
  const cupFixtures: Fixture[] = [];

  for (let i = 0; i < 8; i++) {
    cupFixtures.push({
      id: `fix-${season}-domesticCup-r16-${i + 1}`,
      season,
      week: 4,
      competition: 'domesticCup',
      roundName: 'Round of 16',
      homeClubId: cup16[i * 2],
      awayClubId: cup16[i * 2 + 1],
      played: false,
    });
  }

  // Continental Champions Cup Semi-Finals on Week 9 for top 4 Div 1 clubs
  const top4Div1 = [...clubs]
    .filter((c) => c.division === 1)
    .sort((a, b) => b.reputation - a.reputation)
    .slice(0, 4);

  if (top4Div1.length === 4) {
    cupFixtures.push(
      {
        id: `fix-${season}-championsCup-sf-1`,
        season,
        week: 9,
        competition: 'championsCup',
        roundName: 'Semi-Final',
        homeClubId: top4Div1[0].id,
        awayClubId: top4Div1[3].id,
        played: false,
      },
      {
        id: `fix-${season}-championsCup-sf-2`,
        season,
        week: 9,
        competition: 'championsCup',
        roundName: 'Semi-Final',
        homeClubId: top4Div1[1].id,
        awayClubId: top4Div1[2].id,
        played: false,
      }
    );
  }

  return [...div1Fixtures, ...div2Fixtures, ...cupFixtures].sort((a, b) => a.week - b.week);
}
