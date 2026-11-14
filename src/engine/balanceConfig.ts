import {
  AdminAuditLogEntry,
  BalanceConfiguration,
  ChemistryLevelLabel,
  SynergyLevelLabel,
} from './types';

/**
 * Initial recommended balancing values from Master Development Directive:
 * - Chemistry max match contribution: up to 3.0%
 * - Synergy max match contribution: up to 4.0%
 * - Combined chemistry + synergy maximum: up to 7.0%
 * - Primary player attribute limit: 100
 * - Diminishing returns on training progression:
 *   40-59: 100%, 60-69: 85%, 70-79: 65%, 80-89: 40%, 90-94: 20%, 95-99: 10%
 * - Maximum active performance boosters per player: 2
 */
export const DEFAULT_BALANCE_CONFIG: BalanceConfiguration = {
  version: 1,
  updatedAtIso: '2026-08-01T00:00:00.000Z',
  updatedBy: 'System Default',
  // Chemistry & Synergy Match Influence Caps (Nonlinear)
  maxChemistryMatchBonusPct: 3.0,
  maxSynergyMatchBonusPct: 4.0,
  maxCombinedChemSynergyBonusPct: 7.0,
  // Chemistry Progression
  chemistryGainPerMatchTogether: 1.35,
  chemistryGainPerTrainingWeek: 0.55,
  chemistryDecayPerInactiveWeek: 0.35,
  transferAdaptationWeeks: 5,
  // Synergy Weights
  synergyRoleWeight: 1.0,
  synergyTacticsWeight: 1.0,
  synergyFormationWeight: 1.0,
  // Player Attribute & Training Diminishing Returns
  maxPrimaryAttributeCap: 100,
  efficiencyTier40_59: 1.0,
  efficiencyTier60_69: 0.85,
  efficiencyTier70_79: 0.65,
  efficiencyTier80_89: 0.4,
  efficiencyTier90_94: 0.2,
  efficiencyTier95_99: 0.1,
  // Anti-Overbuff Booster Restrictions
  maxActiveBoostersPerPlayer: 2,
  boosterGlobalStrengthMultiplier: 1.0,
  boosterDefaultCooldownWeeks: 2,
  // Rewarded Ads & Daily Economy
  maxRewardedAdsPerDay: 5,
  dailyLoginSoftCoins: 250,
  starterPackPriceUsd: 4.99,
  starterPackPremiumCoins: 300,
  starterPackTrainingBoostersQty: 5,
  starterPackRecoveryPacksQty: 3,
  starterPackMoraleBoostersQty: 2,
  starterPackRareChemistryQty: 1,
  starterPackRareSynergyQty: 1,
  starterPackOnboardingWeeksLimit: 22,
  storePurchasesEnabled: true,
};

/**
 * Maps a 0..100 Chemistry score to its canonical ChemistryLevelLabel.
 * 0–19: Unfamiliar
 * 20–39: Developing
 * 40–59: Familiar
 * 60–79: Strong Understanding
 * 80–94: Excellent Understanding
 * 95–100: Exceptional Understanding
 */
export function getChemistryLevelLabel(score: number): ChemistryLevelLabel {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 95) return 'Exceptional Understanding';
  if (s >= 80) return 'Excellent Understanding';
  if (s >= 60) return 'Strong Understanding';
  if (s >= 40) return 'Familiar';
  if (s >= 20) return 'Developing';
  return 'Unfamiliar';
}

/**
 * Maps a 0..100 Synergy score to its canonical SynergyLevelLabel.
 * 0–19: Poor Compatibility
 * 20–39: Limited Compatibility
 * 40–59: Average Compatibility
 * 60–79: Good Compatibility
 * 80–94: Excellent Compatibility
 * 95–100: Exceptional Compatibility
 */
export function getSynergyLevelLabel(score: number): SynergyLevelLabel {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 95) return 'Exceptional Compatibility';
  if (s >= 80) return 'Excellent Compatibility';
  if (s >= 60) return 'Good Compatibility';
  if (s >= 40) return 'Average Compatibility';
  if (s >= 20) return 'Limited Compatibility';
  return 'Poor Compatibility';
}

/**
 * Computes the diminishing-returns training efficiency multiplier for a given current attribute value.
 * Player attribute 40–59: 100% efficiency
 * Player attribute 60–69: 85% efficiency
 * Player attribute 70–79: 65% efficiency
 * Player attribute 80–89: 40% efficiency
 * Player attribute 90–94: 20% efficiency
 * Player attribute 95–99: 10% efficiency
 * Player attribute >= maxPrimaryAttributeCap (100): 0% efficiency
 */
