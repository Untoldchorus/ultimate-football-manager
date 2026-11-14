import {
  DEFAULT_BALANCE_CONFIG,
} from './balanceConfig';
import {
  ensureEconomyState,
  expireSeasonPositionBoostersAtSeasonEnd,
  tickTemporaryPositionBoostersAfterMatch,
  tickWeeklyBoostersAndExpirations,
} from './boosterEconomy';
import {
  evaluateTeamChemistry,
  processWeeklyChemistryDevelopmentAndDecay,
  updatePairChemistryAfterMatch,
} from './chemistryEngine';
import {
  autoPickLineupForClub,
  generatePlayer,
} from './generator';
import { generateSeasonFixtures } from './fixtures';
import { simulateMatch } from './matchEngine';
import {
  calculateMarketValue,
  calculateOverallRating,
  calculateWeeklyWage,
  FORMATION_SLOTS,
} from './ratings';
import { createRng } from './rng';
import { calculateStandings } from './standings';
import { evaluateTeamSynergy } from './synergyEngine';
import {
  progressPositionalFamiliarity,
  resolveExtendedPlayerAttributes,
} from './tacticalMatrixEngine';
import {
  MIN_SQUAD_SIZE,
  processWeeklyAiTransfers,
  processWeeklyScouting,
  processWeeklyTraining,
} from './transfers';
import {
  Club,
  Fixture,
  GameState,
  MatchResult,
  Player,
  PositionCode,
  SeasonHistorySummary,
  TrophyRecord,
} from './types';

/**
 * Applies a completed MatchResult to the GameState (updates fixture, player stats, fitness, morale, and home gate revenue).
 */
