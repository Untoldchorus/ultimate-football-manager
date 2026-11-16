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
  Maximize2,
  Minimize2,
  RotateCcw,
  Plus,
  Play,
  Zap,
  Clock,
  X,
  Compass,
  ArrowUpRight,
  ChevronRight,
  Flame,
  CheckCircle2,
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
import type { ClubEmpireBuildingId, LandPlot } from '@/engine/types';
import { ClubEmpire3DScene, CameraTarget } from './ClubEmpire3DCampus';
import { soundManager } from '@/lib/audio';
import { ClubCrest } from '../ui/FootballVisuals';

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

type CampusZoneFilter =
  | 'all'
  | 'stadium'
  | 'training'
  | 'medical'
  | 'youth'
  | 'commercial'
  | 'land'
  | 'finances';

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

const SECTIONS_2D: {
  id: ClubEmpireSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
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
    setActiveTab,
  } = useGameStore();

  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [active2dSection, setActive2dSection] = useState<ClubEmpireSection>('overview');
  const [activeZone, setActiveZone] = useState<CampusZoneFilter>('all');
  const [selectedBuildingId, setSelectedBuildingId] = useState<ClubEmpireBuildingId | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<LandPlot | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);
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

  // Handle ESC key to exit fullscreen or close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBuildingId || selectedPlot) {
          setSelectedBuildingId(null);
          setSelectedPlot(null);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBuildingId, selectedPlot, isFullscreen]);

  if (!gameState || gameState.careerType !== 'original_team' || !empire || !userClub) {
    return (
      <div className="rounded-3xl border border-amber-500/30 bg-navy-900/90 p-8 text-center text-white">
        <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-amber-400" />
        <h2 className="text-xl font-bold uppercase">Club Empire Unavailable</h2>
        <p className="mt-2 text-sm text-slate-400">
          Club Empire 3D Campus infrastructure is exclusive to Original Team Career Mode.
        </p>
      </div>
    );
  }

  const tierInfo =
    CLUB_DEVELOPMENT_TIERS.find((t) => t.tier === empire.developmentTier) ??
    CLUB_DEVELOPMENT_TIERS[0];
  const stadiumLevel = empire.buildings.stadium_stands?.level ?? 1;
  const stadiumCapacity = STADIUM_CAPACITY_BY_LEVEL[stadiumLevel] ?? 2000;
  const youthCapacity = YOUTH_CAPACITY_BY_LEVEL[empire.buildings.youth_academy?.level ?? 1] ?? 12;
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
      setTimeout(() => setFeedback(null), 5000);
    });
  };

  const renderBuildingCard = (buildingId: ClubEmpireBuildingId) => {
    const def = CLUB_EMPIRE_BUILDINGS_CATALOG[buildingId];
    const state = empire.buildings[buildingId];
    if (!def || !state) return null;
    const isConstructing = empire.activeConstructions.some((c) => c.buildingId === buildingId);
    const bNextLevel = state.level + 1;
    const bEvalRes = evaluateBuildingPrerequisites(gameState, buildingId, bNextLevel);
    const bCost = bEvalRes.cost;

    return (
      <div
        key={buildingId}
        className={`rounded-2xl border p-4 transition-all ${
          selectedBuildingId === buildingId
            ? 'border-pitch-400 bg-navy-900/95 shadow-lg shadow-pitch-950/30'
            : 'border-slate-800 bg-navy-900/70 hover:border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white text-sm">{def.name}</h4>
              <span className="rounded-lg bg-navy-950 px-2 py-0.5 text-[10px] font-black uppercase text-pitch-300 border border-pitch-500/30">
                Lv {state.level} / {def.maxLevel}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{def.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedBuildingId(buildingId)}
            className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            Inspect
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs">
          <span className="text-slate-400">
            Status:{' '}
            <strong className={state.level > 0 ? 'text-emerald-400' : 'text-slate-400'}>
              {state.level === 0 ? 'Not Built' : `Active Lv ${state.level}`}
            </strong>
          </span>

          {state.level >= def.maxLevel ? (
            <span className="text-gold-400 font-bold">Max Level</span>
          ) : isConstructing ? (
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5 animate-spin" /> In Construction
            </span>
          ) : (
            <button
              type="button"
              disabled={!bEvalRes.eligible}
              onClick={() => {
                soundManager.playUiClick();
                runAction(
                  startEmpireConstruction(buildingId),
                  `Started construction: ${def.name} Lv ${bNextLevel}`
                );
              }}
              className={`rounded-xl px-3 py-1.5 font-bold uppercase text-[11px] transition ${
                bEvalRes.eligible
                  ? 'bg-pitch-500 hover:bg-pitch-400 text-navy-950 shadow-md shadow-pitch-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Upgrade ({formatMoney(bCost)})
            </button>
          )}
        </div>
      </div>
    );
  };

  // Camera presets for quick navigation
  const glideToZone = (zone: CampusZoneFilter) => {
    soundManager.playUiClick();
    setActiveZone(zone);

    switch (zone) {
      case 'stadium':
        setCameraTarget({ position: [38, 28, -12], target: [38, 6, -42] });
        setSelectedBuildingId('stadium_stands');
        break;
      case 'training':
        setCameraTarget({ position: [2, 26, 26], target: [2, 2, -6] });
        setSelectedBuildingId('football_pitch');
        break;
      case 'medical':
        setCameraTarget({ position: [30, 20, 24], target: [30, 3, 0] });
        setSelectedBuildingId('club_hospital');
        break;
      case 'commercial':
        setCameraTarget({ position: [24, 20, 44], target: [24, 4, 22] });
        setSelectedBuildingId('club_merchandise_store');
        break;
      case 'youth':
        setCameraTarget({ position: [-28, 22, 16], target: [-28, 4, -6] });
        setSelectedBuildingId('youth_academy');
        break;
      case 'land':
        setCameraTarget({ position: [0, 65, 45], target: [0, 0, 0] });
        setSelectedBuildingId(null);
        break;
      case 'finances':
        setCameraTarget({ position: [24, 22, 42], target: [24, 4, 22] });
        setSelectedBuildingId('club_headquarters');
        break;
      default:
        setCameraTarget({ position: [36, 42, 58], target: [0, 4, 0] });
        break;
    }
  };

  const selectedBuildingDef = selectedBuildingId
    ? CLUB_EMPIRE_BUILDINGS_CATALOG[selectedBuildingId]
    : null;
  const selectedBuildingState = selectedBuildingId
    ? empire.buildings[selectedBuildingId]
    : null;
  const selectedBuildingProject = selectedBuildingId
    ? empire.activeConstructions.find((c) => c.buildingId === selectedBuildingId)
    : null;

  const nextLevel = selectedBuildingState ? selectedBuildingState.level + 1 : 1;
  const evalRes = selectedBuildingId
    ? evaluateBuildingPrerequisites(gameState, selectedBuildingId, nextLevel)
    : null;

  return (
    <div
      className={`relative w-full overflow-hidden select-none transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-navy-950 h-screen w-screen'
          : 'rounded-3xl border border-slate-800 bg-navy-950 h-[calc(100vh-140px)] min-h-[640px]'
      }`}
    >
      {/* =================================================================== */}
      {/* 1. TOP FLOATING EVONY HUD BAR (Header & Resource Tickers)           */}
      {/* =================================================================== */}
      <div className="absolute top-3 inset-x-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left: Club Crest, Title & Tier */}
        <div className="pointer-events-auto flex items-center gap-3 p-2.5 pr-4 rounded-2xl bg-navy-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-md">
          <ClubCrest club={userClub} size={38} />
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase text-white tracking-wide">
              <span>{userClub.name} Clubgelände</span>
              <span className="px-1.5 py-0.5 rounded bg-gold-400/15 text-gold-300 text-[10px] font-bold border border-gold-400/30">
                HD 3D
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Tier: <strong className="text-pitch-400">{tierInfo.tier}</strong></span>
              <span>&bull;</span>
              <span>Max Lv: <strong className="text-white">{tierInfo.maxBuildingLevel}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: Live Resource Tickers (Evony Style) */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-2 p-1.5 rounded-2xl bg-navy-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-md text-xs font-bold">
          {/* Club Funds */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 text-emerald-400">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase text-slate-400 font-bold leading-none">Club Funds</div>
              <div className="text-xs font-black">{formatMoney(userClub.finances.cashBalance)}</div>
            </div>
          </div>

          {/* Stadium Capacity */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 text-white">
            <Ticket className="w-4 h-4 text-gold-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase text-slate-400 font-bold leading-none">Stadium Cap</div>
              <div className="text-xs font-black">{stadiumCapacity.toLocaleString()}</div>
            </div>
          </div>

          {/* Hospital Boosters */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 text-sky-400">
            <HeartPulse className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase text-slate-400 font-bold leading-none">Hospital Boosters</div>
              <div className="text-xs font-black">
                {empire.hospitalProduction.individualBoostersStored} Ind &bull;{' '}
                {empire.hospitalProduction.teamBoostersStored} Team
              </div>
            </div>
          </div>

          {/* Active Construction Slots */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-800 text-amber-400">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[9px] uppercase text-slate-400 font-bold leading-none">Constructions</div>
              <div className="text-xs font-black">
                {empire.activeConstructions.length} / {empire.maxSimultaneousConstructions}
              </div>
            </div>
          </div>
        </div>

        {/* Right: View Mode Toggle, Camera Reset & Fullscreen Controls */}
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl bg-navy-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-md">
          {/* 3D vs 2D Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-navy-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                setViewMode('3d');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                viewMode === '3d'
                  ? 'bg-pitch-500 text-navy-950 shadow-md shadow-pitch-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3D Campus</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                setViewMode('2d');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition ${
                viewMode === '2d'
                  ? 'bg-pitch-500 text-navy-950 shadow-md shadow-pitch-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Infrastructure</span>
            </button>
          </div>

          {viewMode === '3d' && (
            <button
              type="button"
              onClick={() => glideToZone('all')}
              className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-800 text-slate-300 hover:text-white transition"
              title="Reset Camera to Overview"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-800 text-slate-300 hover:text-white transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Temporary Feedback Banner */}
      {feedback && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto px-4 py-2 rounded-2xl bg-navy-950/95 border text-xs font-bold shadow-2xl animate-fade-in flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 ${feedback.ok ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span className={feedback.ok ? 'text-white' : 'text-rose-300'}>{feedback.message}</span>
        </div>
      )}

      {viewMode === '3d' ? (
        <>
          {/* =================================================================== */}
          {/* 2. MAIN 3D FULL-VIEWPORT WORLD SCENE (We Are Football / Evony)      */}
          {/* =================================================================== */}
          <div className="w-full h-full">
            <ClubEmpire3DScene
              empire={empire}
              club={userClub}
              selectedBuildingId={selectedBuildingId}
              onSelectBuilding={(id) => {
                setSelectedBuildingId(id);
                setSelectedPlot(null);
              }}
              onSelectPlot={(plot) => {
                setSelectedPlot(plot);
                setSelectedBuildingId(plot.assignedBuildingId ?? null);
              }}
              onClaimBooster={(type) => {
                runAction(claimEmpireHospitalBooster(type), `Claimed ${type} hospital booster`);
              }}
              cameraTarget={cameraTarget}
            />
          </div>

          {/* =================================================================== */}
          {/* 3. BOTTOM FLOATING ZONE NAVIGATION PILLS (Evony Category Tabs)      */}
          {/* =================================================================== */}
          <div className="absolute bottom-4 inset-x-4 z-20 pointer-events-none flex items-center justify-center">
            <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-navy-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-md overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Overview', icon: Crown },
                { id: 'stadium', label: 'Stadium', icon: Ticket },
                { id: 'training', label: 'Pitches', icon: Dumbbell },
                { id: 'medical', label: 'Medical & Pool', icon: HeartPulse },
                { id: 'commercial', label: 'Megastore', icon: Landmark },
                { id: 'youth', label: 'Youth Academy', icon: Users },
                { id: 'land', label: 'Land Expansion', icon: MapPin },
                { id: 'finances', label: 'Financials', icon: Coins },
              ].map((z) => {
                const Icon = z.icon;
                const isActive = activeZone === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => glideToZone(z.id as CampusZoneFilter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-pitch-500 text-navy-950 shadow-lg shadow-pitch-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-navy-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{z.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. CAMERA CONTROL INSTRUCTIONS (Bottom-Left - Image 2 Style) */}
          <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-navy-950/80 border border-slate-800 text-[10px] text-slate-400 backdrop-blur-md">
            <div className="flex items-center gap-1 font-mono font-bold text-slate-300">
              <span className="px-1 py-0.5 rounded bg-navy-900 border border-slate-800">W</span>
              <span className="px-1 py-0.5 rounded bg-navy-900 border border-slate-800">A</span>
              <span className="px-1 py-0.5 rounded bg-navy-900 border border-slate-800">S</span>
              <span className="px-1 py-0.5 rounded bg-navy-900 border border-slate-800">D</span>
            </div>
            <span>&bull; Drag to Orbit &bull; Scroll to Zoom &bull; Tap Building to Inspect</span>
          </div>
        </>
      ) : (
        /* 2D INFRASTRUCTURE DASHBOARD VIEW (Image 1 Style) */
        <div className="w-full h-full overflow-y-auto pt-24 p-4 sm:p-6 space-y-6">
          {/* Navigation Tab Bar matching Image 1 */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-navy-900/90 border border-slate-800 overflow-x-auto">
            {SECTIONS_2D.map((sec) => {
              const Icon = sec.icon;
              const isSelected = active2dSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    soundManager.playUiClick();
                    setActive2dSection(sec.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-pitch-500 text-navy-950 shadow-md shadow-pitch-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* 1. CLUB OVERVIEW (Image 1 match) */}
          {active2dSection === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Active Construction Queue */}
              <div className="space-y-4 rounded-2xl border border-slate-800 bg-navy-900/70 p-5 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" />
                    Active Construction Queue
                  </h2>
                  <span className="text-xs text-slate-400">
                    {empire.activeConstructions.length} / {empire.maxSimultaneousConstructions} Slots
                  </span>
                </div>

                {empire.activeConstructions.length === 0 ? (
                  <div className="rounded-xl border border-slate-800/80 bg-navy-950/60 p-6 text-center text-xs text-slate-400">
                    No active construction projects. Select any facility or campus plot to begin upgrades.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {empire.activeConstructions.map((proj) => {
                      const def = CLUB_EMPIRE_BUILDINGS_CATALOG[proj.buildingId];
                      const endMs =
                        proj.expectedCompletionMs ??
                        proj.completedAtMs ??
                        proj.startTimestampMs + proj.originalDurationMs;
                      const remainingMs = Math.max(0, endMs - nowMs);
                      const totalMs = proj.originalDurationMs || 60000;
                      const pct = Math.min(100, Math.max(0, Math.round(((totalMs - remainingMs) / totalMs) * 100)));
                      const isReady = remainingMs <= 0;

                      return (
                        <div key={proj.buildingId} className="rounded-xl border border-slate-800 bg-navy-950/60 p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-white text-sm">
                                {def?.name ?? proj.buildingId} &rarr; Lv {proj.targetLevel}
                              </div>
                              <div className="text-xs text-slate-400">
                                Remaining:{' '}
                                <span className={`font-mono font-bold ${isReady ? 'text-emerald-400' : 'text-amber-300'}`}>
                                  {formatRemaining(remainingMs)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              {isReady ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    soundManager.playUpgradeComplete();
                                    await syncClubEmpireTimers();
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-pitch-500 hover:bg-pitch-400 text-navy-950 font-black uppercase text-xs shadow-md shadow-pitch-500/20"
                                >
                                  Claim &amp; Finish
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundManager.playUiClick();
                                      runAction(useEmpireConstructionBooster(proj.projectId, 'common'), 'Applied 5% speedup');
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-700 text-slate-200 font-bold"
                                  >
                                    5% Boost ({empire.constructionBoosters.common})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundManager.playUiClick();
                                      runAction(useEmpireConstructionBooster(proj.projectId, 'rare'), 'Applied 10% speedup');
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-navy-900 hover:bg-navy-800 border border-cyan-800 text-cyan-300 font-bold"
                                  >
                                    10% Boost ({empire.constructionBoosters.rare})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundManager.playUiClick();
                                      runAction(useEmpireAdReduction(proj.projectId), 'Applied Ad Reduction');
                                    }}
                                    className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                                  >
                                    Watch Ad (-10% / 30m max)
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2 w-full rounded-full bg-navy-900 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${isReady ? 'bg-emerald-400' : 'bg-pitch-400'}`}
                              style={{ width: `${isReady ? 100 : Math.max(5, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Club Development Status (Image 1 match) */}
              <div className="space-y-4 rounded-2xl border border-slate-800 bg-navy-900/70 p-5">
                <h3 className="text-base font-black uppercase text-white">Club Development Status</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Development Tier</span>
                    <span className="font-bold text-pitch-400">{tierInfo.tier}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Pitch Injury Risk</span>
                    <span className="font-bold text-white">{(pitchRiskMultiplier * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Pitch Morale Bonus</span>
                    <span className="font-bold text-emerald-400">+{pitchMoraleBonus}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Superstar Influence</span>
                    <span className="font-bold text-amber-300">+{superstarInfluence.totalCommercialInfluence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Museum Tourism / Wk</span>
                    <span className="font-bold text-white">{formatMoney(museumIncome.weeklyTourismIncome)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('3d')}
                    className="w-full py-2.5 rounded-xl bg-pitch-500 hover:bg-pitch-400 text-navy-950 font-black uppercase text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-pitch-500/20"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Launch 3D Evony Campus</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. STADIUM */}
          {active2dSection === 'stadium' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  'stadium_stands',
                  'football_pitch',
                  'floodlights_sound',
                  'vip_hospitality_boxes',
                  'concourse_amenities',
                  'video_scoreboard',
                  'var_goal_line_tech',
                ].map((id) => renderBuildingCard(id as ClubEmpireBuildingId))}
              </div>

              {/* Matchday Ticket Pricing */}
              <div className="rounded-2xl border border-slate-800 bg-navy-900/70 p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Ticket className="w-5 h-5 text-gold-400" />
                  <span>Home Match Ticket Pricing</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="flex justify-between text-xs text-slate-300">
                      <span>General Admission</span>
                      <strong className="text-pitch-400">€{ticketPriceDraft}</strong>
                    </label>
                    <input
                      type="range"
                      min={15}
                      max={90}
                      value={ticketPriceDraft}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTicketPriceDraft(val);
                        updateEmpireTicketPricing({
                          generalPrice: val,
                          premiumPrice: empire.ticketPricing.premiumPrice,
                          vipPrice: vipPriceDraft,
                        });
                      }}
                      className="w-full accent-pitch-500 mt-2"
                    />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs text-slate-300">
                      <span>VIP Hospitality Ticket</span>
                      <strong className="text-gold-400">€{vipPriceDraft}</strong>
                    </label>
                    <input
                      type="range"
                      min={40}
                      max={250}
                      value={vipPriceDraft}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setVipPriceDraft(val);
                        updateEmpireTicketPricing({
                          generalPrice: ticketPriceDraft,
                          premiumPrice: empire.ticketPricing.premiumPrice,
                          vipPrice: val,
                        });
                      }}
                      className="w-full accent-gold-400 mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. TRAINING CAMPUS */}
          {active2dSection === 'training' && (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                'training_complex',
                'fitness_gym',
                'tactical_analysis_room',
                'recovery_swimming_pool',
              ].map((id) => renderBuildingCard(id as ClubEmpireBuildingId))}
            </div>
          )}

          {/* 4. MEDICAL CAMPUS */}
          {active2dSection === 'medical' && (
            <div className="space-y-6">
              {/* Booster Offline Storage */}
              <div className="rounded-2xl border border-sky-500/30 bg-navy-900/80 p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold text-white">
                    <HeartPulse className="w-5 h-5 text-sky-400" />
                    <span>Hospital Offline Booster Generation</span>
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Boosters heal injured players and speed up match recovery.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playBoosterCollect();
                      runAction(claimEmpireHospitalBooster('individual'), 'Collected Individual Recovery Booster');
                    }}
                    disabled={empire.hospitalProduction.individualBoostersStored === 0}
                    className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-navy-950 font-bold text-xs"
                  >
                    Collect Ind ({empire.hospitalProduction.individualBoostersStored}/{empire.hospitalProduction.individualStorageCap})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playBoosterCollect();
                      runAction(claimEmpireHospitalBooster('team'), 'Collected Team Recovery Booster');
                    }}
                    disabled={empire.hospitalProduction.teamBoostersStored === 0}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-navy-950 font-bold text-xs"
                  >
                    Collect Team ({empire.hospitalProduction.teamBoostersStored}/{empire.hospitalProduction.teamStorageCap})
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  'club_hospital',
                  'rehabilitation_centre',
                  'sports_science_lab',
                ].map((id) => renderBuildingCard(id as ClubEmpireBuildingId))}
              </div>
            </div>
          )}

          {/* 5. YOUTH DEVELOPMENT */}
          {active2dSection === 'youth' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-navy-900/70 p-4 text-xs text-slate-300">
                Youth Academy Capacity: <strong className="text-pitch-400">{youthCapacity} prospects</strong>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  'youth_academy',
                  'youth_residence',
                  'scouting_centre',
                ].map((id) => renderBuildingCard(id as ClubEmpireBuildingId))}
              </div>
            </div>
          )}

          {/* 6. COMMERCIAL DISTRICT */}
          {active2dSection === 'commercial' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-navy-900/70 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Trophy className="w-4 h-4 text-gold-400" />
                    Trophy Museum
                  </div>
                  <div className="mt-1 text-base font-bold text-white">
                    {empire.buildings.club_museum?.level ?? 0 > 0 ? 'Open' : 'Locked'}
                  </div>
                  <div className="text-xs text-emerald-300">
                    Tourism: {formatMoney(museumIncome.weeklyTourismIncome)}/wk
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-navy-900/70 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Commercial Influence
                  </div>
                  <div className="mt-1 text-base font-bold text-white">
                    Score: {superstarInfluence.totalCommercialInfluence}
                  </div>
                  <div className="text-xs text-slate-400">
                    Multiplier: x{superstarInfluence.merchandiseMultiplier.toFixed(2)}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-navy-900/70 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Sponsorships
                  </div>
                  <div className="mt-1 text-base font-bold text-white">{empire.sponsorships.length} Active</div>
                  <div className="text-xs text-slate-400">Yields weekly guaranteed revenue</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  'club_merchandise_store',
                  'sponsorship_centre',
                  'media_broadcast_centre',
                  'club_museum',
                  'parking_transport',
                  'supporters_club',
                  'community_centre',
                  'security_operations',
                ].map((id) => renderBuildingCard(id as ClubEmpireBuildingId))}
              </div>
            </div>
          )}

          {/* 7. LAND & CONSTRUCTION */}
          {active2dSection === 'land' && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {empire.landPlots.map((plot) => (
                <div key={plot.plotId} className="rounded-2xl border border-slate-800 bg-navy-900/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{plot.name}</h4>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                        plot.owned ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {plot.owned ? 'Owned' : 'Locked'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Zone: {plot.zone} &bull; Size: {plot.size}</p>
                  {!plot.owned && (
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playCoinCollect();
                        runAction(buyEmpireLandPlot(plot.plotId), `Purchased ${plot.name}`);
                      }}
                      className="w-full py-2 rounded-xl bg-pitch-500 hover:bg-pitch-400 text-navy-950 font-black uppercase text-xs transition"
                    >
                      Purchase Land ({formatMoney(plot.purchaseCost)})
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 8. CLUB FINANCES */}
          {active2dSection === 'finances' && (
            <div className="rounded-2xl border border-slate-800 bg-navy-900/70 p-5 space-y-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                <Coins className="w-5 h-5 text-emerald-400" />
                <span>Club Empire Financial Ledger</span>
              </h3>
              {empire.transactions.length === 0 ? (
                <p className="text-xs text-slate-400">No infrastructure transactions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {empire.transactions.slice(0, 15).map((tx, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-navy-950/60 px-4 py-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{tx.description}</div>
                        <div className="text-[10px] text-slate-500">{tx.category}</div>
                      </div>
                      <span className={`font-mono font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.amount >= 0 ? '+' : ''}{formatMoney(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9. DEVELOPMENT MISSIONS */}
          {active2dSection === 'missions' && (
            <div className="grid gap-4 md:grid-cols-2">
              {empire.missions.map((m) => (
                <div key={m.missionId} className="rounded-2xl border border-slate-800 bg-navy-900/70 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{m.title}</h4>
                      <p className="text-xs text-slate-400">{m.description}</p>
                    </div>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                        m.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-amber-300'
                      }`}
                    >
                      {m.completed ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span>Progress: {m.currentValue} / {m.targetValue}</span>
                    <span className="text-emerald-400 font-bold">Reward: {formatMoney(m.rewardTreasury)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. SLIDE-IN FACILITY & CONSTRUCTION DRAWER (Right Side)             */}
      {/* =================================================================== */}
      {(selectedBuildingId || selectedPlot) && (
        <div className="absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[420px] bg-navy-950/95 border-l border-slate-800 p-6 shadow-2xl backdrop-blur-xl overflow-y-auto space-y-5 animate-slide-left">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-pitch-400 tracking-wider">
                {selectedPlot && !selectedBuildingId ? 'Campus Land Plot' : 'Infrastructure Facility'}
              </span>
              <h2 className="text-xl font-black uppercase text-white">
                {selectedBuildingDef?.name ?? selectedPlot?.name ?? 'Facility Manager'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                setSelectedBuildingId(null);
                setSelectedPlot(null);
              }}
              className="p-1.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* A. UNOWNED LAND PLOT PURCHASE MODE */}
          {selectedPlot && !selectedPlot.owned && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-300">Plot Details</div>
                <div className="text-xs text-slate-400">
                  Zone: <strong className="text-white uppercase">{selectedPlot.zone}</strong> &bull; Size:{' '}
                  <strong className="text-white uppercase">{selectedPlot.size}</strong>
                </div>
                <div className="text-xs text-slate-400">
                  Required Tier: <strong className="text-pitch-400">{selectedPlot.requiredTier}</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-center space-y-2">
                <div className="text-xs uppercase font-extrabold text-gold-400">Acquisition Cost</div>
                <div className="text-3xl font-black text-white">{formatMoney(selectedPlot.purchaseCost)}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundManager.playCoinCollect();
                  runAction(buyEmpireLandPlot(selectedPlot.plotId), `Acquired ${selectedPlot.name}`);
                  setSelectedPlot(null);
                }}
                className="w-full py-3 rounded-2xl bg-pitch-500 hover:bg-pitch-400 text-navy-950 font-black uppercase text-sm tracking-wide shadow-lg shadow-pitch-500/30 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Purchase &amp; Expand Campus</span>
              </button>
            </div>
          )}

          {/* B. BUILDING FACILITY INSPECTOR & UPGRADE CONTROLS */}
          {selectedBuildingDef && selectedBuildingState && (
            <div className="space-y-5">
              {/* Current Level Badge & Category */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-navy-900 border border-slate-800">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current Facility Level</div>
                  <div className="text-lg font-black text-white">
                    Level {selectedBuildingState.level} / {selectedBuildingDef.maxLevel}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-pitch-500/15 border border-pitch-500/30 text-pitch-400 font-bold text-xs uppercase">
                  {selectedBuildingDef.category}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-navy-900/60 p-3 rounded-xl border border-slate-800/80">
                {selectedBuildingDef.description}
              </p>

              {/* Active Construction Timer & Accelerators */}
              {selectedBuildingProject && (() => {
                const endMs =
                  selectedBuildingProject.expectedCompletionMs ??
                  selectedBuildingProject.completedAtMs ??
                  (selectedBuildingProject.startTimestampMs + selectedBuildingProject.originalDurationMs);
                const remainingMs = Math.max(0, endMs - nowMs);
                const totalDurationMs =
                  selectedBuildingProject.originalDurationMs ||
                  (selectedBuildingDef.levels[nextLevel]?.durationMinutes * 60 * 1000) ||
                  60000;
                const elapsedRatio = Math.min(1, Math.max(0, 1 - remainingMs / totalDurationMs));
                const isReady = remainingMs <= 0;

                return (
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isReady
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 font-black text-xs uppercase ${
                        isReady ? 'text-emerald-400' : 'text-amber-300'
                      }`}>
                        <Clock className={`w-4 h-4 ${isReady ? '' : 'animate-spin'}`} />
                        <span>{isReady ? 'Construction Finished' : 'Construction in Progress'}</span>
                      </div>
                      <span className={`text-xs font-mono font-bold ${
                        isReady ? 'text-emerald-300' : 'text-white'
                      }`}>
                        {formatRemaining(remainingMs)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 w-full rounded-full bg-navy-950 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isReady ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{
                          width: `${isReady ? 100 : Math.min(100, Math.max(5, Math.round(elapsedRatio * 100)))}%`,
                        }}
                      />
                    </div>

                    {/* Ready Claim Button or Speedup Controls */}
                    {isReady ? (
                      <button
                        type="button"
                        onClick={async () => {
                          soundManager.playUpgradeComplete();
                          await syncClubEmpireTimers();
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-pitch-500 hover:from-emerald-400 hover:to-pitch-400 text-navy-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Complete &amp; Open Facility (Lv {selectedBuildingProject.targetLevel})</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playUiClick();
                            runAction(
                              useEmpireConstructionBooster(selectedBuildingProject.projectId, 'common'),
                              'Used 5% Construction Booster'
                            );
                          }}
                          className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-800 text-slate-200 text-center font-bold"
                        >
                          5% Speedup ({empire.constructionBoosters.common})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playUiClick();
                            runAction(
                              useEmpireConstructionBooster(selectedBuildingProject.projectId, 'rare'),
                              'Used 10% Construction Booster'
                            );
                          }}
                          className="p-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-800 text-cyan-300 text-center font-bold"
                        >
                          10% Speedup ({empire.constructionBoosters.rare})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.playUiClick();
                            runAction(
                              useEmpireAdReduction(selectedBuildingProject.projectId),
                              'Applied Watch Ad Speedup'
                            );
                          }}
                          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 text-center font-black"
                        >
                          Watch Ad (-10%)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Facility Upgrade Benefit Matrix */}
              <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-300 uppercase text-[11px]">Facility Effect &amp; Output</div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Current Tier Effect:</span>
                  <strong className="text-white">
                    {selectedBuildingDef.levels[selectedBuildingState.level]?.benefitLabel ?? 'Base Tier'}
                  </strong>
                </div>
                {nextLevel <= selectedBuildingDef.maxLevel && (
                  <div className="flex items-center justify-between text-pitch-400 pt-1 border-t border-slate-800">
                    <span>Next Level {nextLevel}:</span>
                    <strong className="text-pitch-400">
                      {selectedBuildingDef.levels[nextLevel]?.benefitLabel ?? 'Enhanced Performance'}
                    </strong>
                  </div>
                )}
              </div>

              {/* SPECIAL FACILITY ACTIONS */}
              {/* Medical Hospital Booster Claim */}
              {selectedBuildingDef.id === 'club_hospital' && (
                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 uppercase">Hospital Booster Storage</span>
                    <span className="text-xs font-black text-white">
                      {empire.hospitalProduction.individualBoostersStored} /{' '}
                      {empire.hospitalProduction.individualStorageCap}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playBoosterCollect();
                        runAction(claimEmpireHospitalBooster('individual'), 'Collected Individual Recovery Booster');
                      }}
                      disabled={empire.hospitalProduction.individualBoostersStored === 0}
                      className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold transition text-center"
                    >
                      Collect Ind ({empire.hospitalProduction.individualBoostersStored})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playBoosterCollect();
                        runAction(claimEmpireHospitalBooster('team'), 'Collected Team Recovery Booster');
                      }}
                      disabled={empire.hospitalProduction.teamBoostersStored === 0}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold transition text-center"
                    >
                      Collect Team ({empire.hospitalProduction.teamBoostersStored})
                    </button>
                  </div>
                </div>
              )}

              {/* Stadium Ticket Pricing Controls */}
              {selectedBuildingDef.id === 'stadium_stands' && (
                <div className="p-4 rounded-2xl bg-navy-900 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-white uppercase">Matchday Ticket Pricing</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>General Admission</span>
                      <strong className="text-white">€{ticketPriceDraft}</strong>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={75}
                      value={ticketPriceDraft}
                      onChange={(e) => setTicketPriceDraft(Number(e.target.value))}
                      className="w-full accent-pitch-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>VIP Executive Box</span>
                      <strong className="text-gold-400">€{vipPriceDraft}</strong>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={250}
                      value={vipPriceDraft}
                      onChange={(e) => setVipPriceDraft(Number(e.target.value))}
                      className="w-full accent-gold-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playUiClick();
                      runAction(
                        updateEmpireTicketPricing({
                          generalPrice: ticketPriceDraft,
                          premiumPrice: Math.round((ticketPriceDraft + vipPriceDraft) / 2),
                          vipPrice: vipPriceDraft,
                        }),
                        'Updated Matchday Ticket Pricing'
                      );
                    }}
                    className="w-full py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-bold text-slate-200 border border-slate-700"
                  >
                    Confirm Ticket Pricing
                  </button>
                </div>
              )}

              {/* Upgrade Button / Construction Action */}
              {!selectedBuildingProject && nextLevel <= selectedBuildingDef.maxLevel && (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={!evalRes?.eligible}
                    onClick={() => {
                      soundManager.playUpgradeComplete();
                      runAction(
                        startEmpireConstruction(selectedBuildingDef.id),
                        `Started ${selectedBuildingDef.name} upgrade to Lv.${nextLevel}`
                      );
                    }}
                    className={`w-full py-3.5 rounded-2xl font-black uppercase text-sm tracking-wide shadow-xl transition-all flex items-center justify-center gap-2 ${
                      evalRes?.eligible
                        ? 'bg-pitch-500 hover:bg-pitch-400 text-navy-950 shadow-pitch-500/25 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>
                      {selectedBuildingState.level === 0 ? 'Construct Facility' : `Upgrade to Level ${nextLevel}`}{' '}
                      ({formatMoney(evalRes?.cost ?? 0)})
                    </span>
                  </button>
                  {!evalRes?.eligible && evalRes?.missingReasons && evalRes.missingReasons.length > 0 && (
                    <p className="text-[11px] text-amber-400 text-center font-semibold">
                      {evalRes.missingReasons[0]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
