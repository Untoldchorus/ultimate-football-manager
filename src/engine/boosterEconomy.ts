import {
  DEFAULT_BALANCE_CONFIG,
  getAttributeTrainingEfficiency,
} from './balanceConfig';
import {
  generateInitialPairChemistryForClub,
  makePlayerPairKey,
} from './chemistryEngine';
import {
  calculateMarketValue,
  calculateOverallRating,
} from './ratings';
import {
  AcquisitionSource,
  ActiveBoosterInstance,
  BalanceConfiguration,
  BoosterCategory,
  BoosterItemDefinition,
  Club,
  EconomyState,
  GameState,
  InventoryItemRecord,
  ItemRarity,
  Player,
  PlayerAttributes,
  ProgressionObjective,
  PurchaseTransactionRecord,
} from './types';

/**
 * Complete Booster & Consumable Catalog covering all 5 required categories
 * (Training, Chemistry, Synergy, Recovery, Morale) + Starter Pack Cosmetic
 * and all 4 rarities (Common, Rare, Epic, Legendary).
 */
export const BOOSTER_CATALOG: BoosterItemDefinition[] = [
  // =========================================================================
  // A. TRAINING BOOSTERS
  // =========================================================================
  {
    itemId: 'bst-train-xp-common',
    name: 'Standard Training XP Drill',
    description:
      'Accelerates weekly training progression for one selected player over 2 weeks (+15% training efficiency). Subject to high-rating diminishing returns.',
    category: 'training',
    subType: 'training_xp',
    rarity: 'Common',
    durationWeeks: 2,
    effectStrength: 15,
    priority: 10,
    conflictGroup: 'training_xp_slot',
    targetScope: 'player',
    cooldownWeeks: 1,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 350,
    premiumCurrencyPrice: 35,
    usageRestrictionsText:
      'Max 2 active boosters per player. Cannot stack identical boosters. Respects 100 attribute cap.',
  },
  {
    itemId: 'bst-train-tech-rare',
    name: 'Precision Technical Masterclass',
    description:
      'Intensive technical coaching session (+1 instant point to a primary technical attribute subject to diminishing returns, plus +25% technical drill boost for 2 weeks).',
    category: 'training',
    subType: 'technical_dev',
    rarity: 'Rare',
    durationWeeks: 2,
    effectStrength: 25,
    priority: 20,
    conflictGroup: 'training_spec_slot',
    targetScope: 'player',
    cooldownWeeks: 2,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 850,
    premiumCurrencyPrice: 80,
    usageRestrictionsText:
      'Applies diminishing returns above 60+ OVR. Primary attributes never exceed 100.',
  },
  {
    itemId: 'bst-train-phys-epic',
    name: 'Biomechanics Physical Conditioning',
    description:
      'Elite athletic conditioning regimen (+1 physical attribute progress weighted by efficiency tier & +35% physical training output for 3 weeks).',
    category: 'training',
    subType: 'physical_dev',
    rarity: 'Epic',
    durationWeeks: 3,
    effectStrength: 35,
    priority: 30,
    conflictGroup: 'training_spec_slot',
    targetScope: 'player',
    cooldownWeeks: 3,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 1800,
    premiumCurrencyPrice: 160,
    usageRestrictionsText:
      'Cooldown: 3 weeks. Cannot conflict with another specialized development program.',
  },
  {
    itemId: 'bst-train-tac-legendary',
    name: 'Cruyff Vision & Tactical Savant Clinic',
    description:
      'Legendary tactical mentorship program (+45% mental & tactical attribute development efficiency for 4 weeks).',
    category: 'training',
    subType: 'tactical_dev',
    rarity: 'Legendary',
    durationWeeks: 4,
    effectStrength: 45,
    priority: 40,
    conflictGroup: 'training_spec_slot',
    targetScope: 'player',
    cooldownWeeks: 4,
    maxActivePerPlayer: 2,
    premiumCurrencyPrice: 320,
    usageRestrictionsText:
      'Legendary scarcity. Respects seasonal growth cap and diminishing returns curve.',
  },

  // =========================================================================
  // B. CHEMISTRY BOOSTERS
  // =========================================================================
  {
    itemId: 'bst-chem-train-common',
    name: 'Squad Communication Workshop',
    description:
      'Helps a player integrate faster with surrounding teammates (+4 interpersonal chemistry bonus for 2 weeks and reduces transfer adaptation by 1 week).',
    category: 'chemistry',
    subType: 'chemistry_training',
    rarity: 'Common',
    durationWeeks: 2,
    effectStrength: 4,
    priority: 10,
    conflictGroup: 'chem_player_slot',
    targetScope: 'player',
    cooldownWeeks: 2,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 400,
    premiumCurrencyPrice: 40,
    usageRestrictionsText:
      'Contributes to team chemistry within the nonlinear 3% match influence cap.',
  },
  {
    itemId: 'bst-chem-pair-rare',
    name: 'Partnership Telepathy Session',
    description:
      'Dedicated two-player tactical & interpersonal drill (+6 partnership familiarity and +2 equivalent matches played together).',
    category: 'chemistry',
    subType: 'partnership_training',
    rarity: 'Rare',
    durationWeeks: 2,
    effectStrength: 6,
    priority: 25,
    conflictGroup: 'chem_pair_slot',
    targetScope: 'pair',
    cooldownWeeks: 2,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 900,
    premiumCurrencyPrice: 85,
    usageRestrictionsText: 'Builds genuine partnership familiarity without bypassing match limits.',
  },
  {
    itemId: 'bst-chem-bonding-epic',
    name: 'Pre-Match Retreat & Team Bonding',
    description:
      'Full-squad cohesion retreat that elevates all starting XI links (+7 team chemistry points for 3 weeks and +4 squad morale).',
    category: 'chemistry',
    subType: 'team_bonding',
    rarity: 'Epic',
    durationWeeks: 3,
    effectStrength: 7,
    priority: 35,
    conflictGroup: 'chem_team_slot',
    targetScope: 'team',
    cooldownWeeks: 3,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 1950,
    premiumCurrencyPrice: 175,
    usageRestrictionsText:
      'One active Team Bonding effect per club. Capped by central nonlinear match modifier.',
  },

  // =========================================================================
  // C. SYNERGY BOOSTERS
  // =========================================================================
  {
    itemId: 'bst-syn-pos-common',
    name: 'Positional Role Briefing',
    description:
      'Sharpens positional discipline and secondary-slot familiarity (+4 tactical synergy for 2 weeks).',
    category: 'synergy',
    subType: 'positional_training',
    rarity: 'Common',
    durationWeeks: 2,
    effectStrength: 4,
    priority: 10,
    conflictGroup: 'syn_unit_slot',
    targetScope: 'team',
    cooldownWeeks: 1,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 420,
    premiumCurrencyPrice: 40,
    usageRestrictionsText:
      'Contributes to tactical synergy within the 4% maximum match influence limit.',
  },
  {
    itemId: 'bst-syn-tac-rare',
    name: 'Opposition & Tactical Preparation Dossier',
    description:
      'Detailed video analysis of pressing triggers and transition lanes (+6 team tactical synergy for 2 weeks).',
    category: 'synergy',
    subType: 'tactical_preparation',
    rarity: 'Rare',
    durationWeeks: 2,
    effectStrength: 6,
    priority: 25,
    conflictGroup: 'syn_tac_slot',
    targetScope: 'team',
    cooldownWeeks: 2,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 950,
    premiumCurrencyPrice: 90,
    usageRestrictionsText:
      'Enhances pressing & positional coverage without guaranteeing victory.',
  },
  {
    itemId: 'bst-syn-unit-epic',
    name: 'Synchronized Unit Coordination Camp',
    description:
      'Synchronizes Backline, Midfield Engine Room, and Frontline unit spacing (+9 team synergy for 3 weeks).',
    category: 'synergy',
    subType: 'unit_coordination',
    rarity: 'Epic',
    durationWeeks: 3,
    effectStrength: 9,
    priority: 35,
    conflictGroup: 'syn_tac_slot',
    targetScope: 'team',
    cooldownWeeks: 3,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 2100,
    premiumCurrencyPrice: 190,
    usageRestrictionsText:
      'Higher priority replaces lower Tactical Preparation boosters if active.',
  },

  // =========================================================================
  // D. RECOVERY BOOSTERS
  // =========================================================================
  {
    itemId: 'bst-rec-pack-common',
    name: 'Cryo & Physio Recovery Pack',
    description:
      'Immediate sports-science recovery treatment restoring +14% Fitness to a fatigued player (capped at 100%).',
    category: 'recovery',
    subType: 'recovery_pack',
    rarity: 'Common',
    durationWeeks: 0,
    effectStrength: 14,
    priority: 10,
    conflictGroup: 'instant_recovery',
    targetScope: 'player',
    cooldownWeeks: 1,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 300,
    premiumCurrencyPrice: 30,
    usageRestrictionsText: 'Instant consumable. Fitness cannot exceed 100%.',
  },
  {
    itemId: 'bst-rec-cond-rare',
    name: 'Elite Matchday Condition Pack',
    description:
      'Restores +24% Fitness to a target player and reduces minor knock recovery by 1 week.',
    category: 'recovery',
    subType: 'condition_pack',
    rarity: 'Rare',
    durationWeeks: 0,
    effectStrength: 24,
    priority: 20,
    conflictGroup: 'instant_recovery',
    targetScope: 'player',
    cooldownWeeks: 1,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 780,
    premiumCurrencyPrice: 75,
    usageRestrictionsText: 'Instant consumable. Cannot cure long-term ligament tears instantly.',
  },
  {
    itemId: 'bst-rec-squad-epic',
    name: 'Full-Squad Hydrotherapy & Fatigue Recovery',
    description:
      'Restores +12% Fitness across all senior players in the club after congested cup weeks.',
    category: 'recovery',
    subType: 'fatigue_recovery',
    rarity: 'Epic',
    durationWeeks: 0,
    effectStrength: 12,
    priority: 30,
    conflictGroup: 'squad_recovery',
    targetScope: 'team',
    cooldownWeeks: 2,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 1750,
    premiumCurrencyPrice: 165,
    usageRestrictionsText: 'Cooldown: 2 weeks between full-squad recovery treatments.',
  },

  // =========================================================================
  // E. MORALE BOOSTERS
  // =========================================================================
  {
    itemId: 'bst-mor-ind-common',
    name: 'One-on-One Manager Pep Talk',
    description:
      'Personal mentoring session that lifts an individual player’s morale by +14 points (up to 100).',
    category: 'morale',
    subType: 'individual_morale',
    rarity: 'Common',
    durationWeeks: 0,
    effectStrength: 14,
    priority: 10,
    conflictGroup: 'morale_ind',
    targetScope: 'player',
    cooldownWeeks: 1,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 280,
    premiumCurrencyPrice: 28,
    usageRestrictionsText: 'Instant morale lift. Morale capped at 100.',
  },
  {
    itemId: 'bst-mor-team-rare',
    name: 'Dressing Room Gala & Team Morale Boost',
    description:
      'Boosts morale of every player in the squad by +9 points and clears minor bench dissatisfaction.',
    category: 'morale',
    subType: 'team_morale',
    rarity: 'Rare',
    durationWeeks: 0,
    effectStrength: 9,
    priority: 20,
    conflictGroup: 'morale_team',
    targetScope: 'team',
    cooldownWeeks: 2,
    maxActivePerPlayer: 2,
    softCurrencyPrice: 820,
    premiumCurrencyPrice: 80,
    usageRestrictionsText: 'Cooldown: 2 weeks.',
  },
  {
    itemId: 'bst-mor-ldr-legendary',
    name: 'Captain’s Legendary Leadership Rally',
    description:
      'Inspires the entire club (+15 squad morale, +0.5 form boost, and +3 leadership communication for 3 weeks).',
    category: 'morale',
    subType: 'leadership_motivation',
    rarity: 'Legendary',
    durationWeeks: 3,
    effectStrength: 15,
    priority: 40,
    conflictGroup: 'morale_team',
    targetScope: 'team',
    cooldownWeeks: 4,
    maxActivePerPlayer: 2,
    premiumCurrencyPrice: 290,
    usageRestrictionsText: 'Legendary item. Cooldown: 4 weeks.',
  },

  // =========================================================================
  // F. STARTER PACK EXCLUSIVE COSMETIC
  // =========================================================================
  {
    itemId: 'cosmetic-founders-gold-crest',
    name: 'Founder’s Golden Crest & Touchline Badge',
    description:
      'Exclusive one-time Starter Pack club customization reward.Unlocks the Championship Gold Crest Frame & VIP Manager Touchline Badge.',
    category: 'cosmetic',
    subType: 'founders_cosmetic',
    rarity: 'Legendary',
    durationWeeks: 999,
    effectStrength: 0,
    priority: 100,
    conflictGroup: 'cosmetic_crest',
    targetScope: 'club_cosmetic',
    cooldownWeeks: 0,
    maxActivePerPlayer: 1,
    usageRestrictionsText: 'Cosmetic customization only (0% competitive stat advantage).',
  },
];