export function applyMatchResultToState(
  state: GameState,
  fixtureId: string,
  result: MatchResult
): GameState {
  const fixture = state.fixtures.find((f) => f.id === fixtureId);
  if (!fixture || fixture.played) return state;

  const updatedFixtures = state.fixtures.map((f) =>
    f.id === fixtureId ? { ...f, played: true, result } : f
  );

  const homeClub = state.clubs.find((c) => c.id === result.homeClubId);
  const awayClub = state.clubs.find((c) => c.id === result.awayClubId);

  const goalCounts = new Map<string, number>();
  const assistCounts = new Map<string, number>();
  const yellowCounts = new Map<string, number>();
  const redCounts = new Map<string, number>();
  const injuryWeeksMap = new Map<string, number>();

  for (const ev of result.events) {
    if (ev.type === 'goal' && ev.playerId) {
      goalCounts.set(ev.playerId, (goalCounts.get(ev.playerId) ?? 0) + 1);
      if (ev.secondaryPlayerId) {
        assistCounts.set(ev.secondaryPlayerId, (assistCounts.get(ev.secondaryPlayerId) ?? 0) + 1);
      }
    } else if (ev.type === 'yellowCard' && ev.playerId) {
      yellowCounts.set(ev.playerId, (yellowCounts.get(ev.playerId) ?? 0) + 1);
    } else if (ev.type === 'redCard' && ev.playerId) {
      redCounts.set(ev.playerId, (redCounts.get(ev.playerId) ?? 0) + 1);
    } else if (ev.type === 'injury' && ev.playerId) {
      injuryWeeksMap.set(ev.playerId, ev.metadata?.injuryWeeks ?? 2);
    }
  }

  const homeStarters = new Set(homeClub?.startingXI ?? []);
  const awayStarters = new Set(awayClub?.startingXI ?? []);
  const subbedInIds = new Set<string>();
  for (const ev of result.events) {
    if (ev.type === 'substitution' && ev.metadata?.subInId) {
      subbedInIds.add(ev.metadata.subInId);
    }
  }
  const homeSlots = homeClub ? FORMATION_SLOTS[homeClub.tactics.formation] ?? FORMATION_SLOTS['4-3-3'] : FORMATION_SLOTS['4-3-3'];
  const awaySlots = awayClub ? FORMATION_SLOTS[awayClub.tactics.formation] ?? FORMATION_SLOTS['4-3-3'] : FORMATION_SLOTS['4-3-3'];

  const homeCleanSheet = result.awayScore === 0;
  const awayCleanSheet = result.homeScore === 0;
  const homeWon = result.homeScore > result.awayScore;
  const awayWon = result.awayScore > result.homeScore;

  const updatedPlayers = state.players.map((p) => {
    const isHomeStarter = homeStarters.has(p.id);
    const isAwayStarter = awayStarters.has(p.id);
    const isSubIn = subbedInIds.has(p.id);

    if (!isHomeStarter && !isAwayStarter && !isSubIn) {
      // Bench/Reserve player recovers fitness & clears accumulated fatigue, but star players may lose morale if benched
      const moraleDelta =
        (p.clubId === result.homeClubId || p.clubId === result.awayClubId) &&
        p.roleExpectation === 'star' &&
        p.injuryWeeks === 0
          ? -3
          : 0;
      const newMorale = Math.max(20, Math.min(100, p.morale + moraleDelta));
      const ext = resolveExtendedPlayerAttributes(p);
      const naturalClearance = Math.round(12 + ext.recovery * 0.12);
      const nextFatigue = Math.max(0, (p.fatigue ?? 0) - naturalClearance);
      return {
        ...p,
        fitness: Math.min(100, p.fitness + 6),
        stamina: Math.min(100, (p.stamina ?? 90) + 12),
        fatigue: nextFatigue,
        consecutiveMatches: 0,
        morale: newMorale,
        transferRequested: p.transferRequested || newMorale < 35,
      };
    }

    const matchRating = result.playerRatings[p.id] ?? 6.5;
    const apps = p.stats.appearances + 1;
    const avgRating =
      Math.round(((p.stats.averageRating * p.stats.appearances + matchRating) / apps) * 10) / 10;

    const cleanSheetInc =
      (isHomeStarter && homeCleanSheet && ['GK', 'CB', 'LB', 'RB'].includes(p.primaryPosition)) ||
      (isAwayStarter && awayCleanSheet && ['GK', 'CB', 'LB', 'RB'].includes(p.primaryPosition))
        ? 1
        : 0;

    const won =
      ((isHomeStarter || p.clubId === result.homeClubId) && homeWon) ||
      ((isAwayStarter || p.clubId === result.awayClubId) && awayWon);
    const drew = result.homeScore === result.awayScore;
    const moraleDelta = won ? 4 : drew ? 1 : -3;
    const newMorale = Math.max(25, Math.min(100, p.morale + moraleDelta));
    const newForm = Math.max(1, Math.min(10, Math.round((p.form * 0.7 + matchRating * 0.3) * 10) / 10));

    // Calculate played position & progress positional familiarity if deployed in a secondary/unfamiliar slot
    let playedPos: PositionCode = p.primaryPosition;
    if (isHomeStarter && homeClub) {
      const idx = homeClub.startingXI.indexOf(p.id);
      if (idx >= 0 && homeSlots[idx]) playedPos = homeSlots[idx].position;
    } else if (isAwayStarter && awayClub) {
      const idx = awayClub.startingXI.indexOf(p.id);
      if (idx >= 0 && awaySlots[idx]) playedPos = awaySlots[idx].position;
    }
    const mins = isSubIn && !isHomeStarter && !isAwayStarter ? 25 : 90;
    const progressedPlayer = progressPositionalFamiliarity(p, playedPos, mins, false);

    const consec = (p.consecutiveMatches ?? 0) + 1;
    const rawFatigueDelta = result.playerFatigueDelta?.[p.id] ?? (mins >= 60 ? 11 : 5);
    const consecExtraFatigue = consec >= 3 ? (consec - 2) * 3 : 0;
    const nextFatigue = Math.min(100, Math.round((p.fatigue ?? 0) + rawFatigueDelta + consecExtraFatigue));
    const nextStamina = Math.max(45, Math.min(100, Math.round(100 - nextFatigue * 0.45)));

    return {
      ...progressedPlayer,
      fitness: Math.max(45, p.fitness - (mins >= 60 ? 9 : 4)),
      stamina: nextStamina,
      fatigue: nextFatigue,
      consecutiveMatches: consec,
      morale: newMorale,
      form: newForm,
      injuryWeeks: p.injuryWeeks + (injuryWeeksMap.get(p.id) ?? 0),
      stats: {
        appearances: apps,
        goals: p.stats.goals + (goalCounts.get(p.id) ?? 0),
        assists: p.stats.assists + (assistCounts.get(p.id) ?? 0),
        cleanSheets: p.stats.cleanSheets + cleanSheetInc,
        yellowCards: p.stats.yellowCards + (yellowCounts.get(p.id) ?? 0),
        redCards: p.stats.redCards + (redCounts.get(p.id) ?? 0),
        averageRating: avgRating,
        minutesPlayed: p.stats.minutesPlayed + mins,
      },
    };
  });

  // Home club gate receipt
  const updatedClubs = state.clubs.map((c) => {
    if (c.id !== result.homeClubId) return c;
    const gate = c.finances.matchdayRevenuePerHomeGame;
    return {
      ...c,
      finances: {
        ...c.finances,
        cashBalance: c.finances.cashBalance + gate,
        ledger: [
          {
            id: `tx-gate-${fixtureId}`,
            week: state.currentWeek,
            season: state.currentSeason,
            category: 'matchday' as const,
            description: `Matchday Gate Receipts vs ${awayClub?.name ?? 'Visitor'}`,
            amount: gate,
          },
          ...c.finances.ledger,
        ].slice(0, 60),
      },
    };
  });

  // Update interpersonal pair chemistry, Soft Currency rewards & progression objectives if user's club played
  let nextEconomy = ensureEconomyState(state);
  const userClubId = state.manager.clubId;
  const userPlayedHome = result.homeClubId === userClubId;
  const userPlayedAway = result.awayClubId === userClubId;

  if ((userPlayedHome || userPlayedAway) && (homeClub || awayClub)) {
    const uClub = (userPlayedHome ? homeClub : awayClub)!;
    const goalAssistPairs: [string, string][] = [];
    for (const ev of result.events) {
      if (ev.type === 'goal' && ev.teamId === userClubId && ev.playerId && ev.secondaryPlayerId) {
        goalAssistPairs.push([ev.playerId, ev.secondaryPlayerId]);
      }
    }

    const updatedPairChem = updatePairChemistryAfterMatch(
      nextEconomy.pairChemistry,
      uClub,
      uClub.startingXI,
      goalAssistPairs,
      state.currentSeason,
      state.currentWeek,
      nextEconomy.balanceConfig ?? DEFAULT_BALANCE_CONFIG
    );

    const userGoals = userPlayedHome ? result.homeScore : result.awayScore;
    const oppGoals = userPlayedHome ? result.awayScore : result.homeScore;
    const userWon = userGoals > oppGoals;
    const userDrew = userGoals === oppGoals;
    const userCleanSheet = oppGoals === 0;
    const matchSoftCoins = userWon ? 240 : userDrew ? 140 : 80;

    const updatedObjectives = nextEconomy.objectives.map((obj) => {
      if (obj.id === 'obj-daily-match') {
        const prog = Math.min(obj.targetProgress, obj.currentProgress + 1);
        return { ...obj, currentProgress: prog, completed: prog >= obj.targetProgress };
      }
      if (obj.id === 'obj-weekly-goals') {
        const prog = Math.min(obj.targetProgress, obj.currentProgress + userGoals);
        return { ...obj, currentProgress: prog, completed: prog >= obj.targetProgress };
      }
      if (obj.id === 'obj-weekly-cleansheet' && userCleanSheet) {
        const prog = Math.min(obj.targetProgress, obj.currentProgress + 1);
        return { ...obj, currentProgress: prog, completed: prog >= obj.targetProgress };
      }
      if (obj.id === 'obj-ach-silverware' && userWon) {
        const prog = Math.min(obj.targetProgress, obj.currentProgress + 1);
        return { ...obj, currentProgress: prog, completed: prog >= obj.targetProgress };
      }
      return obj;
    });

    // Decrement Temporary Position Boosters (3-match duration) once per completed official match for participating players
    const participatingUserPlayerIds = new Set<string>([
      ...uClub.startingXI,
      ...Array.from(subbedInIds),
    ]);
    const updatedPositionBoosters = tickTemporaryPositionBoostersAfterMatch(
      nextEconomy.activePositionBoosters ?? [],
      participatingUserPlayerIds
    );

    nextEconomy = {
      ...nextEconomy,
      softCurrency: nextEconomy.softCurrency + matchSoftCoins,
      pairChemistry: updatedPairChem,
      objectives: updatedObjectives,
      activePositionBoosters: updatedPositionBoosters,
    };
  }

  return {
    ...state,
    fixtures: updatedFixtures,
    players: updatedPlayers,
    clubs: updatedClubs,
    economy: nextEconomy,
  };
}

