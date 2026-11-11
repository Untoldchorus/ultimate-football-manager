'use client';

import React, { useEffect } from 'react';
import { CareerCreationScreen } from '@/components/career/CareerCreationScreen';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { useGameStore } from '@/store/useGameStore';

export default function HomePage() {
  const { gameState, isHydrated, hydrateFromStorage } = useGameStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-full border-4 border-pitch-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-widest text-pitch-400">
            Loading Career Database...
          </p>
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