export function getBoosterDefinition(itemId: string): BoosterItemDefinition | undefined {
  return BOOSTER_CATALOG.find((b) => b.itemId === itemId);
}

/**
 * Generates the initial default objectives (Daily, Weekly, Seasonal, Achievements).
 */
export function generateDefaultObjectives(): ProgressionObjective[] {
  return [
    {
      id: 'obj-daily-match',
      title: 'Matchday Tactician',
      description: 'Complete 1 competitive league or cup fixture.',
      cadence: 'daily',
      targetProgress: 1,
      currentProgress: 0,
      completed: false,
      claimed: false,
      rewardSoftCoins: 300,
      rewardPremiumCoins: 10,
      rewardItemId: 'bst-rec-pack-common',
      rewardItemQty: 1,
    },
    {
      id: 'obj-daily-training',
      title: 'Training Ground Oversight',
      description: 'Complete a week of scheduled squad training or activate 1 training drill.',
      cadence: 'daily',
      targetProgress: 1,
      currentProgress: 0,
      completed: false,
      claimed: false,
      rewardSoftCoins: 220,
      rewardPremiumCoins: 5,
      rewardItemId: 'bst-train-xp-common',
      rewardItemQty: 1,
    },
    {
      id: 'obj-weekly-goals',
      title: 'Attacking Fluency',
      description: 'Score 5 goals across competitive fixtures.',
      cadence: 'weekly',
      targetProgress: 5,
      currentProgress: 0,
      completed: false,
      claimed: false,
      rewardSoftCoins: 750,
      rewardPremiumCoins: 25,
      rewardItemId: 'bst-chem-pair-rare',
      rewardItemQty: 1,
    },
    {
      id: 'obj-weekly-cleansheet',
      title: 'Defensive Fortress',
      description: 'Keep 2 clean sheets in league or cup competition.',
      cadence: 'weekly',
      targetProgress: 2,
      currentProgress: 0,
      completed: false,
      claimed: false,
      rewardSoftCoins: 800,
      rewardPremiumCoins: 30,
      rewardItemId: 'bst-syn-tac-rare',
      rewardItemQty: 1,
    },
    {
      id: 'obj-season-cohesion',
      title: 'Locker Room Harmony',
      description: 'Reach Strong Understanding (75+ Team Chemistry) with your Starting XI.',
      cadence: 'seasonal',
      targetProgress: 75,
      currentProgress: 60,
      completed: false,
      claimed: false,
      rewardSoftCoins: 1800,
      rewardPremiumCoins: 75,
      rewardItemId: 'bst-chem-bonding-epic',
      rewardItemQty: 1,
    },
    {
      id: 'obj-ach-silverware',
      title: 'Silverware Contender',
      description: 'Win 3 matches in a single season.',
      cadence: 'achievement',
      targetProgress: 3,
      currentProgress: 0,
      completed: false,
      claimed: false,
      rewardSoftCoins: 1500,
      rewardPremiumCoins: 60,
      rewardItemId: 'bst-syn-unit-epic',
      rewardItemQty: 1,
    },
  ];
}