/**
 * Simulates all unplayed fixtures for `state.currentWeek`.
 */
export function simulateWeekMatches(state: GameState, weekSeed: number): GameState {
  let nextState = state;
  const weekFixtures = nextState.fixtures.filter(
    (f) => f.week === nextState.currentWeek && !f.played
  );

  for (let i = 0; i < weekFixtures.length; i++) {
    const fix = weekFixtures[i];
    const homeClub = nextState.clubs.find((c) => c.id === fix.homeClubId);
    const awayClub = nextState.clubs.find((c) => c.id === fix.awayClubId);
    if (!homeClub || !awayClub) continue;

    const homePlayers = nextState.players.filter((p) => p.clubId === homeClub.id);
    const awayPlayers = nextState.players.filter((p) => p.clubId === awayClub.id);

    const econ = ensureEconomyState(nextState);
    const balCfg = econ.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
    const isHomeUser = homeClub.id === nextState.manager.clubId;
    const isAwayUser = awayClub.id === nextState.manager.clubId;

    const homeChemReport = evaluateTeamChemistry(
      homeClub,
      homePlayers,
      isHomeUser ? econ.pairChemistry : {},
      nextState.currentSeason,
      nextState.currentWeek,
      isHomeUser ? econ.activeBoosters : [],
      balCfg
    );
    const awayChemReport = evaluateTeamChemistry(
      awayClub,
      awayPlayers,
      isAwayUser ? econ.pairChemistry : {},
      nextState.currentSeason,
      nextState.currentWeek,
      isAwayUser ? econ.activeBoosters : [],
      balCfg
    );
    const homeSynReport = evaluateTeamSynergy(
      homeClub,
      homePlayers,
      isHomeUser ? econ.activeBoosters : [],
      balCfg
    );
    const awaySynReport = evaluateTeamSynergy(
      awayClub,
      awayPlayers,
      isAwayUser ? econ.activeBoosters : [],
      balCfg
    );

    const res = simulateMatch(
      {
        fixtureId: fix.id,
        homeClub,
        awayClub,
        homePlayers,
        awayPlayers,
        homeChemistryScore: homeChemReport.overallChemistry,
        awayChemistryScore: awayChemReport.overallChemistry,
        homeSynergyScore: homeSynReport.overallSynergy,
        awaySynergyScore: awaySynReport.overallSynergy,
        homeActiveBoosters: isHomeUser ? econ.activeBoosters : [],
        awayActiveBoosters: isAwayUser ? econ.activeBoosters : [],
        homePositionBoosters: isHomeUser ? econ.activePositionBoosters ?? [] : [],
        awayPositionBoosters: isAwayUser ? econ.activePositionBoosters ?? [] : [],
        currentSeason: nextState.currentSeason,
        balanceConfig: balCfg,
      },
      (weekSeed ^ Math.imul(i + 1, 0x85ebca6b)) >>> 0
    );

    nextState = applyMatchResultToState(nextState, fix.id, res);
  }

  return nextState;
}

