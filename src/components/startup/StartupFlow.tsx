'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Trophy,
  Sparkles,
  Play,
  SkipForward,
  Shield,
  Building2,
  ChevronRight,
  Flame,
  Globe2,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CareerCreationScreen } from '@/components/career/CareerCreationScreen';
import { AppShell } from '@/components/layout/AppShell';
import { AuthModal } from '@/components/startup/AuthModal';
import { CareerHubScreen } from '@/components/startup/CareerHubScreen';
import { soundManager } from '@/lib/audio';
import {
  AuthSession,
  createGuestSession,
  getIntroSkipPreference,
  getStoredSession,
  logoutSession,
  setIntroSkipPreference,
} from '@/services/authService';
import { IndexedDBSaveRepository, SaveSlotId } from '@/services/saveRepository';
import { useGameStore } from '@/store/useGameStore';

type StartupStage =
  | 'studio_logo'
  | 'game_logo'
  | 'loading'
  | 'prologue'
  | 'welcome'
  | 'career_hub'
  | 'new_career';

export function StartupFlow() {
  const {
    gameState,
    isHydrated,
    hydrationStep,
    saveSlots,
    hydrateFromStorage,
    loadFromSlot,
    recoverWithFreshCareerScreen,
  } = useGameStore();

  const [stage, setStage] = useState<StartupStage>('studio_logo');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'convert_guest'>('login');
  const [rememberSkip, setRememberSkip] = useState(false);
  const [progress, setProgress] = useState(25);
  const [selectedHighlightMode, setSelectedHighlightMode] = useState<'original' | 'real'>('original');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    hydrateFromStorage();
    setSession(getStoredSession());
    setRememberSkip(getIntroSkipPreference());
  }, [hydrateFromStorage]);

  // Step 1: Studio Logo -> Step 2: Game Logo -> Step 3: Loading
  useEffect(() => {
    if (stage === 'studio_logo') {
      const t = setTimeout(() => setStage('game_logo'), 1300);
      return () => clearTimeout(t);
    }
    if (stage === 'game_logo') {
      const t = setTimeout(() => setStage('loading'), 1200);
      return () => clearTimeout(t);
    }
  }, [stage]);

  // Step 3: Loading -> Prologue or Welcome
  useEffect(() => {
    if (stage !== 'loading') return;
    const timer = setInterval(() => {
      setProgress((prev) => Math.min(isHydrated ? 100 : 92, prev + 18));
    }, 150);
    if (isHydrated) {
      const doneTimer = setTimeout(() => {
        setStage(getIntroSkipPreference() ? 'welcome' : 'prologue');
      }, 400);
      return () => {
        clearInterval(timer);
        clearTimeout(doneTimer);
      };
    }
    return () => clearInterval(timer);
  }, [stage, isHydrated]);

  // If a career is active in store, launch directly into AppShell
  if (gameState) {
    return <AppShell />;
  }

  // 1. Studio Logo (UNTOLD CREATIONS Official)
  if (stage === 'studio_logo') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
        <div className="relative w-80 max-w-[85vw] aspect-[16/9] flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center gap-1.5 text-gold-400">
            {[...Array(7)].map((_, i) => (
              <span key={i} className="text-sm font-black animate-pulse">★</span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.3em] text-white drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            UNTOLD
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.45em] text-slate-400">
            C R E A T I O N S
          </p>
        </div>
      </div>
    );
  }

  // 2. Game Logo & Opening Cinematic Title
  if (stage === 'game_logo') {
    return (
      <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center p-6 overflow-hidden select-none">
        <div
          className="absolute inset-0 opacity-40 scale-105 animate-pulse"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(132, 204, 22, 0.25) 0%, rgba(2, 6, 23, 0.95) 75%)',
          }}
        />
        <div className="relative z-10 text-center space-y-4 max-w-xl">
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-lime-400 via-pitch-500 to-emerald-700 flex items-center justify-center shadow-[0_0_50px_rgba(132,204,22,0.5)]">
            <Trophy className="w-10 h-10 text-navy-950" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-400 animate-ping" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-lime-400">
              Next-Gen Football Management Simulation
            </p>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
              Ultimate Football Manager
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              20 Nations &bull; 40 Divisions &bull; 732 Clubs &bull; 18,300 Players
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Loading & Initialization
  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 relative flex items-center justify-center p-6 overflow-hidden select-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 20%, rgba(132, 204, 22, 0.15) 0%, rgba(15, 23, 42, 0.95) 60%, #030712 100%)',
          }}
        />

        <div className="relative z-10 max-w-md w-full bg-slate-900/95 border border-slate-700/80 rounded-3xl p-8 text-center space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center mx-auto shadow-inner shadow-lime-400/20">
            <Trophy className="w-8 h-8 text-lime-400 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              Calibrating Simulation Engine
            </h2>
            <p className="text-xs font-semibold text-lime-400">{hydrationStep}</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-lime-400 via-emerald-400 to-gold-400 transition-all duration-300 shadow-[0_0_12px_rgba(132,204,22,0.8)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Database Sync</span>
              <span className="text-lime-300">{progress}%</span>
            </div>
          </div>
          {!isHydrated && (
            <button
              type="button"
              onClick={() => {
                recoverWithFreshCareerScreen();
                setStage('welcome');
              }}
              className="text-[11px] text-slate-400 hover:text-white underline transition-colors"
            >
              Taking too long? Skip to Welcome Screen
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Cinematic Prologue (Tunnel Walkout)
  if (stage === 'prologue') {
    const finishPrologue = () => {
      if (rememberSkip) {
        setIntroSkipPreference(true);
      }
      setStage('welcome');
    };

    return (
      <div className="min-h-screen bg-black text-white relative flex flex-col justify-between p-6 sm:p-10 overflow-hidden select-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.25) 0%, rgba(0, 0, 0, 0.95) 75%)',
          }}
        />

        {/* Top Controls */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-lime-400">
              Season 2026/27 Opening Ceremony
            </span>
          </div>
          <button
            type="button"
            onClick={finishPrologue}
            className="px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-700/80 backdrop-blur-md transition-colors"
          >
            <span>Skip Prologue</span>
            <SkipForward className="w-3.5 h-3.5 text-lime-400" />
          </button>
        </div>

        {/* Middle Dramatic Banner */}
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-300 text-[11px] font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-gold-400" />
            <span>The Touchline Is Yours</span>
          </div>
          <h2 className="text-3xl sm:text-6xl font-black leading-tight uppercase tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
            Every Dynasty Begins With One Decision.
          </h2>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            Command 732 authentic football clubs across 40 global leagues—or forge your own
            football empire from an empty ground to a world-class megastadium.
          </p>
          <div>
            <button
              type="button"
              onClick={finishPrologue}
              className="px-8 py-4 rounded-2xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-sm uppercase tracking-wider inline-flex items-center gap-2 shadow-[0_0_35px_rgba(132,204,22,0.5)] transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Enter Stadium</span>
            </button>
          </div>
        </div>

        {/* Bottom Skip Preference */}
        <div className="relative z-10 flex items-center justify-center">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-black/60 px-4 py-2 rounded-full border border-slate-800 backdrop-blur-sm">
            <input
              type="checkbox"
              checked={rememberSkip}
              onChange={(e) => setRememberSkip(e.target.checked)}
              className="rounded border-slate-700 bg-navy-900 text-lime-400 focus:ring-lime-400"
            />
            <span>Remember my choice and skip opening sequence next time</span>
          </label>
        </div>
      </div>
    );
  }

  // 5. Welcome & Game Mode Command Center (EA FC & FM Inspired Experience)
  if (stage === 'welcome') {
    const latestSlot = saveSlots[0] ?? null;

    return (
      <div
        className="min-h-screen text-slate-100 relative flex flex-col justify-between p-4 sm:p-8 select-none overflow-x-hidden"
        style={{
          backgroundColor: '#030712',
          backgroundImage: `
            radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.22) 0%, transparent 45%),
            radial-gradient(circle at 90% 10%, rgba(132, 204, 22, 0.18) 0%, transparent 45%),
            radial-gradient(ellipse at 50% 100%, rgba(16, 185, 129, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.9) 0%, #030712 100%)
          `,
        }}
      >
        {/* Top Header */}
        <header className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-gold-400">
                UNTOLD CREATIONS
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Sports Simulation Studio
              </span>
            </div>
            <span className="hidden sm:inline-block w-px h-5 bg-slate-800" />
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-lime-400">
              Interactive Management Edition
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold uppercase text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>732 Clubs &bull; 40 Leagues &bull; 18,300 Players</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400 text-[10px] font-black uppercase tracking-wider">
              Season 2026/27
            </span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 max-w-6xl w-full mx-auto my-auto py-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-lime-400 text-xs font-black uppercase tracking-widest shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Choose Your Career Path</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
              Ultimate Football Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
              Select how you want to conquer the football world. Build an empire from scratch or take the helm of a global giant.
            </p>
          </div>

          {/* Resume Active Career Banner (If Saves Exist) */}
          {latestSlot && (
            <div className="rounded-3xl border border-lime-400/40 bg-gradient-to-r from-slate-900 via-slate-900 to-lime-950/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_35px_rgba(132,204,22,0.15)]">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-lime-400">
                  <Play className="w-3 h-3 fill-current" />
                  Active Save Detected
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white">
                  {latestSlot.clubName}
                </h3>
                <p className="text-xs text-slate-300">
                  Manager: <strong className="text-white">{latestSlot.managerName}</strong> &bull; Season{' '}
                  {latestSlot.seasonYear} &bull; Week {latestSlot.currentWeek} &bull;{' '}
                  <span className="text-lime-300 font-semibold">
                    {latestSlot.state.careerType === 'original_team'
                      ? 'Original Club (Club Empire)'
                      : 'Real Club Career'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  soundManager.playUiClick();
                  await loadFromSlot(latestSlot.slotId as SaveSlotId);
                }}
                className="px-8 py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(132,204,22,0.4)] transition-all hover:scale-105 shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Career</span>
              </button>
            </div>
          )}

          {/* Dual Hero Game Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Original Team Career (Build Your Football Club) */}
            <div
              className={`relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between group ${
                selectedHighlightMode === 'original'
                  ? 'border-lime-400 shadow-[0_0_35px_rgba(132,204,22,0.3)] bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/70'
              }`}
            >
              <div
                className="relative h-48 w-full overflow-hidden p-5 flex flex-col justify-between"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(15, 23, 42, 0.95) 70%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 rounded-full bg-emerald-500 text-navy-950 font-black text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Featured Mode</span>
                  </div>
                  <span className="text-[11px] font-black uppercase text-gold-400">
                    Tier 2 Entry
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">
                    Exclusive 3D Campus &bull; Squad Draft
                  </span>
                  <h3 className="text-2xl font-black uppercase text-white drop-shadow-md">
                    Build Your Football Club
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Design your custom crest, home &amp; away kits, and stadium. Replace an existing club in Tier 2, inherit displaced players as free agents, and construct your 3D campus from ground to glory.
                </p>
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Stadium</div>
                    <div className="text-xs font-black text-lime-400">3D Campus</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Squad</div>
                    <div className="text-xs font-black text-emerald-400">23 Hybrid + Draft</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Empire</div>
                    <div className="text-xs font-black text-gold-400">9 Facilities</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playUiClick();
                    setSelectedHighlightMode('original');
                    setStage('new_career');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.02]"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Found Original Club &amp; Enter Tier 2</span>
                </button>
              </div>
            </div>

            {/* Card 2: Real Club Career */}
            <div
              className={`relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between group ${
                selectedHighlightMode === 'real'
                  ? 'border-lime-400 shadow-[0_0_35px_rgba(132,204,22,0.3)] bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/70'
              }`}
            >
              <div
                className="relative h-48 w-full overflow-hidden p-5 flex flex-col justify-between"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(15, 23, 42, 0.95) 70%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-white font-black text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-lime-400" />
                    <span>Authentic World</span>
                  </div>
                  <span className="text-[11px] font-black uppercase text-blue-400">
                    UEFA Champions League
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">
                    20 Nations &bull; 40 Leagues &bull; 732 Clubs
                  </span>
                  <h3 className="text-2xl font-black uppercase text-white drop-shadow-md">
                    Real Club Career
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Take the hotseat at 732 real clubs across the globe. Compete in authentic domestic divisions, national cups, and 36-team continental tournaments with full transfer depth.
                </p>
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Clubs</div>
                    <div className="text-xs font-black text-lime-400">732 Teams</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Players</div>
                    <div className="text-xs font-black text-emerald-400">18,300+</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Tactics</div>
                    <div className="text-xs font-black text-gold-400">12 Matrix Styles</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playUiClick();
                    setSelectedHighlightMode('real');
                    setStage('new_career');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-transform hover:scale-[1.02]"
                >
                  <Shield className="w-4 h-4 text-lime-400" />
                  <span>Select Real Club &amp; Sign Contract</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Play & Session Actions Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                const guest = createGuestSession();
                setSession(guest);
                setStage('new_career');
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(132,204,22,0.4)] transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Instant Kick-Off as Guest</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                setAuthModalMode('login');
                setShowAuthModal(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-gold-400/30 text-gold-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <span>{session ? `Signed in: ${session.user.displayName}` : 'Sign In / Cloud Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playUiClick();
                setStage('career_hub');
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-lime-400" />
              <span>Career Save Slots ({saveSlots.length})</span>
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 gap-2">
          <span>&copy; 2026 Untold Creations &bull; Ultimate Football Manager</span>
          <div className="flex items-center gap-3">
            <span>Deterministic Engine</span>
            <span>&bull;</span>
            <span>Cloud &amp; IndexedDB Sync</span>
            <span>&bull;</span>
            <span>UEFA Champions League Engine</span>
          </div>
        </footer>

        {showAuthModal && (
          <AuthModal
            initialMode={authModalMode}
            onAuthenticated={(newSession) => {
              setSession(newSession);
              setShowAuthModal(false);
              setStage('career_hub');
            }}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    );
  }

  // 6. Career Selection Hub
  if (stage === 'career_hub') {
    return (
      <>
        <CareerHubScreen
          session={session ?? createGuestSession()}
          saveSlots={saveSlots}
          onContinueCareer={async (slotId: SaveSlotId) => {
            soundManager.playUiClick();
            await loadFromSlot(slotId);
          }}
          onCreateNewCareer={(careerType: 'real_club' | 'original_team') => {
            soundManager.playUiClick();
            setSelectedHighlightMode(careerType === 'original_team' ? 'original' : 'real');
            setStage('new_career');
          }}
          onDeleteCareer={async (slotId: SaveSlotId) => {
            soundManager.playUiClick();
            await new IndexedDBSaveRepository().deleteSlot(slotId);
            await hydrateFromStorage();
          }}
          onUpgradeGuest={() => {
            soundManager.playUiClick();
            setAuthModalMode('convert_guest');
            setShowAuthModal(true);
          }}
          onLogout={async () => {
            soundManager.playUiClick();
            await logoutSession();
            setSession(null);
            setStage('welcome');
          }}
        />
        {showAuthModal && (
          <AuthModal
            initialMode={authModalMode}
            onAuthenticated={(newSession) => {
              setSession(newSession);
              setShowAuthModal(false);
            }}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </>
    );
  }

  // 7. New Career Wizard
  return (
    <div className="relative">
      <div className="bg-navy-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            soundManager.playUiClick();
            setStage('welcome');
          }}
          className="text-xs font-semibold text-slate-300 hover:text-white underline flex items-center gap-1"
        >
          &larr; Back to Welcome Screen
        </button>
        <span className="text-xs text-slate-400">
          Signed in as: <strong className="text-white">{session?.user.displayName ?? 'Guest Manager'}</strong>
        </span>
      </div>
      <CareerCreationScreen initialCareerType={selectedHighlightMode === 'original' ? 'original_team' : 'real_club'} />
    </div>
  );
}
