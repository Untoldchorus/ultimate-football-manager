import {
  GameState,
  RealWorldLoginStreakState,
} from './types';
import {
  ensureEconomyState,
  grantInventoryItems,
} from './boosterEconomy';

export interface LoginStreakDayReward {
  day: number;
  title: string;
  description: string;
  category: 'coins' | 'materials' | 'training' | 'scouting' | 'recovery' | 'construction' | 'uncommon';
  icon: string;
  rarity: 'Common' | 'Uncommon' | 'Rare';
  grant: {
    softCoins?: number;
    premiumCoins?: number;
    constructionMaterials?: number;
    trainingTokens?: number;
    scoutingPoints?: number;
    boosterItemId?: string;
    boosterItemName?: string;
  };
}

export const SEVEN_DAY_STREAK_SCHEDULE: LoginStreakDayReward[] = [
  {
    day: 1,
    title: 'Club Operating Funds',
    description: '€50,000 in club currency to bolster wage and transfer allocations.',
    category: 'coins',
    icon: 'Coins',
    rarity: 'Common',
    grant: { softCoins: 50_000 },
  },
  {
    day: 2,
    title: 'Construction Concrete',
    description: '250 construction materials for facility upgrades in Club Empire.',
    category: 'materials',
    icon: 'Hammer',
    rarity: 'Common',
    grant: { constructionMaterials: 250 },
  },
  {
    day: 3,
    title: 'Tactical Training Drills',
    description: '15 tactical training tokens to accelerate squad development.',
    category: 'training',
    icon: 'GraduationCap',
    rarity: 'Common',
    grant: { trainingTokens: 15 },
  },
  {
    day: 4,
    title: 'Scouting Network Dossier',
    description: '100 international scouting points to uncover wonderkids.',
    category: 'scouting',
    icon: 'Compass',
    rarity: 'Common',
    grant: { scoutingPoints: 100 },
  },
  {
    day: 5,
    title: 'Individual Recovery Booster',
    description: '1x fast-acting medical recovery stimulant for fatigued stars.',
    category: 'recovery',
    icon: 'HeartPulse',
    rarity: 'Common',
    grant: {
      boosterItemId: 'bst-rec-pack-common',
      boosterItemName: 'Standard Recovery Pack',
    },
  },
  {
    day: 6,
    title: '30-Min Fast-Track Crane',
    description: '1x construction speedup booster reducing facility build duration.',
    category: 'construction',
    icon: 'Zap',
    rarity: 'Common',
    grant: {
      constructionMaterials: 500,
    },
  },
  {
    day: 7,
    title: 'Elite Club Laurels Pool',
    description: 'Uncommon reward: €150,000 Coins, 500 Materials, and 1x Team Recovery Booster!',
    category: 'uncommon',
    icon: 'Trophy',
    rarity: 'Uncommon',
    grant: {
      softCoins: 150_000,
      constructionMaterials: 500,
      boosterItemId: 'bst-rec-squad-rare',
      boosterItemName: 'Cryotherapy Squad Recovery',
    },
  },
];

/**
 * Returns today's UTC calendar date as a "YYYY-MM-DD" string.
 */