/**
 * Generates next knockout rounds for Domestic Cup (Weeks 9, 14, 19) & Champions Cup (Week 14)
 */
function advanceCupCompetitions(state: GameState, weekSeed: number): GameState {
  const rng = createRng(weekSeed ^ 0x9999);
  const newFixtures: Fixture[] = [];
  const newTrophies: TrophyRecord[] = [...state.trophies];
  const updatedNews = [...state.news];

  const getWinnerId = (f: Fixture): string => {
    if (!f.result) return f.homeClubId;
    if (f.result.homeScore > f.result.awayScore) return f.homeClubId;
    if (f.result.awayScore > f.result.homeScore) return f.awayClubId;
    return rng.chance(0.5) ? f.homeClubId : f.awayClubId;
  };

  // Domestic Cup progression: R16 (w4) -> QF (w9) -> SF (w14) -> Final (w19)
  const cupRoundMap: Record<number, { prevWeek: number; nextWeek: number; roundName: string }> = {
    4: { prevWeek: 4, nextWeek: 9, roundName: 'Quarter-Final' },
    9: { prevWeek: 9, nextWeek: 14, roundName: 'Semi-Final' },
    14: { prevWeek: 14, nextWeek: 19, roundName: 'Final' },
  };

  const cupStep = cupRoundMap[state.currentWeek];
  if (cupStep) {
    const prevMatches = state.fixtures.filter(
      (f) =>
        f.season === state.currentSeason &&
        f.competition === 'domesticCup' &&
        f.week === cupStep.prevWeek &&
        f.played
    );
    const winners = prevMatches.map(getWinnerId);
    for (let i = 0; i < Math.floor(winners.length / 2); i++) {
      newFixtures.push({
        id: `fix-${state.currentSeason}-domesticCup-w${cupStep.nextWeek}-${i + 1}`,
        season: state.currentSeason,
        week: cupStep.nextWeek,
        competition: 'domesticCup',
        roundName: cupStep.roundName,
        homeClubId: winners[i * 2],
        awayClubId: winners[i * 2 + 1],
        played: false,
      });
    }
  }

  // Record Domestic Cup Winner at Week 19
  if (state.currentWeek === 19) {
    const finalMatch = state.fixtures.find(
      (f) =>
        f.season === state.currentSeason &&
        f.competition === 'domesticCup' &&
        f.week === 19 &&
        f.played
    );
    if (finalMatch) {
      const winnerId = getWinnerId(finalMatch);
      const runnerUpId =
        winnerId === finalMatch.homeClubId ? finalMatch.awayClubId : finalMatch.homeClubId;
      const wClub = state.clubs.find((c) => c.id === winnerId);
      const rClub = state.clubs.find((c) => c.id === runnerUpId);
      if (wClub && rClub) {
        newTrophies.push({
          id: `trophy-domcup-${state.currentSeason}`,
          season: state.currentSeason,
          competition: 'domesticCup',
          competitionName: 'National Challenge Cup',
          winnerClubId: wClub.id,
          winnerClubName: wClub.name,
          runnerUpClubId: rClub.id,
          runnerUpClubName: rClub.name,
        });
        updatedNews.unshift({
          id: `news-domcup-${state.currentSeason}`,
          week: state.currentWeek,
          season: state.currentSeason,
          title: `${wClub.name} lift the National Challenge Cup!`,
          body: `${wClub.name} defeated ${rClub.name} in the final to claim domestic cup glory!`,
          category: 'cup',
        });
      }
    }
  }

  // Champions Cup SF (w9) -> Final (w14)
  if (state.currentWeek === 9) {
    const sfMatches = state.fixtures.filter(
      (f) =>
        f.season === state.currentSeason &&
        f.competition === 'championsCup' &&
        f.week === 9 &&
        f.played
    );
    if (sfMatches.length === 2) {
      newFixtures.push({
        id: `fix-${state.currentSeason}-championsCup-final`,
        season: state.currentSeason,
        week: 14,
        competition: 'championsCup',
        roundName: 'Final',
        homeClubId: getWinnerId(sfMatches[0]),
        awayClubId: getWinnerId(sfMatches[1]),
        played: false,
      });
    }
  }

  if (state.currentWeek === 14) {
    const ccFinal = state.fixtures.find(
      (f) =>
        f.season === state.currentSeason &&
        f.competition === 'championsCup' &&
        f.week === 14 &&
        f.played
    );
    if (ccFinal) {
      const winnerId = getWinnerId(ccFinal);
      const runnerUpId =
        winnerId === ccFinal.homeClubId ? ccFinal.awayClubId : ccFinal.homeClubId;
      const wClub = state.clubs.find((c) => c.id === winnerId);
      const rClub = state.clubs.find((c) => c.id === runnerUpId);
      if (wClub && rClub) {
        newTrophies.push({
          id: `trophy-cc-${state.currentSeason}`,
          season: state.currentSeason,
          competition: 'championsCup',
          competitionName: 'Continental Champions Cup',
          winnerClubId: wClub.id,
          winnerClubName: wClub.name,
          runnerUpClubId: rClub.id,
          runnerUpClubName: rClub.name,
        });
      }
    }
  }

  return {
    ...state,
    fixtures: [...state.fixtures, ...newFixtures],
    trophies: newTrophies,
    news: updatedNews.slice(0, 60),
  };
}

