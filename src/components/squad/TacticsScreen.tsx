import React, { useState } from 'react';
import {
  Sliders,
  ShieldAlert,
  Zap,
  Compass,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { DEFAULT_BALANCE_CONFIG } from '@/engine/balanceConfig';
import { ensureEconomyState } from '@/engine/boosterEconomy';
import { evaluateTeamChemistry } from '@/engine/chemistryEngine';
import { FORMATION_SLOTS } from '@/engine/ratings';
import {
  CANONICAL_19_TACTICAL_ROLES,
  evaluateTeamSynergy,
  resolvePlayerTacticalRole,
  TACTICAL_ROLE_LABELS,
} from '@/engine/synergyEngine';
import {
  applyPlayingStyleDefaults,
  calculateTacticalAdaptationScore,
  DEFAULT_TACTICAL_COUNTER_MATRIX,
  evaluateFormationStyleCompatibility,
  resolveManagerAttributes,
  resolveTacticalPlayingStyle,
  TACTICAL_STYLES_CATALOG,
  TACTICAL_STYLES_LIST,
} from '@/engine/tacticalMatrixEngine';
import {
  DefensiveLine,
  FormationCode,
  PressingIntensity,
  TacticalMentality,
  TacticalPlayerRole,
  TacticalPlayingStyle,
} from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

const ALL_10_FORMATIONS: FormationCode[] = [
  '4-3-3',
  '4-4-2',
  '4-2-3-1',
  '3-5-2',
  '3-4-3',
  '5-3-2',
  '4-1-4-1',
  '4-3-1-2',
  '4-2-2-2',
  '5-4-1',
];

export function TacticsScreen() {
  const {
    gameState,
    updateUserTactics,
    setUserFormation,
    updatePlayerTacticalRole,
    saveTacticalPreset,
    loadTacticalPreset,
    deleteTacticalPreset,
    setActiveTab,
  } = useGameStore();
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showCounterMatrix, setShowCounterMatrix] = useState(false);

  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const clubPlayers = gameState.players.filter((p) => p.clubId === userClub.id && !p.isYouth);
  const playerMap = new Map(clubPlayers.map((p) => [p.id, p]));
  const economy = ensureEconomyState(gameState);
  const balCfg = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;

  const synergy = evaluateTeamSynergy(
    userClub,
    clubPlayers,
    economy.activeBoosters,
    balCfg,
    economy.activePositionBoosters ?? [],
    gameState.currentSeason
  );
  const chemistry = evaluateTeamChemistry(
    userClub,
    clubPlayers,
    economy.pairChemistry,
    gameState.currentSeason,
    gameState.currentWeek,
    economy.activeBoosters,
    balCfg,
    economy.activePositionBoosters ?? []
  );

  const t = userClub.tactics;
  const activeStyle = resolveTacticalPlayingStyle(t);
  const styleDef = TACTICAL_STYLES_CATALOG[activeStyle];
  const mgrAttrs = resolveManagerAttributes(userClub.reputation, gameState.manager.attributes);
  const formCompat = evaluateFormationStyleCompatibility(t.formation, activeStyle);

  const adaptation = calculateTacticalAdaptationScore({
    teamSynergy: synergy.overallSynergy,
    positionalUnitSynergy:
      (synergy.defensiveSynergy + synergy.midfieldSynergy + synergy.attackingSynergy) / 3,
    tacticalFamiliarity: (chemistry.overallChemistry + formCompat) / 2,
    formationCompatibility: formCompat,
    managerAdaptability: mgrAttrs.tacticalAdaptability + (activeStyle === 'balanced' ? 8 : 0),
  });

  const strongAgainstList = TACTICAL_STYLES_LIST.filter(
    (opp) => DEFAULT_TACTICAL_COUNTER_MATRIX[activeStyle][opp] === 'Strong'
  );
  const weakAgainstList = TACTICAL_STYLES_LIST.filter(
    (opp) => DEFAULT_TACTICAL_COUNTER_MATRIX[activeStyle][opp] === 'Weak'
  );

  const slots = FORMATION_SLOTS[t.formation] ?? FORMATION_SLOTS['4-3-3'];
  const savedPresets = gameState.manager.savedPresets ?? [];

  return (
    <div className="space-y-6" data-testid="tactics-screen">
      {/* Top Tactical Command & 12-Style Philosophy Header */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-pitch-400" />
            <div>
              <h2 className="text-lg font-extrabold text-white">
                FC27 Tactical Command &bull; 12 Core Playing Philosophies
              </h2>
              <p className="text-xs text-slate-400">
                Choose from the 12 core tactical philosophies, 10 formations, 19 player roles, and 14 custom instructions.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-pitch-500/20 text-pitch-400 text-xs font-bold">
              Active Formation: {t.formation} ({formCompat}% Style Fit)
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              Adaptation Score: {adaptation.score}/100 ({adaptation.transitionReadiness})
            </span>
            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                setActiveTab('chemistry');
              }}
              className="px-3 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-extrabold flex items-center gap-1.5 transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>
                Synergy: {synergy.overallSynergy}/100 &bull; Chem: {chemistry.overallChemistry}/100
              </span>
            </button>
          </div>
        </div>

        {/* 12 Core Playing Styles Selector + Formation Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 12 Playing Styles */}
              <div className="space-y-1.5">
                <label
                  htmlFor="attacking-style-select"
                  className="block text-xs font-bold uppercase text-pitch-400"
                >
                  Core Playing Style (12 Philosophies)
                </label>
                <select
                  id="attacking-style-select"
                  data-testid="playing-style-select"
                  value={activeStyle}
                  onChange={(e) => {
                    soundManager.playUiClick();
                    const chosen = e.target.value as TacticalPlayingStyle;
                    const updated = applyPlayingStyleDefaults(t, chosen);
                    updateUserTactics(updated);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-pitch-500/50 text-sm font-bold text-white"
                >
                  {TACTICAL_STYLES_LIST.map((stKey) => {
                    const def = TACTICAL_STYLES_CATALOG[stKey];
                    return (
                      <option key={stKey} value={stKey}>
                        {def.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 10 Supported Formations */}
              <div className="space-y-1.5">
                <label
                  htmlFor="formation-select-tactics"
                  className="block text-xs font-bold uppercase text-slate-400"
                >
                  Tactical Formation (10 Systems)
                </label>
                <select
                  id="formation-select-tactics"
                  data-testid="formation-select-tactics"
                  value={t.formation}
                  onChange={(e) => {
                    soundManager.playUiClick();
                    setUserFormation(e.target.value as FormationCode);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-slate-700 text-sm font-bold text-white"
                >
                  {ALL_10_FORMATIONS.map((f) => (
                    <option key={f} value={f}>
                      {f} ({evaluateFormationStyleCompatibility(f, activeStyle)}% {styleDef.name} Fit)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Philosophy, Strengths, Weaknesses & Counter Matrix Summary Card */}
            <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-pitch-400">
                    Active Tactical Philosophy
                  </span>
                  <h3 className="text-base font-black text-white">{styleDef.name}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-navy-900 border border-slate-700 text-[11px] font-bold text-slate-300">
                  Stamina Workload: {Math.round(styleDef.staminaDrainFactor * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{styleDef.philosophy}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Strengths (+5% Situational Counter)</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                    {styleDef.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  {strongAgainstList.length > 0 && (
                    <div className="pt-1 text-[10px] text-emerald-300 font-bold">
                      Counters:{' '}
                      {strongAgainstList.map((k) => TACTICAL_STYLES_CATALOG[k].name).join(', ')}
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 space-y-1">
                  <div className="text-[10px] font-extrabold uppercase text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Weaknesses (-5% Vulnerable To)</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                    {styleDef.weaknesses.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                  {weakAgainstList.length > 0 && (
                    <div className="pt-1 text-[10px] text-rose-300 font-bold">
                      Vulnerable vs:{' '}
                      {weakAgainstList.map((k) => TACTICAL_STYLES_CATALOG[k].name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Saved Tactical Presets & Manager Intelligence Panel */}
          <div className="lg:col-span-5 bg-navy-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4" />
                  <span>Custom Tactical Presets</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCounterMatrix(!showCounterMatrix)}
                  className="text-[11px] font-bold text-sky-400 hover:underline"
                >
                  {showCounterMatrix ? 'Hide 12×12 Matrix' : 'View Full 12×12 Counter Matrix'}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  placeholder="Preset name (e.g. High Press 4-3-3)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-navy-900 border border-slate-700 text-xs text-white"
                />
                <button
                  type="button"
                  data-testid="save-tactical-preset-btn"
                  onClick={() => {
                    if (!presetNameInput.trim()) return;
                    soundManager.playUiClick();
                    saveTacticalPreset(presetNameInput);
                    setPresetNameInput('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold"
                >
                  Save Preset
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {savedPresets.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    No custom presets saved yet. Configure your instructions and click Save Preset.
                  </p>
                ) : (
                  savedPresets.map((pr) => (
                    <div
                      key={pr.id}
                      className="p-2 rounded-lg bg-navy-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{pr.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {pr.tactics.formation} &bull;{' '}
                          {TACTICAL_STYLES_CATALOG[resolveTacticalPlayingStyle(pr.tactics)].name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playUiClick();
                            loadTacticalPreset(pr.id);
                          }}
                          className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTacticalPreset(pr.id)}
                          className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manager 8 Core Attributes Summary */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Manager Tactical Intelligence &amp; Adaptability</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {[
                  ['Tactical IQ', mgrAttrs.tacticalIntelligence],
                  ['Adaptability', mgrAttrs.tacticalAdaptability],
                  ['Flexibility', mgrAttrs.tacticalFlexibility],
                  ['Match Prep', mgrAttrs.matchPreparation],
                ].map(([label, val]) => (
                  <div
                    key={String(label)}
                    className="p-2 rounded-lg bg-navy-900 border border-slate-800 text-center"
                  >
                    <div className="text-[10px] text-slate-400">{label}</div>
                    <div className="font-black text-gold-400">{val}/100</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Full 12x12 Tactical Counter Matrix */}
        {showCounterMatrix && (
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 overflow-x-auto space-y-2">
            <h3 className="text-xs font-extrabold uppercase text-gold-400">
              Complete 12 &times; 12 Tactical Counter Matrix (Row vs Column)
            </h3>
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="p-1.5 text-left">Style</th>
                  {TACTICAL_STYLES_LIST.map((col) => (
                    <th key={col} className="p-1 text-center">
                      {TACTICAL_STYLES_CATALOG[col].name.slice(0, 7)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TACTICAL_STYLES_LIST.map((row) => (
                  <tr key={row} className="border-b border-slate-900">
                    <td className="p-1.5 font-bold text-white whitespace-nowrap">
                      {TACTICAL_STYLES_CATALOG[row].name}
                    </td>
                    {TACTICAL_STYLES_LIST.map((col) => {
                      const out = DEFAULT_TACTICAL_COUNTER_MATRIX[row][col];
                      return (
                        <td
                          key={col}
                          className={`p-1 text-center font-bold ${
                            out === 'Strong'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : out === 'Weak'
                              ? 'text-rose-400 bg-rose-500/10'
                              : 'text-slate-500'
                          }`}
                        >
                          {out === 'Strong' ? '+5%' : out === 'Weak' ? '-5%' : '0%'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 14 Custom Tactical Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Mentality */}
          <div className="space-y-1.5">
            <label htmlFor="mentality-select" className="block text-xs font-bold uppercase text-slate-400">
              Team Mentality
            </label>
            <select
              id="mentality-select"
              data-testid="mentality-select"
              value={t.mentality}
              onChange={(e) => {
                soundManager.playUiClick();
                updateUserTactics({ mentality: e.target.value as TacticalMentality });
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="ultraDefensive">Ultra Defensive</option>
              <option value="defensive">Cautious / Defensive</option>
              <option value="balanced">Balanced Standard</option>
              <option value="attacking">Positive / Attacking</option>
              <option value="allOutAttack">All-Out Overload</option>
            </select>
          </div>

          {/* Pressing Intensity */}
          <div className="space-y-1.5">
            <label htmlFor="pressing-select" className="block text-xs font-bold uppercase text-slate-400">
              Pressing Intensity
            </label>
            <select
              id="pressing-select"
              value={t.pressing}
              onChange={(e) => {
                soundManager.playUiClick();
                updateUserTactics({ pressing: e.target.value as PressingIntensity });
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="low">Low Block (Conserve Stamina)</option>
              <option value="medium">Standard Mid-Block</option>
              <option value="high">High Press</option>
              <option value="gegenpress">Relentless Gegenpress</option>
            </select>
          </div>

          {/* Defensive Line */}
          <div className="space-y-1.5">
            <label htmlFor="def-line-select" className="block text-xs font-bold uppercase text-slate-400">
              Defensive Line Height
            </label>
            <select
              id="def-line-select"
              value={t.defensiveLine}
              onChange={(e) => {
                soundManager.playUiClick();
                updateUserTactics({ defensiveLine: e.target.value as DefensiveLine });
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="deep">Deep Defensive Line</option>
              <option value="standard">Standard Line</option>
              <option value="high">High Line</option>
            </select>
          </div>

          {/* Defensive Positioning */}
          <div className="space-y-1.5">
            <label htmlFor="def-pos-select" className="block text-xs font-bold uppercase text-slate-400">
              Defensive Positioning
            </label>
            <select
              id="def-pos-select"
              value={t.defensivePositioning ?? 'zonal'}
              onChange={(e) => {
                soundManager.playUiClick();
                updateUserTactics({
                  defensivePositioning: e.target.value as 'zonal' | 'manMarking' | 'hybrid',
                });
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-white"
            >
              <option value="zonal">Zonal Spatial Coverage</option>
              <option value="manMarking">Disciplined Man-Marking</option>
              <option value="hybrid">Hybrid Pressing Traps</option>
            </select>
          </div>
        </div>

        {/* Sliders: Width, Tempo, Directness, Transition Speed, Compactness, Creative Freedom, Forward Movement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            ['Attacking Width', 'width', t.width],
            ['Passing Tempo', 'tempo', t.tempo],
            ['Passing Directness', 'directness', t.directness],
            ['Transition Speed', 'transitionSpeed', t.transitionSpeed ?? 65],
            ['Defensive Compactness', 'defensiveCompactness', t.defensiveCompactness ?? 65],
            ['Player Freedom', 'playerFreedom', t.playerFreedom ?? 55],
            ['Creative Freedom', 'creativeFreedom', t.creativeFreedom ?? 60],
            ['Forward Movement', 'forwardMovement', t.forwardMovement ?? 65],
          ].map(([label, key, val]) => (
            <div key={String(key)} className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase text-[10px]">{label}</span>
                <span className="text-pitch-400">{val}/100</span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={Number(val)}
                onChange={(e) => updateUserTactics({ [key]: Number(e.target.value) })}
                className="w-full accent-pitch-500"
              />
            </div>
          ))}
        </div>

        {/* Toggles: Counter-Pressing, Offside Trap, Overlapping Runs, Underlapping Runs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {[
            [
              'Counter-Pressing',
              'Swarm immediately on turnover',
              Boolean(t.counterPressing),
              () => updateUserTactics({ counterPressing: !t.counterPressing }),
            ],
            [
              'Step Up / Offside Trap',
              'Compress space behind backline',
              Boolean(t.offsideTrap),
              () => updateUserTactics({ offsideTrap: !t.offsideTrap }),
            ],
            [
              'Overlapping Runs',
              'Fullbacks overlap wide wingers',
              Boolean(t.overlappingRuns ?? true),
              () => updateUserTactics({ overlappingRuns: !(t.overlappingRuns ?? true) }),
            ],
            [
              'Underlapping Runs',
              'Half-space inverted runs',
              Boolean(t.underlappingRuns ?? false),
              () => updateUserTactics({ underlappingRuns: !t.underlappingRuns }),
            ],
          ].map(([title, desc, active, toggleFn]) => (
            <button
              key={String(title)}
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                (toggleFn as () => void)();
              }}
              className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition ${
                active
                  ? 'bg-pitch-600/20 border-pitch-500 text-white'
                  : 'bg-navy-950 border-slate-800 text-slate-400'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">{String(title)}</div>
                <div className="text-[10px] text-slate-400">{String(desc)}</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-navy-800">
                {active ? 'ON' : 'OFF'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Starting XI Specialized Player Roles Assignment (19 Roles) */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gold-400" />
            <div>
              <h3 className="text-base font-extrabold text-white">
                Starting XI Specialized Player Roles (19 Tactical Roles)
              </h3>
              <p className="text-xs text-slate-400">
                Assign complementary roles (e.g., Defensive Midfielder + Wingback, Advanced Playmaker + Poacher) to maximize unit synergy.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-400">
            Role Compatibility: {synergy.factors.roleCompatibilityScore}/100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {userClub.startingXI.slice(0, 11).map((pid, idx) => {
            const p = playerMap.get(pid);
            if (!p) return null;
            const slotPos = slots[idx]?.position ?? p.primaryPosition;
            const currentRole = resolvePlayerTacticalRole(p, slotPos);
            return (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-pitch-500/20 text-pitch-400 font-black text-[10px]">
                      {slotPos}
                    </span>
                    <span className="font-bold text-white">
                      {p.firstName} {p.lastName}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gold-400">OVR {p.overall}</span>
                </div>

                <select
                  value={currentRole}
                  onChange={(e) => {
                    soundManager.playUiClick();
                    updatePlayerTacticalRole(p.id, e.target.value as TacticalPlayerRole);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-xs font-bold text-slate-200"
                >
                  {CANONICAL_19_TACTICAL_ROLES.map((roleKey) => (
                    <option key={roleKey} value={roleKey}>
                      {TACTICAL_ROLE_LABELS[roleKey]}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