/**
 * Creates a fresh, valid `EconomyState` for a newly created career or migrated save.
 */
export function createInitialEconomyState(
  club: Club,
  clubPlayers: Player[],
  worldSeed: number,
  season = 2026,
  week = 1
): EconomyState {
  const accountId = `acct-${club.id}-${worldSeed}`;
  const nowIso = new Date().toISOString();
  const todayKey = nowIso.slice(0, 10);

  const starterInventory: InventoryItemRecord[] = [
    {
      instanceId: `inv-init-train-1`,
      itemId: 'bst-train-xp-common',
      quantity: 2,
      acquiredAtIso: nowIso,
      acquiredWeek: week,
      acquiredSeason: season,
      source: 'daily_login',
    },
    {
      instanceId: `inv-init-rec-1`,
      itemId: 'bst-rec-pack-common',
      quantity: 2,
      acquiredAtIso: nowIso,
      acquiredWeek: week,
      acquiredSeason: season,
      source: 'daily_login',
    },
    {
      instanceId: `inv-init-chem-1`,
      itemId: 'bst-chem-train-common',
      quantity: 1,
      acquiredAtIso: nowIso,
      acquiredWeek: week,
      acquiredSeason: season,
      source: 'daily_login',
    },
    {
      instanceId: `inv-init-syn-1`,
      itemId: 'bst-syn-pos-common',
      quantity: 1,
      acquiredAtIso: nowIso,
      acquiredWeek: week,
      acquiredSeason: season,
      source: 'daily_login',
    },
  ];

  return {
    accountId,
    softCurrency: 1250,
    premiumCurrency: 100,
    inventory: starterInventory,
    activeBoosters: [],
    cooldownsByTarget: {},
    usageHistory: [],
    acquisitionHistory: starterInventory.map((inv, idx) => {
      const def = getBoosterDefinition(inv.itemId)!;
      return {
        id: `acq-init-${idx + 1}`,
        itemId: inv.itemId,
        itemName: def.name,
        rarity: def.rarity,
        quantity: inv.quantity,
        source: inv.source,
        acquiredAtIso: nowIso,
        season,
        week,
      };
    }),
    dailyLoginStreak: 1,
    lastDailyLoginClaimWeek: 0,
    objectives: generateDefaultObjectives(),
    rewardedAds: {
      dateKey: todayKey,
      adsWatchedToday: 0,
      claimedNonces: [],
      providerStatus: 'ready',
    },
    starterPack: {
      accountId,
      owned: false,
      onboardingOfferUnlockedWeek: 1,
      failedAttemptsCount: 0,
      cosmeticUnlocked: false,
    },
    transactions: [],
    pairChemistry: generateInitialPairChemistryForClub(club, clubPlayers, season, week),
    chemistryHistory: [
      {
        season,
        week,
        teamChemistry: 64,
        teamSynergy: 68,
        note: 'Initial pre-season squad baseline',
      },
    ],
    balanceConfig: { ...DEFAULT_BALANCE_CONFIG },
    adminAuditLog: [],
  };
}

/**
 * Ensures `state.economy` is always initialized on `GameState`.
 */
export function ensureEconomyState(state: GameState): EconomyState {
  if (state.economy) return state.economy;
  const userClub = state.clubs.find((c) => c.id === state.manager.clubId) ?? state.clubs[0];
  const clubPlayers = state.players.filter((p) => p.clubId === userClub.id);
  return createInitialEconomyState(
    userClub,
    clubPlayers,
    state.worldSeed,
    state.currentSeason,
    state.currentWeek
  );
}

/**
 * Adds items to the user's inventory (merging quantities for matching `itemId`)
 * and logs an entry in `acquisitionHistory`.
 */
