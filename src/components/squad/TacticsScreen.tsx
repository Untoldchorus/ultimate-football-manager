import React from 'react';
import { Sliders, ShieldAlert, Zap, Compass } from 'lucide-react';
import { DEFAULT_BALANCE_CONFIG } from '@/engine/balanceConfig';
import { ensureEconomyState } from '@/engine/boosterEconomy';
import { evaluateTeamSynergy } from '@/engine/synergyEngine';
import {
  AttackingStyle,
  DefensiveLine,
  PressingIntensity,
  TacticalMentality,
} from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

export function TacticsScreen() {
  const { gameState, updateUserTactics, setActiveTab } = useGameStore();
  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const clubPlayers = gameState.players.filter((p) => p.clubId === userClub.id && !p.isYouth);
  const economy = ensureEconomyState(gameState);
  const synergy = evaluateTeamSynergy(
    userClub,
    clubPlayers,
    economy.activeBoosters,
    economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG
  );
  const t = userClub.tactics;

  return (
    <div className="space-y-6" data-testid="tactics-screen">
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-pitch-400" />
            <div>
              <h2 className="text-lg font-extrabold text-white">Tactical Identity &amp; Instructions</h2>
              <p className="text-xs text-slate-400">
                All tactical parameters feed directly into the match simulation engine.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-pitch-500/20 text-pitch-400 text-xs font-bold">
              Active Formation: {t.formation}
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
                Tactical Synergy: {synergy.overallSynergy}/100 ({synergy.level})
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mentality */}
          <div className="space-y-2">
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
              className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-slate-700 text-sm font-bold text-white"
            >
              <option value="ultraDefensive">Ultra Defensive (Park the Bus)</option>
              <option value="defensive">Cautious / Defensive</option>
              <option value="balanced">Balanced Standard</option>
              <option value="attacking">Positive / Attacking</option>
              <option value="allOutAttack">All-Out Overload</option>
            </select>
          </div>

          {/* Attacking Style */}
          <div className="space-y-2">
            <label htmlFor="attacking-style-select" className="block text-xs font-bold uppercase text-slate-400">
              Attacking Style
            </label>
            <select
              id="attacking-style-select"
              value={t.attackingStyle}
              onChange={(e) => {
                soundManager.playUiClick();
                updateUserTactics({ attackingStyle: e.target.value as AttackingStyle });
              }}
              className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-slate-700 text-sm font-bold text-white"
            >
              <option value="possession">Control Possession</option>
              <option value="tikiTaka">Tiki-Taka Short Passing</option>
              <option value="wingPlay">Wing Play &amp; Early Crosses</option>
              <option value="directCounter">Direct Counter-Attack</option>
              <option value="balanced">Fluid Balanced</option>
            </select>
          </div>

          {/* Pressing Intensity */}
          <div className="space-y-2">
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
              className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-slate-700 text-sm font-bold text-white"
            >
              <option value="low">Low Block (Conserve Stamina)</option>
              <option value="medium">Standard Mid-Block</option>
              <option value="high">High Press</option>
              <option value="gegenpress">Relentless Gegenpress</option>
            </select>
          </div>

          {/* Defensive Line */}
          <div className="space-y-2">
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
              className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-slate-700 text-sm font-bold text-white"
            >
              <option value="deep">Deep Defensive Line</option>
              <option value="standard">Standard Line</option>
              <option value="high">High Line</option>
            </select>
          </div>
        </div>

        {/* Sliders: Width, Tempo, Directness */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 uppercase">Attacking Width</span>
              <span className="text-pitch-400">{t.width}/100</span>
            </div>
            <input
              type="range"
              min={10}
              max={95}
              value={t.width}
              onChange={(e) => updateUserTactics({ width: Number(e.target.value) })}
              className="w-full accent-pitch-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 uppercase">Match Tempo</span>
              <span className="text-pitch-400">{t.tempo}/100</span>
            </div>
            <input
              type="range"
              min={10}
              max={95}
              value={t.tempo}
              onChange={(e) => updateUserTactics({ tempo: Number(e.target.value) })}
              className="w-full accent-pitch-500"
            />
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 uppercase">Passing Directness</span>
              <span className="text-pitch-400">{t.directness}/100</span>
            </div>
            <input
              type="range"
              min={10}
              max={95}
              value={t.directness}
              onChange={(e) => updateUserTactics({ directness: Number(e.target.value) })}
              className="w-full accent-pitch-500"
            />
          </div>
        </div>

        {/* Toggles: Counter-Pressing & Offside Trap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => {
              soundManager.playUiClick();
              updateUserTactics({ counterPressing: !t.counterPressing });
            }}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition ${
              t.counterPressing
                ? 'bg-pitch-600/20 border-pitch-500 text-white'
                : 'bg-navy-950 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-pitch-400" />
              <div>
                <div className="text-sm font-bold text-white">Counter-Press Immediately</div>
                <div className="text-xs text-slate-400">Swarm opponents upon losing possession</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-navy-800">
              {t.counterPressing ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playUiClick();
              updateUserTactics({ offsideTrap: !t.offsideTrap });
            }}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition ${
              t.offsideTrap
                ? 'bg-pitch-600/20 border-pitch-500 text-white'
                : 'bg-navy-950 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-gold-400" />
              <div>
                <div className="text-sm font-bold text-white">Step Up / Offside Trap</div>
                <div className="text-xs text-slate-400">Catch opposing strikers behind the backline</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-navy-800">
              {t.offsideTrap ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
