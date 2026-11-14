'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Coins,
  Crown,
  Dumbbell,
  HeartPulse,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  Target,
  Ticket,
  Trophy,
  Users,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import {
  CLUB_DEVELOPMENT_TIERS,
  CLUB_EMPIRE_BUILDINGS_CATALOG,
  STADIUM_CAPACITY_BY_LEVEL,
  YOUTH_CAPACITY_BY_LEVEL,
} from '@/engine/clubEmpireConfig';
import {
  calculateMuseumTourismIncome,
  calculatePitchInjuryRiskMultiplier,
  calculatePitchMoraleBonus,
  calculateSuperstarCommercialInfluence,
  evaluateBuildingPrerequisites,
} from '@/engine/clubEmpireEngine';
import type { ClubEmpireBuildingId } from '@/engine/types';
import { ClubEmpire3DCampus } from './ClubEmpire3DCampus';

type ClubEmpireSection =
  | 'overview'
  | 'stadium'
  | 'training'
  | 'medical'
  | 'youth'
  | 'commercial'
  | 'land'
  | 'finances'
  | 'missions';

const SECTIONS: { id: ClubEmpireSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Club Overview', icon: Crown },
  { id: 'stadium', label: 'Stadium', icon: Ticket },
  { id: 'training', label: 'Training Campus', icon: Dumbbell },
  { id: 'medical', label: 'Medical Campus', icon: HeartPulse },
  { id: 'youth', label: 'Youth Development', icon: Users },
  { id: 'commercial', label: 'Commercial District', icon: Landmark },
  { id: 'land', label: 'Land & Construction', icon: MapPin },
  { id: 'finances', label: 'Club Finances', icon: Coins },
  { id: 'missions', label: 'Development Missions', icon: Target },
];

