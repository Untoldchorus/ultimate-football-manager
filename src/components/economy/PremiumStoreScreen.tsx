'use client';

import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Coins,
  Crown,
  Film,
  Gift,
  Lock,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tv,
  XCircle,
  Zap,
} from 'lucide-react';
import { DEFAULT_BALANCE_CONFIG } from '@/engine/balanceConfig';
import {
  BOOSTER_CATALOG,
  ensureEconomyState,
  getBoosterDefinition,
  SERVER_STORE_OFFERS,
} from '@/engine/boosterEconomy';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest } from '../ui/FootballVisuals';
import { getRarityCardStyle } from './BoosterInventoryScreen';

export function PremiumStoreScreen() {
  const {
    gameState,
    purchaseStarterPack,
    purchaseStoreOffer,
    watchRewardedAd,
    setActiveTab,
  } = useGameStore();

  const [storeNotice, setStoreNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStarterPackConfirmModal, setShowStarterPackConfirmModal] = useState(false);
  const [selectedAdReward, setSelectedAdReward] = useState<
    'recovery' | 'training' | 'soft_coins'
  >('recovery');
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const userClub = useMemo(() => {
    if (!gameState) return null;
    return gameState.clubs.find((c) => c.id === gameState.manager.clubId) ?? gameState.clubs[0];
  }, [gameState]);

  const economy = useMemo(() => {
    if (!gameState) return null;
    return ensureEconomyState(gameState);
  }, [gameState]);

  if (!gameState || !userClub || !economy) return null;

  const config = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
  const starterPackOwned = economy.starterPack.owned;
  const todayKey = new Date().toISOString().slice(0, 10);
  const adsWatchedToday =
    economy.rewardedAds.dateKey === todayKey ? economy.rewardedAds.adsWatchedToday : 0;

  const handleStarterPackAction = async (
    outcome: 'verified' | 'failed' | 'cancelled' | 'restored'
  ) => {
    soundManager.playUiClick();
    setIsProcessing(true);
    setShowStarterPackConfirmModal(false);
    const res = await purchaseStarterPack(outcome);
    setIsProcessing(false);
    setStoreNotice({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleBuyStoreOffer = async (
    offerId: string,
    currencyType: 'soft' | 'premium' | 'real_money'
  ) => {
    soundManager.playUiClick();
    setIsProcessing(true);
    const res = await purchaseStoreOffer({ offerId, currencyType });
    setIsProcessing(false);
    setStoreNotice({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleWatchRewardedAd = async () => {
    soundManager.playUiClick();
    setIsWatchingAd(true);
    // Simulate a brief 700ms rewarded ad completion & provider SSV callback
    await new Promise((r) => setTimeout(r, 700));
    const res = await watchRewardedAd(selectedAdReward);
    setIsWatchingAd(false);
    setStoreNotice({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  return (
    <div className="space-y-6" data-testid="premium-store-screen">
      {/* Top Marketplace Header */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-950 to-navy-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ClubCrest club={userClub} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-[11px] font-extrabold uppercase tracking-wider text-gold-400">
                  Server-Verified Club Marketplace
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Anti-Pay-To-Win Bounded (&le;7% Match Cap)</span>
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
                In-Game Store, Starter Pack &amp; Sponsor Broadcasts
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Every transaction is verified with server-side HMAC signatures, duplicate protection, and persistent ledger records.
              </p>
            </div>
          </div>

          {/* Live Currency Wallet */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-navy-950 border border-slate-800 flex items-center gap-2.5">
              <Coins className="w-4 h-4 text-pitch-400" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Soft Club Coins</div>
                <div className="text-base font-black text-white" data-testid="store-soft-coins">
                  {economy.softCurrency.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-navy-950 border border-gold-500/40 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <div>
                <div className="text-[10px] text-gold-400 font-bold uppercase">Premium Coins</div>
                <div
                  className="text-base font-black text-gold-300"
                  data-testid="store-premium-coins"
                >
                  {economy.premiumCurrency.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className="px-3.5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-xs font-extrabold text-slate-200 transition"
            >
              Open Inventory ({economy.inventory.reduce((s, i) => s + i.quantity, 0)})
            </button>
          </div>
        </div>

        {storeNotice && (
          <div
            data-testid="store-status-banner"
            className={`mt-4 p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
              storeNotice.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {storeNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{storeNotice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStoreNotice(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================
          EXCLUSIVE ONE-TIME STARTER PACK HERO PANEL
         =================================================================== */}
      <div
        data-testid="starter-pack-hero"
        className={`relative rounded-3xl border-2 p-6 md:p-7 overflow-hidden shadow-2xl transition ${
          starterPackOwned
            ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-navy-950 to-navy-900'
            : 'border-gold-400/70 bg-gradient-to-br from-amber-950/45 via-navy-950 to-indigo-950/50'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gold-500 text-navy-950 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>Exclusive One-Time Starter Pack</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-navy-900/90 border border-gold-500/30 text-[11px] font-bold text-gold-300">
                1x Per Manager Account Lifetime
              </span>
              {starterPackOwned && (
                <span
                  data-testid="starter-pack-owned-badge"
                  className="px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black uppercase flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>OWNED &amp; VERIFIED</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Founder&apos;s Touchline &amp; Squad Kickstart Bundle
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Accelerate your opening campaign with verified Premium Coins, Training Drills, Recovery Packs, Morale Talks, Rare Chemistry &amp; Tactical Preparation Dossiers, plus the permanent{' '}
              <strong className="text-gold-300">Founder&apos;s Golden Crest Cosmetic</strong>.
            </p>

            {/* 7 Proposed Starter Pack Contents Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
              <div className="p-2.5 rounded-xl bg-navy-950/90 border border-gold-500/40 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-gold-300">
                    +{config.starterPackPremiumCoins} Coins
                  </div>
                  <div className="text-[10px] text-slate-400">Premium Currency</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-navy-950/90 border border-slate-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-white">
                    {config.starterPackTrainingBoostersQty}x Training XP
                  </div>
                  <div className="text-[10px] text-slate-400">Common Drills</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-navy-950/90 border border-slate-700 flex items-center gap-2">
                <Gift className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-white">
                    {config.starterPackRecoveryPacksQty}x Recovery Packs
                  </div>
                  <div className="text-[10px] text-slate-400">+14% Fitness</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-navy-950/90 border border-slate-700 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-white">
                    {config.starterPackMoraleBoostersQty}x Morale Talks
                  </div>
                  <div className="text-[10px] text-slate-400">+14 Morale</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-navy-950/90 border border-sky-500/40 flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-sky-300">
                    {config.starterPackRareChemistryQty}x Rare Chemistry
                  </div>
                  <div className="text-[10px] text-slate-400">Partnership Telepathy</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-navy-950/90 border border-sky-500/40 flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-sky-300">
                    {config.starterPackRareSynergyQty}x Rare Tactical
                  </div>
                  <div className="text-[10px] text-slate-400">Preparation Dossier</div>
                </div>
              </div>

              <div className="col-span-2 p-2.5 rounded-xl bg-navy-950/90 border border-amber-400/50 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs font-black text-amber-300">
                    1x Founder&apos;s Golden Crest &amp; Touchline Badge
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Exclusive Cosmetic Reward (0% Stat Advantage)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Purchase / Owned Box */}
          <div className="lg:w-80 p-5 rounded-2xl bg-navy-950/95 border border-slate-800 flex flex-col justify-between gap-4 shrink-0">
            <div className="text-center space-y-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-gold-400">
                One-Time Special Offer Price
              </div>
              <div className="text-4xl font-black text-white">
                ${config.starterPackPriceUsd.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400">
                Over 300% Early-Season Value &bull; Instant Server Delivery
              </div>
            </div>

            {starterPackOwned ? (
              <div className="space-y-2.5">
                <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Starter Pack Owned (Locked)</span>
                </div>
                <div className="text-[10px] text-slate-400 text-center">
                  Tx ID: {economy.starterPack.transactionId}
                </div>
                <button
                  type="button"
                  onClick={() => handleStarterPackAction('restored')}
                  className="w-full py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Verify / Restore Entitlement</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  data-testid="buy-starter-pack-btn"
                  disabled={isProcessing}
                  onClick={() => setShowStarterPackConfirmModal(true)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-navy-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-gold-500/25 transition"
                >
                  {isProcessing
                    ? 'Verifying Transaction...'
                    : `Unlock Starter Pack ($${config.starterPackPriceUsd.toFixed(2)})`}
                </button>

                <button
                  type="button"
                  onClick={() => handleStarterPackAction('restored')}
                  className="w-full py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-slate-800 text-[11px] font-bold text-slate-400 hover:text-white flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restore Previous Purchase</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Confirmation Modal for Starter Pack */}
      {showStarterPackConfirmModal && !starterPackOwned && (
        <div
          data-testid="starter-pack-confirm-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-navy-900 border-2 border-gold-500/60 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 text-[10px] font-black uppercase">
                Server-Side Payment Verification
              </span>
              <span className="text-sm font-black text-white">
                ${config.starterPackPriceUsd.toFixed(2)} USD
              </span>
            </div>

            <h3 className="text-lg font-black text-white">
              Confirm Exclusive One-Time Starter Pack
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your transaction will be verified by the server payment ledger (`srv_sig_hmac`). If a payment is cancelled or fails, your one-time eligibility is preserved.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                data-testid="confirm-starter-pack-verified-btn"
                onClick={() => handleStarterPackAction('verified')}
                className="w-full py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider"
              >
                Confirm &amp; Complete Verified Purchase (${config.starterPackPriceUsd.toFixed(2)})
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="simulate-starter-pack-cancel-btn"
                  onClick={() => handleStarterPackAction('cancelled')}
                  className="py-2 rounded-xl bg-navy-950 hover:bg-navy-800 border border-slate-700 text-[11px] font-bold text-slate-300"
                >
                  Cancel Checkout
                </button>
                <button
                  type="button"
                  data-testid="simulate-starter-pack-fail-btn"
                  onClick={() => handleStarterPackAction('failed')}
                  className="py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-[11px] font-bold text-rose-300"
                >
                  Simulate Declined Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          OPTIONAL REWARDED ADVERTISEMENTS STATION
         =================================================================== */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-[10px] font-extrabold uppercase text-sky-400 flex items-center gap-1">
                <Tv className="w-3 h-3" />
                <span>Optional Club Sponsor Broadcasts (Rewarded Ads)</span>
              </span>
              <span
                data-testid="rewarded-ad-counter"
                className="text-xs font-black text-white"
              >
                Daily Limit: {adsWatchedToday} / {config.maxRewardedAdsPerDay} Watched Today
              </span>
            </div>
            <h3 className="text-base font-black text-white">
              Watch a Sponsor Broadcast to Claim a Predetermined Reward
            </h3>
            <p className="text-xs text-slate-400">
              Never forced during matches. Rewards are granted only after provider completion token verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Select rewarded ad prize"
              value={selectedAdReward}
              onChange={(e) =>
                setSelectedAdReward(
                  e.target.value as 'recovery' | 'training' | 'soft_coins'
                )
              }
              className="bg-navy-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
            >
              <option value="recovery">
                Reward: 1x Common Cryo Recovery Pack (+14% Fitness)
              </option>
              <option value="training">
                Reward: 1x Common Standard Training XP Drill
              </option>
              <option value="soft_coins">Reward: +200 Soft Club Coins</option>
            </select>

            <button
              type="button"
              data-testid="watch-rewarded-ad-btn"
              disabled={isWatchingAd || adsWatchedToday >= config.maxRewardedAdsPerDay}
              onClick={handleWatchRewardedAd}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition ${
                adsWatchedToday >= config.maxRewardedAdsPerDay
                  ? 'bg-navy-950 border border-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>
                {isWatchingAd
                  ? 'Verifying Sponsor Stream...'
                  : adsWatchedToday >= config.maxRewardedAdsPerDay
                    ? 'Daily Ad Limit Reached'
                    : 'Watch Sponsor Broadcast'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================
          SPECIAL OFFERS, EVENT BUNDLES & CURRENCY PACKS
         =================================================================== */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gold-400" />
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              Special Offers, Event Bundles &amp; Currency Packs
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVER_STORE_OFFERS.map((offer) => (
            <div
              key={offer.offerId}
              data-testid={`store-offer-${offer.offerId}`}
              className="p-4 rounded-2xl bg-navy-950 border border-slate-800 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-[10px] font-black uppercase text-gold-300">
                    {offer.badgeText ?? offer.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-black text-pitch-400">{offer.priceDisplay}</span>
                </div>
                <h3 className="text-sm font-black text-white">{offer.offerName}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{offer.description}</p>

                {offer.itemsGranted.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {offer.itemsGranted.map((g) => {
                      const def = getBoosterDefinition(g.itemId);
                      return (
                        <span
                          key={g.itemId}
                          className="px-2 py-0.5 rounded bg-navy-900 border border-slate-800 text-[10px] font-bold text-slate-200"
                        >
                          {g.quantity}x {def?.name ?? g.itemId}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleBuyStoreOffer(offer.offerId, offer.currencyType)}
                className="w-full py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider transition"
              >
                Purchase ({offer.priceDisplay})
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================
          INDIVIDUAL BOOSTER MARKETPLACE (SOFT & PREMIUM CURRENCY)
         =================================================================== */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
            Individual Booster Catalog Store
          </h2>
          <p className="text-[11px] text-slate-400">
            Acquire specific Training, Chemistry, Synergy, Recovery, and Morale consumables using Soft Club Coins or Premium Coins.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BOOSTER_CATALOG.filter((b) => b.category !== 'cosmetic').map((b) => {
            const style = getRarityCardStyle(b.rarity);
            return (
              <div
                key={b.itemId}
                className={`p-4 rounded-2xl border ${style.border} flex flex-col justify-between gap-3`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${style.badge}`}
                    >
                      {b.rarity} &bull; {b.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {b.durationWeeks === 0 ? 'Instant' : `${b.durationWeeks}w Duration`}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white">{b.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{b.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {b.softCurrencyPrice !== undefined ? (
                    <button
                      type="button"
                      data-testid={`buy-soft-${b.itemId}`}
                      disabled={isProcessing}
                      onClick={() => handleBuyStoreOffer(b.itemId, 'soft')}
                      className="py-2 px-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-700 text-[11px] font-extrabold text-white transition"
                    >
                      {b.softCurrencyPrice.toLocaleString()} Club Coins
                    </button>
                  ) : (
                    <div className="py-2 px-2 rounded-xl bg-navy-900/50 border border-slate-800 text-[10px] font-bold text-slate-500 text-center">
                      Legendary Exclusive
                    </div>
                  )}

                  {b.premiumCurrencyPrice !== undefined && (
                    <button
                      type="button"
                      data-testid={`buy-premium-${b.itemId}`}
                      disabled={isProcessing}
                      onClick={() => handleBuyStoreOffer(b.itemId, 'premium')}
                      className="py-2 px-2 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-[11px] font-extrabold text-gold-300 transition"
                    >
                      {b.premiumCurrencyPrice} Premium
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Persistent Server-Verified Purchase History Ledger */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Purchase &amp; Transaction History Ledger ({economy.transactions.length})</span>
        </h3>

        {economy.transactions.length === 0 ? (
          <p className="text-xs text-slate-500">
            No store purchases recorded on this account yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                  <th className="py-2 px-3">Transaction ID</th>
                  <th className="py-2 px-3">Offer</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Server HMAC Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {economy.transactions.map((tx) => (
                  <tr key={tx.transactionId + tx.createdAtIso}>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-300">
                      {tx.transactionId}
                    </td>
                    <td className="py-2 px-3 font-bold text-white">{tx.offerName}</td>
                    <td className="py-2 px-3 text-gold-300 font-bold">{tx.priceDisplay}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          tx.status === 'verified' || tx.status === 'restored'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-400">
                      {tx.verificationHash.slice(0, 22)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
