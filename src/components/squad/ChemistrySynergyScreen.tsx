'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Compass,
  GitBranch,
  Globe,
  Layers,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  computeNonlinearMatchModifiers,
  DEFAULT_BALANCE_CONFIG,
  getSynergyLevelLabel,
} from '@/engine/balanceConfig';
import { ensureEconomyState } from '@/engine/boosterEconomy';
import { evaluateTeamChemistry } from '@/engine/chemistryEngine';
import { FORMATION_SLOTS } from '@/engine/ratings';
import {
  evaluateTeamSynergy,
  resolvePlayerTacticalRole,
  TACTICAL_ROLE_LABELS,
} from '@/engine/synergyEngine';
import {
  FormationCode,
  PartnershipChemistryEvaluation,
  PartnershipSynergyEvaluation,
  Player,
  TacticalPlayerRole,
} from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest, getPlayerShirtNumber, PlayerAvatar } from '../ui/FootballVisuals';

const ALL_TACTICAL_ROLES: TacticalPlayerRole[] = [
  'SweeperKeeper',
  'ShotStopper',
  'BallPlayingDefender',
  'StopperCB',
  'AttackingFullback',
  'InvertedFullback',
  'DefensiveFullback',
  'AnchorMan',
  'DeepLyingPlaymaker',
  'BoxToBox',
  'AdvancedPlaymaker',
  'InsideForward',
  'TraditionalWinger',
  'Poacher',
  'CompleteForward',
  'FalseNine',
];