export function getTodayUtcDateIso(nowMs = Date.now()): string {
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Computes milliseconds remaining until next 00:00:00 UTC midnight.
 */
export function getMsUntilNextUtcMidnight(nowMs = Date.now()): number {
  const d = new Date(nowMs);
  const nextUtc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.max(0, nextUtc.getTime() - nowMs);
}

/**
 * Formats milliseconds into "HHh MMm SSs" countdown format.
 */
export function formatCountdownTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * Evaluates the current streak state based on real-world UTC time.
 */
export function evaluateLoginStreakStatus(streakState?: RealWorldLoginStreakState, nowMs = Date.now()): {
  canClaimToday: boolean;
  currentStreak: number;
  nextDayToClaim: number;
  streakWasReset: boolean;
  msUntilNextReset: number;
} {
  const todayUtc = getTodayUtcDateIso(nowMs);
  const msUntilNextReset = getMsUntilNextUtcMidnight(nowMs);

  if (!streakState || !streakState.lastClaimUtcDate) {
    return {
      canClaimToday: true,
      currentStreak: 0,
      nextDayToClaim: 1,
      streakWasReset: false,
      msUntilNextReset,
    };
  }

  // If already claimed today (UTC)
  if (streakState.lastClaimUtcDate === todayUtc) {
    return {
      canClaimToday: false,
      currentStreak: streakState.currentStreak,
      nextDayToClaim: (streakState.currentStreak % 7) + 1,
      streakWasReset: false,
      msUntilNextReset,
    };
  }

  // Calculate difference in UTC days
  const [lastY, lastM, lastD] = streakState.lastClaimUtcDate.split('-').map(Number);
  const [currY, currM, currD] = todayUtc.split('-').map(Number);
  const lastUtcTime = Date.UTC(lastY, lastM - 1, lastD);
  const currUtcTime = Date.UTC(currY, currM - 1, currD);
  const diffDays = Math.round((currUtcTime - lastUtcTime) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Exactly yesterday: streak continues!
    const nextDay = (streakState.currentStreak % 7) + 1;
    return {
      canClaimToday: true,
      currentStreak: streakState.currentStreak,
      nextDayToClaim: nextDay,
      streakWasReset: false,
      msUntilNextReset,
    };
  }

  // Missed at least one entire UTC day: streak resets to Day 1
  return {
    canClaimToday: true,
    currentStreak: 0,
    nextDayToClaim: 1,
    streakWasReset: true,
    msUntilNextReset,
  };
}

/**
 * Claims today's 7-Day Login Streak Reward and updates the career state.
 */
export function claimSevenDayLoginReward(
  state: GameState,
  nowMs = Date.now()
): {
  success: boolean;
  message: string;
  claimedReward?: LoginStreakDayReward;
  updatedState: GameState;
} {
  const status = evaluateLoginStreakStatus(state.loginStreak, nowMs);
  if (!status.canClaimToday) {
    return {
      success: false,
      message: 'Already claimed today! Next reward unlocks at 00:00 UTC.',
      updatedState: state,
    };
  }

  const dayIndex = status.nextDayToClaim;
  const rewardDef = SEVEN_DAY_STREAK_SCHEDULE.find((r) => r.day === dayIndex) ?? SEVEN_DAY_STREAK_SCHEDULE[0];
  const todayUtc = getTodayUtcDateIso(nowMs);

  let economy = ensureEconomyState(state);
  const userClub = state.clubs.find((c) => c.id === state.manager.clubId) ?? state.clubs[0];

  // Apply grants
  if (rewardDef.grant.softCoins) {
    economy = {
      ...economy,
      softCurrency: economy.softCurrency + rewardDef.grant.softCoins,
    };
  }
  if (rewardDef.grant.boosterItemId) {
    economy = grantInventoryItems(
      economy,
      [{ itemId: rewardDef.grant.boosterItemId, quantity: 1 }],
      'daily_login',
      state.currentSeason,
      state.currentWeek,
      new Date(nowMs).toISOString()
    );
  }

  // Update Login Streak State
  const prevHistory = state.loginStreak?.claimHistory ?? [];
  const newStreak = dayIndex;
  const bestStreak = Math.max(state.loginStreak?.bestStreak ?? 0, newStreak);
  const cycleCount = dayIndex === 7 ? (state.loginStreak?.cycleCount ?? 0) + 1 : (state.loginStreak?.cycleCount ?? 0);

  const updatedLoginStreak: RealWorldLoginStreakState = {
    currentStreak: newStreak,
    bestStreak,
    lastClaimUtcDate: todayUtc,
    totalClaimsCount: (state.loginStreak?.totalClaimsCount ?? 0) + 1,
    cycleCount,
    claimHistory: [
      {
        streakDay: newStreak,
        claimedAtIso: new Date(nowMs).toISOString(),
        rewardLabel: `${rewardDef.title}: ${rewardDef.description}`,
      },
      ...prevHistory,
    ].slice(0, 30),
  };

  return {
    success: true,
    message: `Claimed Day ${dayIndex} Streak Reward: ${rewardDef.title}!`,
    claimedReward: rewardDef,
    updatedState: {
      ...state,
      economy,
      loginStreak: updatedLoginStreak,
    },
  };
}