export function getAttributeTrainingEfficiency(
  currentAttrValue: number,
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG
): number {
  const cap = config.maxPrimaryAttributeCap ?? 100;
  if (currentAttrValue >= cap) return 0;
  if (currentAttrValue >= 95) return config.efficiencyTier95_99;
  if (currentAttrValue >= 90) return config.efficiencyTier90_94;
  if (currentAttrValue >= 80) return config.efficiencyTier80_89;
  if (currentAttrValue >= 70) return config.efficiencyTier70_79;
  if (currentAttrValue >= 60) return config.efficiencyTier60_69;
  return config.efficiencyTier40_59;
}

/**
 * Controlled nonlinear curve mapping Chemistry (0..100) and Synergy (0..100)
 * into situational match performance modifiers.
 *
 * - Baseline neutral score is ~58 (Familiar / Good baseline for a newly assembled professional squad).
 * - Uses hyperbolic tangent (`Math.tanh`) so extreme values saturate smoothly toward the configured cap
 *   instead of acting as an unbounded linear multiplier.
 * - Strictly enforces:
 *   - `|chemistryModPct| <= config.maxChemistryMatchBonusPct` (default 3.0%)
 *   - `|synergyModPct| <= config.maxSynergyMatchBonusPct` (default 4.0%)
 *   - `|combinedModPct| <= config.maxCombinedChemSynergyBonusPct` (default 7.0%)
 */
export function computeNonlinearMatchModifiers(
  chemistryScore: number,
  synergyScore: number,
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG
): {
  chemistryModPct: number;
  synergyModPct: number;
  combinedModPct: number;
  passingAndMovementMultiplier: number;
  tacticalAndStructureMultiplier: number;
} {
  const clampedChem = Math.max(0, Math.min(100, chemistryScore));
  const clampedSyn = Math.max(0, Math.min(100, synergyScore));

  // Neutral reference point is 58. Above 58 yields positive bonus; below 58 yields slight penalty.
  const chemNormalized = (clampedChem - 58) / 28;
  const synNormalized = (clampedSyn - 58) / 28;

  const rawChemPct = Math.tanh(chemNormalized) * config.maxChemistryMatchBonusPct;
  const rawSynPct = Math.tanh(synNormalized) * config.maxSynergyMatchBonusPct;

  const chemistryModPct = Math.max(
    -config.maxChemistryMatchBonusPct,
    Math.min(config.maxChemistryMatchBonusPct, Math.round(rawChemPct * 100) / 100)
  );
  const synergyModPct = Math.max(
    -config.maxSynergyMatchBonusPct,
    Math.min(config.maxSynergyMatchBonusPct, Math.round(rawSynPct * 100) / 100)
  );

  const combinedRaw = chemistryModPct + synergyModPct;
  const combinedModPct = Math.max(
    -config.maxCombinedChemSynergyBonusPct,
    Math.min(
      config.maxCombinedChemSynergyBonusPct,
      Math.round(combinedRaw * 100) / 100
    )
  );

  return {
    chemistryModPct,
    synergyModPct,
    combinedModPct,
    passingAndMovementMultiplier: 1 + chemistryModPct / 100,
    tacticalAndStructureMultiplier: 1 + synergyModPct / 100,
  };
}

/**
 * Validates and clamps administrator configuration updates, producing both the sanitized
 * configuration and a structured audit log entry.
 */
