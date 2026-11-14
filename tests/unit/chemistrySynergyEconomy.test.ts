import { describe, expect, it } from 'vitest';
import {
  computeNonlinearMatchModifiers,
  DEFAULT_BALANCE_CONFIG,
  getAttributeTrainingEfficiency,
  getChemistryLevelLabel,
  getSynergyLevelLabel,
  validateAndApplyBalanceConfigUpdate,
} from '@/engine/balanceConfig';
import { runAutomatedBalanceTestSuite } from '@/engine/balanceTester';
import {
  activateBoosterItem,
  applyVerifiedRewardedAdGrant,
  applyVerifiedStarterPackTransaction,
  applyVerifiedStorePurchase,
  BOOSTER_CATALOG,
  claimDailyLoginReward,
  ensureEconomyState,
  grantInventoryItems,
  tickWeeklyBoostersAndExpirations,
} from '@/engine/boosterEconomy';
import {
  evaluateTeamChemistry,
  makePlayerPairKey,
  processWeeklyChemistryDevelopmentAndDecay,
  updatePairChemistryAfterMatch,
} from '@/engine/chemistryEngine';
import { generateInitialGameState } from '@/engine/generator';
import { simulateMatch } from '@/engine/matchEngine';
import { evaluateTeamSynergy } from '@/engine/synergyEngine';
import { executePlayerTransfer } from '@/engine/transfers';
import { ManagerProfile } from '@/engine/types';

const TEST_MANAGER: ManagerProfile = {
  name: 'Elena Tactician',
  nationality: 'Spain',
  tacticalStyle: 'tikiTaka',
  difficulty: 'standard',
  startingChallenge: 'none',
  clubId: 'club-emerald',
};