export function grantInventoryItems(
  economy: EconomyState,
  grants: { itemId: string; quantity: number }[],
  source: AcquisitionSource,
  season: number,
  week: number,
  nowIso = new Date().toISOString()
): EconomyState {
  const nextInv = [...economy.inventory];
  const nextHistory = [...economy.acquisitionHistory];

  for (const g of grants) {
    if (g.quantity <= 0) continue;
    const def = getBoosterDefinition(g.itemId);
    if (!def) continue;

    const existingIdx = nextInv.findIndex((i) => i.itemId === g.itemId);
    if (existingIdx >= 0) {
      nextInv[existingIdx] = {
        ...nextInv[existingIdx],
        quantity: nextInv[existingIdx].quantity + g.quantity,
      };
    } else {
      nextInv.push({
        instanceId: `inv-${g.itemId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: g.itemId,
        quantity: g.quantity,
        acquiredAtIso: nowIso,
        acquiredWeek: week,
        acquiredSeason: season,
        source,
        expiresAtWeek: def.expirationWeeks
          ? ((week - 1 + def.expirationWeeks) % 22) + 1
          : undefined,
        expiresAtSeason: def.expirationWeeks
          ? season + Math.floor((week - 1 + def.expirationWeeks) / 22)
          : undefined,
      });
    }

    nextHistory.unshift({
      id: `acq-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      itemId: def.itemId,
      itemName: def.name,
      rarity: def.rarity,
      quantity: g.quantity,
      source,
      acquiredAtIso: nowIso,
      season,
      week,
    });
  }

  return {
    ...economy,
    inventory: nextInv,
    acquisitionHistory: nextHistory.slice(0, 80),
  };
}

export interface BoosterActivationResult {
  success: boolean;
  message: string;
  updatedState: GameState;
}

/**
 * Activates a booster from the user's inventory with strict Anti-Overbuff validation:
 * 1. Verifies inventory ownership (`quantity >= 1`).
 * 2. Enforces maximum active performance boosters per player (`config.maxActiveBoostersPerPlayer`, default 2).
 * 3. Prevents identical boosters from stacking (`itemId` already active on target).
 * 4. Enforces cooldowns (`cooldownsByTarget`).
 * 5. Resolves conflict groups via the priority system:
 *    - A lower or equal priority booster in the same conflict group is blocked while a higher one is active.
 *    - A higher priority booster supersedes and replaces the lower priority active booster in that conflict group.
 * 6. Enforces player attribute cap (`maxPrimaryAttributeCap = 100`) and diminishing returns on training boosters.
 */
export function activateBoosterItem(
  state: GameState,
  itemId: string,
  targetPlayerId?: string,
  secondaryPlayerId?: string,
  nowIso = new Date().toISOString()
): BoosterActivationResult {
  const economy = ensureEconomyState(state);
  const config = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
  const def = getBoosterDefinition(itemId);

  if (!def) {
    return { success: false, message: 'Unknown booster item ID.', updatedState: state };
  }

  const invIdx = economy.inventory.findIndex((i) => i.itemId === itemId && i.quantity > 0);
  if (invIdx < 0) {
    return {
      success: false,
      message: `You do not have any ${def.name} left in your inventory.`,
      updatedState: state,
    };
  }

  const userClubId = state.manager.clubId;
  const clubPlayers = state.players.filter((p) => p.clubId === userClubId && !p.isYouth);
  const targetPlayer = targetPlayerId
    ? state.players.find((p) => p.id === targetPlayerId)
    : clubPlayers[0];

  if ((def.targetScope === 'player' || def.targetScope === 'pair') && !targetPlayer) {
    return {
      success: false,
      message: 'Please select a valid target player for this booster.',
      updatedState: state,
    };
  }

  const currentTotalWeek = state.currentSeason * 22 + state.currentWeek;
  const cooldownKey = `${targetPlayer?.id ?? userClubId}_${def.conflictGroup}`;
  const cooldownUntil = economy.cooldownsByTarget[cooldownKey] ?? 0;

  if (cooldownUntil > currentTotalWeek) {
    const weeksWait = cooldownUntil - currentTotalWeek;
    return {
      success: false,
      message: `Cooldown active for this booster category (${weeksWait} week(s) remaining).`,
      updatedState: state,
    };
  }

  // Check identical stacking & conflict priority on active boosters
  let nextActiveBoosters = [...economy.activeBoosters];
  if (def.durationWeeks > 0) {
    // 1. Identical booster cannot stack on same target
    const identicalActive = nextActiveBoosters.find(
      (b) =>
        b.itemId === def.itemId &&
        (def.targetScope === 'team' ? b.clubId === userClubId : b.targetPlayerId === targetPlayer?.id)
    );
    if (identicalActive) {
      return {
        success: false,
        message: `${def.name} is already active! Identical boosters cannot stack.`,
        updatedState: state,
      };
    }

    // 2. Conflict group & Priority check
    const conflictingIdx = nextActiveBoosters.findIndex(
      (b) =>
        b.conflictGroup === def.conflictGroup &&
        (def.targetScope === 'team' ? b.clubId === userClubId : b.targetPlayerId === targetPlayer?.id)
    );

    if (conflictingIdx >= 0) {
      const existingConflict = nextActiveBoosters[conflictingIdx];
      if (def.priority <= existingConflict.priority) {
        return {
          success: false,
          message: `Cannot activate: a higher or equal priority effect (${existingConflict.name}) is already active in slot '${def.conflictGroup}'.`,
          updatedState: state,
        };
      }
      // Higher priority replaces lower priority conflict
      nextActiveBoosters.splice(conflictingIdx, 1);
    }

    // 3. Max active performance boosters per player check (default 2)
    if (def.targetScope === 'player' && targetPlayer) {
      const playerActiveCount = nextActiveBoosters.filter(
        (b) => b.targetPlayerId === targetPlayer.id
      ).length;
      if (playerActiveCount >= config.maxActiveBoostersPerPlayer) {
        return {
          success: false,
          message: `${targetPlayer.firstName} ${targetPlayer.lastName} already has the maximum ${config.maxActiveBoostersPerPlayer} active boosters.`,
          updatedState: state,
        };
      }
    }
  }

  // Apply immediate effects (Recovery, Morale, Technical/Physical instant progress, Chemistry pair bonus)
  let updatedPlayers = [...state.players];
  let updatedPairChemistry = { ...economy.pairChemistry };
  let effectSummary = '';
  const strength = Math.round(def.effectStrength * config.boosterGlobalStrengthMultiplier);
  const attrCap = config.maxPrimaryAttributeCap ?? 100;

  if (def.category === 'recovery') {
    if (def.subType === 'fatigue_recovery') {
      updatedPlayers = updatedPlayers.map((p) =>
        p.clubId === userClubId && !p.isYouth
          ? { ...p, fitness: Math.min(100, p.fitness + strength) }
          : p
      );
      effectSummary = `Restored +${strength}% fitness across all senior squad players.`;
    } else if (targetPlayer) {
      updatedPlayers = updatedPlayers.map((p) => {
        if (p.id !== targetPlayer.id) return p;
        const nextInjury =
          def.subType === 'condition_pack' && p.injuryWeeks > 0
            ? Math.max(0, p.injuryWeeks - 1)
            : p.injuryWeeks;
        return {
          ...p,
          fitness: Math.min(100, p.fitness + strength),
          injuryWeeks: nextInjury,
        };
      });
      effectSummary = `Restored +${strength}% fitness to ${targetPlayer.firstName} ${targetPlayer.lastName}.`;
    }
  } else if (def.category === 'morale') {
    if (def.subType === 'individual_morale' && targetPlayer) {
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === targetPlayer.id
          ? { ...p, morale: Math.min(100, p.morale + strength), transferRequested: false }
          : p
      );
      effectSummary = `Boosted ${targetPlayer.firstName} ${targetPlayer.lastName}'s morale by +${strength}.`;
    } else {
      updatedPlayers = updatedPlayers.map((p) =>
        p.clubId === userClubId
          ? {
              ...p,
              morale: Math.min(100, p.morale + strength),
              form:
                def.subType === 'leadership_motivation'
                  ? Math.min(10, Math.round((p.form + 0.5) * 10) / 10)
                  : p.form,
            }
          : p
      );
      effectSummary = `Boosted entire squad morale by +${strength}.`;
    }
  } else if (def.category === 'training' && targetPlayer) {
    // Apply diminishing-returns attribute development check if player is below potential and seasonal cap
    const attrKeyMap: Record<string, (keyof PlayerAttributes)[]> = {
      training_xp: ['passing', 'positioning', 'stamina'],
      technical_dev: ['passing', 'dribbling', 'ballControl', 'firstTouch', 'finishing'],
      physical_dev: ['stamina', 'strength', 'pace', 'acceleration', 'agility'],
      tactical_dev: ['vision', 'decisions', 'positioning', 'anticipation', 'composure'],
    };
    const candidateKeys = attrKeyMap[def.subType] ?? ['passing'];
    const chosenKey = candidateKeys[0];
    const currVal = targetPlayer.attributes[chosenKey];
    const eff = getAttributeTrainingEfficiency(currVal, config);

    if (currVal < attrCap && targetPlayer.seasonGrowth < 5 && eff > 0) {
      // Scaled increment respecting diminishing returns
      const rawGain = eff >= 0.65 ? 1 : eff >= 0.35 && def.rarity !== 'Common' ? 1 : 0;
      if (rawGain > 0) {
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id !== targetPlayer.id) return p;
          const nextVal = Math.min(attrCap, p.attributes[chosenKey] + rawGain);
          const nextAttrs = { ...p.attributes, [chosenKey]: nextVal };
          const nextOvr = Math.min(
            attrCap,
            Math.min(p.potential, calculateOverallRating(nextAttrs, p.primaryPosition))
          );
          return {
            ...p,
            attributes: nextAttrs,
            overall: nextOvr,
            marketValue: calculateMarketValue(nextOvr, p.age, p.potential),
            seasonGrowth: Math.min(5, p.seasonGrowth + (nextOvr > p.overall ? 1 : 0.5)),
          };
        });
      }
    }
    effectSummary = `Activated ${def.name} on ${targetPlayer.firstName} ${targetPlayer.lastName} (${Math.round(eff * 100)}% tier efficiency, +${strength}% training boost for ${def.durationWeeks}w).`;
  } else if (def.category === 'chemistry') {
    if (def.subType === 'partnership_training' && targetPlayer) {
      const partnerId =
        secondaryPlayerId && secondaryPlayerId !== targetPlayer.id
          ? secondaryPlayerId
          : clubPlayers.find((p) => p.id !== targetPlayer.id)?.id;
      if (partnerId) {
        const key = makePlayerPairKey(targetPlayer.id, partnerId);
        const existingPair = updatedPairChemistry[key];
        updatedPairChemistry[key] = {
          pairKey: key,
          playerAId: targetPlayer.id < partnerId ? targetPlayer.id : partnerId,
          playerBId: targetPlayer.id < partnerId ? partnerId : targetPlayer.id,
          clubId: userClubId,
          matchesTogether: (existingPair?.matchesTogether ?? 4) + 2,
          minutesTogether: (existingPair?.minutesTogether ?? 320) + 180,
          trainingSessionsTogether: (existingPair?.trainingSessionsTogether ?? 4) + 3,
          weeksSinceLastPlayedTogether: 0,
          dynamicFamiliarityBonus: Math.min(
            32,
            (existingPair?.dynamicFamiliarityBonus ?? 2) + strength * 0.65
          ),
          lastUpdatedSeason: state.currentSeason,
          lastUpdatedWeek: state.currentWeek,
        };
      }
      effectSummary = `Completed Partnership Telepathy training (+${strength} familiarity).`;
    } else if (def.subType === 'chemistry_training' && targetPlayer) {
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === targetPlayer.id && p.joinedClubWeek !== undefined
          ? { ...p, joinedClubWeek: Math.max(1, p.joinedClubWeek - 1) }
          : p
      );
      effectSummary = `Accelerated ${targetPlayer.firstName} ${targetPlayer.lastName}'s squad integration (+${strength} chemistry for ${def.durationWeeks}w).`;
    } else {
      effectSummary = `Team Bonding retreat active (+${strength} team chemistry for ${def.durationWeeks}w).`;
    }
  } else if (def.category === 'synergy') {
    effectSummary = `Activated ${def.name} (+${strength} tactical synergy for ${def.durationWeeks}w).`;
  } else if (def.category === 'cosmetic') {
    effectSummary = `Equipped ${def.name} on your club profile.`;
  }

  // Register active duration booster if durationWeeks > 0
  if (def.durationWeeks > 0) {
    nextActiveBoosters.push({
      activeId: `act-${def.itemId}-${Date.now()}`,
      itemId: def.itemId,
      name: def.name,
      category: def.category,
      subType: def.subType,
      rarity: def.rarity,
      effectStrength: def.effectStrength,
      priority: def.priority,
      conflictGroup: def.conflictGroup,
      targetPlayerId: targetPlayer?.id,
      secondaryPlayerId,
      clubId: userClubId,
      activatedWeek: state.currentWeek,
      activatedSeason: state.currentSeason,
      remainingWeeks: def.durationWeeks,
    });
  }

  // Decrement inventory quantity
  const nextInventory = economy.inventory
    .map((item, i) => (i === invIdx ? { ...item, quantity: item.quantity - 1 } : item))
    .filter((item) => item.quantity > 0);

  // Set cooldown if applicable
  const nextCooldowns = { ...economy.cooldownsByTarget };
  if (def.cooldownWeeks > 0) {
    nextCooldowns[cooldownKey] = currentTotalWeek + def.cooldownWeeks;
  }

  // Update daily training objective if training booster used
  const nextObjectives = economy.objectives.map((obj) => {
    if (obj.id === 'obj-daily-training' && !obj.completed) {
      return { ...obj, currentProgress: 1, completed: true };
    }
    return obj;
  });

  const nextEconomy: EconomyState = {
    ...economy,
    inventory: nextInventory,
    activeBoosters: nextActiveBoosters,
    cooldownsByTarget: nextCooldowns,
    pairChemistry: updatedPairChemistry,
    objectives: nextObjectives,
    usageHistory: [
      {
        id: `use-${Date.now()}`,
        itemId: def.itemId,
        itemName: def.name,
        rarity: def.rarity,
        category: def.category,
        usedAtIso: nowIso,
        season: state.currentSeason,
        week: state.currentWeek,
        targetDescription: targetPlayer
          ? `${targetPlayer.firstName} ${targetPlayer.lastName}`
          : 'Full Squad',
        effectSummary,
      },
      ...economy.usageHistory,
    ].slice(0, 60),
  };

  return {
    success: true,
    message: effectSummary,
    updatedState: {
      ...state,
      players: updatedPlayers,
      economy: nextEconomy,
    },
  };
}

