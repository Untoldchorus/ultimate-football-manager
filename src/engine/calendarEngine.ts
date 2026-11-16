import {
  CalendarEvent,
  CalendarEventCategory,
  CalendarEventImportance,
  CalendarState,
  Club,
  ClubEmpireState,
  Fixture,
  GameState,
} from './types';

export type { CalendarEvent, CalendarEventCategory, CalendarEventImportance };

// ============================================================================
// FOOTBALL WORLD CALENDAR CONSTANTS & HELPERS
// ============================================================================

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Formats a Date ISO string ("YYYY-MM-DD") into human-friendly football calendar format.
 * Example: "Saturday, 15 Aug 2026"
 */
export function formatDateDisplay(dateIso: string, includeDayOfWeek = true): string {
  try {
    const [yearStr, monthStr, dayStr] = dateIso.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    const d = new Date(year, month, day);

    const dayName = DAY_NAMES[d.getDay()];
    const monthName = MONTH_NAMES[month]?.slice(0, 3) ?? 'Aug';

    if (includeDayOfWeek) {
      return `${dayName}, ${day} ${monthName} ${year}`;
    }
    return `${day} ${monthName} ${year}`;
  } catch {
    return dateIso;
  }
}

/**
 * Returns the short month and year, e.g. "August 2026".
 */
export function formatMonthYear(dateIso: string): string {
  try {
    const [yearStr, monthStr] = dateIso.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    return `${MONTH_NAMES[month] ?? 'August'} ${year}`;
  } catch {
    return dateIso;
  }
}

/**
 * Adds an integer number of days to an ISO date ("YYYY-MM-DD").
 */