/**
 * Processes weekly finances (sponsorship income, wage bill, staff/stadium maintenance) and Board confidence.
 */
export function processWeeklyFinancesAndBoard(state: GameState): GameState {
  const updatedClubs = state.clubs.map((c) => {
    const wages = c.finances.currentWageBillWeekly;
    const maint = c.finances.weeklyStaffAndStadiumCost;
    const sponsor = c.finances.weeklySponsorIncome;
    const netWeekly = sponsor - wages - maint;

    return {
      ...c,
      finances: {
        ...c.finances,
        cashBalance: c.finances.cashBalance + netWeekly,
        ledger: [
          {
            id: `tx-wk-${state.currentSeason}-w${state.currentWeek}-${c.id}`,
            week: state.currentWeek,
            season: state.currentSeason,
            category: 'wages' as const,
            description: `Week ${state.currentWeek} Net Operations (Sponsor +£${sponsor.toLocaleString()} / Wages & Staff -£${(wages + maint).toLocaleString()})`,
            amount: netWeekly,
          },
          ...c.finances.ledger,
        ].slice(0, 60),
      },
    };
  });

  // Update board confidence for manager's club
  const userClub = updatedClubs.find((c) => c.id === state.manager.clubId) ?? updatedClubs[0];
  const comp = userClub.division === 1 ? 'division1' : 'division2';
  const standings = calculateStandings(updatedClubs, state.fixtures, comp);
  const currentPos = standings.findIndex((r) => r.clubId === userClub.id) + 1;

  const posDiff = state.board.targetLeaguePosition - currentPos;
  const wageOk = userClub.finances.currentWageBillWeekly <= userClub.finances.wageBudgetWeekly;
  const rawConf = 72 + posDiff * 4 + (wageOk ? 4 : -8);
  const confidence = Math.max(15, Math.min(100, Math.round(state.board.confidence * 0.7 + rawConf * 0.3)));

  return {
    ...state,
    clubs: updatedClubs,
    board: {
      ...state.board,
      confidence,
      warningsCount: confidence < 35 ? state.board.warningsCount + 1 : state.board.warningsCount,
    },
  };
}

