import {
  FootballAchievement,
  GameState,
} from './types';
import {
  ensureEconomyState,
  grantInventoryItems,
} from './boosterEconomy';

export const FOOTBALL_ACHIEVEMENTS_CATALOG: Omit<
  FootballAchievement,
  'currentProgress' | 'unlocked' | 'claimed'
>[] = [
  {
    id: 'ach-first-win',
    title: 'First Taste of Glory',
    description: 'Secure your first competitive victory in any official competition.',
    category: 'matches',
    icon: 'Trophy',
    targetProgress: 1,
    reward: {
      coins: 35_000,
      trainingTokens: 15,
      reputation: 2,
    },
  },
  {
    id: 'ach-win-streak-5',
    title: 'Unstoppable Momentum',
    description: 'Win 5 consecutive competitive matches across all competitions.',
    category: 'matches',
    icon: 'Flame',
    targetProgress: 5,
    reward: {
      coins: 85_000,
      reputation: 6,
      boosterItemId: 'bst-chem-pair-rare',
      boosterItemName: 'Pair Chemistry Catalyst',
    },
  },
  {
    id: 'ach-clean-sheet-3',
    title: 'Fortress Defense',
    description: 'Keep 3 clean sheets in competitive campaign fixtures.',
    category: 'matches',
    icon: 'Shield',
    targetProgress: 3,
    reward: {
      coins: 45_000,
      boosterItemId: 'bst-rec-pack-common',
      boosterItemName: 'Standard Recovery Pack',
    },
  },
  {
    id: 'ach-transfer-gem',
    title: 'Scouting Masterstroke',
    description: 'Sign a high-potential talent or free-agent star to strengthen the squad.',
    category: 'transfers',
    icon: 'UserPlus',
    targetProgress: 1,
    reward: {
      coins: 50_000,
      scoutingPoints: 120,
    },
  },
  {
    id: 'ach-youth-debut',
    title: 'Academy Prodigy',
    description: 'Graduate a youth academy prospect and award them their senior competitive debut.',
    category: 'youth',
    icon: 'GraduationCap',
    targetProgress: 1,
    reward: {
      coins: 60_000,
      trainingTokens: 25,
      reputation: 3,
    },
  },
  {
    id: 'ach-empire-builder',
    title: 'Infrastructure Visionary',
    description: 'Upgrade 3 campus facilities in Club Empire to Level 2 or higher.',
    category: 'empire',
    icon: 'Building2',
    targetProgress: 3,
    reward: {
      materials: 600,
      coins: 75_000,
    },
  },
  {
    id: 'ach-domestic-silverware',
    title: 'Silverware in the Cabinet',
    description: 'Win an official league title or domestic cup trophy.',
    category: 'trophies',
    icon: 'Award',
    targetProgress: 1,
    reward: {
      coins: 250_000,
      reputation: 15,
      boosterItemId: 'bst-rec-squad-rare',
      boosterItemName: 'Squad Cryotherapy Treatment',
    },
  },
  {
    id: 'ach-season-veteran',
    title: 'Full Campaign Veteran',
    description: 'Complete a full domestic season campaign from Matchweek 1 through finale.',
    category: 'career',
    icon: 'Calendar',
    targetProgress: 1,
    reward: {
      coins: 150_000,
      reputation: 8,
    },
  },
];

/**
 * Initializes or normalizes the career's achievements state.
 */
export function initializeAchievements(): FootballAchievement[] {
  return FOOTBALL_ACHIEVEMENTS_CATALOG.map((cat) => ({
    ...cat,
    currentProgress: 0,
    unlocked: false,
    claimed: false,
  }));
}

/**
 * Evaluates in-game accomplishments and returns updated progress and newly unlocked achievements.
 */
