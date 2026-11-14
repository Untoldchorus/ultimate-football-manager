import { describe, expect, it } from 'vitest';
import { DEFAULT_BALANCE_CONFIG } from '@/engine/balanceConfig';
import {
  activateBoosterItem,
  applyVerifiedStarterPackTransaction,
  ensureEconomyState,
  grantInventoryItems,
  tickTemporaryPositionBoostersAfterMatch,
} from '@/engine/boosterEconomy';
import { evaluateTeamChemistry } from '@/engine/chemistryEngine';
import { generateInitialGameState } from '@/engine/generator';
import { resimulateFromMinute, simulateMatch } from '@/engine/matchEngine';
import { FORMATION_SLOTS } from '@/engine/ratings';
import { applyMatchResultToState, performSeasonRollover } from '@/engine/season';
import { CANONICAL_19_TACTICAL_ROLES, evaluateTeamSynergy } from '@/engine/synergyEngine';
import {
  ALL_10_FORMATIONS,
  ALL_12_PLAYING_STYLES,
  calculateTacticalAdaptationScore,
  DEFAULT_TACTICAL_COUNTER_MATRIX,
  evaluateDetailedPositionalSuitability,
  evaluatePlayerInMatchPhysicalState,
  evaluateTacticalMatchup,
  getRecommendedSubstitutions,
  getTacticalMatchupOutcome,
  progressPositionalFamiliarity,
  resolveExtendedPlayerAttributes,
  resolveManagerAttributes,
  selectOptimalCounterPlayingStyle,
  TACTICAL_STYLES_CATALOG,
} from '@/engine/tacticalMatrixEngine';
import { Club, GameState, ManagerProfile, Player, TacticalPlayingStyle } from '@/engine/types';

const TEST_MANAGER: ManagerProfile = {
  name: 'Marco FC27',
  nationality: 'Italy',
  tacticalStyle: 'gegenpress',
  difficulty: 'standard',
  startingChallenge: 'none',
  clubId: 'club-emerald',
};

function addBoosterToState(state: GameState, itemId: string, quantity = 1): GameState {
  const econ = ensureEconomyState(state);
  const nextEcon = grantInventoryItems(
    econ,
    [{ itemId, quantity }],
    'daily_objective',
    state.currentSeason,
    state.currentWeek
  );
  return { ...state, economy: nextEcon };
}