/**
 * Advances active booster durations by 1 week and expires any shelf-life inventory items.
 * Temporary boosters expire cleanly without leaving permanent attribute mutations.
 */
export function tickWeeklyBoostersAndExpirations(state: GameState): GameState {
  const economy = ensureEconomyState(state);

  const nextActiveBoosters = economy.activeBoosters
    .map((b) => ({ ...b, remainingWeeks: b.remainingWeeks - 1 }))
    .filter((b) => b.remainingWeeks > 0);

  const nextInventory = economy.inventory.filter((item) => {
    if (item.expiresAtSeason === undefined || item.expiresAtWeek === undefined) return true;
    const itemExpiryTotal = item.expiresAtSeason * 22 + item.expiresAtWeek;
    const currentTotal = state.currentSeason * 22 + state.currentWeek;
    return itemExpiryTotal > currentTotal;
  });

  return {
    ...state,
    economy: {
      ...economy,
      activeBoosters: nextActiveBoosters,
      inventory: nextInventory,
    },
  };
}

/**
 * Claims the Daily Login Reward (once per game week).
 */
export function claimDailyLoginReward(
  state: GameState,
  nowIso = new Date().toISOString()
): { success: boolean; message: string; updatedState: GameState } {
  const economy = ensureEconomyState(state);
  const config = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
  const weekStamp = state.currentSeason * 100 + state.currentWeek;

  if (economy.lastDailyLoginClaimWeek === weekStamp) {
    return {
      success: false,
      message: 'Daily login reward already claimed for this matchweek.',
      updatedState: state,
    };
  }

  const streak = economy.dailyLoginStreak + 1;
  const softBonus = config.dailyLoginSoftCoins + Math.min(250, streak * 25);
  const rewardItem =
    streak % 5 === 0
      ? 'bst-chem-pair-rare'
      : streak % 3 === 0
        ? 'bst-train-xp-common'
        : 'bst-rec-pack-common';

  let nextEconomy = grantInventoryItems(
    economy,
    [{ itemId: rewardItem, quantity: 1 }],
    'daily_login',
    state.currentSeason,
    state.currentWeek,
    nowIso
  );

  nextEconomy = {
    ...nextEconomy,
    softCurrency: nextEconomy.softCurrency + softBonus,
    dailyLoginStreak: streak,
    lastDailyLoginClaimWeek: weekStamp,
  };

  const def = getBoosterDefinition(rewardItem)!;
  return {
    success: true,
    message: `Day ${streak} Login Claimed: +${softBonus} Club Coins & 1x ${def.name}!`,
    updatedState: {
      ...state,
      economy: nextEconomy,
    },
  };
}

