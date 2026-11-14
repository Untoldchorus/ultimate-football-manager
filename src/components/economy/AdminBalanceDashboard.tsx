'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Lock,
  Play,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Unlock,
} from 'lucide-react';
import { DEFAULT_BALANCE_CONFIG } from '@/engine/balanceConfig';
import {
  AutomatedBalanceTestReport,
  runAutomatedBalanceTestSuite,
} from '@/engine/balanceTester';
import { BOOSTER_CATALOG, ensureEconomyState } from '@/engine/boosterEconomy';
import { evaluateTeamChemistry } from '@/engine/chemistryEngine';
import { evaluateTeamSynergy } from '@/engine/synergyEngine';
import { BalanceConfiguration } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

export function AdminBalanceDashboard() {
  const { gameState, updateAdminBalanceConfig } = useGameStore();

  const [passcode, setPasscode] = useState('ADMIN-FM27');
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [draftConfig, setDraftConfig] = useState<BalanceConfiguration | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [testIterations, setTestIterations] = useState<number>(60);
  const [balanceReport, setBalanceReport] = useState<AutomatedBalanceTestReport | null>(null);
  const [isRunningSuite, setIsRunningSuite] = useState(false);

  const economy = useMemo(() => {
    if (!gameState) return null;
    return ensureEconomyState(gameState);
  }, [gameState]);

  const activeConfig = draftConfig ?? economy?.balanceConfig ?? DEFAULT_BALANCE_CONFIG;

  // Compute live Economy & Match Analytics across all clubs in the career world
  const analytics = useMemo(() => {
    if (!gameState || !economy) return null;

    let totalChem = 0;
    let totalSyn = 0;
    const formationStats: Record<string, { count: number; totalSyn: number }> = {};

    for (const club of gameState.clubs) {
      const cPlayers = gameState.players.filter((p) => p.clubId === club.id && !p.isYouth);
      const isUser = club.id === gameState.manager.clubId;
      const chem = evaluateTeamChemistry(
        club,
        cPlayers,
        isUser ? economy.pairChemistry : {},
        gameState.currentSeason,
        gameState.currentWeek,
        isUser ? economy.activeBoosters : [],
        activeConfig
      );
      const syn = evaluateTeamSynergy(
        club,
        cPlayers,
        isUser ? economy.activeBoosters : [],
        activeConfig
      );
      totalChem += chem.overallChemistry;
      totalSyn += syn.overallSynergy;

      const f = club.tactics.formation;
      if (!formationStats[f]) formationStats[f] = { count: 0, totalSyn: 0 };
      formationStats[f].count += 1;
      formationStats[f].totalSyn += syn.overallSynergy;
    }

    const clubCount = Math.max(1, gameState.clubs.length);
    const avgChemistry = Math.round((totalChem / clubCount) * 10) / 10;
    const avgSynergy = Math.round((totalSyn / clubCount) * 10) / 10;

    // Booster usage counts
    const usageCounts: Record<string, number> = {};
    for (const b of BOOSTER_CATALOG) usageCounts[b.name] = 0;
    for (const u of economy.usageHistory) {
      usageCounts[u.itemName] = (usageCounts[u.itemName] ?? 0) + 1;
    }
    const sortedBoosters = Object.entries(usageCounts).sort((a, b) => b[1] - a[1]);
    const mostUsedBooster = sortedBoosters[0] ?? ['None', 0];
    const leastUsedBooster = sortedBoosters[sortedBoosters.length - 1] ?? ['None', 0];

    const verifiedTx = economy.transactions.filter(
      (t) => t.status === 'verified' || t.status === 'restored'
    );
    const realMoneyRevenue = verifiedTx
      .filter((t) => t.currencyType === 'real_money')
      .reduce((s, t) => s + t.amountPaid, 0);

    return {
      avgChemistry,
      avgSynergy,
      mostUsedBooster,
      leastUsedBooster,
      starterPackOwned: economy.starterPack.owned,
      failedStarterAttempts: economy.starterPack.failedAttemptsCount,
      adsWatchedToday: economy.rewardedAds.adsWatchedToday,
      verifiedTransactionsCount: verifiedTx.length,
      realMoneyRevenue: Math.round(realMoneyRevenue * 100) / 100,
      formationBreakdown: Object.entries(formationStats).map(([fmt, st]) => ({
        formation: fmt,
        clubs: st.count,
        avgSynergy: Math.round(st.totalSyn / Math.max(1, st.count)),
      })),
    };
  }, [gameState, economy, activeConfig]);

  if (!gameState || !economy || !analytics) return null;

  const updateDraftField = <K extends keyof BalanceConfiguration>(
    key: K,
    val: BalanceConfiguration[K]
  ) => {
    setDraftConfig((prev) => ({
      ...(prev ?? economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG),
      [key]: val,
    }));
  };

  const handleSaveConfig = async () => {
    soundManager.playUiClick();
    if (!draftConfig) return;
    const res = await updateAdminBalanceConfig(draftConfig, passcode);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setDraftConfig(null);
    }
  };

  const handleResetDefaults = async () => {
    soundManager.playUiClick();
    setDraftConfig({ ...DEFAULT_BALANCE_CONFIG });
    const res = await updateAdminBalanceConfig(DEFAULT_BALANCE_CONFIG, passcode);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: 'Restored central Balance Configuration to canonical production defaults.',
    });
  };

  const handleRunBalanceSuite = () => {
    soundManager.playUiClick();
    setIsRunningSuite(true);
    setTimeout(() => {
      const report = runAutomatedBalanceTestSuite(
        activeConfig,
        testIterations,
        20261114
      );
      setBalanceReport(report);
      setIsRunningSuite(false);
    }, 30);
  };

  return (
    <div className="space-y-6" data-testid="admin-balance-dashboard">
      {/* Top Protected Admin Header */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[11px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Protected Administrator Balancing &amp; Telemetry</span>
              </span>
              <span className="text-xs text-slate-400">
                Config Version v{activeConfig.version} &bull; Updated by {activeConfig.updatedBy}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Central Game Balancing, Economy &amp; Automated Simulation Lab
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust nonlinear match caps, chemistry/synergy rates, booster limits, and Starter Pack contents without redeploying code.
            </p>
          </div>

          {/* Admin Authorization Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-navy-950 px-3 py-1.5 rounded-xl border border-slate-800">
              {isUnlocked ? (
                <Unlock className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-rose-400" />
              )}
              <input
                type="password"
                aria-label="Administrator Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Admin Passcode"
                className="bg-transparent text-xs font-mono text-white w-28 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsUnlocked(passcode === 'ADMIN-FM27')}
                className="px-2 py-0.5 rounded bg-navy-800 text-[10px] font-bold text-slate-200"
              >
                Verify
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              data-testid="save-admin-config-btn"
              onClick={handleSaveConfig}
              className="px-4 py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-pitch-600/25"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply &amp; Audit Config</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div
            data-testid="admin-feedback-banner"
            className={`mt-4 p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Live Economy & Match Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-400">Avg League Chemistry</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">
            {analytics.avgChemistry} / 100
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-400">Avg League Synergy</div>
          <div className="text-xl font-black text-sky-400 mt-0.5">
            {analytics.avgSynergy} / 100
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-400">Starter Pack Status</div>
          <div className="text-sm font-black text-gold-400 mt-1">
            {analytics.starterPackOwned ? 'CONVERTED (1/1)' : 'ELIGIBLE (0/1)'}
          </div>
          <div className="text-[10px] text-slate-500">
            Failed Attempts: {analytics.failedStarterAttempts}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-400">Rewarded Ad Engagement</div>
          <div className="text-xl font-black text-white mt-0.5">
            {analytics.adsWatchedToday} / {activeConfig.maxRewardedAdsPerDay}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-400">Most Used Booster</div>
          <div className="text-xs font-black text-white mt-1 truncate">
            {analytics.mostUsedBooster[0]} ({analytics.mostUsedBooster[1]}x)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-400">Verified Revenue</div>
          <div className="text-xl font-black text-pitch-400 mt-0.5">
            ${analytics.realMoneyRevenue.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500">
            {analytics.verifiedTransactionsCount} Verified Txs
          </div>
        </div>
      </div>

      {/* Central Balance Configuration Tuning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Match Engine Nonlinear Caps & Chemistry/Synergy Rates */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-pitch-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Match Engine Nonlinear Modifiers &amp; Progression Rates</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-bold text-slate-200 mb-1">
                <span>Max Chemistry Match Contribution (Recommended 3.0%)</span>
                <span className="text-emerald-400">
                  {activeConfig.maxChemistryMatchBonusPct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={8.0}
                step={0.5}
                value={activeConfig.maxChemistryMatchBonusPct}
                onChange={(e) =>
                  updateDraftField('maxChemistryMatchBonusPct', parseFloat(e.target.value))
                }
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-200 mb-1">
                <span>Max Synergy Match Contribution (Recommended 4.0%)</span>
                <span className="text-sky-400">
                  {activeConfig.maxSynergyMatchBonusPct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={8.0}
                step={0.5}
                value={activeConfig.maxSynergyMatchBonusPct}
                onChange={(e) =>
                  updateDraftField('maxSynergyMatchBonusPct', parseFloat(e.target.value))
                }
                className="w-full accent-sky-500"
              />
            </div>

            <div>
              <div className="flex justify-between font-bold text-slate-200 mb-1">
                <span>Max Combined Match Contribution Cap (Recommended 7.0%)</span>
                <span className="text-gold-400">
                  {activeConfig.maxCombinedChemSynergyBonusPct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={12.0}
                step={0.5}
                value={activeConfig.maxCombinedChemSynergyBonusPct}
                onChange={(e) =>
                  updateDraftField('maxCombinedChemSynergyBonusPct', parseFloat(e.target.value))
                }
                className="w-full accent-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Chemistry Gain / Match Together
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={0.2}
                  max={4.0}
                  value={activeConfig.chemistryGainPerMatchTogether}
                  onChange={(e) =>
                    updateDraftField(
                      'chemistryGainPerMatchTogether',
                      parseFloat(e.target.value) || 1.35
                    )
                  }
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Chemistry Decay / Inactive Week
                </label>
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={2.0}
                  value={activeConfig.chemistryDecayPerInactiveWeek}
                  onChange={(e) =>
                    updateDraftField(
                      'chemistryDecayPerInactiveWeek',
                      parseFloat(e.target.value) || 0.35
                    )
                  }
                  className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Anti-Overbuff, Rewarded Ads & Starter Pack Configuration */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Booster Anti-Overbuff, Rewarded Ads &amp; Starter Pack Tuning</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Max Active Boosters / Player
              </label>
              <input
                type="number"
                min={1}
                max={3}
                value={activeConfig.maxActiveBoostersPerPlayer}
                onChange={(e) =>
                  updateDraftField(
                    'maxActiveBoostersPerPlayer',
                    parseInt(e.target.value, 10) || 2
                  )
                }
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Booster Strength Mult
              </label>
              <input
                type="number"
                step={0.1}
                min={0.25}
                max={2.0}
                value={activeConfig.boosterGlobalStrengthMultiplier}
                onChange={(e) =>
                  updateDraftField(
                    'boosterGlobalStrengthMultiplier',
                    parseFloat(e.target.value) || 1
                  )
                }
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Max Rewarded Ads / Day
              </label>
              <input
                type="number"
                min={0}
                max={15}
                value={activeConfig.maxRewardedAdsPerDay}
                onChange={(e) =>
                  updateDraftField('maxRewardedAdsPerDay', parseInt(e.target.value, 10) || 5)
                }
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Starter Pack Price ($)
              </label>
              <input
                type="number"
                step={0.5}
                min={0.99}
                max={29.99}
                value={activeConfig.starterPackPriceUsd}
                onChange={(e) =>
                  updateDraftField('starterPackPriceUsd', parseFloat(e.target.value) || 4.99)
                }
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-gold-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Starter Pack Premium Coins
              </label>
              <input
                type="number"
                step={50}
                min={50}
                max={2000}
                value={activeConfig.starterPackPremiumCoins}
                onChange={(e) =>
                  updateDraftField(
                    'starterPackPremiumCoins',
                    parseInt(e.target.value, 10) || 300
                  )
                }
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-gold-300 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Daily Login Soft Coins
              </label>
              <input
                type="number"
                step={25}
                min={50}
                max={2000}
                value={activeConfig.dailyLoginSoftCoins}
                onChange={(e) =>
                  updateDraftField('dailyLoginSoftCoins', parseInt(e.target.value, 10) || 250)
                }
                className="w-full bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
            <span className="text-slate-300 font-bold">Enable Store Purchases Globally:</span>
            <input
              type="checkbox"
              checked={activeConfig.storePurchasesEnabled}
              onChange={(e) => updateDraftField('storePurchasesEnabled', e.target.checked)}
              className="w-4 h-4 accent-pitch-500"
            />
          </div>
        </div>
      </div>

      {/* ===================================================================
          AUTOMATED BALANCE TESTING SUITE RUNNER
         =================================================================== */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-pitch-400" />
              <span>Automated Batch Match Simulation &amp; Anti-Exploit Tester</span>
            </h2>
            <p className="text-xs text-slate-400">
              Simulates batch matches across Baseline, High Chemistry, High Synergy, Full Booster, and Underdog scenarios to verify competitive fairness.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              aria-label="Simulation batch size"
              value={testIterations}
              onChange={(e) => setTestIterations(parseInt(e.target.value, 10))}
              className="bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              <option value={40}>40 Matches / Scenario</option>
              <option value={60}>60 Matches / Scenario</option>
              <option value={100}>100 Matches / Scenario</option>
            </select>

            <button
              type="button"
              data-testid="run-automated-balance-suite-btn"
              disabled={isRunningSuite}
              onClick={handleRunBalanceSuite}
              className="px-4 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-pitch-600/25"
            >
              <Play className="w-4 h-4" />
              <span>
                {isRunningSuite ? 'Simulating Matches...' : 'Run Automated Balance Suite'}
              </span>
            </button>
          </div>
        </div>

        {balanceReport && (
          <div data-testid="automated-balance-report" className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-navy-950 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold">
                {balanceReport.overallHealth === 'HEALTHY' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">
                      ALL FAIR-PLAY BOUNDS PASSED ({balanceReport.totalMatchesSimulated} Matches Simulated)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300">
                      Flagged Warnings: {balanceReport.flaggedWarnings.join(' | ')}
                    </span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Anti-Exploit Checks Passed:{' '}
                <strong className="text-white">
                  {balanceReport.antiExploitChecks.filter((c) => c.passed).length}/
                  {balanceReport.antiExploitChecks.length}
                </strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                    <th className="py-2 px-3">Scenario</th>
                    <th className="py-2 px-3">Matches</th>
                    <th className="py-2 px-3">Win / Draw / Loss</th>
                    <th className="py-2 px-3">Home Win %</th>
                    <th className="py-2 px-3">Avg Goals</th>
                    <th className="py-2 px-3">Avg xG</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {balanceReport.scenarios.map((sc) => (
                    <tr key={sc.scenarioId} className="hover:bg-navy-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">{sc.label}</td>
                      <td className="py-2.5 px-3 text-slate-300">{sc.matchesSimulated}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-300">
                        {sc.homeWinRatePct}% W / {sc.drawRatePct}% D / {sc.awayWinRatePct}% L
                      </td>
                      <td className="py-2.5 px-3 font-black text-pitch-400">
                        {sc.homeWinRatePct}%
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">{sc.avgGoalsPerMatch}</td>
                      <td className="py-2.5 px-3 text-sky-300 font-bold">
                        {sc.avgHomeXg} vs {sc.avgAwayXg}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            sc.status === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {sc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Administrator Audit Log */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gold-400" />
          <span>Administrator Balance Change Audit Log ({economy.adminAuditLog.length})</span>
        </h3>

        {economy.adminAuditLog.length === 0 ? (
          <p className="text-xs text-slate-500">
            No custom balance overrides logged yet. Modify a slider above and click &ldquo;Apply &amp; Audit Config&rdquo;.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
            {economy.adminAuditLog.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-gold-300">{log.summary}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  by {log.adminUser} &bull; {log.timestampIso.slice(0, 19).replace('T', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