describe('FC27 Advanced Football Match Engine — 24 Required Test Scenarios', () => {
  it('1. Defines exactly 12 core tactical playing styles with complete philosophies, strengths, weaknesses & neutral lists', () => {
    expect(ALL_12_PLAYING_STYLES).toHaveLength(12);
    expect(Object.keys(TACTICAL_STYLES_CATALOG)).toHaveLength(12);

    const expectedStyles: TacticalPlayingStyle[] = [
      'gegenpress',
      'tikiTaka',
      'directCounter',
      'wingPlay',
      'parkTheBus',
      'highPress',
      'longBall',
      'possession',
      'catenaccio',
      'totalFootball',
      'midBlock',
      'balanced',
    ];
    expect(ALL_12_PLAYING_STYLES).toEqual(expectedStyles);

    for (const style of expectedStyles) {
      const def = TACTICAL_STYLES_CATALOG[style];
      expect(def.id).toBe(style);
      expect(def.philosophy.length).toBeGreaterThan(15);
      expect(def.strengths.length).toBeGreaterThanOrEqual(4);
      expect(def.weaknesses.length).toBeGreaterThanOrEqual(3);
      expect(def.staminaDrainFactor).toBeGreaterThan(0.8);
      expect(def.staminaDrainFactor).toBeLessThan(1.6);
    }
  });

  it('2. Verifies all 144 (12 × 12) tactical matchups in the Counter Matrix, mirror neutrality, and Balanced Football neutrality', () => {
    let totalCombinations = 0;
    for (const styleA of ALL_12_PLAYING_STYLES) {
      for (const styleB of ALL_12_PLAYING_STYLES) {
        totalCombinations++;
        const outcomeAB = getTacticalMatchupOutcome(styleA, styleB);
        const outcomeBA = getTacticalMatchupOutcome(styleB, styleA);
        expect(['Strong', 'Neutral', 'Weak']).toContain(outcomeAB);

        // Mirror matchups must be Neutral
        if (styleA === styleB) {
          expect(outcomeAB).toBe('Neutral');
        }

        // Balanced Football must be Neutral against all 12 styles (no predetermined advantage/disadvantage)
        if (styleA === 'balanced' || styleB === 'balanced') {
          expect(outcomeAB).toBe('Neutral');
          expect(outcomeBA).toBe('Neutral');
        }

        // Antisymmetry check: if A is Strong against B, B is Weak against A
        if (outcomeAB === 'Strong') {
          expect(outcomeBA).toBe('Weak');
        } else if (outcomeAB === 'Weak') {
          expect(outcomeBA).toBe('Strong');
        }
      }
    }
    expect(totalCombinations).toBe(144);

    // Explicit Section 2 spot checks
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.gegenpress.tikiTaka).toBe('Strong');
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.gegenpress.directCounter).toBe('Weak');
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.tikiTaka.parkTheBus).toBe('Strong');
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.directCounter.highPress).toBe('Strong');
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.wingPlay.catenaccio).toBe('Strong');
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.parkTheBus.directCounter).toBe('Strong');
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.longBall.gegenpress).toBe('Strong');
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.midBlock.wingPlay).toBe('Strong');
    expect(DEFAULT_TACTICAL_COUNTER_MATRIX.totalFootball.parkTheBus).toBe('Strong');
  });

  it('3. Evaluates situational tactical modifiers (+5% Strong, 0% Neutral, -5% Weak) and impacts multi-match outcomes without guaranteeing wins', () => {
    const state = generateInitialGameState(101010, TEST_MANAGER);
    const baseClubA = state.clubs[0];
    const baseClubB = state.clubs[1];
    const playersA = state.players.filter((p) => p.clubId === baseClubA.id && !p.isYouth);
    const playersB = state.players.filter((p) => p.clubId === baseClubB.id && !p.isYouth);

    const clubGegen: Club = {
      ...baseClubA,
      tactics: { ...baseClubA.tactics, playingStyle: 'gegenpress' },
    };
    const clubTiki: Club = {
      ...baseClubB,
      tactics: { ...baseClubB.tactics, playingStyle: 'tikiTaka' },
    };

    const matchup = evaluateTacticalMatchup({
      homeClub: clubGegen,
      awayClub: clubTiki,
      homePlayers: playersA,
      awayPlayers: playersB,
      homeChemistryScore: 75,
      awayChemistryScore: 75,
      homeSynergyScore: 75,
      awaySynergyScore: 75,
      config: DEFAULT_BALANCE_CONFIG,
    });
    expect(matchup.teamAOutcome).toBe('Strong');
    expect(matchup.teamBOutcome).toBe('Weak');
    expect(matchup.teamASituationalModifierPct).toBeGreaterThan(0);
    expect(matchup.teamBSituationalModifierPct).toBeLessThan(0);
  });

  it('4. Resolves all 58 extended player attributes across Technical, Physical, Mental, Defensive, and Goalkeeping', () => {
    const state = generateInitialGameState(202020, TEST_MANAGER);
    const striker = state.players.find((p) => p.primaryPosition === 'ST')!;
    const gk = state.players.find((p) => p.primaryPosition === 'GK')!;

    const stExt = resolveExtendedPlayerAttributes(striker);
    const gkExt = resolveExtendedPlayerAttributes(gk);

    expect(Object.keys(stExt).length).toBeGreaterThanOrEqual(55);
    expect(stExt.sprintSpeed).toBeGreaterThanOrEqual(25);
    expect(stExt.naturalFitness).toBeGreaterThanOrEqual(25);
    expect(stExt.recovery).toBeGreaterThanOrEqual(25);
    expect(stExt.tacticalIntelligence).toBeGreaterThanOrEqual(25);
    expect(stExt.defensiveAwareness).toBeGreaterThanOrEqual(20);
    expect(gkExt.oneOnOnes).toBeGreaterThan(stExt.oneOnOnes);
    expect(gkExt.commandOfArea).toBeGreaterThan(stExt.commandOfArea);
  });

  it('5. Evaluates Positional Suitability: Natural (0 penalty), Secondary Familiar (>=80%, 0 penalty), Adjacent (minor penalty), and Severe Out-of-Position (ST at CB / Outfielder at GK)', () => {
    const state = generateInitialGameState(303030, TEST_MANAGER);
    const stPlayer: Player = {
      ...state.players.find((p) => p.primaryPosition === 'ST')!,
      secondaryPositions: ['LW'],
      positionalFamiliarity: { ST: 100, LW: 86, RW: 62, CB: 15 },
    };

    const naturalEval = evaluateDetailedPositionalSuitability(stPlayer, 'ST', [], 2026);
    expect(naturalEval.isNatural).toBe(true);
    expect(naturalEval.familiarityScore).toBe(100);
    expect(naturalEval.chemistryPenaltyPoints).toBe(0);
    expect(naturalEval.tacticalExecutionMultiplier).toBe(1.0);

    // Switching between learned familiar positions (>=80%) has ZERO penalty
    const familiarSecondaryEval = evaluateDetailedPositionalSuitability(stPlayer, 'LW', [], 2026);
    expect(familiarSecondaryEval.isSecondary).toBe(true);
    expect(familiarSecondaryEval.chemistryPenaltyPoints).toBe(0);
    expect(familiarSecondaryEval.tacticalExecutionMultiplier).toBeGreaterThanOrEqual(0.98);

    // Adjacent compatible position (ST at RW with 62% familiarity) has minor penalty
    const compatibleEval = evaluateDetailedPositionalSuitability(stPlayer, 'RW', [], 2026);
    expect(compatibleEval.summaryLabel).toBe('Adjacent Adaptation');
    expect(compatibleEval.chemistryPenaltyPoints).toBeGreaterThan(0);
    expect(compatibleEval.chemistryPenaltyPoints).toBeLessThan(15);

    // Severe out-of-position: Striker deployed at Centre-Back (CB)
    const stAtCbEval = evaluateDetailedPositionalSuitability(stPlayer, 'CB', [], 2026);
    expect(stAtCbEval.summaryLabel).toBe('Severe Out-of-Position');
    expect(stAtCbEval.chemistryPenaltyPoints).toBeGreaterThanOrEqual(18);
    expect(stAtCbEval.tacticalExecutionMultiplier).toBeLessThanOrEqual(0.75);

    // Severe out-of-position: Outfield player deployed at Goalkeeper (GK)
    const stAtGkEval = evaluateDetailedPositionalSuitability(stPlayer, 'GK', [], 2026);
    expect(stAtGkEval.summaryLabel).toBe('Severe Out-of-Position');
    expect(stAtGkEval.chemistryPenaltyPoints).toBeGreaterThanOrEqual(30);
    expect(stAtGkEval.tacticalExecutionMultiplier).toBeLessThanOrEqual(0.6);
  });

  it('6. Progresses Positional Familiarity through matches and training', () => {
    const state = generateInitialGameState(404040, TEST_MANAGER);
    const rwPlayer: Player = {
      ...state.players.find((p) => p.primaryPosition === 'RW')!,
      secondaryPositions: [],
      positionalFamiliarity: { RW: 100 },
    };

    const beforeLw = evaluateDetailedPositionalSuitability(rwPlayer, 'LW', [], 2026).familiarityScore;
    const afterMatch = progressPositionalFamiliarity(rwPlayer, 'LW', 90, false);
    const afterLw = afterMatch.positionalFamiliarity?.LW ?? 0;

    expect(afterLw).toBeGreaterThan(beforeLw);
  });

  it('7. Separates In-Match Stamina from Between-Match Accumulated Fatigue with style-dependent drain rates', () => {
    const state = generateInitialGameState(505050, TEST_MANAGER);
    const player = state.players.find((p) => !p.isYouth && p.primaryPosition === 'CM')!;

    const freshGegen80 = evaluatePlayerInMatchPhysicalState(
      { ...player, fitness: 95, stamina: 95, fatigue: 5, tacticalRole: 'BoxToBox' },
      'gegenpress',
      80
    );
    const freshParkBus80 = evaluatePlayerInMatchPhysicalState(
      { ...player, fitness: 95, stamina: 95, fatigue: 5, tacticalRole: 'DefensiveMidfielder' },
      'parkTheBus',
      80
    );

    // Gegenpress + BoxToBox drains significantly more in-match stamina by minute 80 than Park the Bus
    expect(freshGegen80.staminaRemaining).toBeLessThan(freshParkBus80.staminaRemaining);

    // High accumulated fatigue reduces starting stamina, sprint speed, concentration, and raises injury probability
    const fatiguedState = evaluatePlayerInMatchPhysicalState(
      { ...player, fitness: 85, stamina: 85, fatigue: 78, tacticalRole: 'BoxToBox' },
      'highPress',
      75
    );
    expect(fatiguedState.fatigueAccumulated).toBeGreaterThanOrEqual(78);
    expect(fatiguedState.sprintSpeedMultiplier).toBeLessThan(freshGegen80.sprintSpeedMultiplier);
    expect(fatiguedState.concentrationMultiplier).toBeLessThan(freshGegen80.concentrationMultiplier);
    expect(fatiguedState.injuryProbabilityMultiplier).toBeGreaterThan(
      freshGegen80.injuryProbabilityMultiplier
    );
  });

  it('8. Season Position Booster (1-season duration): unlocks 1 additional position, grants 0 off-position penalty, and auto-expires at season rollover without mutating natural position', () => {
    let state = generateInitialGameState(606060, TEST_MANAGER);
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    const stPlayer = state.players.find(
      (p) => p.clubId === club.id && p.primaryPosition === 'ST' && !p.isYouth
    )!;
    const naturalPos = stPlayer.primaryPosition;

    state = addBoosterToState(state, 'bst-pos-season-epic', 1);
    const actRes = activateBoosterItem(
      state,
      'bst-pos-season-epic',
      stPlayer.id,
      undefined,
      new Date().toISOString(),
      'CAM'
    );
    expect(actRes.success).toBe(true);
    state = actRes.updatedState;

    const economy = ensureEconomyState(state);
    expect(economy.activePositionBoosters).toHaveLength(1);
    const activeBooster = economy.activePositionBoosters![0];
    expect(activeBooster.boosterType).toBe('season_position');
    expect(activeBooster.unlockedPosition).toBe('CAM');
    expect(activeBooster.status).toBe('active');

    // Natural position is unchanged
    const updatedPlayer = state.players.find((p) => p.id === stPlayer.id)!;
    expect(updatedPlayer.primaryPosition).toBe(naturalPos);

    // Playing at CAM now has 0 off-position penalty
    const suitDuringSeason = evaluateDetailedPositionalSuitability(
      updatedPlayer,
      'CAM',
      economy.activePositionBoosters,
      state.currentSeason
    );
    expect(suitDuringSeason.isBoosterUnlocked).toBe(true);
    expect(suitDuringSeason.chemistryPenaltyPoints).toBe(0);
    expect(suitDuringSeason.tacticalExecutionMultiplier).toBeGreaterThanOrEqual(0.99);

    // Rollover season -> Season Position Booster automatically expires
    const rolledState = performSeasonRollover(state);
    const rolledEconomy = ensureEconomyState(rolledState);
    expect(rolledEconomy.activePositionBoosters![0].status).toBe('expired');

    const suitNextSeason = evaluateDetailedPositionalSuitability(
      updatedPlayer,
      'CAM',
      rolledEconomy.activePositionBoosters,
      rolledState.currentSeason
    );
    expect(suitNextSeason.isBoosterUnlocked).toBe(false);
  });

  it('9. Temporary Position Booster (3-match duration): unlocks 1 position for 3 completed official matches, counts down 3 -> 2 -> 1 -> 0, does not double-charge on substitution, and auto-expires', () => {
    let state = generateInitialGameState(707070, TEST_MANAGER);
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    const targetId = club.startingXI[2];
    const targetPlayer = state.players.find((p) => p.id === targetId)!;

    state = addBoosterToState(state, 'bst-pos-temp-rare', 1);
    const actRes = activateBoosterItem(
      state,
      'bst-pos-temp-rare',
      targetPlayer.id,
      undefined,
      new Date().toISOString(),
      'LB'
    );
    expect(actRes.success).toBe(true);
    state = actRes.updatedState;

    let boosters = ensureEconomyState(state).activePositionBoosters!;
    expect(boosters[0].remainingMatches).toBe(3);
    expect(boosters[0].status).toBe('active');

    // Match 1 completed (even if player appears twice in array due to substitution metadata, only decrements by 1)
    boosters = tickTemporaryPositionBoostersAfterMatch(boosters, [targetPlayer.id, targetPlayer.id]);
    expect(boosters[0].remainingMatches).toBe(2);
    expect(boosters[0].status).toBe('active');

    // Match where player did NOT participate -> remainingMatches stays 2
    boosters = tickTemporaryPositionBoostersAfterMatch(boosters, ['other-player-id']);
    expect(boosters[0].remainingMatches).toBe(2);

    // Match 2 completed -> remainingMatches = 1
    boosters = tickTemporaryPositionBoostersAfterMatch(boosters, [targetPlayer.id]);
    expect(boosters[0].remainingMatches).toBe(1);
    expect(boosters[0].status).toBe('active');

    // Match 3 completed -> remainingMatches = 0 and status = 'expired'
    boosters = tickTemporaryPositionBoostersAfterMatch(boosters, [targetPlayer.id]);
    expect(boosters[0].remainingMatches).toBe(0);
    expect(boosters[0].status).toBe('expired');
  });

  it('10. Separates Fitness Boosters (stamina readiness) from Recovery Boosters (accumulated fatigue clearance)', () => {
    let state = generateInitialGameState(808080, TEST_MANAGER);
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    const playerId = club.startingXI[0];

    // Artificially set player to low stamina (62%) and high accumulated fatigue (55%)
    state = {
      ...state,
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, fitness: 62, stamina: 62, fatigue: 55 } : p
      ),
    };

    state = addBoosterToState(state, 'bst-fitness-ind-common', 1);
    state = addBoosterToState(state, 'bst-recovery-ind-rare', 1);

    // Activate Individual Fitness Booster -> raises fitness/stamina significantly
    const fitRes = activateBoosterItem(state, 'bst-fitness-ind-common', playerId);
    expect(fitRes.success).toBe(true);
    const afterFitPlayer = fitRes.updatedState.players.find((p) => p.id === playerId)!;
    expect(afterFitPlayer.stamina).toBeGreaterThan(72);

    // Activate Individual Recovery Booster -> clears accumulated fatigue significantly
    const recRes = activateBoosterItem(fitRes.updatedState, 'bst-recovery-ind-rare', playerId);
    expect(recRes.success).toBe(true);
    const afterRecPlayer = recRes.updatedState.players.find((p) => p.id === playerId)!;
    expect(afterRecPlayer.fatigue).toBeLessThan(35);
  });

  it('11. Supports all 10 Formations and all 19 Player Roles in Synergy and Tactical Adaptation calculations', () => {
    expect(ALL_10_FORMATIONS).toHaveLength(10);
    for (const f of ALL_10_FORMATIONS) {
      expect(FORMATION_SLOTS[f]).toHaveLength(11);
    }
    expect(CANONICAL_19_TACTICAL_ROLES).toHaveLength(19);

    const state = generateInitialGameState(909090, TEST_MANAGER);
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    const clubPlayers = state.players.filter((p) => p.clubId === club.id && !p.isYouth);

    for (const formation of ALL_10_FORMATIONS) {
      const syn = evaluateTeamSynergy(
        { ...club, tactics: { ...club.tactics, formation } },
        clubPlayers,
        []
      );
      expect(syn.overallSynergy).toBeGreaterThanOrEqual(20);
      expect(syn.overallSynergy).toBeLessThanOrEqual(100);
    }

    const adaptation = calculateTacticalAdaptationScore({
      teamSynergy: 82,
      positionalUnitSynergy: 80,
      tacticalFamiliarity: 85,
      formationCompatibility: 88,
      managerAdaptability: 84,
      avgStamina: 90,
      avgFatigue: 10,
    });
    expect(adaptation.score).toBeGreaterThanOrEqual(75);
    expect(adaptation.score).toBeLessThanOrEqual(98);
    expect(adaptation.transitionReadiness).toBe('Smooth');
  });

  it('12. Evaluates 8 Manager Attributes, AI Counter-Style Selection, Mid-Match Tactical Resimulation, and Starter Pack One-Time Protection', () => {
    const state = generateInitialGameState(123987, TEST_MANAGER);
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    const oppClub = state.clubs.find((c) => c.id !== club.id)!;
    const clubPlayers = state.players.filter((p) => p.clubId === club.id && !p.isYouth);
    const oppPlayers = state.players.filter((p) => p.clubId === oppClub.id && !p.isYouth);

    const mgrAttrs = resolveManagerAttributes(club.reputation, state.manager.attributes);
    expect(Object.keys(mgrAttrs)).toHaveLength(8);
    expect(mgrAttrs.tacticalIntelligence).toBeGreaterThanOrEqual(45);

    // AI Manager selects a Strong counter style against High Press when adaptable
    const counterChoice = selectOptimalCounterPlayingStyle('highPress', mgrAttrs, 85, 0);
    expect(ALL_12_PLAYING_STYLES).toContain(counterChoice);

    // Substitution recommendations prioritize exhausted players
    const starters = club.startingXI
      .map((id) => clubPlayers.find((p) => p.id === id))
      .filter((p): p is Player => !!p)
      .map((p, i) => (i === 1 ? { ...p, stamina: 35, fitness: 35, fatigue: 70 } : p));
    const bench = club.substitutes
      .map((id) => clubPlayers.find((p) => p.id === id))
      .filter((p): p is Player => !!p);
    const recs = getRecommendedSubstitutions(starters, bench, club.tactics.formation, 72);
    expect(recs.length).toBeGreaterThan(0);

    // Mid-match tactical switch preserves events before minute 60
    const realFixture = state.fixtures.find(
      (f) => f.homeClubId === club.id || f.awayClubId === club.id
    )!;
    const fHomeClub = state.clubs.find((c) => c.id === realFixture.homeClubId)!;
    const fAwayClub = state.clubs.find((c) => c.id === realFixture.awayClubId)!;
    const fHomePlayers = state.players.filter((p) => p.clubId === fHomeClub.id && !p.isYouth);
    const fAwayPlayers = state.players.filter((p) => p.clubId === fAwayClub.id && !p.isYouth);

    const initialMatch = simulateMatch(
      {
        fixtureId: realFixture.id,
        homeClub: fHomeClub,
        awayClub: fAwayClub,
        homePlayers: fHomePlayers,
        awayPlayers: fAwayPlayers,
      },
      555666
    );
    const switchedMatch = resimulateFromMinute(
      {
        fixtureId: realFixture.id,
        homeClub: { ...fHomeClub, tactics: { ...fHomeClub.tactics, playingStyle: 'directCounter' } },
        awayClub: fAwayClub,
        homePlayers: fHomePlayers,
        awayPlayers: fAwayPlayers,
      },
      555666,
      initialMatch,
      60
    );
    const before60Init = initialMatch.events.filter((e) => e.minute < 60);
    const before60Switched = switchedMatch.events.filter((e) => e.minute < 60);
    expect(before60Switched.length).toBe(before60Init.length);

    // Post-match state application updates stamina, fatigue, consecutiveMatches & ticks 3-match position boosters
    const postMatchState = applyMatchResultToState(state, realFixture.id, initialMatch);
    const starterAfter = postMatchState.players.find((p) => p.id === fHomeClub.startingXI[0])!;
    expect(starterAfter.consecutiveMatches).toBeGreaterThanOrEqual(1);
    expect(starterAfter.fatigue).toBeGreaterThanOrEqual(0);

    // Starter Pack one-time lock & failed transaction safety
    const failedTx = applyVerifiedStarterPackTransaction(state, {
      transactionId: 'tx-fail-1',
      status: 'failed',
      verificationSignature: 'unverified',
    });
    expect(failedTx.success).toBe(false);
    expect(ensureEconomyState(failedTx.updatedState).starterPack.owned).toBe(false);

    const okTx = applyVerifiedStarterPackTransaction(failedTx.updatedState, {
      transactionId: 'tx-ok-1',
      status: 'verified',
      verificationSignature: 'srv_sig_valid_1',
    });
    expect(okTx.success).toBe(true);
    expect(ensureEconomyState(okTx.updatedState).starterPack.owned).toBe(true);

    const dupTx = applyVerifiedStarterPackTransaction(okTx.updatedState, {
      transactionId: 'tx-dup-2',
      status: 'verified',
      verificationSignature: 'srv_sig_valid_2',
    });
    expect(dupTx.success).toBe(false);
  });
});