export function evaluateCareerAchievements(state: GameState): {
  updatedAchievements: FootballAchievement[];
  newlyUnlocked: FootballAchievement[];
} {
  const existing = state.achievements && state.achievements.length > 0
    ? [...state.achievements]
    : initializeAchievements();

  const userClubId = state.manager.clubId;
  const userFixtures = state.fixtures.filter(
    (f) => f.played && (f.homeClubId === userClubId || f.awayClubId === userClubId)
  );

  let wins = 0;
  let cleanSheets = 0;
  let currentStreak = 0;
  let maxStreak = 0;

  for (const f of userFixtures) {
    if (!f.result) continue;
    const isHome = f.homeClubId === userClubId;
    const userScore = isHome ? f.result.homeScore : f.result.awayScore;
    const oppScore = isHome ? f.result.awayScore : f.result.homeScore;

    if (userScore > oppScore) {
      wins++;
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }

    if (oppScore === 0) {
      cleanSheets++;
    }
  }

  // Count empire buildings upgraded >= Lv 2
  const empireLv2Count = state.clubEmpire?.buildings
    ? Object.values(state.clubEmpire.buildings).filter((b) => b.level >= 2).length
    : 0;

  // Count trophies won by user
  const userTrophies = state.trophies.filter((t) => t.winnerClubId === userClubId).length;

  // Completed seasons
  const completedSeasons = state.seasonHistory.length;

  const newlyUnlocked: FootballAchievement[] = [];

  const updatedAchievements = existing.map((ach) => {
    let progress = ach.currentProgress;

    switch (ach.id) {
      case 'ach-first-win':
        progress = Math.min(ach.targetProgress, wins);
        break;
      case 'ach-win-streak-5':
        progress = Math.min(ach.targetProgress, maxStreak);
        break;
      case 'ach-clean-sheet-3':
        progress = Math.min(ach.targetProgress, cleanSheets);
        break;
      case 'ach-transfer-gem':
        progress = state.transfers.some((t) => t.toClubId === userClubId) ? 1 : 0;
        break;
      case 'ach-youth-debut':
        progress = state.players.some((p) => p.clubId === userClubId && p.isYouth && (p.stats?.appearances ?? 0) > 0) ? 1 : 0;
        break;
      case 'ach-empire-builder':
        progress = Math.min(ach.targetProgress, empireLv2Count);
        break;
      case 'ach-domestic-silverware':
        progress = Math.min(ach.targetProgress, userTrophies);
        break;
      case 'ach-season-veteran':
        progress = Math.min(ach.targetProgress, completedSeasons);
        break;
    }

    const isNowUnlocked = progress >= ach.targetProgress;
    if (isNowUnlocked && !ach.unlocked) {
      const unlockedItem: FootballAchievement = {
        ...ach,
        currentProgress: progress,
        unlocked: true,
        unlockedAtIso: new Date().toISOString(),
      };
      newlyUnlocked.push(unlockedItem);
      return unlockedItem;
    }

    return {
      ...ach,
      currentProgress: progress,
      unlocked: ach.unlocked || isNowUnlocked,
    };
  });

  return {
    updatedAchievements,
    newlyUnlocked,
  };
}

/**
 * Claims a completed achievement reward and grants currency, reputation, or boosters.
 */
export function claimAchievementReward(
  state: GameState,
  achievementId: string
): {
  success: boolean;
  message: string;
  claimedAchievement?: FootballAchievement;
  updatedState: GameState;
} {
  const achievements = state.achievements && state.achievements.length > 0
    ? [...state.achievements]
    : initializeAchievements();

  const targetIdx = achievements.findIndex((a) => a.id === achievementId);
  if (targetIdx === -1) {
    return { success: false, message: 'Achievement not found.', updatedState: state };
  }

  const target = achievements[targetIdx];
  if (!target.unlocked) {
    return { success: false, message: 'Achievement is not unlocked yet.', updatedState: state };
  }
  if (target.claimed) {
    return { success: false, message: 'Reward already claimed.', updatedState: state };
  }

  let economy = ensureEconomyState(state);
  let clubs = [...state.clubs];
  const userClubIdx = clubs.findIndex((c) => c.id === state.manager.clubId);

  // Grant reward payouts
  if (target.reward.coins && userClubIdx !== -1) {
    const cf = clubs[userClubIdx].finances;
    clubs[userClubIdx] = {
      ...clubs[userClubIdx],
      finances: {
        ...cf,
        transferBudget: cf.transferBudget + target.reward.coins,
        cashBalance: cf.cashBalance + target.reward.coins,
      },
    };
    economy = {
      ...economy,
      softCurrency: economy.softCurrency + target.reward.coins,
    };
  }

  if (target.reward.reputation && userClubIdx !== -1) {
    clubs[userClubIdx] = {
      ...clubs[userClubIdx],
      reputation: Math.min(100, clubs[userClubIdx].reputation + target.reward.reputation),
    };
  }

  if (target.reward.boosterItemId) {
    economy = grantInventoryItems(
      economy,
      [{ itemId: target.reward.boosterItemId, quantity: 1 }],
      'achievement',
      state.currentSeason,
      state.currentWeek,
      new Date().toISOString()
    );
  }

  const updatedTarget: FootballAchievement = {
    ...target,
    claimed: true,
  };
  achievements[targetIdx] = updatedTarget;

  return {
    success: true,
    message: `Claimed Achievement: ${target.title}!`,
    claimedAchievement: updatedTarget,
    updatedState: {
      ...state,
      clubs,
      economy,
      achievements,
    },
  };
}
