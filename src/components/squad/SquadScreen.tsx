'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight,
  Eye,
  Shield,
  Zap,
  Sparkles,
} from 'lucide-react';
import { FORMATION_SLOTS, validateLineup } from '@/engine/ratings';
import { FormationCode, Player } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { getPlayerShirtNumber, PlayerAvatar } from '../ui/FootballVisuals';
import { PlayerProfileModal } from '../ui/PlayerProfileModal';

const FORMATIONS: FormationCode[] = [
  '4-3-3',
  '4-2-3-1',
  '4-4-2',
  '3-5-2',
  '3-4-3',
  '4-1-4-1',
  '5-3-2',
];

export function SquadScreen() {
  const {
    gameState,
    swapPlayersInSquad,
    autoPickUserLineup,
    setUserFormation,
    updatePlayerRole,
    updateClubCaptains,
  } = useGameStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [profileModalPlayer, setProfileModalPlayer] = useState<Player | null>(null);

  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const clubPlayers = gameState.players.filter((p) => p.clubId === userClub.id && !p.isYouth);
  const playerMap = new Map(clubPlayers.map((p) => [p.id, p]));

  const slots = FORMATION_SLOTS[userClub.tactics.formation] ?? FORMATION_SLOTS['4-3-3'];
  const validation = validateLineup(userClub.startingXI, userClub.substitutes, clubPlayers);

  // Compute Team Strength (ATT / MID / DEF) and Squad Chemistry (0..100)
  const starters = userClub.startingXI
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => !!p);

  const attPlayers = starters.filter((p) => ['ST', 'LW', 'RW', 'CAM'].includes(p.primaryPosition));
  const midPlayers = starters.filter((p) => ['CM', 'CDM', 'CAM'].includes(p.primaryPosition));
  const defPlayers = starters.filter((p) => ['CB', 'LB', 'RB', 'GK'].includes(p.primaryPosition));

  const avgOvr = (list: Player[]) =>
    list.length > 0
      ? Math.round(list.reduce((s, p) => s + p.overall, 0) / list.length)
      : 70;

  const attStrength = avgOvr(attPlayers);
  const midStrength = avgOvr(midPlayers);
  const defStrength = avgOvr(defPlayers);

  let inPositionCount = 0;
  slots.forEach((slot, idx) => {
    const p = playerMap.get(userClub.startingXI[idx]);
    if (!p) return;
    if (p.primaryPosition === slot.position) inPositionCount += 1;
    else if (p.secondaryPositions.includes(slot.position)) inPositionCount += 0.7;
  });
  const avgMorale =
    starters.reduce((s, p) => s + p.morale, 0) / Math.max(1, starters.length);
  const chemistry = Math.min(
    100,
    Math.round((inPositionCount / 11) * 70 + (avgMorale / 100) * 30)
  );

  const handlePlayerTapOrClick = async (targetPlayerId: string) => {
    soundManager.playUiClick();
    if (!selectedPlayerId) {
      setSelectedPlayerId(targetPlayerId);
      setInspectedPlayer(playerMap.get(targetPlayerId) ?? null);
      return;
    }
    if (selectedPlayerId === targetPlayerId) {
      setSelectedPlayerId(null);
      return;
    }
    await swapPlayersInSquad(selectedPlayerId, targetPlayerId);
    setSelectedPlayerId(null);
  };

  const handleDropOnPlayer = async (targetPlayerId: string) => {
    if (draggedPlayerId && draggedPlayerId !== targetPlayerId) {
      soundManager.playUiClick();
      await swapPlayersInSquad(draggedPlayerId, targetPlayerId);
    }
    setDraggedPlayerId(null);
    setSelectedPlayerId(null);
  };

  return (
    <div className="space-y-6" data-testid="squad-screen">
      <PlayerProfileModal
        player={profileModalPlayer}
        onClose={() => setProfileModalPlayer(null)}
        allPlayers={gameState.players}
        clubs={gameState.clubs}
      />

      {/* Top Action Bar & Team Strength / Chemistry Indicators */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="formation-select" className="text-xs font-bold uppercase text-slate-400">
              Formation:
            </label>
            <select
              id="formation-select"
              data-testid="formation-select"
              value={userClub.tactics.formation}
              onChange={(e) => {
                soundManager.playUiClick();
                setUserFormation(e.target.value as FormationCode);
              }}
              className="px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-700 text-sm font-bold text-pitch-400 focus:outline-none focus:border-pitch-500"
            >
              {FORMATIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <button
              type="button"
              data-testid="autopick-lineup-btn"
              onClick={() => {
                soundManager.playUiClick();
                autoPickUserLineup();
              }}
              className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-pitch-400" />
              <span>Auto-Pick Best XI</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold uppercase text-gold-400">Captain (C):</span>
              <select
                value={userClub.captainId ?? userClub.startingXI[0]}
                onChange={(e) => {
                  soundManager.playUiClick();
                  updateClubCaptains(e.target.value, userClub.viceCaptainId);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-white"
              >
                {clubPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{getPlayerShirtNumber(p)} {p.firstName[0]}. {p.lastName} ({p.attributes.leadership ?? 70} LDR)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lineup Validation Status Pill */}
          <div className="flex items-center gap-2">
            {validation.valid ? (
              <span
                data-testid="lineup-valid-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pitch-500/20 border border-pitch-500/40 text-pitch-400 text-xs font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                Lineup Valid (11 Starters, 1 GK)
              </span>
            ) : (
              <span
                data-testid="lineup-invalid-badge"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold"
              >
                <AlertTriangle className="w-4 h-4" />
                {validation.errors[0]}
              </span>
            )}
          </div>
        </div>

        {/* Team Strength & Squad Chemistry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-pitch-400" />
              Attack Rating
            </span>
            <span className="text-base font-black text-pitch-400">{attStrength}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              Midfield Rating
            </span>
            <span className="text-base font-black text-gold-400">{midStrength}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              Defense Rating
            </span>
            <span className="text-base font-black text-sky-400">{defStrength}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-400">
              Tactical Chemistry
            </span>
            <span className="text-base font-black text-white">{chemistry}%</span>
          </div>
        </div>
      </div>

      {selectedPlayerId && (
        <div className="px-4 py-2.5 rounded-xl bg-pitch-600/20 border border-pitch-500 text-pitch-400 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            <span>
              Swap Mode Active: Tap any other player on the pitch, bench, or reserves to swap positions with{' '}
              {playerMap.get(selectedPlayerId)?.lastName}.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const p = playerMap.get(selectedPlayerId);
                if (p) setProfileModalPlayer(p);
              }}
              className="px-2.5 py-1 rounded bg-pitch-600 text-white text-[11px] font-bold"
            >
              Open Full Profile &amp; Radar
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlayerId(null)}
              className="underline text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Interactive Pitch Visualiser */}
        <div className="xl:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Starting XI &bull; Tactical Pitch ({userClub.tactics.formation})
            </h2>
            <span className="text-xs text-slate-400">Drag &amp; Drop or Tap-to-Swap</span>
          </div>

          <div
            className="relative w-full h-[500px] rounded-2xl overflow-hidden border-2 border-pitch-500/50 select-none shadow-inner"
            style={{
              background:
                'repeating-linear-gradient(90deg, #064e3b 0px, #064e3b 52px, #047857 52px, #047857 104px)',
            }}
          >
            {/* Detailed Pitch SVG Markings */}
            <svg
              viewBox="0 0 1000 620"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-65"
            >
              <rect x="25" y="20" width="950" height="580" fill="none" stroke="#fff" strokeWidth="3" />
              <line x1="500" y1="20" x2="500" y2="600" stroke="#fff" strokeWidth="3" />
              <circle cx="500" cy="310" r="76" fill="none" stroke="#fff" strokeWidth="3" />
              <circle cx="500" cy="310" r="5" fill="#fff" />
              <rect x="25" y="135" width="145" height="350" fill="none" stroke="#fff" strokeWidth="3" />
              <rect x="25" y="215" width="55" height="190" fill="none" stroke="#fff" strokeWidth="3" />
              <rect x="830" y="135" width="145" height="350" fill="none" stroke="#fff" strokeWidth="3" />
              <rect x="920" y="215" width="55" height="190" fill="none" stroke="#fff" strokeWidth="3" />
            </svg>

            {slots.map((slot, idx) => {
              const pId = userClub.startingXI[idx];
              const player = pId ? playerMap.get(pId) : undefined;
              if (!player) return null;
              const isSelected = selectedPlayerId === player.id;
              const isOutOfPos =
                player.primaryPosition !== slot.position &&
                !player.secondaryPositions.includes(slot.position);
              const shirtNo = getPlayerShirtNumber(player, idx);

              return (
                <div
                  key={slot.slotIndex}
                  draggable
                  onDragStart={() => setDraggedPlayerId(player.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnPlayer(player.id)}
                  onClick={() => handlePlayerTapOrClick(player.id)}
                  data-testid={`pitch-slot-${idx}`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition transform hover:scale-105 flex flex-col items-center ${
                    isSelected ? 'scale-110 z-20' : 'z-10'
                  }`}
                >
                  {/* Player Card Token */}
                  <div
                    className={`relative rounded-xl p-0.5 shadow-xl border-2 ${
                      isSelected
                        ? 'ring-4 ring-gold-400 border-white bg-gold-500'
                        : isOutOfPos
                          ? 'border-amber-400 bg-amber-950'
                          : 'border-white/90 bg-navy-950'
                    }`}
                  >
                    <PlayerAvatar
                      player={player}
                      clubColor={slot.position === 'GK' ? '#f59e0b' : userClub.primaryColor}
                      secondaryColor={userClub.secondaryColor}
                      size={42}
                    />
                    <span className="absolute -top-2 -left-2 px-1.5 py-0.2 rounded bg-gold-500 text-navy-950 font-black text-[10px] shadow">
                      {player.overall}
                    </span>
                    <span className="absolute -top-2 -right-2 px-1 py-0.2 rounded bg-navy-900 border border-slate-700 text-white font-black text-[9px]">
                      #{shirtNo}
                    </span>
                  </div>

                  <div className="mt-1 px-2 py-0.5 rounded-md bg-navy-950/95 border border-slate-700 text-[10px] font-extrabold text-white whitespace-nowrap shadow flex items-center gap-1">
                    <span className="text-pitch-400">{slot.position}</span>
                    <span>{player.lastName}</span>
                    {userClub.captainId === player.id && (
                      <span className="px-1 rounded bg-gold-500 text-navy-950 text-[8px] font-black">C</span>
                    )}
                    {userClub.viceCaptainId === player.id && (
                      <span className="px-1 rounded bg-slate-700 text-gold-400 text-[8px] font-black">VC</span>
                    )}
                  </div>
                  <div className="w-12 h-1 bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-white/10">
                    <div
                      className="h-full bg-pitch-400"
                      style={{ width: `${player.fitness}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inspected Player Quick Strip + Role Selector & Profile Button */}
          {inspectedPlayer && (
            <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  player={inspectedPlayer}
                  clubColor={userClub.primaryColor}
                  secondaryColor={userClub.secondaryColor}
                  size={52}
                />
                <div>
                  <div className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span>
                      #{getPlayerShirtNumber(inspectedPlayer)} {inspectedPlayer.firstName}{' '}
                      {inspectedPlayer.lastName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-pitch-600/20 text-pitch-400 text-xs">
                      {inspectedPlayer.primaryPosition}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Age {inspectedPlayer.age} &bull; {inspectedPlayer.nationality} &bull; Wage: £
                    {inspectedPlayer.weeklyWage.toLocaleString()}/wk &bull; Value: £
                    {(inspectedPlayer.marketValue / 1000000).toFixed(2)}M
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-bold">Squad Role:</span>
                  <select
                    value={inspectedPlayer.roleExpectation}
                    onChange={(e) =>
                      updatePlayerRole(
                        inspectedPlayer.id,
                        e.target.value as 'star' | 'starter' | 'rotation' | 'prospect'
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-xs font-bold text-gold-400 uppercase"
                  >
                    <option value="star">Star Player</option>
                    <option value="starter">First Team Starter</option>
                    <option value="rotation">Squad Rotation</option>
                    <option value="prospect">Future Prospect</option>
                  </select>
                </div>

                <button
                  type="button"
                  data-testid="open-player-profile-btn"
                  onClick={() => setProfileModalPlayer(inspectedPlayer)}
                  className="px-3.5 py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Profile &amp; Radar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bench & Reserves Lists */}
        <div className="xl:col-span-5 space-y-6">
          {/* Substitutes (7) */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-400">
              Substitutes Bench ({userClub.substitutes.length} / 7)
            </h3>
            <div className="space-y-1.5">
              {userClub.substitutes.map((subId, idx) => {
                const p = playerMap.get(subId);
                if (!p) return null;
                const isSelected = selectedPlayerId === p.id;
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDraggedPlayerId(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnPlayer(p.id)}
                    onClick={() => handlePlayerTapOrClick(p.id)}
                    data-testid={`sub-slot-${idx}`}
                    className={`p-2 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-pitch-600/20 border-pitch-500'
                        : 'bg-navy-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <PlayerAvatar
                        player={p}
                        clubColor={userClub.primaryColor}
                        secondaryColor={userClub.secondaryColor}
                        size={36}
                      />
                      <span className="w-8 text-center py-0.5 rounded bg-slate-800 text-xs font-bold text-pitch-400">
                        {p.primaryPosition}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">
                          #{getPlayerShirtNumber(p)} {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Age {p.age} &bull; Fit {p.fitness}% &bull; Morale {p.morale}% &bull; £{(p.marketValue / 1000000).toFixed(1)}M &bull; C:{p.contractEndSeason}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-gold-400">{p.overall}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileModalPlayer(p);
                        }}
                        className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300"
                        title="Inspect Player Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reserves */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Reserve Squad ({userClub.reserves.length})
            </h3>
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
              {userClub.reserves.map((resId) => {
                const p = playerMap.get(resId);
                if (!p) return null;
                const isSelected = selectedPlayerId === p.id;
                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDraggedPlayerId(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnPlayer(p.id)}
                    onClick={() => handlePlayerTapOrClick(p.id)}
                    className={`p-2 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-pitch-600/20 border-pitch-500'
                        : 'bg-navy-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <PlayerAvatar
                        player={p}
                        clubColor={userClub.primaryColor}
                        secondaryColor={userClub.secondaryColor}
                        size={34}
                      />
                      <span className="w-8 text-center py-0.5 rounded bg-slate-800 text-xs font-bold text-slate-300">
                        {p.primaryPosition}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">
                          #{getPlayerShirtNumber(p)} {p.firstName} {p.lastName}
                          {p.injuryWeeks > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px]">
                              INJ {p.injuryWeeks}w
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Age {p.age} &bull; Fit {p.fitness}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-200">{p.overall}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileModalPlayer(p);
                        }}
                        className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300"
                        title="Inspect Player Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
