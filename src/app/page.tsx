'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertTriangle, PlayCircle, HardDriveDownload } from 'lucide-react';
import { CareerCreationScreen } from '@/components/career/CareerCreationScreen';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { useGameStore } from '@/store/useGameStore';

export default function HomePage() {
  const {
    gameState,
    isHydrated,
    hydrationStep,
    hydrationError,
    saveSlots,
    hydrateFromStorage,
    loadFromSlot,
    recoverWithFreshCareerScreen,
  } = useGameStore();
  const [progress, setProgress] = useState(25);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (isHydrated) return;
    const timer = setInterval(() => {
      setProgress((prev) => Math.min(92, prev + 18));
    }, 300);
    return () => clearInterval(timer);
  }, [isHydrated]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-navy-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-full border-4 border-pitch-500 border-t-transparent animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              Ultimate Football Manager
            </h2>
            <p className="text-xs font-semibold text-pitch-400">{hydrationStep}</p>
          </div>
          <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-pitch-600 to-gold-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => recoverWithFreshCareerScreen()}
            className="text-[11px] text-slate-400 hover:text-white underline"
          >
            Taking too long? Skip straight to Career Menu
          </button>
        </div>
      </div>
    );
  }

  if (hydrationError && !gameState) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-navy-900 border border-amber-500/40 rounded-3xl p-7 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h2 className="text-lg font-extrabold text-white">
              Career Database Recovery &amp; Diagnostics
            </h2>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{hydrationError}</p>

          {saveSlots.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold uppercase text-gold-400 flex items-center gap-1.5">
                <HardDriveDownload className="w-4 h-4" />
                <span>Available Backup Save Slots</span>
              </div>
              {saveSlots.map((slot) => (
                <button
                  key={slot.slotId}
                  type="button"
                  onClick={() => loadFromSlot(slot.slotId)}
                  className="w-full p-3 rounded-xl bg-navy-950 hover:bg-navy-800 border border-slate-700 text-left flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-white">
                    {slot.slotId.toUpperCase()}: {slot.clubName} ({slot.managerName})
                  </span>
                  <span className="text-pitch-400 font-bold">
                    Season {slot.seasonYear} &bull; W{slot.currentWeek}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => hydrateFromStorage()}
              className="px-4 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Database Connection</span>
            </button>
            <button
              type="button"
              onClick={() => recoverWithFreshCareerScreen()}
              className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2"
            >
              <PlayCircle className="w-4 h-4 text-gold-400" />
              <span>Start / Load Career Menu</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {gameState ? <AppShell /> : <CareerCreationScreen />}
    </ErrorBoundary>
  );
}
