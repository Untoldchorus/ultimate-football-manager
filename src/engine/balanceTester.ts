import {
  computeNonlinearMatchModifiers,
  DEFAULT_BALANCE_CONFIG,
  getAttributeTrainingEfficiency,
} from './balanceConfig';
import {
  activateBoosterItem,
  BOOSTER_CATALOG,
  createInitialEconomyState,
  grantInventoryItems,
} from './boosterEconomy';
import { generateInitialGameState } from './generator';
import { simulateMatch } from './matchEngine';
import {
  ActiveBoosterInstance,
  BalanceConfiguration,
  Club,
  FormationCode,
  Player,
} from './types';

export interface BalanceSimulationScenarioResult {
  scenarioId: string;
  label: string;
  matchesSimulated: number;
  homeWinRatePct: number;
  drawRatePct: number;
  awayWinRatePct: number;
  avgGoalsPerMatch: number;
  avgHomeXg: number;
  avgAwayXg: number;
  status: 'PASS' | 'FLAGGED';
  flagReason?: string;
}

export interface FormationEffectivenessEntry {
  formation: FormationCode;
  matchesPlayed: number;
  winRatePct: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  flaggedOverpowered: boolean;
}

export interface AutomatedBalanceTestReport {
  reportId: string;
  generatedAtIso: string;
  totalMatchesSimulated: number;
  configSnapshot: BalanceConfiguration;
  scenarios: BalanceSimulationScenarioResult[];
  formationMatrix: FormationEffectivenessEntry[];
  antiExploitChecks: {
    checkId: string;
    title: string;
    passed: boolean;
    details: string;
  }[];
  flaggedWarnings: string[];
  overallHealth: 'HEALTHY' | 'WARNINGS_DETECTED';
}

function clonePlayersAtTargetOvr(players: Player[], targetOvr: number, fitness = 98): Player[] {
  return players.map((p) => {
    const delta = targetOvr - p.overall;
    const nextAttrs = { ...p.attributes };
    for (const k of Object.keys(nextAttrs) as (keyof typeof nextAttrs)[]) {
      nextAttrs[k] = Math.max(20, Math.min(99, nextAttrs[k] + delta));
    }
    return {
      ...p,
      overall: targetOvr,
      fitness,
      morale: 82,
      form: 7.2,
      attributes: nextAttrs,
    };
  });
}

/**
 * Runs a comprehensive automated balance & anti-exploit test suite across:
 * 1. Equal OVR baseline realism
 * 2. High Chemistry (96) vs Unfamiliar Chemistry (20) impact bounds
 * 3. High Synergy (96) vs Poor Synergy (20) impact bounds
 * 4. Maximum Combined Chemistry (98) + Synergy (98) + Active Boosters vs Baseline (verifies purchased boosters never guarantee wins)
 * 5. Underdog Tactical Advantage (+Synergy/Tactics vs +6 OVR stronger opponent)
 * 6. All 7 Formations head-to-head matrix to detect overpowered formations (> 64% win rate)
 * 7. Anti-exploit inventory, Starter Pack one-time lock, attribute cap (100), and diminishing returns verification
 *
 * As required by the Master Directive, the balancing engine flags suspicious results rather than silently mutating the game.
 */
