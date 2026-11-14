'use client';

import React, { useMemo, useState } from 'react';
import {
  Award,
  Backpack,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Filter,
  Flame,
  Gift,
  History,
  Layers,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_BALANCE_CONFIG,
  getAttributeTrainingEfficiency,
} from '@/engine/balanceConfig';
import {
  BOOSTER_CATALOG,
  ensureEconomyState,
  getBoosterDefinition,
} from '@/engine/boosterEconomy';
import { BoosterCategory, ItemRarity, Player } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest, PlayerAvatar } from '../ui/FootballVisuals';

const RARITY_ORDER: Record<ItemRarity, number> = {
  Legendary: 4,
  Epic: 3,
  Rare: 2,
  Common: 1,
};

export function getRarityCardStyle(rarity: ItemRarity): {
  border: string;
  badge: string;
  glow: string;
} {
  switch (rarity) {
    case 'Legendary':
      return {
        border: 'border-amber-400/60 bg-gradient-to-b from-amber-950/40 via-navy-950 to-navy-950',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
        glow: 'shadow-lg shadow-amber-500/10',
      };
    case 'Epic':
      return {
        border: 'border-purple-400/50 bg-gradient-to-b from-purple-950/35 via-navy-950 to-navy-950',
        badge: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
        glow: 'shadow-lg shadow-purple-500/10',
      };
    case 'Rare':
      return {
        border: 'border-sky-400/50 bg-gradient-to-b from-sky-950/35 via-navy-950 to-navy-950',
        badge: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
        glow: 'shadow-md shadow-sky-500/10',
      };
    default:
      return {
        border: 'border-slate-700/80 bg-navy-950',
        badge: 'bg-slate-800 text-slate-300 border-slate-600',
        glow: '',
      };
  }
}

