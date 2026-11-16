import {
  addDaysToDate,
  CalendarEvent,
  diffInDays,
  formatDateDisplay,
  getMatchweekForDate,
  initializeCalendarState,
  isDeadlineDay,
  isTransferWindowOpen,
} from './calendarEngine';
import {
  DEFAULT_BALANCE_CONFIG,
} from './balanceConfig';
import {
  ensureEconomyState,
} from './boosterEconomy';
import {
  evaluateTeamChemistry,
  processWeeklyChemistryDevelopmentAndDecay,
} from './chemistryEngine';
import {
  recordMatchToGlobalStats,
} from './globalStatsEngine';
import {
  simulateMatch,
} from './matchEngine';
import {
  evaluateTeamSynergy,
} from './synergyEngine';
import {
  processWeeklyAiTransfers,
  processWeeklyScouting,
  processWeeklyTraining,
} from './transfers';
import {
  Club,
  Fixture,
  GameState,
  NewsItem,
  Player,
} from './types';
import {
  advanceCupCompetitions,
  performSeasonRollover,
  processWeeklyFinancesAndBoard,
  simulateWeekMatches,
} from './season';
import { tickWeeklyBoostersAndExpirations } from './boosterEconomy';

export interface DailySimulationResult {
  nextState: GameState;
  eventsProcessed: CalendarEvent[];
  pauseReason?: string;
  autoPaused: boolean;
  dayAdvanced: boolean;
}

/**
 * Ensures that the GameState has a fully populated CalendarState and authoritative currentDateIso.
 */
export function ensureCalendarState(state: GameState): GameState {
  if (state.calendarState && state.currentDateIso) {
    return state;
  }
  const calendarState = initializeCalendarState(
    state.currentSeason,
    state.currentWeek,
    state.fixtures,
    state.clubs,
    state.manager.clubId
  );
  return {
    ...state,
    currentDateIso: calendarState.currentDateIso,
    calendarState,
  };
}

/**
 * Processes a single in-game day advancement in deterministic chronological order.
 */
