'use client';

import React, { useState } from 'react';
import {
  Home,
  Building2,
  Users,
  Sliders,
  ArrowLeftRight,
  Compass,
  Dumbbell,
  Calendar,
  Trophy,
  Landmark,
  GraduationCap,
  History,
  Settings,
  Play,
  Menu,
  X,
  GitBranch,
  Backpack,
  ShoppingBag,
  Shield,
  Coins,
  Sparkles,
  Crown,
} from 'lucide-react';
import { ensureEconomyState } from '@/engine/boosterEconomy';
import { soundManager } from '@/lib/audio';
import { NavTab, useGameStore } from '@/store/useGameStore';
import { AdminBalanceDashboard } from '../economy/AdminBalanceDashboard';
import { BoosterInventoryScreen } from '../economy/BoosterInventoryScreen';
import { PremiumStoreScreen } from '../economy/PremiumStoreScreen';
import { CutsceneModal } from './CutsceneModal';
import { HomeDashboard } from './HomeDashboard';
import { ChemistrySynergyScreen } from '../squad/ChemistrySynergyScreen';
import { SquadScreen } from '../squad/SquadScreen';
import { TacticsScreen } from '../squad/TacticsScreen';
import { TransfersScreen } from '../management/TransfersScreen';
import {
  ScoutingScreen,
  TrainingScreen,
  YouthAcademyScreen,
} from '../management/TrainingScoutingYouthScreens';
import {
  ClubHistoryScreen,
  CompetitionsScreen,
  FinancesScreen,
  FixturesScreen,
  MyClubScreen,
  SettingsScreen,
} from '../management/ClubFinanceHistorySettingsScreens';
import { MatchdayScreen } from '../match/MatchdayScreen';
import { ClubCrest } from '../ui/FootballVisuals';

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'myClub', label: 'My Club', icon: Building2 },
  { id: 'squad', label: 'Squad', icon: Users },
  { id: 'tactics', label: 'Tactics', icon: Sliders },
  { id: 'chemistry', label: 'Chemistry & Synergy', icon: GitBranch },
  { id: 'inventory', label: 'Booster Inventory', icon: Backpack },
  { id: 'store', label: 'Store & Starter Pack', icon: ShoppingBag },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'scouting', label: 'Scouting', icon: Compass },
  { id: 'training', label: 'Training', icon: Dumbbell },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'competitions', label: 'Competitions', icon: Trophy },
  { id: 'finances', label: 'Finances', icon: Landmark },
  { id: 'youth', label: 'Youth Academy', icon: GraduationCap },
  { id: 'history', label: 'Club History', icon: History },
  { id: 'admin', label: 'Admin Balancing', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  const { gameState, activeTab, setActiveTab, isSaving } = useGameStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const economy = ensureEconomyState(gameState);

  const handleNav = (tab: NavTab) => {
    soundManager.playUiClick();
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col md:flex-row">
      <CutsceneModal />

      {/* Sidebar Navigation (Desktop) & Drawer (Mobile) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-navy-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Club Badge Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <ClubCrest club={userClub} size={42} />
              <div className="overflow-hidden">
                <div
                  data-testid="header-club-name"
                  className="font-extrabold text-sm text-white truncate"
                >
                  {userClub.name}
                </div>
                <div className="text-[11px] text-pitch-400 font-semibold truncate">
                  {gameState.manager.name} &bull; S{gameState.currentSeason} W{gameState.currentWeek}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Matchday Action */}
          <button
            type="button"
            data-testid="sidebar-matchday-btn"
            onClick={() => handleNav('matchday')}
            className={`w-full py-2.5 px-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow transition ${
              activeTab === 'matchday'
                ? 'bg-gold-500 text-navy-950'
                : 'bg-pitch-600 hover:bg-pitch-500 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Matchday Center</span>
          </button>

          {/* 13 Standard Navigation Links */}
          <nav className="space-y-1" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`nav-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition ${
                    isActive
                      ? 'bg-navy-800 text-pitch-400 border border-pitch-500/40'
                      : 'text-slate-400 hover:bg-navy-800/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Autosave: {isSaving ? 'Saving...' : 'Synced'}</span>
          <span className="text-gold-400 font-bold">v1.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-navy-900/90 backdrop-blur border-b border-slate-800 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-navy-800 text-slate-200"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-pitch-400">
                Season {gameState.currentSeason} &bull; Week {gameState.currentWeek}
              </span>
              <h1 className="text-base md:text-lg font-black text-white capitalize">
                {activeTab === 'myClub' ? 'My Club' : activeTab}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {economy.starterPack.cosmeticUnlocked && (
              <span
                title="Founder's Golden Crest & Touchline Badge Unlocked"
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-black uppercase text-amber-300"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Founder VIP</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => handleNav('store')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-950 hover:bg-navy-800 border border-slate-800 text-xs transition"
            >
              <Coins className="w-3.5 h-3.5 text-pitch-400" />
              <span className="font-black text-white" data-testid="header-soft-coins">
                {economy.softCurrency.toLocaleString()}
              </span>
              <span className="text-slate-600">|</span>
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span className="font-black text-gold-300" data-testid="header-premium-coins">
                {economy.premiumCurrency.toLocaleString()}
              </span>
            </button>
            <div className="hidden sm:block text-right text-xs">
              <div className="text-slate-400">Transfer Budget</div>
              <div className="font-extrabold text-pitch-400">
                £{userClub.finances.transferBudget.toLocaleString()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleNav('matchday')}
              className="px-4 py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider"
            >
              Matchday
            </button>
          </div>
        </header>

        {/* Active Screen */}
        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex-1">
          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'myClub' && <MyClubScreen />}
          {activeTab === 'squad' && <SquadScreen />}
          {activeTab === 'tactics' && <TacticsScreen />}
          {activeTab === 'chemistry' && <ChemistrySynergyScreen />}
          {activeTab === 'inventory' && <BoosterInventoryScreen />}
          {activeTab === 'store' && <PremiumStoreScreen />}
          {activeTab === 'transfers' && <TransfersScreen />}
          {activeTab === 'scouting' && <ScoutingScreen />}
          {activeTab === 'training' && <TrainingScreen />}
          {activeTab === 'fixtures' && <FixturesScreen />}
          {activeTab === 'competitions' && <CompetitionsScreen />}
          {activeTab === 'finances' && <FinancesScreen />}
          {activeTab === 'youth' && <YouthAcademyScreen />}
          {activeTab === 'history' && <ClubHistoryScreen />}
          {activeTab === 'admin' && <AdminBalanceDashboard />}
          {activeTab === 'settings' && <SettingsScreen />}
          {activeTab === 'matchday' && <MatchdayScreen />}
        </main>
      </div>
    </div>
  );
}