describe('Master Directive: Chemistry, Synergy, Booster Economy, Monetization & Game Balancing', () => {
  it('1. Calculates Chemistry and Synergy independently with canonical 6-tier labels', () => {
    expect(getChemistryLevelLabel(12)).toBe('Unfamiliar');
    expect(getChemistryLevelLabel(32)).toBe('Developing');
    expect(getChemistryLevelLabel(50)).toBe('Familiar');
    expect(getChemistryLevelLabel(72)).toBe('Strong Understanding');
    expect(getChemistryLevelLabel(88)).toBe('Excellent Understanding');
    expect(getChemistryLevelLabel(97)).toBe('Exceptional Understanding');

    expect(getSynergyLevelLabel(15)).toBe('Poor Compatibility');
    expect(getSynergyLevelLabel(30)).toBe('Limited Compatibility');
    expect(getSynergyLevelLabel(52)).toBe('Average Compatibility');
    expect(getSynergyLevelLabel(68)).toBe('Good Compatibility');
    expect(getSynergyLevelLabel(85)).toBe('Excellent Compatibility');
    expect(getSynergyLevelLabel(96)).toBe('Exceptional Compatibility');

    const state = generateInitialGameState(444555, TEST_MANAGER);
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    const clubPlayers = state.players.filter((p) => p.clubId === club.id && !p.isYouth);
    const economy = ensureEconomyState(state);

    const chem = evaluateTeamChemistry(
      club,
      clubPlayers,
      economy.pairChemistry,
      state.currentSeason,
      state.currentWeek,
      economy.activeBoosters
    );
    const syn = evaluateTeamSynergy(club, clubPlayers, economy.activeBoosters);

    expect(chem.overallChemistry).toBeGreaterThanOrEqual(20);
    expect(chem.overallChemistry).toBeLessThanOrEqual(100);
    expect(chem.individualPlayers.length).toBe(11);
    expect(chem.partnerships.length).toBeGreaterThan(10);

    expect(syn.overallSynergy).toBeGreaterThanOrEqual(20);
    expect(syn.overallSynergy).toBeLessThanOrEqual(100);
    expect(syn.defensiveSynergy).toBeGreaterThan(0);
    expect(syn.midfieldSynergy).toBeGreaterThan(0);
    expect(syn.attackingSynergy).toBeGreaterThan(0);

    // Changing formation or roles dynamically changes Synergy while interpersonal pair familiarity remains distinct
    const swappedRolePlayers = clubPlayers.map((p, idx) =>
      idx < 5 ? { ...p, tacticalRole: 'Poacher' as const } : p
    );
    const synAfterRoleMismatch = evaluateTeamSynergy(
      {
        ...club,
        tactics: {
          ...club.tactics,
          formation: '5-3-2',
          pressing: 'gegenpress',
          defensiveLine: 'deep',
        },
      },
      swappedRolePlayers,
      []
    );
    expect(synAfterRoleMismatch.overallSynergy).not.toBe(syn.overallSynergy);
  });

  it('2. Develops Chemistry gradually through matches, applies inactivity decay, protects injured players, and introduces transfer adaptation', () => {
    const state = generateInitialGameState(777888, TEST_MANAGER);
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    const economy = ensureEconomyState(state);

    const p1Id = club.startingXI[0];
    const p2Id = club.startingXI[1];
    const key = makePlayerPairKey(p1Id, p2Id);
    const beforePair = economy.pairChemistry[key];
    const beforeMatches = beforePair?.matchesTogether ?? 0;

    // Single match together should increase familiarity gradually (never excessively)
    const afterMatchMap = updatePairChemistryAfterMatch(
      economy.pairChemistry,
      club,
      club.startingXI,
      [],
      state.currentSeason,
      state.currentWeek
    );
    const afterOneMatch = afterMatchMap[key];
    expect(afterOneMatch.matchesTogether).toBe(beforeMatches + 1);
    expect(
      afterOneMatch.dynamicFamiliarityBonus - (beforePair?.dynamicFamiliarityBonus ?? 0)
    ).toBeLessThan(1.8);

    // Extended period without playing together (6 weeks) triggers gradual decay unless injured
    const inactivePairMap = {
      ...afterMatchMap,
      [key]: {
        ...afterOneMatch,
        weeksSinceLastPlayedTogether: 6,
        dynamicFamiliarityBonus: 10,
      },
    };
    const nonPlayingClub = {
      ...club,
      startingXI: club.startingXI.filter((id) => id !== p1Id && id !== p2Id),
    };
    const decayedMap = processWeeklyChemistryDevelopmentAndDecay(
      inactivePairMap,
      nonPlayingClub,
      state.players.filter((p) => p.clubId === club.id),
      state.currentSeason,
      state.currentWeek + 1
    );
    expect(decayedMap[key].dynamicFamiliarityBonus).toBeLessThan(10);

    // Injury grace protection: if player is injured, established relationship does not decay
    const injuredPlayers = state.players
      .filter((p) => p.clubId === club.id)
      .map((p) => (p.id === p1Id ? { ...p, injuryWeeks: 3 } : p));
    const protectedMap = processWeeklyChemistryDevelopmentAndDecay(
      inactivePairMap,
      nonPlayingClub,
      injuredPlayers,
      state.currentSeason,
      state.currentWeek + 1
    );
    expect(protectedMap[key].dynamicFamiliarityBonus).toBe(10);

    // Transfers introduce realistic chemistry adaptation periods
    const foreignPlayer = state.players.find((p) => p.clubId !== club.id && !p.isYouth)!;
    const afterTransfer = executePlayerTransfer(
      state,
      foreignPlayer.id,
      club.id,
      1000000,
      15000,
      false
    );
    const transferredPlayer = afterTransfer.players.find((p) => p.id === foreignPlayer.id)!;
    expect(transferredPlayer.joinedClubSeason).toBe(state.currentSeason);
    expect(transferredPlayer.joinedClubWeek).toBe(state.currentWeek);
  });

  it('3. Enforces controlled nonlinear Match Engine modifiers (Chemistry <= 3%, Synergy <= 4%, Combined <= 7%)', () => {
    const maxMod = computeNonlinearMatchModifiers(100, 100, DEFAULT_BALANCE_CONFIG);
    expect(maxMod.chemistryModPct).toBeLessThanOrEqual(3.0);
    expect(maxMod.synergyModPct).toBeLessThanOrEqual(4.0);
    expect(maxMod.combinedModPct).toBeLessThanOrEqual(7.0);

    const minMod = computeNonlinearMatchModifiers(0, 0, DEFAULT_BALANCE_CONFIG);
    expect(minMod.combinedModPct).toBeGreaterThanOrEqual(-7.0);

    // Neutral baseline (58, 58) yields 0%
    const neutralMod = computeNonlinearMatchModifiers(58, 58, DEFAULT_BALANCE_CONFIG);
    expect(neutralMod.combinedModPct).toBe(0);

    // Simulate match with high vs low cohesion and verify match executes cleanly
    const state = generateInitialGameState(123987, TEST_MANAGER);
    const homeClub = state.clubs[0];
    const awayClub = state.clubs[1];
    const res = simulateMatch(
      {
        fixtureId: 'test-chem-syn-match',
        homeClub,
        awayClub,
        homePlayers: state.players.filter((p) => p.clubId === homeClub.id),
        awayPlayers: state.players.filter((p) => p.clubId === awayClub.id),
        homeChemistryScore: 94,
        awayChemistryScore: 42,
        homeSynergyScore: 92,
        awaySynergyScore: 45,
      },
      998877
    );
    expect(res.events.length).toBeGreaterThan(20);
  });

  it('4. Enforces Booster Anti-Overbuff rules: max 2 active per player, no identical stacking, priority conflict replacement, diminishing returns, and expiration cleanup', () => {
    let state = generateInitialGameState(555666, TEST_MANAGER);
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    const targetPlayer = state.players.find((p) => p.clubId === club.id && !p.isYouth)!;

    // Grant test boosters across all categories and rarities
    let economy = ensureEconomyState(state);
    economy = grantInventoryItems(
      economy,
      [
        { itemId: 'bst-train-xp-common', quantity: 3 },
        { itemId: 'bst-train-tech-rare', quantity: 2 },
        { itemId: 'bst-train-phys-epic', quantity: 2 },
        { itemId: 'bst-chem-train-common', quantity: 2 },
      ],
      'achievement',
      state.currentSeason,
      state.currentWeek
    );
    state = { ...state, economy };

    // 1. Activate first booster on targetPlayer
    const act1 = activateBoosterItem(state, 'bst-train-xp-common', targetPlayer.id);
    expect(act1.success).toBe(true);
    state = act1.updatedState;

    // 2. Identical booster cannot stack (and respects cooldown)
    const stackAttempt = activateBoosterItem(state, 'bst-train-xp-common', targetPlayer.id);
    expect(stackAttempt.success).toBe(false);

    // 3. Activate second distinct booster on targetPlayer (`bst-train-tech-rare`)
    const act2 = activateBoosterItem(state, 'bst-train-tech-rare', targetPlayer.id);
    expect(act2.success).toBe(true);
    state = act2.updatedState;

    // 4. Attempting a 3rd distinct player booster on same player is blocked by max 2 limit
    const act3Blocked = activateBoosterItem(state, 'bst-chem-train-common', targetPlayer.id);
    expect(act3Blocked.success).toBe(false);
    expect(act3Blocked.message).toContain('maximum 2 active boosters');

    // 5. Diminishing returns curve check
    expect(getAttributeTrainingEfficiency(52)).toBe(1.0);
    expect(getAttributeTrainingEfficiency(65)).toBe(0.85);
    expect(getAttributeTrainingEfficiency(75)).toBe(0.65);
    expect(getAttributeTrainingEfficiency(85)).toBe(0.4);
    expect(getAttributeTrainingEfficiency(92)).toBe(0.2);
    expect(getAttributeTrainingEfficiency(97)).toBe(0.1);
    expect(getAttributeTrainingEfficiency(100)).toBe(0);

    // 6. Temporary boosters expire cleanly after duration ticks
    expect(state.economy!.activeBoosters.length).toBe(2);
    state = tickWeeklyBoostersAndExpirations(state);
    state = tickWeeklyBoostersAndExpirations(state);
    expect(state.economy!.activeBoosters.length).toBe(0);
  });

  it('5. Enforces Rewarded Ad verification, daily limits, and duplicate nonce protection', () => {
    let state = generateInitialGameState(333222, TEST_MANAGER);

    // Reject unverified signature
    const unverified = applyVerifiedRewardedAdGrant(
      state,
      'nonce-1',
      'recovery',
      'fake_sig_123'
    );
    expect(unverified.success).toBe(false);

    // Grant verified ad
    const valid1 = applyVerifiedRewardedAdGrant(
      state,
      'nonce-valid-1',
      'recovery',
      'verified_ad_hmac123'
    );
    expect(valid1.success).toBe(true);
    state = valid1.updatedState;

    // Reject duplicate nonce replay
    const replay = applyVerifiedRewardedAdGrant(
      state,
      'nonce-valid-1',
      'recovery',
      'verified_ad_hmac123'
    );
    expect(replay.success).toBe(false);
    expect(replay.message).toContain('Duplicate reward claim blocked');

    // Enforce daily cap (default 5 per day)
    for (let i = 2; i <= 5; i++) {
      const r = applyVerifiedRewardedAdGrant(
        state,
        `nonce-valid-${i}`,
        'soft_coins',
        `verified_ad_hmac_${i}`
      );
      expect(r.success).toBe(true);
      state = r.updatedState;
    }

    const overCap = applyVerifiedRewardedAdGrant(
      state,
      'nonce-valid-6',
      'training',
      'verified_ad_hmac_6'
    );
    expect(overCap.success).toBe(false);
    expect(overCap.message).toContain('Daily rewarded advertisement limit reached');
  });

  it('6. Enforces Exclusive One-Time Starter Pack rules: cancelled/failed preserves eligibility, verified grants all 7 items + locks 1x per account, and duplicate transactions are blocked', () => {
    let state = generateInitialGameState(999000, TEST_MANAGER);
    const initialPrem = ensureEconomyState(state).premiumCurrency;

    // 1. Cancelled purchase does not consume eligibility
    const cancelled = applyVerifiedStarterPackTransaction(state, {
      transactionId: 'tx-cancel-1',
      status: 'cancelled',
      verificationSignature: 'unverified_cancelled',
    });
    expect(cancelled.success).toBe(false);
    state = cancelled.updatedState;
    expect(state.economy!.starterPack.owned).toBe(false);

    // 2. Failed payment does not consume eligibility
    const failed = applyVerifiedStarterPackTransaction(state, {
      transactionId: 'tx-fail-1',
      status: 'failed',
      verificationSignature: 'unverified_failed',
    });
    expect(failed.success).toBe(false);
    state = failed.updatedState;
    expect(state.economy!.starterPack.owned).toBe(false);
    expect(state.economy!.starterPack.failedAttemptsCount).toBe(2);

    // 3. Verified Starter Pack purchase unlocks all items & locks account entitlement
    const verified = applyVerifiedStarterPackTransaction(state, {
      transactionId: 'tx-sp-verified-100',
      status: 'verified',
      verificationSignature: 'srv_sig_valid_starter_pack_hmac',
    });
    expect(verified.success).toBe(true);
    state = verified.updatedState;
    expect(state.economy!.starterPack.owned).toBe(true);
    expect(state.economy!.starterPack.cosmeticUnlocked).toBe(true);
    expect(state.economy!.premiumCurrency).toBe(initialPrem + 300);

    // Verify Founder's Golden Crest cosmetic is in inventory
    const crest = state.economy!.inventory.find(
      (i) => i.itemId === 'cosmetic-founders-gold-crest'
    );
    expect(crest?.quantity).toBe(1);

    // 4. Second purchase attempt on same account is permanently blocked
    const secondAttempt = applyVerifiedStarterPackTransaction(state, {
      transactionId: 'tx-sp-verified-200',
      status: 'verified',
      verificationSignature: 'srv_sig_second_hmac',
    });
    expect(secondAttempt.success).toBe(false);
    expect(secondAttempt.message).toContain('already OWNED');

    // 5. Restoration succeeds idempotently without duplicating items
    const restored = applyVerifiedStarterPackTransaction(state, {
      transactionId: 'tx-sp-restore-300',
      status: 'restored',
      verificationSignature: 'srv_sig_restore_hmac',
    });
    expect(restored.success).toBe(true);
    expect(restored.updatedState.economy!.premiumCurrency).toBe(initialPrem + 300);
  });

  it('7. Prevents duplicate Store transactions, validates Admin Balance Configuration bounds, and passes the Automated Balance Test Suite', () => {
    let state = generateInitialGameState(888111, TEST_MANAGER);

    // Claim daily login
    const loginRes = claimDailyLoginReward(state);
    expect(loginRes.success).toBe(true);
    state = loginRes.updatedState;

    // Verified store purchase
    const storeBuy = applyVerifiedStorePurchase(state, {
      transactionId: 'tx-store-unique-1',
      offerId: 'bst-rec-pack-common',
      offerName: 'Cryo & Physio Recovery Pack',
      currencyType: 'soft',
      costAmount: 300,
      priceDisplay: '300 Club Coins',
      verificationSignature: 'srv_sig_store_1',
      itemsGranted: [{ itemId: 'bst-rec-pack-common', quantity: 1 }],
    });
    expect(storeBuy.success).toBe(true);
    state = storeBuy.updatedState;

    // Duplicate transaction ID is rejected
    const dupBuy = applyVerifiedStorePurchase(state, {
      transactionId: 'tx-store-unique-1',
      offerId: 'bst-rec-pack-common',
      offerName: 'Cryo & Physio Recovery Pack',
      currencyType: 'soft',
      costAmount: 300,
      priceDisplay: '300 Club Coins',
      verificationSignature: 'srv_sig_store_1',
      itemsGranted: [{ itemId: 'bst-rec-pack-common', quantity: 1 }],
    });
    expect(dupBuy.success).toBe(false);

    // Admin balance configuration validation & audit log
    const adminUpdate = validateAndApplyBalanceConfigUpdate(
      DEFAULT_BALANCE_CONFIG,
      {
        maxChemistryMatchBonusPct: 3.5,
        maxSynergyMatchBonusPct: 4.5,
        maxCombinedChemSynergyBonusPct: 7.5,
      },
      'unit-test-admin'
    );
    expect(adminUpdate.updatedConfig.maxChemistryMatchBonusPct).toBe(3.5);
    expect(Object.keys(adminUpdate.auditEntry.changes).length).toBe(3);

    // Automated Balance Test Suite (batch simulation across all 5 scenarios + 7 formations)
    const report = runAutomatedBalanceTestSuite(DEFAULT_BALANCE_CONFIG, 30, 20261114);
    expect(report.scenarios.length).toBe(5);
    expect(report.formationMatrix.length).toBe(7);
    expect(report.antiExploitChecks.every((c) => c.passed)).toBe(true);
    expect(BOOSTER_CATALOG.length).toBeGreaterThanOrEqual(17);
  });
});