/**
 * Full Season Rollover when Week 22 completes:
 * - Records league champions & runner-ups in `trophies`
 * - Records `seasonHistory` summary for user's club
 * - Promotes top 2 from Division 2 and relegates bottom 2 from Division 1
 * - Awards prize money
 * - Ages players (+1 year), retires veterans >= 35, spawns youth replacements so every club has >= 22 senior players
 * - Resets seasonal stats & generates new season fixtures
 */
export function performSeasonRollover(state: GameState): GameState {
  const nextSeason = state.currentSeason + 1;
  const rng = createRng((state.worldSeed ^ Math.imul(nextSeason, 0x9e3779b9)) >>> 0);

  const div1Standings = calculateStandings(state.clubs, state.fixtures, 'division1');
  const div2Standings = calculateStandings(state.clubs, state.fixtures, 'division2');

  const newTrophies: TrophyRecord[] = [...state.trophies];
  if (div1Standings.length >= 2) {
    newTrophies.push({
      id: `trophy-div1-${state.currentSeason}`,
      season: state.currentSeason,
      competition: 'division1',
      competitionName: 'Premier Division 1',
      winnerClubId: div1Standings[0].clubId,
      winnerClubName: div1Standings[0].clubName,
      runnerUpClubId: div1Standings[1].clubId,
      runnerUpClubName: div1Standings[1].clubName,
    });
  }
  if (div2Standings.length >= 2) {
    newTrophies.push({
      id: `trophy-div2-${state.currentSeason}`,
      season: state.currentSeason,
      competition: 'division2',
      competitionName: 'Championship Division 2',
      winnerClubId: div2Standings[0].clubId,
      winnerClubName: div2Standings[0].clubName,
      runnerUpClubId: div2Standings[1].clubId,
      runnerUpClubName: div2Standings[1].clubName,
    });
  }

  // Record user's season history
  const userClub = state.clubs.find((c) => c.id === state.manager.clubId) ?? state.clubs[0];
  const userStandings = userClub.division === 1 ? div1Standings : div2Standings;
  const userRowIdx = userStandings.findIndex((r) => r.clubId === userClub.id);
  const userRow = userStandings[userRowIdx] ?? userStandings[0];

  const userPlayers = state.players
    .filter((p) => p.clubId === userClub.id)
    .sort((a, b) => b.stats.goals - a.stats.goals);
  const topScorer = userPlayers[0];

  const userTrophiesThisSeason = newTrophies
    .filter((t) => t.season === state.currentSeason && t.winnerClubId === userClub.id)
    .map((t) => t.competitionName);

  const historyEntry: SeasonHistorySummary = {
    season: state.currentSeason,
    clubId: userClub.id,
    clubName: userClub.name,
    division: userClub.division,
    finalPosition: userRowIdx + 1,
    played: userRow.played,
    won: userRow.won,
    drawn: userRow.drawn,
    lost: userRow.lost,
    goalsFor: userRow.goalsFor,
    goalsAgainst: userRow.goalsAgainst,
    points: userRow.points,
    topScorerName: topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : 'N/A',
    topScorerGoals: topScorer ? topScorer.stats.goals : 0,
    trophiesWon: userTrophiesThisSeason,
  };

  // Promotion & Relegation (bottom 2 of Div 1 <-> top 2 of Div 2)
  const relegatedIds = new Set(div1Standings.slice(-2).map((r) => r.clubId));
  const promotedIds = new Set(div2Standings.slice(0, 2).map((r) => r.clubId));

  // Age players, return loans, handle retirements & contract expiries
  const survivingPlayers: Player[] = [];
  for (const p of state.players) {
    const newAge = p.age + 1;
    // Retire players aged >= 36 (or >= 34 with chance)
    if (newAge >= 36 || (newAge >= 34 && rng.chance(0.4))) {
      continue;
    }

    const returnedClubId = p.loanedFromClubId ?? p.clubId;
    const ageDecline = newAge >= 31 ? -1 : 0;
    const newOvr = Math.max(45, Math.min(p.potential, p.overall + ageDecline));

    survivingPlayers.push({
      ...p,
      age: newAge,
      clubId: returnedClubId,
      loanedFromClubId: null,
      overall: newOvr,
      marketValue: calculateMarketValue(newOvr, newAge, p.potential),
      weeklyWage: calculateWeeklyWage(newOvr, newAge),
      contractEndSeason: p.contractEndSeason <= nextSeason ? nextSeason + 2 : p.contractEndSeason,
      fitness: 100,
      injuryWeeks: 0,
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
    });
  }

  // Ensure every club has at least 22 senior players (and at least 2 GKs) + 2 new youth prospects
  let regenSeq = 1;
  const updatedClubs: Club[] = state.clubs.map((club) => {
    let newDivision = club.division;
    if (relegatedIds.has(club.id)) newDivision = 2;
    else if (promotedIds.has(club.id)) newDivision = 1;

    const clubPool = survivingPlayers.filter((p) => p.clubId === club.id && !p.isYouth);
    const gkCount = clubPool.filter((p) => p.primaryPosition === 'GK').length;

    if (gkCount < 2) {
      for (let g = gkCount; g < 2; g++) {
        const regenGk = generatePlayer(
          rng,
          `regen-${nextSeason}-${club.id}-gk-${regenSeq++}`,
          club.id,
          'GK',
          club.reputation,
          nextSeason,
          false
        );
        survivingPlayers.push(regenGk);
        clubPool.push(regenGk);
      }
    }

    const fillPositions: PositionCode[] = ['CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
    while (clubPool.length < Math.max(22, MIN_SQUAD_SIZE + 4)) {
      const pos = rng.pick(fillPositions);
      const regen = generatePlayer(
        rng,
        `regen-${nextSeason}-${club.id}-${regenSeq++}`,
        club.id,
        pos,
        club.reputation,
        nextSeason,
        false
      );
      survivingPlayers.push(regen);
      clubPool.push(regen);
    }

    // Add 1 fresh youth academy intake player per season
    const youthIntake = generatePlayer(
      rng,
      `youth-${nextSeason}-${club.id}-${regenSeq++}`,
      club.id,
      rng.pick(fillPositions),
      club.reputation,
      nextSeason,
      true
    );
    survivingPlayers.push(youthIntake);

    const allClubPlayers = survivingPlayers.filter((p) => p.clubId === club.id);
    const { startingXI, substitutes, reserves } = autoPickLineupForClub(
      club.tactics.formation,
      allClubPlayers
    );

    const prizeMoney = newDivision === 1 ? 8500000 : 3200000;
    const wageBill = allClubPlayers.reduce((s, p) => s + p.weeklyWage, 0);

    return {
      ...club,
      division: newDivision,
      startingXI,
      substitutes,
      reserves,
      finances: {
        ...club.finances,
        transferBudget: club.finances.transferBudget + Math.round(prizeMoney * 0.6),
        cashBalance: club.finances.cashBalance + prizeMoney,
        currentWageBillWeekly: wageBill,
        seasonPrizeMoneyEarned: prizeMoney,
        ledger: [
          {
            id: `tx-prize-${nextSeason}-${club.id}`,
            week: 1,
            season: nextSeason,
            category: 'prize' as const,
            description: `Season ${state.currentSeason} Prize & TV Distribution`,
            amount: prizeMoney,
          },
          ...club.finances.ledger,
        ].slice(0, 60),
      },
    };
  });

  const nextFixtures = generateSeasonFixtures(updatedClubs, nextSeason, state.worldSeed + nextSeason);

  // Expire all 1-season Position Boosters at season rollover without mutating natural positions
  const nextEcon = ensureEconomyState(state);
  const rolledPositionBoosters = expireSeasonPositionBoostersAtSeasonEnd(
    nextEcon.activePositionBoosters ?? [],
    state.currentSeason
  );

  return {
    ...state,
    currentSeason: nextSeason,
    currentWeek: 1,
    clubs: updatedClubs,
    players: survivingPlayers,
    fixtures: nextFixtures,
    trophies: newTrophies,
    seasonHistory: [historyEntry, ...state.seasonHistory],
    economy: {
      ...nextEcon,
      activePositionBoosters: rolledPositionBoosters,
    },
    news: [
      {
        id: `news-newseason-${nextSeason}`,
        week: 1,
        season: nextSeason,
        title: `Welcome to the ${nextSeason}/${nextSeason + 1} Season!`,
        body: `Fixtures have been released for the ${nextSeason} campaign. Prize money has been credited to club budgets.`,
        category: 'board' as const,
      },
      ...state.news,
    ].slice(0, 60),
  };
}

/**
 * Advances the game by one full week:
 * 1. Simulates any remaining unplayed matches in the current week
 * 2. Processes cup progression
 * 3. Runs weekly training, scouting, AI transfers, and financial/board updates
 * 4. Increments `currentWeek` (or triggers `performSeasonRollover` after week 22)
 */
export function advanceGameWeek(state: GameState): GameState {
  const weekSeed = (state.worldSeed ^ Math.imul(state.currentSeason * 100 + state.currentWeek, 0x9e3779b9)) >>> 0;

  let next = simulateWeekMatches(state, weekSeed);
  next = advanceCupCompetitions(next, weekSeed);
  next = processWeeklyTraining(next, weekSeed);
  next = processWeeklyScouting(next, weekSeed);
  next = processWeeklyAiTransfers(next, weekSeed);
  next = processWeeklyFinancesAndBoard(next);

  // Process weekly interpersonal chemistry development/decay, active booster countdowns, and history snapshots
  next = tickWeeklyBoostersAndExpirations(next);
  const econ = ensureEconomyState(next);
  const userClub = next.clubs.find((c) => c.id === next.manager.clubId) ?? next.clubs[0];
  const userPlayers = next.players.filter((p) => p.clubId === userClub.id);
  const balCfg = econ.balanceConfig ?? DEFAULT_BALANCE_CONFIG;

  const updatedPairChem = processWeeklyChemistryDevelopmentAndDecay(
    econ.pairChemistry,
    userClub,
    userPlayers,
    next.currentSeason,
    next.currentWeek,
    balCfg
  );

  const chemReport = evaluateTeamChemistry(
    userClub,
    userPlayers,
    updatedPairChem,
    next.currentSeason,
    next.currentWeek,
    econ.activeBoosters,
    balCfg
  );
  const synReport = evaluateTeamSynergy(
    userClub,
    userPlayers,
    econ.activeBoosters,
    balCfg
  );

  const nextObjectives = econ.objectives.map((obj) => {
    if (obj.id === 'obj-daily-training') {
      return { ...obj, currentProgress: 1, completed: true };
    }
    if (obj.id === 'obj-season-cohesion') {
      const prog = Math.max(obj.currentProgress, chemReport.overallChemistry);
      return { ...obj, currentProgress: prog, completed: prog >= obj.targetProgress };
    }
    return obj;
  });

  next = {
    ...next,
    economy: {
      ...econ,
      pairChemistry: updatedPairChem,
      objectives: nextObjectives,
      chemistryHistory: [
        {
          season: next.currentSeason,
          week: next.currentWeek,
          teamChemistry: chemReport.overallChemistry,
          teamSynergy: synReport.overallSynergy,
          note: `W${next.currentWeek} (${userClub.tactics.formation}): Chem ${chemReport.overallChemistry} / Syn ${synReport.overallSynergy}`,
        },
        ...econ.chemistryHistory,
      ].slice(0, 44),
    },
  };

  if (next.currentWeek >= next.maxWeeksPerSeason) {
    return performSeasonRollover(next);
  }

  return {
    ...next,
    currentWeek: next.currentWeek + 1,
  };
}
