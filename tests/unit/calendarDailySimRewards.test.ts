import { describe, it, expect } from 'vitest';
import { generateInitialGameState } from '@/engine/generator';
import { ManagerProfile } from '@/engine/types';
import {
  initializeCalendarState,
  isTransferWindowOpen,
  isDeadlineDay,
  getDateForMatchweek,
} from '@/engine/calendarEngine';
import {
  advanceOneDay,
  advanceToNextMatch,
  advanceToDate,
  ensureCalendarState,
} from '@/engine/dailySimulationEngine';
import {
  evaluateLoginStreakStatus,
  claimSevenDayLoginReward,
  getTodayUtcDateIso,
} from '@/engine/loginStreakEngine';
import {
  initializeAchievements,
  evaluateCareerAchievements,
  claimAchievementReward,
} from '@/engine/achievementEngine';

const TEST_MANAGER: ManagerProfile = {
  name: 'Alex Mercer',
  nationality: 'England',
  tacticalStyle: 'balanced',
  difficulty: 'standard',
  startingChallenge: 'none',
  clubId: 'c_mci',
};

describe('Central World Calendar, Daily Simulation & Reward Economy', () => {
  it('initializes authoritative calendar state with valid transfer windows and deadlines', () => {
    const calendar = initializeCalendarState(2026, 1);
    expect(calendar.currentDateIso).toBe('2026-08-10');
    expect(calendar.seasonStartDateIso).toBe('2026-07-01');
    expect(calendar.seasonEndDateIso).toBe('2027-06-30');
    expect(calendar.scheduledEvents.length).toBeGreaterThan(0);

    // Transfer window checks
    expect(isTransferWindowOpen('2026-08-20', calendar)).toBe(true);
    expect(isDeadlineDay('2026-08-31', calendar)).toBe(true);
    expect(isTransferWindowOpen('2026-10-15', calendar)).toBe(false);
    expect(isTransferWindowOpen('2027-01-10', calendar)).toBe(true);
    expect(isDeadlineDay('2027-01-31', calendar)).toBe(true);
  });

  it('correctly maps in-game matchweeks to simulation calendar dates', () => {
    expect(getDateForMatchweek(2026, 1)).toBe('2026-08-15');
    expect(getDateForMatchweek(2026, 2)).toBe('2026-08-22');
    expect(getDateForMatchweek(2026, 3)).toBe('2026-08-29');
  });

  it('progresses day-by-day with deterministic financial run-rate and injury/stamina recovery', () => {
    const career = ensureCalendarState(generateInitialGameState(12345, TEST_MANAGER));

    // Advance 1 day
    const result1 = advanceOneDay(career);
    expect(result1.dayAdvanced).toBe(true);
    expect(result1.nextState.currentDateIso).toBe('2026-08-11');
  });

  it('detects user matchday auto-pause safely without corrupting schedule', () => {
    const career = ensureCalendarState(generateInitialGameState(54321, TEST_MANAGER));

    // Day 1 is Monday 2026-08-10. Advance to next matchday steps forward 5 days to Saturday Matchday!
    const res = advanceToNextMatch(career);
    expect(res.daysAdvanced).toBe(5);
    expect(res.pauseReason?.toUpperCase()).toContain('MATCHDAY');
  });

  it('manages 7-day UTC login streak cycle with valid reward claims', () => {
    const career = ensureCalendarState(generateInitialGameState(998877, TEST_MANAGER));
    const statusBefore = evaluateLoginStreakStatus(career.loginStreak);
    expect(statusBefore.canClaimToday).toBe(true);
    expect(statusBefore.nextDayToClaim).toBe(1);

    const claimResult = claimSevenDayLoginReward(career);
    expect(claimResult.success).toBe(true);
    expect(claimResult.claimedReward?.day).toBe(1);
    expect(claimResult.updatedState.loginStreak?.currentStreak).toBe(1);
    expect(claimResult.updatedState.loginStreak?.lastClaimUtcDate).toBe(getTodayUtcDateIso());

    // Second claim on the same UTC day must be rejected
    const secondClaim = claimSevenDayLoginReward(claimResult.updatedState);
    expect(secondClaim.success).toBe(false);
  });

  it('initializes and evaluates football achievements without double-claiming', () => {
    const career = ensureCalendarState(generateInitialGameState(112233, TEST_MANAGER));
    const initialAchievements = initializeAchievements();
    expect(initialAchievements.length).toBeGreaterThanOrEqual(8);

    career.achievements = initialAchievements;
    const evaluated = evaluateCareerAchievements(career);
    expect(evaluated.updatedAchievements.length).toBe(initialAchievements.length);

    // Mock an unlocked achievement
    career.achievements[0].unlocked = true;
    career.achievements[0].claimed = false;

    const claimRes = claimAchievementReward(career, career.achievements[0].id);
    expect(claimRes.success).toBe(true);

    // Second claim attempt must fail
    const secondClaim = claimAchievementReward(claimRes.updatedState, career.achievements[0].id);
    expect(secondClaim.success).toBe(false);
  });
});