/**
 * Claims a completed Progression Objective (Daily, Weekly, Seasonal, Achievement).
 */
export function claimObjectiveReward(
  state: GameState,
  objectiveId: string,
  nowIso = new Date().toISOString()
): { success: boolean; message: string; updatedState: GameState } {
  const economy = ensureEconomyState(state);
  const objIdx = economy.objectives.findIndex((o) => o.id === objectiveId);
  if (objIdx < 0) {
    return { success: false, message: 'Objective not found.', updatedState: state };
  }

  const obj = economy.objectives[objIdx];
  if (!obj.completed) {
    return {
      success: false,
      message: 'Objective is not yet completed.',
      updatedState: state,
    };
  }
  if (obj.claimed) {
    return {
      success: false,
      message: 'Objective reward has already been claimed.',
      updatedState: state,
    };
  }

  const sourceMap: Record<ProgressionObjective['cadence'], AcquisitionSource> = {
    daily: 'daily_objective',
    weekly: 'weekly_objective',
    seasonal: 'seasonal_reward',
    achievement: 'achievement',
  };

  let nextEconomy = economy;
  if (obj.rewardItemId && (obj.rewardItemQty ?? 0) > 0) {
    nextEconomy = grantInventoryItems(
      nextEconomy,
      [{ itemId: obj.rewardItemId, quantity: obj.rewardItemQty ?? 1 }],
      sourceMap[obj.cadence],
      state.currentSeason,
      state.currentWeek,
      nowIso
    );
  }

  const nextObjectives = [...nextEconomy.objectives];
  nextObjectives[objIdx] = { ...obj, claimed: true };

  nextEconomy = {
    ...nextEconomy,
    softCurrency: nextEconomy.softCurrency + obj.rewardSoftCoins,
    premiumCurrency: nextEconomy.premiumCurrency + obj.rewardPremiumCoins,
    objectives: nextObjectives,
  };

  return {
    success: true,
    message: `Claimed "${obj.title}": +${obj.rewardSoftCoins} Soft Coins${obj.rewardPremiumCoins > 0 ? `, +${obj.rewardPremiumCoins} Premium Coins` : ''}!`,
    updatedState: {
      ...state,
      economy: nextEconomy,
    },
  };
}