export function BoosterInventoryScreen() {
  const {
    gameState,
    activateBooster,
    claimDailyLogin,
    claimObjective,
    setActiveTab,
  } = useGameStore();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | BoosterCategory>('ALL');
  const [sortBy, setSortBy] = useState<'rarity_desc' | 'rarity_asc' | 'quantity'>('rarity_desc');
  const [selectedTargetPlayerId, setSelectedTargetPlayerId] = useState<string>('');
  const [selectedPartnerPlayerId, setSelectedPartnerPlayerId] = useState<string>('');
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const userClub = useMemo(() => {
    if (!gameState) return null;
    return gameState.clubs.find((c) => c.id === gameState.manager.clubId) ?? gameState.clubs[0];
  }, [gameState]);

  const seniorPlayers = useMemo(() => {
    if (!gameState || !userClub) return [];
    return gameState.players.filter((p) => p.clubId === userClub.id && !p.isYouth);
  }, [gameState, userClub]);

  const economy = useMemo(() => {
    if (!gameState) return null;
    return ensureEconomyState(gameState);
  }, [gameState]);

  if (!gameState || !userClub || !economy) return null;

  const balanceConfig = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
  const effectiveTargetId = selectedTargetPlayerId || seniorPlayers[0]?.id || '';
  const effectivePartnerId =
    selectedPartnerPlayerId ||
    seniorPlayers.find((p) => p.id !== effectiveTargetId)?.id ||
    '';

  const targetPlayer: Player | undefined = seniorPlayers.find((p) => p.id === effectiveTargetId);
  const currentWeekStamp = gameState.currentSeason * 100 + gameState.currentWeek;
  const dailyLoginClaimedThisWeek = economy.lastDailyLoginClaimWeek === currentWeekStamp;

  // Filtered and sorted owned inventory items
  const enrichedInventory = economy.inventory
    .map((rec) => {
      const def = getBoosterDefinition(rec.itemId);
      return def ? { record: rec, def } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .filter((entry) =>
      categoryFilter === 'ALL' ? true : entry.def.category === categoryFilter
    )
    .sort((a, b) => {
      if (sortBy === 'rarity_desc') {
        return RARITY_ORDER[b.def.rarity] - RARITY_ORDER[a.def.rarity];
      }
      if (sortBy === 'rarity_asc') {
        return RARITY_ORDER[a.def.rarity] - RARITY_ORDER[b.def.rarity];
      }
      return b.record.quantity - a.record.quantity;
    });

  const handleActivate = async (itemId: string) => {
    soundManager.playUiClick();
    const res = await activateBooster(itemId, effectiveTargetId, effectivePartnerId);
    setStatusBanner({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleClaimDailyLogin = async () => {
    soundManager.playUiClick();
    const res = await claimDailyLogin();
    setStatusBanner({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleClaimObjective = async (objId: string) => {
    soundManager.playUiClick();
    const res = await claimObjective(objId);
    setStatusBanner({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  return (
    <div className="space-y-6" data-testid="booster-inventory-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ClubCrest club={userClub} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-[11px] font-extrabold uppercase tracking-wider text-gold-400">
                  Club Consumables &amp; Objectives
                </span>
                <span className="text-xs text-slate-400">
                  Max {balanceConfig.maxActiveBoostersPerPlayer} Active Boosters / Player &bull; Anti-Stacking Active
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
                Booster Inventory &amp; Progression Hub
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage training, chemistry, synergy, recovery, and morale items with fair-play diminishing returns.
              </p>
            </div>
          </div>

          {/* Currency & Store Shortcut */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-800 flex items-center gap-2">
              <Coins className="w-4 h-4 text-pitch-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Club Coins</div>
                <div className="text-sm font-black text-white" data-testid="inv-soft-coins">
                  {economy.softCurrency.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-navy-950 border border-gold-500/30 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <div>
                <div className="text-[10px] text-gold-400 font-bold uppercase">Premium Coins</div>
                <div className="text-sm font-black text-gold-300" data-testid="inv-premium-coins">
                  {economy.premiumCurrency.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                setActiveTab('store');
              }}
              className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 text-xs font-extrabold uppercase tracking-wider transition shadow-lg shadow-gold-500/20"
            >
              Visit Marketplace &amp; Starter Pack
            </button>
          </div>
        </div>

        {statusBanner && (
          <div
            data-testid="inventory-status-banner"
            className={`mt-4 p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
              statusBanner.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusBanner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Daily Login Reward & Diminishing Returns Info Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daily Login Streak Banner */}
        <div className="lg:col-span-5 bg-navy-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pitch-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Daily Matchweek Login Reward</span>
              </span>
              <h2 className="text-lg font-black text-white mt-0.5">
                Streak Day #{economy.dailyLoginStreak}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Log in each matchweek to receive Club Coins and rotating Common/Rare recovery &amp; training items.
              </p>
            </div>
            <Gift className="w-8 h-8 text-gold-400 shrink-0" />
          </div>

          <button
            type="button"
            data-testid="claim-daily-login-btn"
            disabled={dailyLoginClaimedThisWeek}
            onClick={handleClaimDailyLogin}
            className={`w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition ${
              dailyLoginClaimedThisWeek
                ? 'bg-navy-950 border border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-pitch-600 hover:bg-pitch-500 text-white shadow-lg shadow-pitch-600/25'
            }`}
          >
            {dailyLoginClaimedThisWeek
              ? `Claimed for Week ${gameState.currentWeek} (Advance Week for Next)`
              : `Claim Day ${economy.dailyLoginStreak + 1} Reward (+Coins & Booster)`}
          </button>
        </div>

        {/* Target Player Selector & Diminishing Returns Preview */}
        <div className="lg:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              <span>Target Player &amp; Anti-Overbuff Training Efficiency</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Primary Attribute Cap: <strong className="text-white">{balanceConfig.maxPrimaryAttributeCap}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Primary Target Player (for Player / Pair Boosters)
              </label>
              <select
                data-testid="booster-target-player-select"
                value={effectiveTargetId}
                onChange={(e) => setSelectedTargetPlayerId(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
              >
                {seniorPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.primaryPosition} • OVR {p.overall} • Fit {p.fitness}% • Mor {p.morale})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Secondary Partner (for Partnership Chemistry Boosters)
              </label>
              <select
                value={effectivePartnerId}
                onChange={(e) => setSelectedPartnerPlayerId(e.target.value)}
                className="w-full bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200"
              >
                {seniorPlayers
                  .filter((p) => p.id !== effectiveTargetId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.primaryPosition} • OVR {p.overall})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {targetPlayer && (
            <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <PlayerAvatar player={targetPlayer} club={userClub} size={34} />
                <div>
                  <div className="font-bold text-white">
                    {targetPlayer.firstName} {targetPlayer.lastName}{' '}
                    <span className="text-gold-400">({targetPlayer.overall} OVR)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Active Player Boosters:{' '}
                    <strong className="text-white">
                      {
                        economy.activeBoosters.filter(
                          (b) => b.targetPlayerId === targetPlayer.id
                        ).length
                      }{' '}
                      / {balanceConfig.maxActiveBoostersPerPlayer}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400">Diminishing Returns Tier Efficiency</div>
                <div className="text-sm font-black text-emerald-400">
                  {Math.round(
                    getAttributeTrainingEfficiency(targetPlayer.overall, balanceConfig) * 100
                  )}
                  % Training Efficiency
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Boosters & Expiration Countdown Strip */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span>Currently Active Boosters &amp; Expiration Timers ({economy.activeBoosters.length})</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Temporary effects expire automatically each week without permanent stat inflation
          </span>
        </div>

        {economy.activeBoosters.length === 0 ? (
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800/80 text-xs text-slate-400 text-center">
            No duration boosters currently active. Activate a Training, Chemistry, Synergy, or Leadership booster below!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {economy.activeBoosters.map((act) => {
              const style = getRarityCardStyle(act.rarity);
              const tPlayer = seniorPlayers.find((p) => p.id === act.targetPlayerId);
              return (
                <div
                  key={act.activeId}
                  className={`p-3.5 rounded-xl border ${style.border} flex items-center justify-between gap-3`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${style.badge}`}
                      >
                        {act.rarity}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        {act.category}
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-white mt-1">{act.name}</div>
                    <div className="text-[10px] text-slate-400">
                      Target:{' '}
                      {tPlayer ? `${tPlayer.firstName} ${tPlayer.lastName}` : 'Full Club Squad'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="px-2.5 py-1 rounded-lg bg-navy-900 border border-slate-700 text-xs font-black text-gold-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{act.remainingWeeks}w left</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Owned Inventory Grid with Category Filter & Rarity Sort */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Backpack className="w-4 h-4 text-pitch-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Club Booster Inventory ({enrichedInventory.reduce((s, i) => s + i.record.quantity, 0)} Items)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-xl border border-slate-800">
              {(
                [
                  ['ALL', 'All'],
                  ['training', 'Training'],
                  ['chemistry', 'Chemistry'],
                  ['synergy', 'Synergy'],
                  ['recovery', 'Recovery'],
                  ['morale', 'Morale'],
                  ['cosmetic', 'Cosmetic'],
                ] as const
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    categoryFilter === cat
                      ? 'bg-pitch-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-navy-950 px-2.5 py-1 rounded-xl border border-slate-800">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Sort inventory items"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'rarity_desc' | 'rarity_asc' | 'quantity')
                }
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none"
              >
                <option value="rarity_desc" className="bg-navy-950">
                  Sort: Highest Rarity
                </option>
                <option value="rarity_asc" className="bg-navy-950">
                  Sort: Common First
                </option>
                <option value="quantity" className="bg-navy-950">
                  Sort: Quantity Owned
                </option>
              </select>
            </div>
          </div>
        </div>

        {enrichedInventory.length === 0 ? (
          <div className="p-8 rounded-xl bg-navy-950 border border-slate-800 text-center space-y-3">
            <p className="text-sm font-bold text-slate-300">
              No boosters matching this category filter in your inventory.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className="px-4 py-2 rounded-xl bg-pitch-600 text-white text-xs font-bold"
            >
              Acquire Boosters in Store or Objectives
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedInventory.map(({ record, def }) => {
              const style = getRarityCardStyle(def.rarity);
              return (
                <div
                  key={record.instanceId}
                  data-testid={`inventory-card-${def.itemId}`}
                  className={`p-4 rounded-2xl border ${style.border} ${style.glow} flex flex-col justify-between gap-3`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${style.badge}`}
                      >
                        {def.rarity} &bull; {def.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-navy-900 border border-slate-700 text-xs font-black text-white">
                        x{record.quantity}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-white">{def.name}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{def.description}</p>

                    <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-navy-900 border border-slate-800">
                        Scope: <strong className="text-slate-200 capitalize">{def.targetScope}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-navy-900 border border-slate-800">
                        Duration:{' '}
                        <strong className="text-slate-200">
                          {def.durationWeeks === 0 ? 'Instant' : `${def.durationWeeks} Weeks`}
                        </strong>
                      </span>
                      {def.cooldownWeeks > 0 && (
                        <span className="px-2 py-0.5 rounded bg-navy-900 border border-slate-800">
                          Cooldown: <strong className="text-slate-200">{def.cooldownWeeks}w</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 italic">{def.usageRestrictionsText}</p>
                  </div>

                  <button
                    type="button"
                    data-testid={`activate-booster-${def.itemId}`}
                    onClick={() => handleActivate(def.itemId)}
                    className="w-full py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider transition"
                  >
                    {def.durationWeeks === 0 ? 'Use Consumable Now' : 'Activate Booster'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scarcity & Acquisition Channels: Daily, Weekly, Seasonal & Achievement Objectives */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-gold-400" />
              <span>Progression Objectives &amp; Achievement Rewards</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Complete football management milestones to earn scarce Rare &amp; Epic boosters and Club Coins.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {economy.objectives.map((obj) => {
            const rewardDef = obj.rewardItemId ? getBoosterDefinition(obj.rewardItemId) : null;
            const pct = Math.min(100, Math.round((obj.currentProgress / obj.targetProgress) * 100));
            return (
              <div
                key={obj.id}
                className="p-4 rounded-xl bg-navy-950 border border-slate-800 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-pitch-500/15 text-pitch-400 text-[10px] font-extrabold uppercase">
                      {obj.cadence} Objective
                    </span>
                    <span className="text-xs font-black text-white">
                      {obj.currentProgress} / {obj.targetProgress}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white">{obj.title}</h3>
                  <p className="text-xs text-slate-400">{obj.description}</p>

                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-pitch-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-gold-300 font-bold">
                    Reward: +{obj.rewardSoftCoins} Coins
                    {obj.rewardPremiumCoins > 0 ? `, +${obj.rewardPremiumCoins} Premium` : ''}
                    {rewardDef ? ` & 1x ${rewardDef.name} (${rewardDef.rarity})` : ''}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!obj.completed || obj.claimed}
                  onClick={() => handleClaimObjective(obj.id)}
                  className={`w-full py-2 rounded-xl text-xs font-extrabold uppercase transition ${
                    obj.claimed
                      ? 'bg-navy-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                      : obj.completed
                        ? 'bg-gold-500 hover:bg-gold-400 text-navy-950 shadow-lg shadow-gold-500/20'
                        : 'bg-navy-900 border border-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {obj.claimed ? 'Reward Claimed' : obj.completed ? 'Claim Reward' : 'In Progress'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Split: Usage History & Acquisition Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <History className="w-4 h-4 text-pitch-400" />
            <span>Booster Activation &amp; Usage History</span>
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {economy.usageHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No boosters activated yet in this career.</p>
            ) : (
              economy.usageHistory.map((u) => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs space-y-0.5"
                >
                  <div className="flex justify-between font-bold text-white">
                    <span>
                      {u.itemName} ({u.rarity})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      S{u.season} W{u.week}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-300">{u.effectSummary}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-gold-400" />
            <span>Item Acquisition Provenance Ledger</span>
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {economy.acquisitionHistory.map((a) => (
              <div
                key={a.id}
                className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    +{a.quantity}x {a.itemName}{' '}
                    <span className="text-[10px] text-gold-400">({a.rarity})</span>
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase">
                    Source: {a.source.replace('_', ' ')}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  S{a.season} W{a.week}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reference Catalog count check */}
      <div className="text-[11px] text-slate-500 text-right">
        Registered Master Booster Catalog: {BOOSTER_CATALOG.length} Official Items across 4 Rarities.
      </div>
    </div>
  );
}