const FORMATIONS: FormationCode[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2'];

function getScoreBadgeColor(score: number): string {
  if (score >= 95) return 'bg-amber-500/20 text-amber-300 border-amber-400/50';
  if (score >= 80) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50';
  if (score >= 60) return 'bg-sky-500/20 text-sky-300 border-sky-400/50';
  if (score >= 40) return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/50';
  if (score >= 20) return 'bg-orange-500/20 text-orange-300 border-orange-400/50';
  return 'bg-rose-500/20 text-rose-300 border-rose-400/50';
}

function getLinkStrokeColor(score: number): string {
  if (score >= 80) return '#10b981'; // Emerald
  if (score >= 60) return '#38bdf8'; // Sky
  if (score >= 40) return '#f59e0b'; // Amber
  return '#f43f5e'; // Rose
}

export function ChemistrySynergyScreen() {
  const {
    gameState,
    updatePlayerTacticalRole,
    setUserFormation,
    setActiveTab,
  } = useGameStore();

  const [lensMode, setLensMode] = useState<'chemistry' | 'synergy'>('chemistry');
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);

  const userClub = useMemo(() => {
    if (!gameState) return null;
    return gameState.clubs.find((c) => c.id === gameState.manager.clubId) ?? gameState.clubs[0];
  }, [gameState]);

  const clubPlayers = useMemo(() => {
    if (!gameState || !userClub) return [];
    return gameState.players.filter((p) => p.clubId === userClub.id && !p.isYouth);
  }, [gameState, userClub]);

  const economy = useMemo(() => {
    if (!gameState) return null;
    return ensureEconomyState(gameState);
  }, [gameState]);

  const balanceConfig = economy?.balanceConfig ?? DEFAULT_BALANCE_CONFIG;

  const teamChemistry = useMemo(() => {
    if (!gameState || !userClub || !economy) return null;
    return evaluateTeamChemistry(
      userClub,
      clubPlayers,
      economy.pairChemistry,
      gameState.currentSeason,
      gameState.currentWeek,
      economy.activeBoosters,
      balanceConfig
    );
  }, [gameState, userClub, clubPlayers, economy, balanceConfig]);

  const teamSynergy = useMemo(() => {
    if (!userClub || !economy) return null;
    return evaluateTeamSynergy(
      userClub,
      clubPlayers,
      economy.activeBoosters,
      balanceConfig
    );
  }, [userClub, clubPlayers, economy, balanceConfig]);

  const matchModifiers = useMemo(() => {
    if (!teamChemistry || !teamSynergy) return null;
    return computeNonlinearMatchModifiers(
      teamChemistry.overallChemistry,
      teamSynergy.overallSynergy,
      balanceConfig
    );
  }, [teamChemistry, teamSynergy, balanceConfig]);

  if (!gameState || !userClub || !economy || !teamChemistry || !teamSynergy || !matchModifiers) {
    return null;
  }

  const slots = FORMATION_SLOTS[userClub.tactics.formation] ?? FORMATION_SLOTS['4-3-3'];
  const playerMap = new Map<string, Player>(clubPlayers.map((p) => [p.id, p]));

  const activeChemPairs = teamChemistry.partnerships;
  const activeSynPairs = teamSynergy.partnerships;
  const safePairIdx = Math.min(
    selectedPairIndex,
    Math.max(0, (lensMode === 'chemistry' ? activeChemPairs.length : activeSynPairs.length) - 1)
  );
  const selectedChemPair: PartnershipChemistryEvaluation | undefined = activeChemPairs[safePairIdx];
  const selectedSynPair: PartnershipSynergyEvaluation | undefined = activeSynPairs[safePairIdx];

  return (
    <div className="space-y-6" data-testid="chemistry-synergy-screen">
      {/* Top Executive Header */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <ClubCrest club={userClub} size={58} />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-pitch-500/15 border border-pitch-500/30 text-[11px] font-extrabold uppercase tracking-wider text-pitch-400">
                  Interpersonal &amp; Tactical Lab
                </span>
                <span className="text-xs text-slate-400">
                  Season {gameState.currentSeason} &bull; Week {gameState.currentWeek}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
                {userClub.name} Chemistry &amp; Synergy Center
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Chemistry measures interpersonal familiarity over time; Synergy measures tactical &amp; role complementarity.
              </p>
            </div>
          </div>

          {/* Quick Formation & Booster Shortcut */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-navy-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400">Formation:</span>
              {FORMATIONS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    soundManager.playUiClick();
                    setUserFormation(f);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-extrabold transition ${
                    userClub.tactics.formation === f
                      ? 'bg-pitch-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                setActiveTab('inventory');
              }}
              className="px-3.5 py-2 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 text-xs font-extrabold flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Activate Chemistry / Synergy Boosters</span>
            </button>
          </div>
        </div>

        {/* 3 Core Score Cards: Chemistry, Synergy, Controlled Match Engine Impact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Card 1: Team Chemistry */}
          <div className="p-4 rounded-2xl bg-navy-950/90 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Team Chemistry (10 Factors)</span>
              </span>
              <span
                data-testid="team-chemistry-tier"
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getScoreBadgeColor(
                  teamChemistry.overallChemistry
                )}`}
              >
                {teamChemistry.level}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div
                data-testid="team-chemistry-score"
                className="text-4xl font-black text-white"
              >
                {teamChemistry.overallChemistry}
                <span className="text-sm font-bold text-slate-500">/100</span>
              </div>
              <div className="text-right text-xs text-emerald-300 font-bold">
                Match Impact: {matchModifiers.chemistryModPct >= 0 ? '+' : ''}
                {matchModifiers.chemistryModPct}%
                <div className="text-[10px] text-slate-400 font-normal">
                  Max Cap: &plusmn;{balanceConfig.maxChemistryMatchBonusPct.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                style={{ width: `${teamChemistry.overallChemistry}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Influences passing combinations, movement coordination, attacking timing &amp; defensive communication.
            </p>
          </div>

          {/* Card 2: Team Synergy */}
          <div className="p-4 rounded-2xl bg-navy-950/90 border border-sky-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>Tactical Synergy (10 Factors)</span>
              </span>
              <span
                data-testid="team-synergy-tier"
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getScoreBadgeColor(
                  teamSynergy.overallSynergy
                )}`}
              >
                {teamSynergy.level}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div
                data-testid="team-synergy-score"
                className="text-4xl font-black text-white"
              >
                {teamSynergy.overallSynergy}
                <span className="text-sm font-bold text-slate-500">/100</span>
              </div>
              <div className="text-right text-xs text-sky-300 font-bold">
                Match Impact: {matchModifiers.synergyModPct >= 0 ? '+' : ''}
                {matchModifiers.synergyModPct}%
                <div className="text-[10px] text-slate-400 font-normal">
                  Max Cap: &plusmn;{balanceConfig.maxSynergyMatchBonusPct.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-sky-400 transition-all duration-300"
                style={{ width: `${teamSynergy.overallSynergy}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Influences tactical effectiveness, positional coverage, pressing coordination &amp; transition structure.
            </p>
          </div>

          {/* Card 3: Controlled Nonlinear Match Engine Output */}
          <div className="p-4 rounded-2xl bg-navy-950/90 border border-gold-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Combined Nonlinear Modifier</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-gold-500/15 text-gold-300 text-[10px] font-bold">
                Fair-Play Bounded
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div
                data-testid="combined-modifier-pct"
                className="text-4xl font-black text-gold-400"
              >
                {matchModifiers.combinedModPct >= 0 ? '+' : ''}
                {matchModifiers.combinedModPct}%
              </div>
              <div className="text-right text-xs text-slate-300 font-bold">
                Pass &amp; Move Mult: {matchModifiers.passingAndMovementMultiplier.toFixed(3)}x
                <div className="text-[10px] text-slate-400 font-normal">
                  Combined Hard Limit: &plusmn;{balanceConfig.maxCombinedChemSynergyBonusPct.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
              <div className="p-1.5 rounded bg-navy-900 border border-slate-800 text-center">
                <div className="text-slate-400">Passing &amp; Movement</div>
                <div className="font-black text-white">
                  {matchModifiers.passingAndMovementMultiplier.toFixed(3)}x
                </div>
              </div>
              <div className="p-1.5 rounded bg-navy-900 border border-slate-800 text-center">
                <div className="text-slate-400">Tactical &amp; Structure</div>
                <div className="font-black text-white">
                  {matchModifiers.tacticalAndStructureMultiplier.toFixed(3)}x
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Positional Unit Synergies Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: 'Defensive Backline',
            score: teamSynergy.positionalUnitSynergy.backline,
            color: 'text-emerald-400',
            desc: 'CB/FB spacing, offside trap & keeper sweep cohesion',
          },
          {
            label: 'Midfield Engine Room',
            score: teamSynergy.positionalUnitSynergy.engineRoom,
            color: 'text-sky-400',
            desc: 'Anchor pivot protection & creative progression',
          },
          {
            label: 'Attacking Frontline',
            score: teamSynergy.positionalUnitSynergy.frontline,
            color: 'text-amber-400',
            desc: 'Striker movement & inside-forward supply lanes',
          },
          {
            label: 'Left Flank Corridor',
            score: teamSynergy.positionalUnitSynergy.leftFlank,
            color: 'text-purple-400',
            desc: 'LB & LW overlapping / inverted corridor balance',
          },
          {
            label: 'Right Flank Corridor',
            score: teamSynergy.positionalUnitSynergy.rightFlank,
            color: 'text-pink-400',
            desc: 'RB & RW overlapping / inverted corridor balance',
          },
        ].map(({ label, score, color, desc }) => (
          <div
            key={label}
            className="bg-navy-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-extrabold uppercase ${color}`}>{label}</span>
              <span className="text-base font-black text-white">{score}</span>
            </div>
            <div className="text-[10px] font-bold text-slate-300">
              {getSynergyLevelLabel(score)}
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-2">{desc}</p>
          </div>
        ))}
      </div>

      {/* Main Split Grid: Interactive Pitch Partnership Graph + 10-Factor Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive Tactical Pitch with Partnership Links */}
        <div className="lg:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-pitch-400" />
                <span>Interactive Pitch Partnership &amp; Unit Network</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Click any partnership line or node to inspect all 10 interpersonal or tactical factors.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-navy-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setLensMode('chemistry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  lensMode === 'chemistry'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chemistry Links ({activeChemPairs.length})
              </button>
              <button
                type="button"
                onClick={() => setLensMode('synergy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  lensMode === 'synergy'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Synergy Links ({activeSynPairs.length})
              </button>
            </div>
          </div>

          {/* SVG Pitch + Player Nodes */}
          <div className="relative w-full h-[460px] rounded-2xl bg-gradient-to-b from-emerald-950 via-emerald-900/90 to-emerald-950 border-2 border-emerald-500/30 overflow-hidden shadow-inner">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="3" y="3" width="94" height="94" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
              <line x1="50" y1="3" x2="50" y2="97" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
              <rect x="3" y="24" width="14" height="52" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
              <rect x="83" y="24" width="14" height="52" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />

              {/* Partnership Link Lines */}
              {(lensMode === 'chemistry' ? activeChemPairs : activeSynPairs).map((pair, idx) => {
                const idxA = userClub.startingXI.indexOf(pair.playerAId);
                const idxB = userClub.startingXI.indexOf(pair.playerBId);
                const slotA = slots[idxA];
                const slotB = slots[idxB];
                if (!slotA || !slotB) return null;
                const isSelected = idx === safePairIdx;
                const color = getLinkStrokeColor(pair.score);
                return (
                  <g
                    key={`${pair.playerAId}-${pair.playerBId}`}
                    className="cursor-pointer"
                    onClick={() => {
                      soundManager.playUiClick();
                      setSelectedPairIndex(idx);
                    }}
                  >
                    <line
                      x1={slotA.x}
                      y1={slotA.y}
                      x2={slotB.x}
                      y2={slotB.y}
                      stroke={color}
                      strokeWidth={isSelected ? '1.6' : '0.85'}
                      strokeOpacity={isSelected ? '0.98' : '0.68'}
                      strokeDasharray={pair.score < 45 ? '1.5 1.5' : undefined}
                    />
                    <circle
                      cx={(slotA.x + slotB.x) / 2}
                      cy={(slotA.y + slotB.y) / 2}
                      r={isSelected ? '2.7' : '2.0'}
                      fill="#070b19"
                      stroke={color}
                      strokeWidth="0.6"
                    />
                    <text
                      x={(slotA.x + slotB.x) / 2}
                      y={(slotA.y + slotB.y) / 2 + 0.8}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="2.2"
                      fontWeight="bold"
                    >
                      {pair.score}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Starting XI Player Tokens */}
            {userClub.startingXI.slice(0, 11).map((pid, idx) => {
              const player = playerMap.get(pid);
              const slot = slots[idx];
              if (!player || !slot) return null;
              const indivChem = teamChemistry.individualPlayers.find((s) => s.playerId === player.id);
              const role = resolvePlayerTacticalRole(player, slot.position);

              return (
                <div
                  key={player.id}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                >
                  <div className="relative">
                    <PlayerAvatar player={player} club={userClub} size={38} />
                    <span
                      className={`absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black border ${getScoreBadgeColor(
                        indivChem?.individualChemistry ?? 60
                      )}`}
                    >
                      {indivChem?.individualChemistry ?? 60}
                    </span>
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded bg-navy-950/95 border border-slate-700/80 text-center shadow-lg">
                    <div className="text-[10px] font-extrabold text-white whitespace-nowrap">
                      #{getPlayerShirtNumber(player, idx)} {player.lastName}
                    </div>
                    <div className="text-[8px] font-bold text-pitch-400 whitespace-nowrap">
                      {slot.position} &bull; {TACTICAL_ROLE_LABELS[role].split(' ')[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Partnership Selector Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(lensMode === 'chemistry' ? activeChemPairs : activeSynPairs).map((pair, idx) => {
              const pA = playerMap.get(pair.playerAId);
              const pB = playerMap.get(pair.playerBId);
              if (!pA || !pB) return null;
              return (
                <button
                  key={`${pair.playerAId}-${pair.playerBId}`}
                  type="button"
                  onClick={() => setSelectedPairIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 ${
                    idx === safePairIdx
                      ? 'bg-navy-800 border-pitch-400 text-white'
                      : 'bg-navy-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>
                    {pA.lastName} &harr; {pB.lastName}
                  </span>
                  <span className="font-black text-pitch-400">{pair.score}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: 10-Factor Partnership Inspector & Archetype Breakdown */}
        <div className="lg:col-span-5 bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          {lensMode === 'chemistry' && selectedChemPair ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    10-Factor Interpersonal Chemistry Breakdown
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">
                    {selectedChemPair.playerAName} &amp; {selectedChemPair.playerBName}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">
                    {selectedChemPair.score}/100
                  </div>
                  <div className="text-[10px] font-bold text-slate-300">
                    {selectedChemPair.level}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    label: '1. Matches Played Together',
                    val: selectedChemPair.factors.matchesPlayedScore,
                    max: 22,
                  },
                  {
                    label: '2. Minutes Played Together',
                    val: selectedChemPair.factors.minutesPlayedScore,
                    max: 14,
                  },
                  {
                    label: '3. Shared Nationality',
                    val: selectedChemPair.factors.sharedNationalityScore,
                    max: 12,
                  },
                  {
                    label: '4. Shared Spoken Language',
                    val: selectedChemPair.factors.sharedLanguageScore,
                    max: 10,
                  },
                  {
                    label: '5. Club Tenure & Connections',
                    val: selectedChemPair.factors.previousClubScore,
                    max: 8,
                  },
                  {
                    label: '6. International Teammates',
                    val: selectedChemPair.factors.internationalTeammateScore,
                    max: 6,
                  },
                  {
                    label: '7. Positional Slot Familiarity',
                    val: selectedChemPair.factors.positionalFamiliarityScore,
                    max: 10,
                  },
                  {
                    label: '8. On-Pitch Playing Relationship',
                    val: selectedChemPair.factors.playingRelationshipScore,
                    max: 8,
                  },
                  {
                    label: '9. Personality Compatibility',
                    val: selectedChemPair.factors.personalityCompatibilityScore,
                    max: 6,
                  },
                  {
                    label: '10. Communication & Leadership',
                    val: selectedChemPair.factors.communicationLeadershipScore,
                    max: 6,
                  },
                ].map((f) => (
                  <div key={f.label} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 font-semibold">{f.label}</span>
                      <span className="text-emerald-300 font-bold">
                        +{f.val.toFixed(1)} / {f.max}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (f.val / f.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {selectedChemPair.factors.transferAdaptationPenalty < 0 && (
                <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>Transfer Adaptation Period Penalty:</span>
                    <span>{selectedChemPair.factors.transferAdaptationPenalty}</span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
                <div className="text-[10px] font-extrabold uppercase text-emerald-400">
                  Partnership Summary ({selectedChemPair.matchesTogether} Matches /{' '}
                  {selectedChemPair.minutesTogether} Mins)
                </div>
                <div className="text-xs text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{selectedChemPair.summaryReason}</span>
                </div>
              </div>
            </>
          ) : selectedSynPair ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">
                    10-Factor Tactical Synergy Breakdown
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">
                    {selectedSynPair.playerAName} &amp; {selectedSynPair.playerBName}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-sky-400">
                    {selectedSynPair.score}/100
                  </div>
                  <div className="text-[10px] font-bold text-slate-300">
                    {selectedSynPair.level}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 space-y-1">
                <div className="text-xs text-sky-200 font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{selectedSynPair.archetypeLabel}</span>
                </div>
                <p className="text-[11px] text-slate-300">{selectedSynPair.explanation}</p>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    label: '1. Tactical Role Compatibility',
                    val: teamSynergy.factors.roleCompatibilityScore,
                  },
                  {
                    label: '2. Positional Slot Relationship',
                    val: teamSynergy.factors.positionalRelationshipScore,
                  },
                  {
                    label: '3. Tactical Instructions Fit',
                    val: teamSynergy.factors.tacticalInstructionScore,
                  },
                  {
                    label: '4. Formation Compatibility',
                    val: teamSynergy.factors.formationCompatibilityScore,
                  },
                  {
                    label: '5. Complementary Attributes',
                    val: teamSynergy.factors.complementaryAttributesScore,
                  },
                  {
                    label: '6. Playing Style Compatibility',
                    val: teamSynergy.factors.playingStyleCompatibilityScore,
                  },
                  {
                    label: '7. Defensive & Attacking Balance',
                    val: teamSynergy.factors.defensiveAttackingBalanceScore,
                  },
                  {
                    label: '8. Spatial Positioning IQ',
                    val: teamSynergy.factors.playerPositioningScore,
                  },
                  {
                    label: '9. Tactical Familiarity',
                    val: teamSynergy.factors.tacticalFamiliarityScore,
                  },
                  {
                    label: '10. Team Structural Coherence',
                    val: teamSynergy.factors.teamStructureScore,
                  },
                ].map((f) => (
                  <div key={f.label} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 font-semibold">{f.label}</span>
                      <span className="text-sky-300 font-bold">{f.val} / 100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${Math.min(100, f.val)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Starting XI Tactical Role Assignment & Individual Chemistry Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold-400" />
              <span>Starting XI Tactical Roles, Languages, Personalities &amp; Individual Chemistry</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Assigning complementary tactical roles (e.g. Anchor CDM behind an Advanced Playmaker, or Overlapping Fullback behind an Inside Forward) dynamically updates Synergy.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Slot</th>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3">Nationality &amp; Languages</th>
                <th className="py-2.5 px-3">Personality</th>
                <th className="py-2.5 px-3">Assigned Tactical Role (Dynamic Synergy)</th>
                <th className="py-2.5 px-3 text-right">Indiv. Chemistry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {userClub.startingXI.slice(0, 11).map((pid, idx) => {
                const player = playerMap.get(pid);
                const slot = slots[idx];
                if (!player || !slot) return null;
                const indiv = teamChemistry.individualPlayers.find((i) => i.playerId === player.id);
                const activeRole = resolvePlayerTacticalRole(player, slot.position);

                return (
                  <tr key={player.id} className="hover:bg-navy-800/40">
                    <td className="py-2.5 px-3 font-black text-pitch-400">{slot.position}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatar player={player} club={userClub} size={30} />
                        <div>
                          <div className="font-bold text-white">
                            {player.firstName} {player.lastName}{' '}
                            <span className="text-gold-400 font-black">({player.overall})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Natural: {player.primaryPosition}
                            {player.secondaryPositions.length > 0
                              ? ` (${player.secondaryPositions.join(', ')})`
                              : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-200 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-sky-400" />
                        <span>{player.nationality}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(player.spokenLanguages ?? ['English']).join(', ')}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-300 font-semibold">
                      {player.personality ?? 'Professional'}
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        aria-label={`Tactical role for ${player.firstName} ${player.lastName}`}
                        value={activeRole}
                        onChange={(e) => {
                          soundManager.playUiClick();
                          updatePlayerTacticalRole(
                            player.id,
                            e.target.value as TacticalPlayerRole
                          );
                        }}
                        className="bg-navy-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-sky-300 focus:border-sky-400 focus:outline-none"
                      >
                        {ALL_TACTICAL_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {TACTICAL_ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-black border ${getScoreBadgeColor(
                          indiv?.individualChemistry ?? 60
                        )}`}
                      >
                        {indiv?.individualChemistry ?? 60} &bull;{' '}
                        {indiv?.level ?? 'Strong Understanding'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom 3 Panels: Improvement Opportunities, Tactical Notes, and Chemistry History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Improvement Opportunities */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Chemistry Improvement Opportunities</span>
          </h3>
          <div className="space-y-2">
            {teamChemistry.improvementOpportunities.map((opp, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2"
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{opp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tactical Synergy Coaching Report */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span>Tactical Synergy Coaching Notes</span>
          </h3>
          <div className="space-y-2">
            {teamSynergy.tacticalInsights.map((note, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chemistry & Synergy Development History */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>Cohesion Development History</span>
          </h3>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {economy.chemistryHistory
              .slice()
              .reverse()
              .map((entry, idx) => (
                <div
                  key={`${entry.season}-${entry.week}-${idx}`}
                  className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      S{entry.season} &bull; Week {entry.week}
                    </div>
                    <div className="text-[10px] text-slate-400">{entry.note}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                      Chem {entry.teamChemistry}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-bold">
                      Syn {entry.teamSynergy}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