export function advanceOneDay(rawState: GameState): DailySimulationResult {
  const state = ensureCalendarState(rawState);
  const calendar = state.calendarState!;
  const currentDate = state.currentDateIso!;
  const nextDate = addDaysToDate(currentDate, 1);
  const userClubId = state.manager.clubId;

  const prevWeek = getMatchweekForDate(currentDate, state.currentSeason);
  const nextWeek = getMatchweekForDate(nextDate, state.currentSeason);
  const isWeekBoundary = nextWeek > prevWeek;

  // 1. Gather all calendar events occurring on nextDate
  const todaysEvents = calendar.scheduledEvents.filter((e) => e.dateIso === nextDate);
  const eventsProcessed: CalendarEvent[] = [...todaysEvents];

  // 2. Check for Immediate User Matchday Pause Trigger
  const userFixtureToday = state.fixtures.find(
    (f) =>
      !f.played &&
      (f.homeClubId === userClubId || f.awayClubId === userClubId) &&
      todaysEvents.some((e) => e.fixtureId === f.id)
  );

  if (userFixtureToday && calendar.autoPauseConditions.pauseOnUserMatch) {
    const home = state.clubs.find((c) => c.id === userFixtureToday.homeClubId);
    const away = state.clubs.find((c) => c.id === userFixtureToday.awayClubId);
    return {
      nextState: {
        ...state,
        currentDateIso: nextDate,
        calendarState: {
          ...calendar,
          currentDateIso: nextDate,
          autoAdvancePaused: true,
        },
      },
      eventsProcessed,
      pauseReason: `MATCHDAY ALERT: ${home?.shortName ?? 'Home'} vs ${away?.shortName ?? 'Away'} kicks off today!`,
      autoPaused: true,
      dayAdvanced: true,
    };
  }

  // 3. Process Daily Player Fatigue Recovery & Stamina Regeneration
  // Scaled by Hospital & Rehabilitation Centre levels
  const hospitalLvl = state.clubEmpire?.buildings?.club_hospital?.level ?? 1;
  const rehabLvl = state.clubEmpire?.buildings?.rehabilitation_centre?.level ?? 0;
  const recoveryMultiplier = 1.0 + hospitalLvl * 0.05 + rehabLvl * 0.08;

  const updatedPlayers: Player[] = state.players.map((p) => {
    let stamina = p.stamina ?? 95;
    let fatigue = p.fatigue ?? 5;
    let fitness = p.fitness ?? 95;
    let injuryWeeks = p.injuryWeeks;

    // Daily stamina/fatigue recovery
    if (injuryWeeks === 0) {
      fatigue = Math.max(0, fatigue - Math.round(3 * recoveryMultiplier));
      stamina = Math.min(100, stamina + Math.round(2 * recoveryMultiplier));
      fitness = Math.min(100, Math.max(20, Math.round((stamina * 0.6 + (100 - fatigue) * 0.4))));
    } else {
      // Injury recovery: pro-rate recovery over time
      // Random chance per day based on rehab center level
      const healsSlightly = Math.random() < 0.14 * recoveryMultiplier;
      if (healsSlightly && injuryWeeks > 0) {
        injuryWeeks = Math.max(0, injuryWeeks - 1);
      }
    }

    return {
      ...p,
      stamina,
      fatigue,
      fitness,
      injuryWeeks,
    };
  });

  // 4. Daily Passive Financial Operations (pro-rated facility maintenance and commercial revenue)
  let userClub = state.clubs.find((c) => c.id === userClubId) ?? state.clubs[0];
  const merchLvl = state.clubEmpire?.buildings?.club_merchandise_store?.level ?? 0;
  const supportersLvl = state.clubEmpire?.buildings?.supporters_club?.level ?? 0;

  // Daily passive commercial earnings
  const dailyMerchRevenue = Math.round((merchLvl * 4500) / 7);
  const dailySupportersDues = Math.round((supportersLvl * 3000) / 7);
  const dailyCommercialIncome = dailyMerchRevenue + dailySupportersDues;

  let clubs = [...state.clubs];
  if (dailyCommercialIncome > 0) {
    const idx = clubs.findIndex((c) => c.id === userClubId);
    if (idx !== -1) {
      const cf = clubs[idx].finances;
      clubs[idx] = {
        ...clubs[idx],
        finances: {
          ...cf,
          transferBudget: cf.transferBudget + Math.round(dailyCommercialIncome * 0.4),
          cashBalance: cf.cashBalance + dailyCommercialIncome,
        },
      };
    }
  }

  // 5. Simulate Other AI Club Matches on this Date
  const aiFixturesToday = state.fixtures.filter(
    (f) =>
      !f.played &&
      f.homeClubId !== userClubId &&
      f.awayClubId !== userClubId &&
      todaysEvents.some((e) => e.fixtureId === f.id)
  );

  let updatedFixtures = [...state.fixtures];
  let newNews: NewsItem[] = [...state.news];

  for (const f of aiFixturesToday) {
    const home = state.clubs.find((c) => c.id === f.homeClubId);
    const away = state.clubs.find((c) => c.id === f.awayClubId);
    if (!home || !away) continue;

    const homeSquad = updatedPlayers.filter((p) => p.clubId === home.id);
    const awaySquad = updatedPlayers.filter((p) => p.clubId === away.id);
    const matchSeed = (state.worldSeed ^ Math.imul(f.week * 1000 + 7, 0x5bd1e995)) >>> 0;

    const res = simulateMatch(
      {
        fixtureId: f.id,
        homeClub: home,
        awayClub: away,
        homePlayers: homeSquad,
        awayPlayers: awaySquad,
        homeChemistryScore: 70,
        awayChemistryScore: 70,
        homeSynergyScore: 70,
        awaySynergyScore: 70,
        balanceConfig: DEFAULT_BALANCE_CONFIG,
      },
      matchSeed
    );

    updatedFixtures = updatedFixtures.map((fix) =>
      fix.id === f.id ? { ...fix, played: true, result: res } : fix
    );
  }

  // 6. Check for Transfer Deadline Day Alert
  if (isDeadlineDay(nextDate, calendar) && calendar.autoPauseConditions.pauseOnTransferDeadline) {
    const deadlineNews: NewsItem = {
      id: `news-deadline-${nextDate}`,
      season: state.currentSeason,
      week: nextWeek,
      title: `TRANSFER DEADLINE DAY: Final 24 Hours of the Window!`,
      body: `Clubs across all 20 leagues are scrambling to finalize bids, submit loan papers, and sign free agents before midnight.`,
      category: 'transfer',
    };
    newNews.unshift(deadlineNews);

    return {
      nextState: {
        ...state,
        currentDateIso: nextDate,
        players: updatedPlayers,
        fixtures: updatedFixtures,
        news: newNews,
        calendarState: {
          ...calendar,
          currentDateIso: nextDate,
          autoAdvancePaused: true,
        },
      },
      eventsProcessed,
      pauseReason: `TRANSFER DEADLINE DAY: The transfer window closes tonight at midnight!`,
      autoPaused: true,
      dayAdvanced: true,
    };
  }

  // 7. If crossing into a new matchweek, execute weekly engine transitions
  let nextState: GameState = {
    ...state,
    currentDateIso: nextDate,
    players: updatedPlayers,
    fixtures: updatedFixtures,
    news: newNews,
    clubs,
    calendarState: {
      ...calendar,
      currentDateIso: nextDate,
    },
  };

  if (isWeekBoundary && nextWeek <= state.maxWeeksPerSeason) {
    const weekSeed =
      (state.worldSeed ^ Math.imul(state.currentSeason * 100 + nextWeek, 0x9e3779b9)) >>> 0;

    nextState = processWeeklyTraining(nextState, weekSeed);
    nextState = processWeeklyScouting(nextState, weekSeed);
    nextState = processWeeklyAiTransfers(nextState, weekSeed);
    nextState = processWeeklyFinancesAndBoard(nextState);
    nextState = tickWeeklyBoostersAndExpirations(nextState);

    nextState = {
      ...nextState,
      currentWeek: nextWeek,
    };
  }

  return {
    nextState,
    eventsProcessed,
    autoPaused: false,
    dayAdvanced: true,
  };
}