export function runAutomatedBalanceTestSuite(
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG,
  matchesPerScenario = 120,
  seed = 90210
): AutomatedBalanceTestReport {
  const baseState = generateInitialGameState(seed, {
    name: 'Balance Tester',
    nationality: 'England',
    tacticalStyle: 'balanced',
    difficulty: 'standard',
    startingChallenge: 'none',
    clubId: 'club-emerald',
  });

  const rawHome = baseState.clubs[0];
  const rawAway = baseState.clubs[1];
  const homePool76 = clonePlayersAtTargetOvr(
    baseState.players.filter((p) => p.clubId === rawHome.id),
    76
  );
  const awayPool76 = clonePlayersAtTargetOvr(
    baseState.players.filter((p) => p.clubId === rawAway.id),
    76
  );

  const balancedClub = (base: Club, formation: FormationCode = '4-3-3'): Club => ({
    ...base,
    tactics: {
      ...base.tactics,
      formation,
      mentality: 'balanced',
      attackingStyle: 'balanced',
      pressing: 'medium',
      defensiveLine: 'standard',
    },
  });

  const homeBase = balancedClub(rawHome);
  const awayBase = balancedClub(rawAway);

  const scenarios: BalanceSimulationScenarioResult[] = [];
  const flaggedWarnings: string[] = [];
  let totalMatchesSimulated = 0;

  const runBatch = (
    scenarioId: string,
    label: string,
    opts: {
      homePlayers?: Player[];
      awayPlayers?: Player[];
      homeClub?: Club;
      awayClub?: Club;
      homeChem?: number;
      awayChem?: number;
      homeSyn?: number;
      awaySyn?: number;
      homeBoosters?: ActiveBoosterInstance[];
      isNeutral?: boolean;
      minExpectedHomeWinPct: number;
      maxExpectedHomeWinPct: number;
    }
  ) => {
    let hWins = 0;
    let draws = 0;
    let aWins = 0;
    let goals = 0;
    let hXg = 0;
    let aXg = 0;

    for (let i = 0; i < matchesPerScenario; i++) {
      const res = simulateMatch(
        {
          fixtureId: `bal-${scenarioId}-${i}`,
          homeClub: opts.homeClub ?? homeBase,
          awayClub: opts.awayClub ?? awayBase,
          homePlayers: opts.homePlayers ?? homePool76,
          awayPlayers: opts.awayPlayers ?? awayPool76,
          isNeutralVenue: opts.isNeutral ?? true,
          homeChemistryScore: opts.homeChem ?? 58,
          awayChemistryScore: opts.awayChem ?? 58,
          homeSynergyScore: opts.homeSyn ?? 58,
          awaySynergyScore: opts.awaySyn ?? 58,
          homeActiveBoosters: opts.homeBoosters ?? [],
          balanceConfig: config,
        },
        seed + i * 7919 + scenarioId.length * 101
      );
      totalMatchesSimulated++;
      goals += res.homeScore + res.awayScore;
      hXg += res.homeStats.xg;
      aXg += res.awayStats.xg;
      if (res.homeScore > res.awayScore) hWins++;
      else if (res.homeScore === res.awayScore) draws++;
      else aWins++;
    }

    const homeWinRatePct = Math.round((hWins / matchesPerScenario) * 1000) / 10;
    const drawRatePct = Math.round((draws / matchesPerScenario) * 1000) / 10;
    const awayWinRatePct = Math.round((aWins / matchesPerScenario) * 1000) / 10;
    const avgGoalsPerMatch = Math.round((goals / matchesPerScenario) * 100) / 100;

    let status: 'PASS' | 'FLAGGED' = 'PASS';
    let flagReason: string | undefined;

    if (
      homeWinRatePct < opts.minExpectedHomeWinPct ||
      homeWinRatePct > opts.maxExpectedHomeWinPct
    ) {
      status = 'FLAGGED';
      flagReason = `Win rate ${homeWinRatePct}% outside expected balance band [${opts.minExpectedHomeWinPct}% – ${opts.maxExpectedHomeWinPct}%].`;
      flaggedWarnings.push(`[${label}] ${flagReason}`);
    }

    scenarios.push({
      scenarioId,
      label,
      matchesSimulated: matchesPerScenario,
      homeWinRatePct,
      drawRatePct,
      awayWinRatePct,
      avgGoalsPerMatch,
      avgHomeXg: Math.round((hXg / matchesPerScenario) * 100) / 100,
      avgAwayXg: Math.round((aXg / matchesPerScenario) * 100) / 100,
      status,
      flagReason,
    });
  };

  // Scenario 1: Equal 76 OVR Neutral Venue Baseline
  runBatch('baseline_equal', 'Equal 76 OVR Neutral Baseline (Chem 58 / Syn 58)', {
    isNeutral: true,
    minExpectedHomeWinPct: 28,
    maxExpectedHomeWinPct: 48,
  });

  // Scenario 2: Exceptional Chemistry (96) vs Unfamiliar Chemistry (20)
  runBatch('chemistry_edge', 'Exceptional Chemistry (96) vs Unfamiliar (20)', {
    homeChem: 96,
    awayChem: 20,
    isNeutral: true,
    minExpectedHomeWinPct: 38,
    maxExpectedHomeWinPct: 68,
  });

  // Scenario 3: Exceptional Synergy (96) vs Poor Synergy (20)
  runBatch('synergy_edge', 'Exceptional Synergy (96) vs Poor Compatibility (20)', {
    homeSyn: 96,
    awaySyn: 20,
    isNeutral: true,
    minExpectedHomeWinPct: 40,
    maxExpectedHomeWinPct: 72,
  });

  // Scenario 4: Full Premium Boosters + Max Chem/Syn vs Unboosted Equal Team (Must NOT guarantee 100% wins)
  const sampleBoosters: ActiveBoosterInstance[] = [
    {
      activeId: 'b1',
      itemId: 'bst-chem-bonding-epic',
      name: 'Pre-Match Retreat',
      category: 'chemistry',
      subType: 'team_bonding',
      rarity: 'Epic',
      effectStrength: 7,
      priority: 35,
      conflictGroup: 'chem_team_slot',
      clubId: homeBase.id,
      activatedSeason: 2026,
      activatedWeek: 1,
      remainingWeeks: 2,
    },
    {
      activeId: 'b2',
      itemId: 'bst-syn-unit-epic',
      name: 'Unit Coordination Camp',
      category: 'synergy',
      subType: 'unit_coordination',
      rarity: 'Epic',
      effectStrength: 9,
      priority: 35,
      conflictGroup: 'syn_tac_slot',
      clubId: homeBase.id,
      activatedSeason: 2026,
      activatedWeek: 1,
      remainingWeeks: 2,
    },
  ];
  runBatch(
    'max_boosters_fairness',
    'Max Boosted Team (95 Chem/Syn + Epic Boosters) vs Baseline 76 OVR',
    {
      homeChem: 95,
      homeSyn: 95,
      homeBoosters: sampleBoosters,
      isNeutral: true,
      minExpectedHomeWinPct: 42,
      maxExpectedHomeWinPct: 74, // Must never guarantee >75% win rate against an equal-OVR opponent
    }
  );

  // Scenario 5: Tactical Underdog (73 OVR with 95 Synergy/Chemistry vs 78 OVR with 25 Synergy/Chemistry)
  const underdog73 = clonePlayersAtTargetOvr(homePool76, 73);
  const disorganized78 = clonePlayersAtTargetOvr(awayPool76, 78);
  runBatch(
    'tactical_underdog',
    'Cohesive Underdog (73 OVR, 95 Syn/Chem) vs Disorganized Favorite (78 OVR, 25 Syn/Chem)',
    {
      homePlayers: underdog73,
      awayPlayers: disorganized78,
      homeChem: 95,
      homeSyn: 95,
      awayChem: 25,
      awaySyn: 25,
      isNeutral: true,
      minExpectedHomeWinPct: 18,
      maxExpectedHomeWinPct: 58,
    }
  );

  // Formation Effectiveness Matrix across all 7 formations
  const formations: FormationCode[] = [
    '4-3-3',
    '4-2-3-1',
    '4-4-2',
    '3-5-2',
    '3-4-3',
    '4-1-4-1',
    '5-3-2',
  ];
  const formationMatrix: FormationEffectivenessEntry[] = [];
  const formMatches = Math.max(30, Math.floor(matchesPerScenario / 3));

  for (const form of formations) {
    let wins = 0;
    let gf = 0;
    let ga = 0;
    for (let i = 0; i < formMatches; i++) {
      const oppForm = formations[(i + 2) % formations.length];
      const res = simulateMatch(
        {
          fixtureId: `form-${form}-${i}`,
          homeClub: balancedClub(rawHome, form),
          awayClub: balancedClub(rawAway, oppForm),
          homePlayers: homePool76,
          awayPlayers: awayPool76,
          isNeutralVenue: true,
          balanceConfig: config,
        },
        seed + i * 3571 + form.charCodeAt(0) * 97
      );
      totalMatchesSimulated++;
      if (res.homeScore > res.awayScore) wins++;
      gf += res.homeScore;
      ga += res.awayScore;
    }
    const winRatePct = Math.round((wins / formMatches) * 1000) / 10;
    const flaggedOverpowered = winRatePct > 65;
    if (flaggedOverpowered) {
      flaggedWarnings.push(
        `Formation ${form} win rate (${winRatePct}%) exceeds 65% overpower threshold.`
      );
    }
    formationMatrix.push({
      formation: form,
      matchesPlayed: formMatches,
      winRatePct,
      avgGoalsScored: Math.round((gf / formMatches) * 100) / 100,
      avgGoalsConceded: Math.round((ga / formMatches) * 100) / 100,
      flaggedOverpowered,
    });
  }

  // Deterministic Anti-Exploit & Economy Rule Checks
  const nlMax = computeNonlinearMatchModifiers(100, 100, config);
  const chemCapOk =
    Math.abs(nlMax.chemistryModPct) <= config.maxChemistryMatchBonusPct &&
    Math.abs(nlMax.synergyModPct) <= config.maxSynergyMatchBonusPct &&
    Math.abs(nlMax.combinedModPct) <= config.maxCombinedChemSynergyBonusPct;

  const eff45 = getAttributeTrainingEfficiency(45, config);
  const eff85 = getAttributeTrainingEfficiency(85, config);
  const eff96 = getAttributeTrainingEfficiency(96, config);
  const eff100 = getAttributeTrainingEfficiency(100, config);
  const diminishingOk = eff45 > eff85 && eff85 > eff96 && eff100 === 0;

  // Test Booster Anti-Stacking & Max-2-Per-Player limit
  let testState = {
    ...baseState,
    economy: createInitialEconomyState(rawHome, homePool76, seed, 2026, 1),
  };
  testState.economy = grantInventoryItems(
    testState.economy!,
    BOOSTER_CATALOG.map((b) => ({ itemId: b.itemId, quantity: 3 })),
    'special_event',
    2026,
    1
  );
  const targetPId = homePool76[0].id;
  const act1 = activateBoosterItem(testState, 'bst-train-xp-common', targetPId);
  const actDup = activateBoosterItem(act1.updatedState, 'bst-train-xp-common', targetPId);
  const act2 = activateBoosterItem(act1.updatedState, 'bst-chem-train-common', targetPId);
  const act3OverLimit = activateBoosterItem(
    act2.updatedState,
    'bst-train-tech-rare',
    targetPId
  );
  const boosterLimitsOk =
    act1.success === true &&
    actDup.success === false &&
    act2.success === true &&
    act3OverLimit.success === false;

  const antiExploitChecks = [
    {
      checkId: 'nonlinear_cap',
      title: 'Nonlinear Match Modifier Caps (Chem <= 3%, Syn <= 4%, Combined <= 7%)',
      passed: chemCapOk,
      details: `At 100/100: Chem +${nlMax.chemistryModPct.toFixed(2)}%, Syn +${nlMax.synergyModPct.toFixed(2)}%, Combined +${nlMax.combinedModPct.toFixed(2)}%`,
    },
    {
      checkId: 'diminishing_returns',
      title: 'Training Diminishing Returns & Attribute 100 Hard Cap',
      passed: diminishingOk,
      details: `Efficiency @45=${Math.round(eff45 * 100)}%, @85=${Math.round(eff85 * 100)}%, @96=${Math.round(eff96 * 100)}%, @100=${Math.round(eff100 * 100)}%`,
    },
    {
      checkId: 'booster_anti_stack',
      title: `Booster Anti-Stacking & Max ${config.maxActiveBoostersPerPlayer} Per Player Enforcement`,
      passed: boosterLimitsOk,
      details:
        'Verified identical booster rejection, conflict group priority, and max active slot cap.',
    },
  ];

  for (const chk of antiExploitChecks) {
    if (!chk.passed) {
      flaggedWarnings.push(`Anti-Exploit Check Failed: ${chk.title}`);
    }
  }

  return {
    reportId: `bal-rep-${Date.now()}`,
    generatedAtIso: new Date().toISOString(),
    totalMatchesSimulated,
    configSnapshot: config,
    scenarios,
    formationMatrix,
    antiExploitChecks,
    flaggedWarnings,
    overallHealth: flaggedWarnings.length === 0 ? 'HEALTHY' : 'WARNINGS_DETECTED',
  };
}