function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `€${(amount / 1_000_000).toFixed(2)}M`;
  if (Math.abs(amount) >= 1_000) return `€${(amount / 1_000).toFixed(1)}K`;
  return `€${amount.toLocaleString()}`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Ready';
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function ClubEmpireScreen() {
  const {
    gameState,
    syncClubEmpireTimers,
    buyEmpireLandPlot,
    startEmpireConstruction,
    useEmpireConstructionBooster,
    useEmpireAdReduction,
    claimEmpireHospitalBooster,
    updateEmpireTicketPricing,
  } = useGameStore();

  const [activeSection, setActiveSection] = useState<ClubEmpireSection>('overview');
  const [selectedBuildingId, setSelectedBuildingId] = useState<ClubEmpireBuildingId | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
      syncClubEmpireTimers();
    }, 1000);
    return () => clearInterval(interval);
  }, [syncClubEmpireTimers]);

  const empire = gameState?.clubEmpire;
  const userClub = gameState ? gameState.clubs.find((c) => c.id === gameState.manager.clubId) ?? null : null;

  const [ticketPriceDraft, setTicketPriceDraft] = useState<number>(
    empire?.ticketPricing.generalPrice ?? 35
  );
  const [vipPriceDraft, setVipPriceDraft] = useState<number>(
    empire?.ticketPricing.vipPrice ?? 95
  );

  useEffect(() => {
    if (empire?.ticketPricing) {
      setTicketPriceDraft(empire.ticketPricing.generalPrice);
      setVipPriceDraft(empire.ticketPricing.vipPrice);
    }
  }, [empire?.ticketPricing]);

  const userSquad = useMemo(() => {
    if (!gameState || !userClub) return [];
    return Object.values(gameState.players).filter((p) => p.clubId === userClub.id);
  }, [gameState, userClub]);

  if (!gameState || gameState.careerType !== 'original_team' || !empire || !userClub) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-amber-400" />
        <h2 className="text-xl font-bold text-white">Club Empire Unavailable</h2>
        <p className="mt-2 text-sm text-slate-400">
          Club Empire infrastructure ownership is exclusive to Original Team Career Mode.
        </p>
      </div>
    );
  }

  const tierInfo = CLUB_DEVELOPMENT_TIERS.find((t) => t.tier === empire.developmentTier) ?? CLUB_DEVELOPMENT_TIERS[0];
  const stadiumLevel = empire.buildings.stadium_stands?.level ?? 1;
  const stadiumCapacity = STADIUM_CAPACITY_BY_LEVEL[stadiumLevel] ?? 12000;
  const youthLevel = empire.buildings.youth_academy?.level ?? 0;
  const youthCapacity = YOUTH_CAPACITY_BY_LEVEL[youthLevel] ?? 0;
  const superstarInfluence = calculateSuperstarCommercialInfluence(userSquad);
  const museumIncome = calculateMuseumTourismIncome(gameState);
  const pitchRiskMultiplier = calculatePitchInjuryRiskMultiplier(gameState);
  const pitchMoraleBonus = calculatePitchMoraleBonus(gameState);

  const runAction = (action: unknown, fallbackMsg: string) => {
    Promise.resolve(action).then((res) => {
      if (res && typeof res === 'object' && 'message' in res) {
        const r = res as { success?: boolean; message: string };
        setFeedback({ ok: Boolean(r.success ?? true), message: r.message });
      } else {
        setFeedback({ ok: true, message: fallbackMsg });
      }
    });
  };

  const renderBuildingCard = (buildingId: ClubEmpireBuildingId) => {
    const def = CLUB_EMPIRE_BUILDINGS_CATALOG[buildingId];
    const state = empire.buildings[buildingId];
    const isConstructing = empire.activeConstructions.some((c) => c.buildingId === buildingId);
    const nextLevel = state.level + 1;
    const evalRes = evaluateBuildingPrerequisites(gameState, buildingId, nextLevel);
    const cost = evalRes.cost;

    return (
      <div
        key={buildingId}
        className={`rounded-xl border p-4 transition-all ${
          selectedBuildingId === buildingId
            ? 'border-emerald-400 bg-slate-900/95 shadow-lg shadow-emerald-950/30'
            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white">{def.name}</h4>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-emerald-300">
                Lv {state.level} / {def.maxLevel}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{def.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedBuildingId(buildingId)}
            className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Inspect
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs">
          <span className="text-slate-400">
            Status: <strong className="text-slate-200">{state.level === 0 ? 'Not Built' : `Active Lv ${state.level}`}</strong>
          </span>

          {state.level >= def.maxLevel ? (
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 font-medium text-emerald-300">
              Max Level
            </span>
          ) : isConstructing ? (
            <span className="rounded-md bg-amber-500/20 px-2.5 py-1 font-medium text-amber-300">
              Under Construction
            </span>
          ) : (
            <button
              type="button"
              disabled={!evalRes.eligible}
              onClick={() => runAction(startEmpireConstruction(buildingId), `Started ${def.name} construction`)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                evalRes.eligible
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              {state.level === 0 ? 'Build' : `Upgrade Lv ${nextLevel}`} ({formatMoney(cost)})
            </button>
          )}
        </div>

        {!evalRes.eligible && evalRes.missingReasons.length > 0 && state.level < def.maxLevel && !isConstructing && (
          <p className="mt-2 text-[11px] text-amber-400/90">{evalRes.missingReasons[0]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Crown className="h-4 w-4" />
            Original Team Career • Club Empire
          </div>
          <h1 className="mt-1 text-2xl font-bold text-white">{userClub.name} Infrastructure</h1>
          <p className="mt-1 text-sm text-slate-400">
            Tier: <span className="font-semibold text-emerald-300">{tierInfo.tier}</span> (Max Building Lv{' '}
            {tierInfo.maxBuildingLevel}) • Active Constructions: {empire.activeConstructions.length}/
            {empire.maxSimultaneousConstructions}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5">
            <div className="text-[11px] text-slate-400">Club Funds</div>
            <div className="text-base font-bold text-emerald-400">{formatMoney(userClub.finances.cashBalance)}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5">
            <div className="text-[11px] text-slate-400">Stadium Cap</div>
            <div className="text-base font-bold text-white">{stadiumCapacity.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5">
            <div className="text-[11px] text-slate-400">Hospital Boosters</div>
            <div className="text-base font-bold text-cyan-300">
              {empire.hospitalProduction.individualBoostersStored} Ind / {empire.hospitalProduction.teamBoostersStored} Team
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5">
            <div className="text-[11px] text-slate-400">Owned Plots</div>
            <div className="text-base font-bold text-amber-300">
              {empire.landPlots.filter((p) => p.owned).length} / {empire.landPlots.length}
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.ok
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
              : 'border-rose-500/40 bg-rose-950/40 text-rose-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const active = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'border border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* 1. CLUB OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
            <h2 className="text-lg font-bold text-white">Active Construction Queue</h2>
            {empire.activeConstructions.length === 0 ? (
              <p className="text-sm text-slate-400">
                No active construction projects. Select a facility in any campus tab or Land & Construction to begin.
              </p>
            ) : (
              <div className="space-y-3">
                {empire.activeConstructions.map((proj) => {
                  const def = CLUB_EMPIRE_BUILDINGS_CATALOG[proj.buildingId];
                  const completesAt = proj.completedAtMs ?? nowMs;
                  const remainingMs = Math.max(0, completesAt - nowMs);
                  const totalMs = Math.max(1, completesAt - nowMs + 1000);
                  const pct = Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100));

                  return (
                    <div key={proj.buildingId} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-white">
                            {def.name} → Lv {proj.targetLevel}
                          </div>
                          <div className="text-xs text-slate-400">
                            Remaining: <span className="font-mono text-amber-300">{formatRemaining(remainingMs)}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => runAction(useEmpireConstructionBooster(proj.projectId, 'common'), 'Applied 5% booster')}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
                          >
                            5% Boost ({empire.constructionBoosters.common})
                          </button>
                          <button
                            type="button"
                            onClick={() => runAction(useEmpireConstructionBooster(proj.projectId, 'rare'), 'Applied 10% booster')}
                            className="rounded-lg border border-cyan-700/60 bg-cyan-950/50 px-2.5 py-1 text-xs text-cyan-200 hover:bg-cyan-900/60"
                          >
                            10% Boost ({empire.constructionBoosters.rare})
                          </button>
                          <button
                            type="button"
                            onClick={() => runAction(useEmpireAdReduction(proj.projectId), 'Applied Ad Reduction')}
                            className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-500"
                          >
                            Watch Ad (-10% / 30m max)
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-bold text-white">Club Development Status</h2>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Development Tier</span>
                <strong className="text-emerald-300">{tierInfo.tier}</strong>
              </div>
              <div className="flex justify-between">
                <span>Pitch Injury Risk</span>
                <strong className="text-cyan-300">{(pitchRiskMultiplier * 100).toFixed(0)}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Pitch Morale Bonus</span>
                <strong className="text-emerald-300">+{pitchMoraleBonus}</strong>
              </div>
              <div className="flex justify-between">
                <span>Superstar Influence</span>
                <strong className="text-amber-300">+{superstarInfluence.totalCommercialInfluence}</strong>
              </div>
              <div className="flex justify-between">
                <span>Museum Tourism / Wk</span>
                <strong className="text-emerald-300">{formatMoney(museumIncome.weeklyTourismIncome)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. STADIUM & TICKET PRICING */}
      {activeSection === 'stadium' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {(['football_pitch', 'stadium_stands', 'vip_hospitality', 'stadium_roof', 'lighting_scoreboard', 'fan_plaza'] as ClubEmpireBuildingId[]).map(
              renderBuildingCard
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Ticket className="h-5 w-5 text-emerald-400" />
              Home-Match Ticket Pricing
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Applies exclusively to home matches. Overpricing reduces attendance and fan satisfaction.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="flex justify-between text-xs font-medium text-slate-300">
                  <span>General Admission Price</span>
                  <span className="text-emerald-300">€{ticketPriceDraft}</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={180}
                  value={ticketPriceDraft}
                  onChange={(e) => setTicketPriceDraft(Number(e.target.value))}
                  className="mt-2 w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-medium text-slate-300">
                  <span>VIP / Hospitality Price</span>
                  <span className="text-amber-300">€{vipPriceDraft}</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={500}
                  value={vipPriceDraft}
                  onChange={(e) => setVipPriceDraft(Number(e.target.value))}
                  className="mt-2 w-full accent-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  runAction(
                    updateEmpireTicketPricing({
                      generalPrice: ticketPriceDraft,
                      premiumPrice: Math.round((ticketPriceDraft + vipPriceDraft) / 2),
                      vipPrice: vipPriceDraft,
                    }),
                    'Updated home ticket pricing'
                  )
                }
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Save Home Ticket Pricing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TRAINING CAMPUS */}
      {activeSection === 'training' && (
        <div className="grid gap-4 md:grid-cols-2">
          {(['training_complex', 'fitness_gym'] as ClubEmpireBuildingId[]).map(renderBuildingCard)}
        </div>
      )}

      {/* 4. MEDICAL CAMPUS */}
      {activeSection === 'medical' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <HeartPulse className="h-5 w-5 text-cyan-400" />
                  Hospital Offline Booster Production
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Individual & Team Recovery Boosters are produced separately and capped by Hospital level.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={empire.hospitalProduction.individualBoostersStored <= 0}
                  onClick={() => runAction(claimEmpireHospitalBooster('individual'), 'Claimed Individual Booster')}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500"
                >
                  Claim Individual ({empire.hospitalProduction.individualBoostersStored}/{empire.hospitalProduction.individualStorageCap})
                </button>
                <button
                  type="button"
                  disabled={empire.hospitalProduction.teamBoostersStored <= 0}
                  onClick={() => runAction(claimEmpireHospitalBooster('team'), 'Claimed Team Booster')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500"
                >
                  Claim Team ({empire.hospitalProduction.teamBoostersStored}/{empire.hospitalProduction.teamStorageCap})
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(['club_hospital', 'rehabilitation_centre', 'sports_science_lab'] as ClubEmpireBuildingId[]).map(
              renderBuildingCard
            )}
          </div>
        </div>
      )}

      {/* 5. YOUTH DEVELOPMENT */}
      {activeSection === 'youth' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            Youth Academy Capacity: <strong className="text-emerald-300">{youthCapacity} prospects</strong>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(['youth_academy', 'youth_residence', 'scouting_centre'] as ClubEmpireBuildingId[]).map(
              renderBuildingCard
            )}
          </div>
        </div>
      )}

      {/* 6. COMMERCIAL DISTRICT */}
      {activeSection === 'commercial' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Trophy className="h-4 w-4 text-amber-400" />
                Trophy Museum
              </div>
              <div className="mt-1 text-lg font-bold text-white">
                {empire.buildings.club_museum.level > 0 ? 'Open (2+ Trophies)' : 'Locked (Needs 2 Trophies)'}
              </div>
              <div className="text-xs text-emerald-300">Tourism: {formatMoney(museumIncome.weeklyTourismIncome)}/wk</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Superstar Commercial Influence
              </div>
              <div className="mt-1 text-lg font-bold text-white">
                Score: {superstarInfluence.totalCommercialInfluence}
              </div>
              <div className="text-xs text-slate-400">
                Merchandise x{superstarInfluence.merchandiseMultiplier.toFixed(2)} (diminishing returns)
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Building2 className="h-4 w-4 text-emerald-400" />
                Active Sponsorships
              </div>
              <div className="mt-1 text-lg font-bold text-white">{empire.sponsorships.length} Contracts</div>
              <div className="text-xs text-slate-400">Grows with reputation & superstars</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                'club_headquarters',
                'club_merchandise_store',
                'sponsorship_centre',
                'media_broadcast_centre',
                'club_museum',
                'parking_transport',
                'supporters_club',
                'community_centre',
                'security_operations',
              ] as ClubEmpireBuildingId[]
            ).map(renderBuildingCard)}
          </div>
        </div>
      )}

      {/* 7. LAND & CONSTRUCTION + 3D CAMPUS */}
      {activeSection === 'land' && (
        <div className="space-y-6">
          <ClubEmpire3DCampus
            empire={empire}
            selectedBuildingId={selectedBuildingId ?? 'stadium_stands'}
            onSelectBuilding={setSelectedBuildingId}
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {empire.landPlots.map((plot) => (
              <div key={plot.plotId} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">{plot.name}</h4>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      plot.owned ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {plot.owned ? 'Owned' : 'Locked'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{plot.zone}</p>
                {!plot.owned && (
                  <button
                    type="button"
                    onClick={() => runAction(buyEmpireLandPlot(plot.plotId), `Purchased ${plot.name}`)}
                    className="mt-3 w-full rounded-lg bg-amber-600 py-2 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    Purchase Land ({formatMoney(plot.purchaseCost)})
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. CLUB FINANCES LEDGER */}
      {activeSection === 'finances' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Coins className="h-5 w-5 text-emerald-400" />
            Club Empire Financial Ledger
          </h3>
          {empire.transactions.length === 0 ? (
            <p className="text-sm text-slate-400">No infrastructure transactions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {empire.transactions.slice(0, 20).map((tx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm"
                >
                  <div>
                    <div className="font-medium text-white">{tx.description}</div>
                    <div className="text-xs text-slate-500">
                      {tx.category}
                    </div>
                  </div>
                  <span className={`font-mono font-semibold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.amount >= 0 ? '+' : ''}
                    {formatMoney(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 9. DEVELOPMENT MISSIONS */}
      {activeSection === 'missions' && (
        <div className="grid gap-4 md:grid-cols-2">
          {empire.missions.map((mission) => (
            <div key={mission.missionId} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-white">{mission.title}</h4>
                  <p className="mt-1 text-xs text-slate-400">{mission.description}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${
                    mission.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-amber-300'
                  }`}
                >
                  {mission.completed ? 'Completed' : 'Active'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Progress: {mission.currentValue} / {mission.targetValue}
                </span>
                <span className="text-emerald-300">
                  Reward: {formatMoney(mission.rewardTreasury)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