/**
 * Advances simulation day-by-day until the user's next competitive matchday.
 */
export function advanceToNextMatch(state: GameState, maxDays = 35): { nextState: GameState; daysAdvanced: number; pauseReason?: string } {
  let curr = ensureCalendarState(state);
  let daysAdvanced = 0;
  let reason: string | undefined;

  while (daysAdvanced < maxDays) {
    const res = advanceOneDay(curr);
    curr = res.nextState;
    daysAdvanced++;

    if (res.autoPaused || res.pauseReason) {
      reason = res.pauseReason;
      break;
    }
  }

  return {
    nextState: curr,
    daysAdvanced,
    pauseReason: reason,
  };
}

/**
 * Advances simulation day-by-day until the next scheduled calendar event of interest.
 */
export function advanceToNextEvent(state: GameState, maxDays = 30): { nextState: GameState; daysAdvanced: number; pauseReason?: string } {
  let curr = ensureCalendarState(state);
  let daysAdvanced = 0;
  let reason: string | undefined;

  while (daysAdvanced < maxDays) {
    const res = advanceOneDay(curr);
    curr = res.nextState;
    daysAdvanced++;

    if (res.autoPaused || res.pauseReason || res.eventsProcessed.length > 0) {
      reason = res.pauseReason ?? res.eventsProcessed[0]?.title;
      break;
    }
  }

  return {
    nextState: curr,
    daysAdvanced,
    pauseReason: reason,
  };
}

/**
 * Advances simulation day-by-day to a target calendar date.
 */
export function advanceToDate(state: GameState, targetDateIso: string, maxDays = 90): { nextState: GameState; daysAdvanced: number; pauseReason?: string } {
  let curr = ensureCalendarState(state);
  let daysAdvanced = 0;
  let reason: string | undefined;

  while (daysAdvanced < maxDays && (curr.currentDateIso ?? '') < targetDateIso) {
    const res = advanceOneDay(curr);
    curr = res.nextState;
    daysAdvanced++;

    if (res.autoPaused || res.pauseReason) {
      reason = res.pauseReason;
      break;
    }
  }

  return {
    nextState: curr,
    daysAdvanced,
    pauseReason: reason,
  };
}