export function validateAndApplyBalanceConfigUpdate(
  current: BalanceConfiguration,
  patch: Partial<BalanceConfiguration>,
  adminUser = 'Administrator',
  nowIso = new Date().toISOString()
): { updatedConfig: BalanceConfiguration; auditEntry: AdminAuditLogEntry } {
  const clamp = (val: number, min: number, max: number) =>
    Number.isFinite(val) ? Math.max(min, Math.min(max, val)) : min;

  const next: BalanceConfiguration = {
    ...current,
    maxChemistryMatchBonusPct: clamp(
      patch.maxChemistryMatchBonusPct ?? current.maxChemistryMatchBonusPct,
      0.5,
      8.0
    ),
    maxSynergyMatchBonusPct: clamp(
      patch.maxSynergyMatchBonusPct ?? current.maxSynergyMatchBonusPct,
      0.5,
      8.0
    ),
    maxCombinedChemSynergyBonusPct: clamp(
      patch.maxCombinedChemSynergyBonusPct ?? current.maxCombinedChemSynergyBonusPct,
      1.0,
      12.0
    ),
    chemistryGainPerMatchTogether: clamp(
      patch.chemistryGainPerMatchTogether ?? current.chemistryGainPerMatchTogether,
      0.2,
      4.0
    ),
    chemistryGainPerTrainingWeek: clamp(
      patch.chemistryGainPerTrainingWeek ?? current.chemistryGainPerTrainingWeek,
      0.1,
      2.5
    ),
    chemistryDecayPerInactiveWeek: clamp(
      patch.chemistryDecayPerInactiveWeek ?? current.chemistryDecayPerInactiveWeek,
      0.0,
      2.0
    ),
    transferAdaptationWeeks: Math.round(
      clamp(patch.transferAdaptationWeeks ?? current.transferAdaptationWeeks, 1, 14)
    ),
    synergyRoleWeight: clamp(patch.synergyRoleWeight ?? current.synergyRoleWeight, 0.2, 2.5),
    synergyTacticsWeight: clamp(
      patch.synergyTacticsWeight ?? current.synergyTacticsWeight,
      0.2,
      2.5
    ),
    synergyFormationWeight: clamp(
      patch.synergyFormationWeight ?? current.synergyFormationWeight,
      0.2,
      2.5
    ),
    maxPrimaryAttributeCap: Math.round(
      clamp(patch.maxPrimaryAttributeCap ?? current.maxPrimaryAttributeCap, 90, 100)
    ),
    efficiencyTier40_59: clamp(patch.efficiencyTier40_59 ?? current.efficiencyTier40_59, 0.1, 1.0),
    efficiencyTier60_69: clamp(patch.efficiencyTier60_69 ?? current.efficiencyTier60_69, 0.1, 1.0),
    efficiencyTier70_79: clamp(patch.efficiencyTier70_79 ?? current.efficiencyTier70_79, 0.05, 1.0),
    efficiencyTier80_89: clamp(patch.efficiencyTier80_89 ?? current.efficiencyTier80_89, 0.05, 1.0),
    efficiencyTier90_94: clamp(patch.efficiencyTier90_94 ?? current.efficiencyTier90_94, 0.02, 0.8),
    efficiencyTier95_99: clamp(patch.efficiencyTier95_99 ?? current.efficiencyTier95_99, 0.01, 0.5),
    maxActiveBoostersPerPlayer: Math.round(
      clamp(patch.maxActiveBoostersPerPlayer ?? current.maxActiveBoostersPerPlayer, 1, 3)
    ),
    boosterGlobalStrengthMultiplier: clamp(
      patch.boosterGlobalStrengthMultiplier ?? current.boosterGlobalStrengthMultiplier,
      0.25,
      2.0
    ),
    boosterDefaultCooldownWeeks: Math.round(
      clamp(patch.boosterDefaultCooldownWeeks ?? current.boosterDefaultCooldownWeeks, 0, 8)
    ),
    maxRewardedAdsPerDay: Math.round(
      clamp(patch.maxRewardedAdsPerDay ?? current.maxRewardedAdsPerDay, 0, 15)
    ),
    dailyLoginSoftCoins: Math.round(
      clamp(patch.dailyLoginSoftCoins ?? current.dailyLoginSoftCoins, 50, 2000)
    ),
    starterPackPriceUsd: clamp(
      patch.starterPackPriceUsd ?? current.starterPackPriceUsd,
      0.99,
      29.99
    ),
    starterPackPremiumCoins: Math.round(
      clamp(patch.starterPackPremiumCoins ?? current.starterPackPremiumCoins, 50, 2000)
    ),
    starterPackTrainingBoostersQty: Math.round(
      clamp(
        patch.starterPackTrainingBoostersQty ?? current.starterPackTrainingBoostersQty,
        1,
        20
      )
    ),
    starterPackRecoveryPacksQty: Math.round(
      clamp(patch.starterPackRecoveryPacksQty ?? current.starterPackRecoveryPacksQty, 1, 20)
    ),
    starterPackMoraleBoostersQty: Math.round(
      clamp(patch.starterPackMoraleBoostersQty ?? current.starterPackMoraleBoostersQty, 1, 20)
    ),
    starterPackRareChemistryQty: Math.round(
      clamp(patch.starterPackRareChemistryQty ?? current.starterPackRareChemistryQty, 1, 10)
    ),
    starterPackRareSynergyQty: Math.round(
      clamp(patch.starterPackRareSynergyQty ?? current.starterPackRareSynergyQty, 1, 10)
    ),
    starterPackOnboardingWeeksLimit: Math.round(
      clamp(
        patch.starterPackOnboardingWeeksLimit ?? current.starterPackOnboardingWeeksLimit,
        1,
        66
      )
    ),
    storePurchasesEnabled:
      patch.storePurchasesEnabled !== undefined
        ? Boolean(patch.storePurchasesEnabled)
        : current.storePurchasesEnabled,
    version: current.version + 1,
    updatedAtIso: nowIso,
    updatedBy: adminUser,
  };

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(next) as (keyof BalanceConfiguration)[]) {
    if (key === 'version' || key === 'updatedAtIso' || key === 'updatedBy') continue;
    if (current[key] !== next[key]) {
      changes[key] = { from: current[key], to: next[key] };
    }
  }

  const changedKeys = Object.keys(changes);
  const summary =
    changedKeys.length > 0
      ? `Updated ${changedKeys.length} parameter(s): ${changedKeys.join(', ')}`
      : 'Verified configuration (no parameter delta)';

  return {
    updatedConfig: next,
    auditEntry: {
      id: `audit-v${next.version}-${Date.now()}`,
      timestampIso: nowIso,
      adminUser,
      summary,
      changes,
    },
  };
}
