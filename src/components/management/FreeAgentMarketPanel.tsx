'use client';

import React, { useMemo, useState } from 'react';
import { Search, UserCheck, Sparkles, DollarSign, ShieldAlert } from 'lucide-react';
import {
  ContractOffer,
  evaluateContractOffer,
  filterFreeAgents,
  FreeAgentFilters,
  getFreeAgents,
} from '@/engine/freeAgentEngine';
import { Player } from '@/engine/types';
import { useGameStore } from '@/store/useGameStore';
import { PremiumCard, PrimaryButton, SecondaryButton } from '@/components/ui/DesignSystem';

type Position = Player['primaryPosition'];

const POSITIONS: (Position | 'ALL')[] = [
  'ALL', 'GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST',
];

export function FreeAgentMarketPanel() {
  const { gameState } = useGameStore();
  const [filters, setFilters] = useState<FreeAgentFilters>({
    search: '',
    position: 'ALL',
    minOvr: 50,
    category: 'all',
  });
  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
  const [offer, setOffer] = useState<ContractOffer>({
    weeklyWage: 5000,
    durationYears: 2,
    signingBonus: 10000,
    appearanceBonus: 500,
    squadRole: 'starter',
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  const userClub = gameState?.clubs.find((c) => c.id === gameState.manager.clubId);

  const freeAgents = useMemo(() => {
    if (!gameState) return [];
    return filterFreeAgents(getFreeAgents(gameState.players), filters).sort(
      (a, b) => b.overall - a.overall
    );
  }, [gameState, filters]);

  if (!gameState || !userClub) return null;

  const handleOpenNegotiation = (player: Player) => {
    setNegotiatingPlayer(player);
    setFeedback(null);
    setOffer({
      weeklyWage: Math.max(1500, player.weeklyWage || player.overall * 180),
      durationYears: 2,
      signingBonus: Math.round((player.weeklyWage || 3000) * 2),
      appearanceBonus: 500,
      squadRole: player.overall >= 72 ? 'starter' : 'rotation',
    });
  };

  const handleSubmitOffer = () => {
    if (!negotiatingPlayer) return;
    const result = evaluateContractOffer(negotiatingPlayer, offer, userClub.reputation);
    setFeedback(result.message);

    if (result.outcome === 'accepted') {
      const updatedPlayers = gameState.players.map((p) =>
        p.id === negotiatingPlayer.id
          ? {
              ...p,
              clubId: userClub.id,
              weeklyWage: offer.weeklyWage,
              contractEndSeason: gameState.currentSeason + offer.durationYears,
              roleExpectation: offer.squadRole,
            }
          : p
      );
      useGameStore.setState({
        gameState: {
          ...gameState,
          players: updatedPlayers,
        },
      });
      setTimeout(() => {
        setNegotiatingPlayer(null);
        setFeedback(null);
      }, 1200);
    } else if (result.counterOffer?.weeklyWage) {
      setOffer((prev) => ({
        ...prev,
        weeklyWage: result.counterOffer?.weeklyWage ?? prev.weeklyWage,
        signingBonus: result.counterOffer?.signingBonus ?? prev.signingBonus,
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Category & Filter Bar */}
      <PremiumCard className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['all', 'All Free Agents'],
                ['recently_released', 'Recently Released'],
                ['high_potential', 'High Potential'],
                ['experienced', 'Experienced'],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilters((f) => ({ ...f, category: cat }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  filters.category === cat
                    ? 'bg-lime-400 text-navy-950'
                    : 'bg-navy-950 text-slate-300 hover:bg-navy-800 border border-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {freeAgents.length} available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Search name or nationality..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-lime-400"
            />
          </div>

          <select
            value={filters.position ?? 'ALL'}
            onChange={(e) =>
              setFilters((f) => ({ ...f, position: e.target.value as Position | 'ALL' }))
            }
            className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white"
          >
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                Position: {pos}
              </option>
            ))}
          </select>

          <select
            value={filters.minOvr ?? 50}
            onChange={(e) => setFilters((f) => ({ ...f, minOvr: Number(e.target.value) }))}
            className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white"
          >
            <option value={50}>Min OVR: 50+</option>
            <option value={65}>Min OVR: 65+</option>
            <option value={72}>Min OVR: 72+</option>
            <option value={78}>Min OVR: 78+</option>
          </select>
        </div>
      </PremiumCard>

      {/* Free Agent Cards */}
      {freeAgents.length === 0 ? (
        <PremiumCard className="p-8 text-center text-xs text-slate-400">
          No free agents match your current filters.
        </PremiumCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {freeAgents.slice(0, 30).map((player) => (
            <PremiumCard key={player.id} className="p-4 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-lime-400/15 text-lime-300 text-[10px] font-black">
                      {player.primaryPosition}
                    </span>
                    <h4 className="text-sm font-black text-white">
                      {player.firstName} {player.lastName}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Age {player.age} &bull; {player.nationality} &bull; {player.preferredFoot} Foot
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-lime-400">{player.overall}</div>
                  <div className="text-[10px] text-slate-400">POT {player.potential}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-gold-400" />
                  £{(player.weeklyWage || 2500).toLocaleString()}/wk
                </span>
                <PrimaryButton onClick={() => handleOpenNegotiation(player)}>
                  Negotiate
                </PrimaryButton>
              </div>
            </PremiumCard>
          ))}
        </div>
      )}

      {/* Contract Negotiation Modal */}
      {negotiatingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <PremiumCard className="max-w-md w-full p-6 space-y-4 border-lime-400/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-lime-400" />
                <h3 className="text-base font-black text-white">
                  Contract Negotiation: {negotiatingPlayer.firstName} {negotiatingPlayer.lastName}
                </h3>
              </div>
              <span className="text-xs font-black text-lime-400">
                {negotiatingPlayer.overall} OVR
              </span>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>{feedback}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Weekly Wage (£{offer.weeklyWage.toLocaleString()})
                </label>
                <input
                  type="range"
                  min={1000}
                  max={50000}
                  step={500}
                  value={offer.weeklyWage}
                  onChange={(e) =>
                    setOffer((o) => ({ ...o, weeklyWage: Number(e.target.value) }))
                  }
                  className="w-full accent-lime-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Duration</label>
                  <select
                    value={offer.durationYears}
                    onChange={(e) =>
                      setOffer((o) => ({ ...o, durationYears: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  >
                    <option value={1}>1 Year</option>
                    <option value={2}>2 Years</option>
                    <option value={3}>3 Years</option>
                    <option value={4}>4 Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Squad Role</label>
                  <select
                    value={offer.squadRole}
                    onChange={(e) =>
                      setOffer((o) => ({
                        ...o,
                        squadRole: e.target.value as ContractOffer['squadRole'],
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-white"
                  >
                    <option value="star">Crucial (Star)</option>
                    <option value="starter">Important (Starter)</option>
                    <option value="rotation">Rotation</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <SecondaryButton onClick={() => setNegotiatingPlayer(null)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleSubmitOffer}>Submit Offer</PrimaryButton>
            </div>
          </PremiumCard>
        </div>
      )}
    </div>
  );
}