export function addDaysToDate(dateIso: string, days: number): string {
  const [yearStr, monthStr, dayStr] = dateIso.split('-');
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns difference in days between two ISO dates (b - a).
 */
export function diffInDays(dateIsoA: string, dateIsoB: string): number {
  const [yA, mA, dA] = dateIsoA.split('-').map(Number);
  const [yB, mB, dB] = dateIsoB.split('-').map(Number);
  const dateA = new Date(yA, mA - 1, dA);
  const dateB = new Date(yB, mB - 1, dB);
  const diffTime = dateB.getTime() - dateA.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Maps an in-game matchweek (1..22+) to a calendar date.
 * Season kickoff: Saturday of Matchweek 1 (~August 15, 2026).
 */
export function getDateForMatchweek(seasonYear: number, week: number, dayOfWeekIndex = 6): string {
  // Base: Saturday August 15, 2026 is Matchweek 1 Saturday
  const baseDate = new Date(seasonYear, 7, 15); // Month index 7 = August
  const daysOffset = (week - 1) * 7 + (dayOfWeekIndex - 6);
  baseDate.setDate(baseDate.getDate() + daysOffset);

  const y = baseDate.getFullYear();
  const m = String(baseDate.getMonth() + 1).padStart(2, '0');
  const d = String(baseDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Determines current matchweek from date and season year.
 */
export function getMatchweekForDate(dateIso: string, seasonYear: number): number {
  const baseKickoff = `${seasonYear}-08-15`;
  const diff = diffInDays(baseKickoff, dateIso);
  if (diff < 0) return 1;
  return Math.min(22, Math.floor(diff / 7) + 1);
}

/**
 * Checks whether the transfer window is currently open.
 */
export function isTransferWindowOpen(dateIso: string, calendar: CalendarState): boolean {
  const isSummer =
    dateIso >= calendar.summerWindowOpenDateIso &&
    dateIso <= calendar.summerWindowDeadlineDateIso;
  const isWinter =
    dateIso >= calendar.winterWindowOpenDateIso &&
    dateIso <= calendar.winterWindowDeadlineDateIso;
  return isSummer || isWinter;
}

/**
 * Checks if the current date is a high-stakes Transfer Deadline Day.
 */
export function isDeadlineDay(dateIso: string, calendar: CalendarState): boolean {
  return (
    dateIso === calendar.summerWindowDeadlineDateIso ||
    dateIso === calendar.winterWindowDeadlineDateIso
  );
}

// ============================================================================
// CALENDAR EVENT SCHEDULING ENGINE
// ============================================================================

/**
 * Generates all authoritative Calendar Events for a season from fixtures and football lifecycle rules.
 */
export function generateSeasonCalendarEvents(
  seasonYear: number,
  fixtures: Fixture[],
  clubs: Club[],
  userClubId: string,
  clubEmpire?: ClubEmpireState
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const clubMap = new Map(clubs.map((c) => [c.id, c]));

  // 1. Summer Transfer Window Milestones
  events.push({
    id: `ev-summer-window-open-${seasonYear}`,
    dateIso: `${seasonYear}-07-01`,
    category: 'transfer',
    importance: 'high',
    title: 'Summer Transfer Window Opens',
    description: 'Domestic and international player registration opens across all 20 leagues.',
    actionRequired: false,
  });

  events.push({
    id: `ev-summer-deadline-${seasonYear}`,
    dateIso: `${seasonYear}-08-31`,
    time: '23:00',
    category: 'transfer',
    importance: 'critical',
    title: 'Summer Transfer Deadline Day',
    description: 'Final 24 hours to negotiate transfer bids, register free agents, and conclude loan deals.',
    actionRequired: true,
    autoPause: true,
  });

  // 2. Winter Transfer Window Milestones
  events.push({
    id: `ev-winter-window-open-${seasonYear + 1}`,
    dateIso: `${seasonYear + 1}-01-01`,
    category: 'transfer',
    importance: 'high',
    title: 'Winter Transfer Window Opens',
    description: 'Mid-season transfer window opens for all clubs looking to strengthen their squads.',
    actionRequired: false,
  });

  events.push({
    id: `ev-winter-deadline-${seasonYear + 1}`,
    dateIso: `${seasonYear + 1}-01-31`,
    time: '23:00',
    category: 'transfer',
    importance: 'critical',
    title: 'Winter Transfer Deadline Day',
    description: 'Mid-season window slams shut at midnight. All incoming deals must be finalized.',
    actionRequired: true,
    autoPause: true,
  });

  // 3. Youth Academy Intake
  events.push({
    id: `ev-youth-intake-${seasonYear + 1}`,
    dateIso: `${seasonYear + 1}-03-15`,
    category: 'player',
    importance: 'high',
    title: 'Annual Youth Academy Intake',
    description: 'A new generation of scouted prospects and teenage prodigies arrive at the Academy.',
    actionRequired: false,
  });

  // 4. Ballon d'Or / World Football Gala
  events.push({
    id: `ev-ballon-dor-${seasonYear}`,
    dateIso: `${seasonYear}-11-28`,
    time: '20:00',
    category: 'competition',
    importance: 'high',
    title: "World Football Awards Gala (Ballon d'Or)",
    description: "Official presentation of the World Player of the Year and consensus Team of the Year.",
    actionRequired: false,
  });

  // 5. Season Finale & Transition
  events.push({
    id: `ev-season-finale-${seasonYear + 1}`,
    dateIso: `${seasonYear + 1}-05-24`,
    category: 'competition',
    importance: 'critical',
    title: 'League Campaign Finale & Trophy Presentations',
    description: 'Final matchday of the domestic season. League champions crowned, promotion & relegation settled.',
    actionRequired: true,
    autoPause: true,
  });

  // 6. Map Fixtures to Concrete Calendar Dates
  for (const f of fixtures) {
    const isUserMatch = f.homeClubId === userClubId || f.awayClubId === userClubId;
    const home = clubMap.get(f.homeClubId);
    const away = clubMap.get(f.awayClubId);

    // League matches on Saturday (day 6), Cups on Wednesday (day 3)
    const isMidweek = f.competition.toLowerCase().includes('cup') || f.competition.toLowerCase().includes('uefa');
    const dayOfWeek = isMidweek ? 3 : 6;
    const matchDateIso = getDateForMatchweek(seasonYear, f.week, dayOfWeek);

    events.push({
      id: `ev-fixture-${f.id}`,
      dateIso: matchDateIso,
      time: isMidweek ? '20:00' : '15:00',
      category: 'match',
      importance: isUserMatch ? 'critical' : 'medium',
      title: `${home?.shortName ?? 'HOME'} vs ${away?.shortName ?? 'AWAY'}`,
      description: `${home?.name ?? 'Home'} host ${away?.name ?? 'Away'} at ${home?.stadiumName ?? 'Stadium'} in ${f.competition.toUpperCase()} (${f.roundName ?? `Week ${f.week}`}).`,
      clubId: f.homeClubId,
      opponentClubId: f.awayClubId,
      competition: f.competition,
      fixtureId: f.id,
      actionRequired: isUserMatch && !f.played,
      completed: f.played,
      autoPause: isUserMatch && !f.played,
    });
  }

  // 7. Add Real-World Club Empire Construction Completions (if active)
  if (clubEmpire?.activeConstructions) {
    for (const c of clubEmpire.activeConstructions) {
      if (c.completedAtMs) {
        // Map real-world completion time to nearest in-game date
        const targetDate = new Date(c.completedAtMs);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const compDateIso = `${y}-${m}-${d}`;

        events.push({
          id: `ev-const-${c.projectId}`,
          dateIso: compDateIso,
          category: 'operations',
          importance: 'high',
          title: `Construction Complete: ${c.buildingId.replace(/_/g, ' ').toUpperCase()} Lv.${c.targetLevel}`,
          description: `Contractors have completed expansion works. Facility is now operational.`,
          actionRequired: false,
        });
      }
    }
  }

  // Sort events chronologically
  return events.sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

/**
 * Initializes or normalizes the authoritative CalendarState for the career.
 */
export function initializeCalendarState(
  seasonYear: number,
  currentWeek: number,
  fixtures: Fixture[] = [],
  clubs: Club[] = [],
  userClubId = ''
): CalendarState {
  const currentDateIso = getDateForMatchweek(seasonYear, currentWeek, 1); // Start of current week (Monday)
  const scheduledEvents = generateSeasonCalendarEvents(
    seasonYear,
    fixtures,
    clubs,
    userClubId
  );

  return {
    currentDateIso,
    seasonStartDateIso: `${seasonYear}-07-01`,
    seasonEndDateIso: `${seasonYear + 1}-06-30`,
    summerWindowOpenDateIso: `${seasonYear}-07-01`,
    summerWindowDeadlineDateIso: `${seasonYear}-08-31`,
    winterWindowOpenDateIso: `${seasonYear + 1}-01-01`,
    winterWindowDeadlineDateIso: `${seasonYear + 1}-01-31`,
    autoAdvancePaused: true,
    autoPauseConditions: {
      pauseOnUserMatch: true,
      pauseOnTransferDeadline: true,
      pauseOnMajorInjury: true,
      pauseOnContractExpiry: true,
      pauseOnCupDraw: false,
    },
    simulationSpeedMs: 700,
    scheduledEvents,
  };
}