/**
 * Processes a verified Rewarded Advertisement completion.
 * Enforces:
 * - Daily limit (`config.maxRewardedAdsPerDay`)
 * - Nonce duplicate protection (`claimedNonces`)
 * - Provider availability check
 */
export function applyVerifiedRewardedAdGrant(
  state: GameState,
  adNonce: string,
  rewardChoice: 'recovery' | 'training' | 'soft_coins',
  providerSignature: string,
  nowIso = new Date().toISOString()
): { success: boolean; message: string; updatedState: GameState } {
  const economy = ensureEconomyState(state);
  const config = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
  const todayKey = nowIso.slice(0, 10);

  const adsToday =
    economy.rewardedAds.dateKey === todayKey ? economy.rewardedAds.adsWatchedToday : 0;
  const claimedNonces =
    economy.rewardedAds.dateKey === todayKey ? economy.rewardedAds.claimedNonces : [];

  if (economy.rewardedAds.providerStatus === 'unavailable') {
    return {
      success: false,
      message: 'Rewarded advertisements are currently unavailable from the ad provider.',
      updatedState: state,
    };
  }

  if (adsToday >= config.maxRewardedAdsPerDay) {
    return {
      success: false,
      message: `Daily rewarded advertisement limit reached (${config.maxRewardedAdsPerDay}/${config.maxRewardedAdsPerDay}). Come back tomorrow!`,
      updatedState: state,
    };
  }

  if (!adNonce || !providerSignature || !providerSignature.startsWith('verified_ad_')) {
    return {
      success: false,
      message: 'Ad verification failed: missing or invalid provider completion token.',
      updatedState: state,
    };
  }

  if (claimedNonces.includes(adNonce)) {
    return {
      success: false,
      message: 'Duplicate reward claim blocked: this advertisement session was already credited.',
      updatedState: state,
    };
  }

  let nextEconomy = { ...economy };
  let rewardDesc = '';

  if (rewardChoice === 'recovery') {
    nextEconomy = grantInventoryItems(
      nextEconomy,
      [{ itemId: 'bst-rec-pack-common', quantity: 1 }],
      'rewarded_ad',
      state.currentSeason,
      state.currentWeek,
      nowIso
    );
    rewardDesc = '1x Cryo & Physio Recovery Pack (Common)';
  } else if (rewardChoice === 'training') {
    nextEconomy = grantInventoryItems(
      nextEconomy,
      [{ itemId: 'bst-train-xp-common', quantity: 1 }],
      'rewarded_ad',
      state.currentSeason,
      state.currentWeek,
      nowIso
    );
    rewardDesc = '1x Standard Training XP Drill (Common)';
  } else {
    nextEconomy.softCurrency += 200;
    rewardDesc = '+200 Soft Club Coins';
  }

  nextEconomy.rewardedAds = {
    dateKey: todayKey,
    adsWatchedToday: adsToday + 1,
    claimedNonces: [...claimedNonces, adNonce],
    lastAdWatchedAtIso: nowIso,
    providerStatus: adsToday + 1 >= config.maxRewardedAdsPerDay ? 'cooldown' : 'ready',
  };

  return {
    success: true,
    message: `Verified Ad Reward Granted: ${rewardDesc} (${adsToday + 1}/${config.maxRewardedAdsPerDay} today).`,
    updatedState: {
      ...state,
      economy: nextEconomy,
    },
  };
}

/**
 * Applies a server-verified One-Time Starter Pack purchase or entitlement restoration.
 * Enforces all Starter Pack Rules:
 * - Available once per account lifetime.
 * - Failed or cancelled transactions do NOT consume eligibility (`starterPack.owned` stays `false`).
 * - Duplicate transaction IDs are rejected.
 * - Grants configurable quantities from `BalanceConfiguration`:
 *   - `starterPackPremiumCoins` (default 300)
 *   - `starterPackTrainingBoostersQty` (default 5 Common Training Boosters)
 *   - `starterPackRecoveryPacksQty` (default 3 Recovery Packs)
 *   - `starterPackMoraleBoostersQty` (default 2 Morale Boosters)
 *   - `starterPackRareChemistryQty` (default 1 Rare Chemistry Booster)
 *   - `starterPackRareSynergyQty` (default 1 Rare Tactical Preparation Booster)
 *   - 1 Exclusive Founder's Golden Crest & Touchline Badge Cosmetic
 */
