'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Globe,
  Award,
  Flame,
  ChevronRight,
  Shield,
  Star,
  Users,
  Target,
  Medal,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { COMPETITIONS_REGISTRY, COUNTRIES_REGISTRY, getCountryById } from '@/data/competitionsRegistry';
import { GLOBAL_CLUB_PRESETS } from '@/engine/generator';
import { calculateSeasonalAwards, GlobalPlayerStats, refreshLeaderboards } from '@/engine/globalStatsEngine';
import {
  calculateUefaStandings,
  GlobalUefaUniverse,
  initializeGlobalUefaUniverse,
  UefaKnockoutTie,
  UefaStanding,
  UefaTournamentId,
} from '@/engine/uefaEngine';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest } from '../ui/FootballVisuals';

type WorldTab = 'ucl' | 'uel' | 'uecl' | 'domestic' | 'stats' | 'awards';

export function WorldCompetitionsScreen() {
  const { gameState } = useGameStore();
  const [activeTab, setActiveTab] = useState<WorldTab>('ucl');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('ENG');
  const [selectedTier, setSelectedTier] = useState<1 | 2>(1);
  const [uefaView, setUefaView] = useState<'standings' | 'knockout'>('standings');

  // Load or initialize European universe
  const [uefaUniverse] = useState<GlobalUefaUniverse>(() => {
    return (gameState as any)?.uefaUniverse ?? initializeGlobalUefaUniverse(gameState?.currentSeason ?? 2026);
  });

  const activeTournament =
    activeTab === 'ucl'
      ? uefaUniverse.ucl
      : activeTab === 'uel'
        ? uefaUniverse.uel
        : uefaUniverse.uecl;

  const standings = calculateUefaStandings(
    activeTournament.teams,
    activeTournament.leaguePhaseMatches
  );

  // Domestic League Filter
  const selectedLeague = COMPETITIONS_REGISTRY.find(
    (c) => c.countryId === selectedCountryId && c.tier === selectedTier && c.type === 'league'
  );

  const domesticClubs = GLOBAL_CLUB_PRESETS.filter(
    (c) => c.countryId === selectedCountryId && c.division === selectedTier
  ).sort((a, b) => b.reputation - a.reputation);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs font-black uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            <span>Living World Simulation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <span>Global Football Universe</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Track all 20 nations, 40 domestic divisions, and the 36-team UEFA Champions League,
            Europa League, and Conference League in real time.
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ucl')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'ucl'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Champions League</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('uel')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'uel'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Europa League</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('uecl')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'uecl'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Conference League</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('domestic')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'domestic'
                ? 'bg-lime-400 text-navy-950 shadow-lg shadow-lime-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>20 Leagues</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('awards')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeTab === 'awards'
                ? 'bg-gold-400 text-navy-950 shadow-lg shadow-gold-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Ballon d&apos;Or &amp; Awards</span>
          </button>
        </div>
      </div>

      {/* TAB 1, 2, 3: UEFA COMPETITIONS */}
      {(activeTab === 'ucl' || activeTab === 'uel' || activeTab === 'uecl') && (
        <div className="space-y-6">
          {/* Sub Navigation (Standings vs Bracket) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase text-white">
                {activeTournament.name} &bull; Season {activeTournament.seasonYear}
              </span>
              <span className="text-xs font-bold text-lime-400 px-2.5 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/20">
                Swiss 36-Team System
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUefaView('standings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                  uefaView === 'standings'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                League Phase Table
              </button>
              <button
                type="button"
                onClick={() => setUefaView('knockout')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                  uefaView === 'knockout'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Knockout Bracket
              </button>
            </div>
          </div>

          {uefaView === 'standings' ? (
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                    <span>Ranks 1–8: Direct Round of 16</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                    <span>Ranks 9–24: Knockout Play-offs</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500/80 inline-block" />
                    <span>Ranks 25–36: Eliminated</span>
                  </span>
                </div>
                <span className="font-semibold text-slate-300">
                  {activeTournament.leaguePhaseMatches.filter((m) => m.played).length} Matches Played
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-[11px] font-black uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">Pos</th>
                      <th className="py-3 px-4">Club</th>
                      <th className="py-3 px-3 text-center">Nation</th>
                      <th className="py-3 px-3 text-center">P</th>
                      <th className="py-3 px-3 text-center">W</th>
                      <th className="py-3 px-3 text-center">D</th>
                      <th className="py-3 px-3 text-center">L</th>
                      <th className="py-3 px-3 text-center">GF</th>
                      <th className="py-3 px-3 text-center">GA</th>
                      <th className="py-3 px-3 text-center">GD</th>
                      <th className="py-3 px-4 text-center font-black text-lime-400">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {standings.map((s) => {
                      const isTop8 = s.rank <= 8;
                      const isPlayoff = s.rank >= 9 && s.rank <= 24;
                      return (
                        <tr
                          key={s.clubId}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isTop8
                              ? 'border-l-4 border-l-emerald-500'
                              : isPlayoff
                                ? 'border-l-4 border-l-blue-500'
                                : 'border-l-4 border-l-transparent'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-center font-black text-white">{s.rank}</td>
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            <ClubCrest
                              club={{
                                id: s.clubId,
                                shortName: s.shortName,
                                primaryColor: '#3b82f6',
                                secondaryColor: '#1e293b',
                                division: 1,
                              }}
                              size={22}
                            />
                            <span>{s.clubName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">{s.countryCode}</td>
                          <td className="py-2.5 px-3 text-center text-slate-300">{s.played}</td>
                          <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">{s.won}</td>
                          <td className="py-2.5 px-3 text-center text-slate-400">{s.drawn}</td>
                          <td className="py-2.5 px-3 text-center text-red-400">{s.lost}</td>
                          <td className="py-2.5 px-3 text-center text-slate-300">{s.goalsFor}</td>
                          <td className="py-2.5 px-3 text-center text-slate-300">{s.goalsAgainst}</td>
                          <td
                            className={`py-2.5 px-3 text-center font-bold ${
                              s.goalDifference > 0
                                ? 'text-emerald-400'
                                : s.goalDifference < 0
                                  ? 'text-red-400'
                                  : 'text-slate-400'
                            }`}
                          >
                            {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                          </td>
                          <td className="py-2.5 px-4 text-center font-black text-lime-400 text-sm">
                            {s.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Knockout Bracket */
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-6 shadow-xl">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black uppercase text-white">Knockout Stage Path to Glory</h3>
                <p className="text-xs text-slate-400">
                  Round of 16 &bull; Quarter-Finals &bull; Semi-Finals &bull; Final
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Round of 16 Sample Ties */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 text-center pb-2 border-b border-slate-800">
                    Round of 16
                  </h4>
                  {standings.slice(0, 4).map((top, idx) => {
                    const opponent = standings[15 - idx] ?? standings[8 + idx];
                    return (
                      <div
                        key={top.clubId}
                        className="rounded-2xl bg-slate-950 border border-slate-800 p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>{top.shortName}</span>
                          <span className="text-lime-400">Seeded</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{opponent?.shortName ?? 'Play-off Winner'}</span>
                          <span>Unseeded</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quarter-Finals */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 text-center pb-2 border-b border-slate-800">
                    Quarter-Finals
                  </h4>
                  {[1, 2].map((q) => (
                    <div key={q} className="rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 p-6 text-center space-y-2">
                      <Trophy className="w-5 h-5 text-gold-400/50 mx-auto" />
                      <p className="text-xs text-slate-500 font-semibold">QF Tie {q}</p>
                    </div>
                  ))}
                </div>

                {/* Semi-Finals */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 text-center pb-2 border-b border-slate-800">
                    Semi-Finals
                  </h4>
                  <div className="rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 p-8 text-center space-y-2">
                    <Trophy className="w-6 h-6 text-gold-400/50 mx-auto" />
                    <p className="text-xs text-slate-500 font-semibold">SF Tie 1 &bull; 2 Legs</p>
                  </div>
                </div>

                {/* The Final */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gold-400 text-center pb-2 border-b border-slate-800">
                    Grand Final
                  </h4>
                  <div className="rounded-2xl bg-gradient-to-b from-gold-400/10 to-slate-950 border border-gold-400/30 p-6 text-center space-y-3 shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-gold-400/20 border border-gold-400/50 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                      <Trophy className="w-6 h-6 text-gold-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase text-white">European Champion</p>
                      <p className="text-[11px] text-slate-400">Neutral Venue</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DOMESTIC LEAGUES */}
      {activeTab === 'domestic' && (
        <div className="space-y-6">
          {/* Country & Tier Selector */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
                Select Country:
              </span>
              {COUNTRIES_REGISTRY.slice(0, 10).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCountryId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedCountryId === c.id
                      ? 'bg-lime-400 text-navy-950 shadow-md font-black'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <span>{c.flagEmoji}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTier(1)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  selectedTier === 1
                    ? 'bg-lime-400 text-navy-950 shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                Tier 1 (Top Flight)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTier(2)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                  selectedTier === 2
                    ? 'bg-lime-400 text-navy-950 shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-400'
                }`}
              >
                Tier 2 (Championship)
              </button>
            </div>
          </div>

          {/* Division Clubs Table */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase text-white">
                  {selectedLeague?.name ?? 'Domestic League'}
                </h3>
                <p className="text-xs text-slate-400">
                  {domesticClubs.length} Active Clubs &bull; {getCountryById(selectedCountryId).name}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-[11px] font-black uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Club</th>
                    <th className="py-3 px-3">City</th>
                    <th className="py-3 px-3">Stadium</th>
                    <th className="py-3 px-3 text-center">Capacity</th>
                    <th className="py-3 px-3 text-center">Reputation</th>
                    <th className="py-3 px-3 text-center">Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {domesticClubs.map((club, idx) => (
                    <tr key={club.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 text-center font-black text-white">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                        <ClubCrest
                          club={{
                            id: club.id,
                            shortName: club.shortName,
                            primaryColor: club.primaryColor,
                            secondaryColor: club.secondaryColor,
                            division: club.division,
                          }}
                          size={22}
                        />
                        <span>{club.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{club.city}</td>
                      <td className="py-2.5 px-3 text-slate-300">{club.stadiumName}</td>
                      <td className="py-2.5 px-3 text-center text-slate-400">
                        {club.stadiumCapacity.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-lime-400">
                        {club.reputation}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400">{club.managerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AWARDS & BALLON D'OR */}
      {activeTab === 'awards' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* World Player of the Year (Ballon d'Or) */}
            <div className="rounded-3xl bg-gradient-to-b from-gold-500/15 via-slate-900 to-slate-900 border border-gold-400/40 p-6 flex flex-col justify-between text-center space-y-4 shadow-[0_0_35px_rgba(251,191,36,0.15)]">
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-gold-400/20 border-2 border-gold-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(251,191,36,0.5)]">
                  <Trophy className="w-8 h-8 text-gold-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-300">
                  World Player of the Year
                </span>
                <h3 className="text-xl font-black uppercase text-white">Ballon d&apos;Or</h3>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <p className="text-base font-black text-lime-400">Vinícius Júnior</p>
                <p className="text-xs text-slate-300">Real Madrid &bull; Brazil</p>
                <p className="text-[11px] text-gold-300 font-semibold pt-1">
                  34 Goals &bull; 19 Assists &bull; UCL Champion
                </p>
              </div>
            </div>

            {/* European Golden Boot */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between text-center space-y-4 shadow-xl">
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-lime-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">
                  Top Continental Scorer
                </span>
                <h3 className="text-xl font-black uppercase text-white">European Golden Boot</h3>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <p className="text-base font-black text-white">Erling Haaland</p>
                <p className="text-xs text-slate-300">Manchester City &bull; Norway</p>
                <p className="text-[11px] text-lime-300 font-semibold pt-1">
                  38 Goals (76.0 Points &bull; x2.0 Coeff)
                </p>
              </div>
            </div>

            {/* Golden Boy */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between text-center space-y-4 shadow-xl">
              <div className="space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <Star className="w-8 h-8 text-emerald-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  Best U21 Talent
                </span>
                <h3 className="text-xl font-black uppercase text-white">Golden Boy 2026</h3>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <p className="text-base font-black text-white">Lamine Yamal</p>
                <p className="text-xs text-slate-300">FC Barcelona &bull; Spain (Age 19)</p>
                <p className="text-[11px] text-emerald-300 font-semibold pt-1">
                  7.88 Average Rating &bull; 14 Goals &bull; 16 Assists
                </p>
              </div>
            </div>
          </div>

          {/* World Team of the Year XI */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-lime-400" />
                  <span>World Team of the Year (4-3-3)</span>
                </h3>
                <p className="text-xs text-slate-400">Official Consensus XI of the 2026/27 Campaign</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-black">
                EA FC Inspired TOTY
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Goalkeeper</span>
                <p className="text-xs font-black text-white">Thibaut Courtois</p>
                <p className="text-[10px] text-slate-400">Real Madrid</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Center Back</span>
                <p className="text-xs font-black text-white">William Saliba</p>
                <p className="text-[10px] text-slate-400">Arsenal</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Center Back</span>
                <p className="text-xs font-black text-white">Virgil van Dijk</p>
                <p className="text-[10px] text-slate-400">Liverpool</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Midfielder</span>
                <p className="text-xs font-black text-white">Rodri</p>
                <p className="text-[10px] text-slate-400">Manchester City</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Midfielder</span>
                <p className="text-xs font-black text-white">Jude Bellingham</p>
                <p className="text-[10px] text-slate-400">Real Madrid</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Midfielder</span>
                <p className="text-xs font-black text-white">Kevin De Bruyne</p>
                <p className="text-[10px] text-slate-400">Manchester City</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Forward</span>
                <p className="text-xs font-black text-lime-400">Kylian Mbappé</p>
                <p className="text-[10px] text-slate-400">Real Madrid</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Striker</span>
                <p className="text-xs font-black text-lime-400">Erling Haaland</p>
                <p className="text-[10px] text-slate-400">Manchester City</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
