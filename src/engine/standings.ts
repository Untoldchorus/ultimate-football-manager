import { Club, CompetitionType, Fixture, StandingsRow } from './types';

/**
 * Computes league standings from completed fixtures for a given competition.
 * Rules:
 * - Win = 3 pts, Draw = 1 pt, Loss = 0 pts
 * - Tiebreakers: Points -> Goal Difference -> Goals Scored -> Alphabetical Club Name
 */
export function calculateStandings(
  clubs: Club[],
  fixtures: Fixture[],
  competition: CompetitionType
): StandingsRow[] {
  const targetDivision = competition === 'division2' ? 2 : 1;
  const divisionClubs = clubs.filter((c) => c.division === targetDivision);

  const map = new Map<string, StandingsRow>();
  for (const club of divisionClubs) {
    map.set(club.id, {
      clubId: club.id,
      clubName: club.name,
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

  const completedFixtures = fixtures.filter(
    (f) => f.competition === competition && f.played && f.result
  );

  for (const fix of completedFixtures) {
    const res = fix.result!;
    const homeRow = map.get(fix.homeClubId);
    const awayRow = map.get(fix.awayClubId);

    if (homeRow) {
      homeRow.played += 1;
      homeRow.goalsFor += res.homeScore;
      homeRow.goalsAgainst += res.awayScore;
      homeRow.goalDifference = homeRow.goalsFor - homeRow.goalsAgainst;
      if (res.homeScore > res.awayScore) {
        homeRow.won += 1;
        homeRow.points += 3;
        homeRow.form.push('W');
      } else if (res.homeScore === res.awayScore) {
        homeRow.drawn += 1;
        homeRow.points += 1;
        homeRow.form.push('D');
      } else {
        homeRow.lost += 1;
        homeRow.form.push('L');
      }
      if (homeRow.form.length > 5) homeRow.form.shift();
    }

    if (awayRow) {
      awayRow.played += 1;
      awayRow.goalsFor += res.awayScore;
      awayRow.goalsAgainst += res.homeScore;
      awayRow.goalDifference = awayRow.goalsFor - awayRow.goalsAgainst;
      if (res.awayScore > res.homeScore) {
        awayRow.won += 1;
        awayRow.points += 3;
        awayRow.form.push('W');
      } else if (res.awayScore === res.homeScore) {
        awayRow.drawn += 1;
        awayRow.points += 1;
        awayRow.form.push('D');
      } else {
        awayRow.lost += 1;
        awayRow.form.push('L');
      }
      if (awayRow.form.length > 5) awayRow.form.shift();
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.clubName.localeCompare(b.clubName);
  });
}