export function applyVerifiedStarterPackTransaction(
  state: GameState,
  tx: {
    transactionId: string;
    status: 'verified' | 'failed' | 'cancelled' | 'restored';
    verificationSignature: string;
    nowIso?: string;
  }
): { success: boolean; message: string; updatedState: GameState } {
  const economy = ensureEconomyState(state);
  const config = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
  const nowIso = tx.nowIso ?? new Date().toISOString();

  if (!config.storePurchasesEnabled) {
    return {
      success: false,
      message: 'Store purchases are currently disabled by administrator configuration.',
      updatedState: state,
    };
  }

  // Handle failed or cancelled transaction gracefully without consuming eligibility
  if (tx.status === 'failed' || tx.status === 'cancelled') {
    const failedRecord: PurchaseTransactionRecord = {
      transactionId: tx.transactionId,
      accountId: economy.accountId,
      offerId: 'offer-starter-pack-onetime',
      offerName: 'Exclusive Manager One-Time Starter Pack',
      currencyType: 'real_money',
      amountPaid: config.starterPackPriceUsd,
      priceDisplay: `$${config.starterPackPriceUsd.toFixed(2)}`,
      status: tx.status,
      verificationHash: tx.verificationSignature || 'unverified',
      createdAtIso: nowIso,
      season: state.currentSeason,
      week: state.currentWeek,
      itemsGranted: [],
      softCoinsGranted: 0,
      premiumCoinsGranted: 0,
    };

    return {
      success: false,
      message:
        tx.status === 'cancelled'
          ? 'Purchase cancelled. Your one-time Starter Pack eligibility remains available.'
          : 'Payment verification failed. Your Starter Pack eligibility was not consumed.',
      updatedState: {
        ...state,
        economy: {
          ...economy,
          starterPack: {
            ...economy.starterPack,
            owned: economy.starterPack.owned,
            failedAttemptsCount: economy.starterPack.failedAttemptsCount + 1,
          },
          transactions: [failedRecord, ...economy.transactions].slice(0, 60),
        },
      },
    };
  }

  // Prevent duplicate purchases if already owned
  if (economy.starterPack.owned) {
    if (tx.status === 'restored') {
      return {
        success: true,
        message: 'Starter Pack entitlement is already active and verified on this account.',
        updatedState: state,
      };
    }
    return {
      success: false,
      message: 'Starter Pack is a permanent one-time offer and is already OWNED on this account.',
      updatedState: state,
    };
  }

  // Prevent duplicate transaction ID replay
  if (economy.transactions.some((t) => t.transactionId === tx.transactionId && t.status === 'verified')) {
    return {
      success: false,
      message: 'Duplicate transaction ID detected and blocked.',
      updatedState: state,
    };
  }

  if (!tx.verificationSignature || !tx.verificationSignature.startsWith('srv_sig_')) {
    return {
      success: false,
      message: 'Server-side signature verification failed for Starter Pack transaction.',
      updatedState: state,
    };
  }

  const grants: { itemId: string; quantity: number }[] = [
    { itemId: 'bst-train-xp-common', quantity: config.starterPackTrainingBoostersQty },
    { itemId: 'bst-rec-pack-common', quantity: config.starterPackRecoveryPacksQty },
    { itemId: 'bst-mor-ind-common', quantity: config.starterPackMoraleBoostersQty },
    { itemId: 'bst-chem-pair-rare', quantity: config.starterPackRareChemistryQty },
    { itemId: 'bst-syn-tac-rare', quantity: config.starterPackRareSynergyQty },
    { itemId: 'cosmetic-founders-gold-crest', quantity: 1 },
  ];

  let nextEconomy = grantInventoryItems(
    economy,
    grants,
    'starter_pack',
    state.currentSeason,
    state.currentWeek,
    nowIso
  );

  const verifiedRecord: PurchaseTransactionRecord = {
    transactionId: tx.transactionId,
    accountId: economy.accountId,
    offerId: 'offer-starter-pack-onetime',
    offerName: 'Exclusive Manager One-Time Starter Pack',
    currencyType: 'real_money',
    amountPaid: config.starterPackPriceUsd,
    priceDisplay: `$${config.starterPackPriceUsd.toFixed(2)}`,
    status: tx.status,
    verificationHash: tx.verificationSignature,
    createdAtIso: nowIso,
    season: state.currentSeason,
    week: state.currentWeek,
    itemsGranted: grants,
    softCoinsGranted: 0,
    premiumCoinsGranted: config.starterPackPremiumCoins,
  };

  nextEconomy = {
    ...nextEconomy,
    premiumCurrency: nextEconomy.premiumCurrency + config.starterPackPremiumCoins,
    starterPack: {
      ...nextEconomy.starterPack,
      owned: true,
      purchasedAtIso: nowIso,
      transactionId: tx.transactionId,
      verificationSignature: tx.verificationSignature,
      cosmeticUnlocked: true,
    },
    transactions: [verifiedRecord, ...nextEconomy.transactions].slice(0, 60),
  };

  return {
    success: true,
    message: `Starter Pack Unlocked! +${config.starterPackPremiumCoins} Premium Coins, 12 Boosters & Founder's Gold Crest added to your account.`,
    updatedState: {
      ...state,
      economy: nextEconomy,
    },
  };
}

/**
 * Applies a server-verified Store Purchase (Booster item, Special Event Bundle, or Currency Pack).
 */
export function applyVerifiedStorePurchase(
  state: GameState,
  payload: {
    transactionId: string;
    offerId: string;
    offerName: string;
    currencyType: 'soft' | 'premium' | 'real_money';
    costAmount: number;
    priceDisplay: string;
    verificationSignature: string;
    itemsGranted: { itemId: string; quantity: number }[];
    softCoinsGranted?: number;
    premiumCoinsGranted?: number;
    nowIso?: string;
  }
): { success: boolean; message: string; updatedState: GameState } {
  const economy = ensureEconomyState(state);
  const config = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
  const nowIso = payload.nowIso ?? new Date().toISOString();

  if (!config.storePurchasesEnabled) {
    return {
      success: false,
      message: 'Store purchases are currently disabled by administrator configuration.',
      updatedState: state,
    };
  }

  if (
    economy.transactions.some(
      (t) => t.transactionId === payload.transactionId && t.status === 'verified'
    )
  ) {
    return {
      success: false,
      message: 'Duplicate transaction prevented: this purchase ID was already processed.',
      updatedState: state,
    };
  }

  if (!payload.verificationSignature || !payload.verificationSignature.startsWith('srv_sig_')) {
    return {
      success: false,
      message: 'Transaction rejected: missing server-authoritative verification signature.',
      updatedState: state,
    };
  }

  if (payload.currencyType === 'soft' && economy.softCurrency < payload.costAmount) {
    return {
      success: false,
      message: `Insufficient Soft Club Coins (need ${payload.costAmount.toLocaleString()}, have ${economy.softCurrency.toLocaleString()}).`,
      updatedState: state,
    };
  }

  if (payload.currencyType === 'premium' && economy.premiumCurrency < payload.costAmount) {
    return {
      success: false,
      message: `Insufficient Premium Coins (need ${payload.costAmount.toLocaleString()}, have ${economy.premiumCurrency.toLocaleString()}).`,
      updatedState: state,
    };
  }

  let nextEconomy = grantInventoryItems(
    economy,
    payload.itemsGranted,
    payload.currencyType === 'soft' ? 'store_soft' : 'store_premium',
    state.currentSeason,
    state.currentWeek,
    nowIso
  );

  const softDelta =
    (payload.softCoinsGranted ?? 0) - (payload.currencyType === 'soft' ? payload.costAmount : 0);
  const premDelta =
    (payload.premiumCoinsGranted ?? 0) -
    (payload.currencyType === 'premium' ? payload.costAmount : 0);

  const record: PurchaseTransactionRecord = {
    transactionId: payload.transactionId,
    accountId: economy.accountId,
    offerId: payload.offerId,
    offerName: payload.offerName,
    currencyType: payload.currencyType,
    amountPaid: payload.costAmount,
    priceDisplay: payload.priceDisplay,
    status: 'verified',
    verificationHash: payload.verificationSignature,
    createdAtIso: nowIso,
    season: state.currentSeason,
    week: state.currentWeek,
    itemsGranted: payload.itemsGranted,
    softCoinsGranted: payload.softCoinsGranted ?? 0,
    premiumCoinsGranted: payload.premiumCoinsGranted ?? 0,
  };

  nextEconomy = {
    ...nextEconomy,
    softCurrency: Math.max(0, nextEconomy.softCurrency + softDelta),
    premiumCurrency: Math.max(0, nextEconomy.premiumCurrency + premDelta),
    transactions: [record, ...nextEconomy.transactions].slice(0, 60),
  };

  return {
    success: true,
    message: `Purchase Verified: ${payload.offerName} added to your club inventory!`,
    updatedState: {
      ...state,
      economy: nextEconomy,
    },
  };
}
