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
  ChevronRight,
  Flame,
  Globe,
} from 'lucide-react';
import { ClubEmpireScreen } from '@/components/empire/ClubEmpireScreen';
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
import { WorldCompetitionsScreen } from '../competitions/WorldCompetitionsScreen';
import { SeasonHubScreen } from '../season/SeasonHubScreen';
import { CentralWorldCalendarScreen } from '../calendar/CentralWorldCalendarScreen';
import { ClubCrest } from '../ui/FootballVisuals';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

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

  const isOriginal = gameState.careerType === 'original_team';

  // Grouped Navigation Architecture
  const navSections: NavSection[] = [
    {
      title: 'Command & Match',
      items: [
        { id: 'home', label: 'Home Dashboard', icon: Home },
        { id: 'seasonHub', label: 'Season Hub', icon: Trophy, badge: 'Hub', badgeColor: 'bg-gold-400 text-navy-950' },
        { id: 'matchday', label: 'Matchday Center', icon: Play, badge: 'Live', badgeColor: 'bg-lime-400 text-navy-950' },
        { id: 'fixtures', label: 'World Calendar', icon: Calendar },
      ],
    },
    {
      title: 'Squad & Tactics',
      items: [
        { id: 'squad', label: 'Squad Management', icon: Users },
        { id: 'tactics', label: 'Tactics Board (12x12)', icon: Sliders },
        { id: 'chemistry', label: 'Chemistry & Synergy', icon: GitBranch },
        { id: 'training', label: 'Training Facilities', icon: Dumbbell },
      ],
    },
    {
      title: 'Competitions & World',
      items: [
        { id: 'worldCompetitions', label: 'World Football & UEFA', icon: Sparkles, badge: 'UCL', badgeColor: 'bg-blue-600 text-white' },
        { id: 'competitions', label: 'Domestic League & Cup', icon: Trophy },
      ],
    },
    {
      title: 'Transfers & Scouting',
      items: [
        { id: 'transfers', label: 'Transfers & Free Agents', icon: ArrowLeftRight },
        { id: 'scouting', label: 'Global Scouting Network', icon: Compass },
        { id: 'youth', label: 'Youth Academy', icon: GraduationCap },
      ],
    },
    {
      title: 'Club Infrastructure',
      items: [
        ...(isOriginal
          ? [
              {
                id: 'clubEmpire' as NavTab,
                label: 'Club Empire 3D Campus',
                icon: Crown,
                badge: 'Empire',
                badgeColor: 'bg-gold-400 text-navy-950',
              },
            ]
          : []),
        { id: 'myClub', label: 'My Club Info', icon: Building2 },
        { id: 'finances', label: 'Finances & Wages', icon: Landmark },
        { id: 'history', label: 'Trophy Room & History', icon: History },
      ],
    },
    {
      title: 'Store & Configuration',
      items: [
        { id: 'store', label: 'Store & Coin Packs', icon: ShoppingBag, badge: 'Offers', badgeColor: 'bg-gold-400/20 text-gold-300' },
        { id: 'inventory', label: 'Booster Inventory', icon: Backpack },
        { id: 'admin', label: 'Admin Balance Center', icon: Shield },
        { id: 'settings', label: 'Game Settings', icon: Settings },
      ],
    },
  ];

  // Quick Action Tabs for instant 1-click header navigation
  const quickHeaderTabs: { id: NavTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'seasonHub', label: 'Season Hub' },
    { id: 'squad', label: 'Squad' },
    { id: 'tactics', label: 'Tactics' },
    { id: 'worldCompetitions', label: 'World (UEFA)' },
    { id: 'fixtures', label: 'Calendar' },
    { id: 'transfers', label: 'Transfers' },
    ...(isOriginal ? [{ id: 'clubEmpire' as NavTab, label: '3D Campus' }] : []),
    { id: 'finances', label: 'Finances' },
    { id: 'store', label: 'Shop' },
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col md:flex-row">
      <CutsceneModal />

      {/* Persistent Left Navigation Sidebar (Desktop & Drawer Mobile) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800/90 flex flex-col justify-between transition-transform duration-200 backdrop-blur-md ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-60px)]">
          {/* Club Identity Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ClubCrest club={userClub} size={38} />
              <div className="overflow-hidden">
                <div
                  data-testid="header-club-name"
                  className="font-black text-sm text-white truncate"
                >
                  {userClub.name}
                </div>
                <div className="text-[10px] text-lime-400 font-bold uppercase tracking-wider truncate">
                  {gameState.manager.name} &bull; S{gameState.currentSeason} W{gameState.currentWeek}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary High-Energy Matchday Button */}
          <button
            type="button"
            data-testid="sidebar-matchday-btn"
            onClick={() => handleNav('matchday')}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] ${
              activeTab === 'matchday'
                ? 'bg-lime-400 text-navy-950 shadow-[0_0_25px_rgba(132,204,22,0.5)]'
                : 'bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-400 hover:to-emerald-500 text-navy-950 shadow-md'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Enter Matchday</span>
          </button>

          {/* Categorized Navigation Sections */}
          <nav className="space-y-4" aria-label="Main Navigation">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`nav-${item.id}`}
                      onClick={() => handleNav(item.id)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-slate-800 text-lime-400 border border-lime-400/40 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-lime-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                            item.badgeColor ?? 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
            <span>{isSaving ? 'Saving...' : 'Cloud Synced'}</span>
          </span>
          <span className="text-gold-400 font-bold">UFM v2026.4</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3 flex flex-col gap-2.5 sticky top-0 z-30 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
                aria-label="Open Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-lime-400 flex items-center gap-1.5">
                  <span>Season {gameState.currentSeason} &bull; Week {gameState.currentWeek}</span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-slate-400">{userClub.shortName}</span>
                </span>
                <h1 className="text-base md:text-lg font-black text-white capitalize flex items-center gap-2">
                  <span>{activeTab === 'myClub' ? 'My Club' : activeTab === 'worldCompetitions' ? 'World Football (UEFA)' : activeTab}</span>
                </h1>
              </div>
            </div>

            {/* Top Right Financials & Matchday Shortcut */}
            <div className="flex items-center gap-3">
              {economy.starterPack.cosmeticUnlocked && (
                <span
                  title="Founder VIP Status Unlocked"
                  className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[10px] font-black uppercase text-amber-300"
                >
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>VIP</span>
                </span>
              )}

              {/* Currency Badge */}
              <button
                type="button"
                onClick={() => handleNav('store')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs transition-colors shadow-inner"
              >
                <Coins className="w-3.5 h-3.5 text-lime-400" />
                <span className="font-black text-white" data-testid="header-soft-coins">
                  {economy.softCurrency.toLocaleString()}
                </span>
                <span className="text-slate-700">|</span>
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span className="font-black text-gold-300" data-testid="header-premium-coins">
                  {economy.premiumCurrency.toLocaleString()}
                </span>
              </button>

              {/* Transfer Budget */}
              <div className="hidden lg:block text-right text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-400">Transfer Budget</div>
                <div className="font-black text-lime-400">
                  £{userClub.finances.transferBudget.toLocaleString()}
                </div>
              </div>

              {/* Direct Matchday Action */}
              <button
                type="button"
                onClick={() => handleNav('matchday')}
                className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(132,204,22,0.3)] transition-transform hover:scale-105"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Play Matchday</span>
                <span className="sm:hidden">Play</span>
              </button>
            </div>
          </div>

          {/* Quick-Jump Horizontal Pills Bar (Desktop / Tablet) */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
              Quick Jump:
            </span>
            {quickHeaderTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleNav(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-lime-400 text-navy-950 font-black shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Active Screen Main Panel */}
        <main
          className={`w-full mx-auto flex-1 pb-24 md:pb-8 transition-all ${
            activeTab === 'clubEmpire'
              ? 'p-2 sm:p-4 max-w-[1760px]'
              : 'p-4 md:p-8 max-w-7xl'
          }`}
        >
          {activeTab === 'home' && <HomeDashboard />}
          {activeTab === 'seasonHub' && <SeasonHubScreen />}
          {activeTab === 'myClub' && <MyClubScreen />}
          {activeTab === 'clubEmpire' && isOriginal && <ClubEmpireScreen />}
          {activeTab === 'squad' && <SquadScreen />}
          {activeTab === 'tactics' && <TacticsScreen />}
          {activeTab === 'chemistry' && <ChemistrySynergyScreen />}
          {activeTab === 'inventory' && <BoosterInventoryScreen />}
          {activeTab === 'store' && <PremiumStoreScreen />}
          {activeTab === 'transfers' && <TransfersScreen />}
          {activeTab === 'scouting' && <ScoutingScreen />}
          {activeTab === 'training' && <TrainingScreen />}
          {activeTab === 'fixtures' && <CentralWorldCalendarScreen />}
          {activeTab === 'competitions' && <CompetitionsScreen />}
          {activeTab === 'worldCompetitions' && <WorldCompetitionsScreen />}
          {activeTab === 'finances' && <FinancesScreen />}
          {activeTab === 'youth' && <YouthAcademyScreen />}
          {activeTab === 'history' && <ClubHistoryScreen />}
          {activeTab === 'admin' && <AdminBalanceDashboard />}
          {activeTab === 'settings' && <SettingsScreen />}
          {activeTab === 'matchday' && <MatchdayScreen />}
        </main>

        {/* Mobile Persistent Bottom Navigation Bar */}
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg z-50 flex items-center justify-around py-2 px-2 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]"
          aria-label="Mobile Bottom Navigation"
        >
          <button
            type="button"
            onClick={() => handleNav('home')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
              activeTab === 'home' ? 'text-lime-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('squad')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
              activeTab === 'squad' ? 'text-lime-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Squad</span>
          </button>

          {/* Elevated Center Matchday Action */}
          <button
            type="button"
            onClick={() => handleNav('matchday')}
            className="flex flex-col items-center -mt-5"
          >
            <div className="w-13 h-13 rounded-full bg-lime-400 text-navy-950 flex items-center justify-center shadow-[0_0_20px_rgba(132,204,22,0.6)] border-4 border-slate-950 hover:scale-105 transition-transform">
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </div>
            <span className="text-[9px] font-black uppercase text-lime-400 mt-0.5">Match</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('worldCompetitions')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
              activeTab === 'worldCompetitions' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>World</span>
          </button>

          <button
            type="button"
            onClick={() => handleNav('transfers')}
            className={`flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
              activeTab === 'transfers' ? 'text-lime-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span>Market</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-1 text-[10px] font-bold text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
