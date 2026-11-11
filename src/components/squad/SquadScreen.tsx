import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { FORMATION_SLOTS, validateLineup } from '@/engine/ratings';
import { FormationCode, Player } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

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
  const { gameState, swapPlayersInSquad, autoPickUserLineup, setUserFormation } = useGameStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const clubPlayers = gameState.players.filter((p) => p.clubId === userClub.id && !p.isYouth);
  const playerMap = new Map(clubPlayers.map((p) => [p.id, p]));

  const slots = FORMATION_SLOTS[userClub.tactics.formation] ?? FORMATION_SLOTS['4-3-3'];
  const validation = validateLineup(userClub.startingXI, userClub.substitutes, clubPlayers);

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
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-navy-900 border border-slate-800 rounded-2xl p-4">
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
        </div>

        {/* Validation Status Pill */}
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

      {selectedPlayerId && (
        <div className="px-4 py-2.5 rounded-xl bg-pitch-600/20 border border-pitch-500 text-pitch-400 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            <span>
              Swap Mode Active: Tap any other player on the pitch, bench, or reserves to swap positions with{' '}
              {playerMap.get(selectedPlayerId)?.lastName}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPlayerId(null)}
            className="underline text-white ml-4"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Interactive Pitch Visualiser */}
        <div className="xl:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Starting XI &bull; Interactive Pitch ({userClub.tactics.formation})
            </h2>
            <span className="text-xs text-slate-400">Drag &amp; Drop or Tap-to-Swap</span>
          </div>

          <div
            className="relative w-full h-[460px] rounded-xl overflow-hidden border-2 border-pitch-500/40 select-none"
            style={{
              background:
                'repeating-linear-gradient(90deg, #064e3b 0px, #064e3b 48px, #065f46 48px, #065f46 96px)',
            }}
          >
            {/* Pitch markings */}
            <div className="absolute inset-3 border-2 border-white/30 rounded pointer-events-none" />
            <div className="absolute top-3 bottom-3 left-1/2 w-0.5 bg-white/30 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-white/30 pointer-events-none" />
            <div className="absolute top-1/4 bottom-1/4 left-3 w-16 border-r-2 border-y-2 border-white/30 pointer-events-none" />
            <div className="absolute top-1/4 bottom-1/4 right-3 w-16 border-l-2 border-y-2 border-white/30 pointer-events-none" />

            {slots.map((slot, idx) => {
              const pId = userClub.startingXI[idx];
              const player = pId ? playerMap.get(pId) : undefined;
              if (!player) return null;
              const isSelected = selectedPlayerId === player.id;
              const isOutOfPos =
                player.primaryPosition !== slot.position &&
                !player.secondaryPositions.includes(slot.position);

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
                  <div
                    className={`w-11 h-11 rounded-full flex flex-col items-center justify-center font-extrabold text-xs shadow-lg border-2 ${
                      isSelected
                        ? 'ring-4 ring-gold-400 border-white'
                        : isOutOfPos
                          ? 'border-amber-400'
                          : 'border-white'
                    }`}
                    style={{
                      backgroundColor:
                        slot.position === 'GK' ? '#f59e0b' : userClub.primaryColor,
                      color: slot.position === 'GK' ? '#000' : userClub.secondaryColor,
                    }}
                  >
                    <span>{player.overall}</span>
                    <span className="text-[9px] opacity-90">{slot.position}</span>
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded bg-navy-950/90 border border-slate-700 text-[11px] font-bold text-white whitespace-nowrap shadow">
                    {player.lastName}
                  </div>
                  <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className="h-full bg-pitch-400"
                      style={{ width: `${player.fitness}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inspected Player Attributes Strip */}
          {inspectedPlayer && (
            <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold text-white">
                  {inspectedPlayer.firstName} {inspectedPlayer.lastName}{' '}
                  <span className="text-pitch-400">({inspectedPlayer.primaryPosition})</span>
                </div>
                <div className="text-xs text-slate-400">
                  Age {inspectedPlayer.age} &bull; {inspectedPlayer.nationality} &bull; Wage: £
                  {inspectedPlayer.weeklyWage.toLocaleString()}/wk &bull; Value: £
                  {(inspectedPlayer.marketValue / 1000000).toFixed(2)}M
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="px-2.5 py-1 rounded bg-navy-800 text-slate-200">
                  PAC <strong className="text-pitch-400">{inspectedPlayer.attributes.pace}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-navy-800 text-slate-200">
                  SHO <strong className="text-pitch-400">{inspectedPlayer.attributes.shooting}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-navy-800 text-slate-200">
                  PAS <strong className="text-pitch-400">{inspectedPlayer.attributes.passing}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-navy-800 text-slate-200">
                  DRI <strong className="text-pitch-400">{inspectedPlayer.attributes.dribbling}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-navy-800 text-slate-200">
                  DEF <strong className="text-pitch-400">{inspectedPlayer.attributes.tackling}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-navy-800 text-slate-200">
                  PHY <strong className="text-pitch-400">{inspectedPlayer.attributes.strength}</strong>
                </span>
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
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-pitch-600/20 border-pitch-500'
                        : 'bg-navy-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center py-0.5 rounded bg-slate-800 text-xs font-bold text-pitch-400">
                        {p.primaryPosition}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Age {p.age} &bull; Fit {p.fitness}% &bull; Morale {p.morale}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-gold-400">{p.overall}</span>
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
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-pitch-600/20 border-pitch-500'
                        : 'bg-navy-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center py-0.5 rounded bg-slate-800 text-xs font-bold text-slate-300">
                        {p.primaryPosition}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {p.firstName} {p.lastName}
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
                    <span className="text-sm font-black text-slate-200">{p.overall}</span>
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
