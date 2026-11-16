'use client';

import React, { useState } from 'react';
import {
  Trophy,
  Calendar,
  Flame,
  Shield,
  TrendingUp,
  AlertCircle,
  Clock,
  Coins,
  Users,
  ChevronRight,
  Play,
  HeartPulse,
  Zap,
  Target,
  Award,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { formatDateDisplay, isTransferWindowOpen } from '@/engine/calendarEngine';
import { soundManager } from '@/lib/audio';
import { ClubCrest, PlayerAvatar } from '../ui/FootballVisuals';
import { LoginStreakModal } from '../rewards/LoginStreakModal';
import { AchievementModal } from '../rewards/AchievementModal';
import { calculateStandings } from '@/engine/standings';

export function SeasonHubScreen() {
  const { gameState, setActiveTab, advanceSimulationDay, advanceSimulationToMatch } = useGameStore();
  const [showLoginStreakModal, setShowLoginStreakModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  if (!gameState) return null;

  const calendar = gameState.calendarState;
  const currentDateIso = gameState.currentDateIso ?? `${gameState.currentSeason}-08-15`;
  const userClubId = gameState.manager.clubId;
  const userClub = gameState.clubs.find((c) => c.id === userClubId) ?? gameState.clubs[0];
  const userPlayers = gameState.players.filter((p) => p.clubId === userClubId);

  // League Standings
  const comp = userClub.division === 1 ? 'division1' : 'division2';
  const standings = calculateStandings(
    gameState.clubs,
    gameState.fixtures,
    comp
  );
  const userRowIndex = standings.findIndex((r) => r.clubId === userClubId);
  const userRow = standings[userRowIndex];

  // Injured Players
  const injuredPlayers = userPlayers.filter((p) => p.injuryWeeks > 0);

  // Upcoming User Fixtures
  const upcomingFixtures = gameState.fixtures
    .filter(
      (f) => !f.played && (f.homeClubId === userClubId || f.awayClubId === userClubId)
    )
    .slice(0, 3);

  const nextFixture = upcomingFixtures[0];
  const nextOpponentId = nextFixture
    ? nextFixture.homeClubId === userClubId
      ? nextFixture.awayClubId
      : nextFixture.homeClubId
    : null;
  const nextOpponent = gameState.clubs.find((c) => c.id === nextOpponentId);

  // Transfer Window Status
  const isWindowOpen = calendar ? isTransferWindowOpen(currentDateIso, calendar) : true;

  // Top Goalscorers in squad
  const squadTopScorers = [...userPlayers]
    .sort((a, b) => (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0))
    .slice(0, 3);

  // 7-Day Login Streak Status
  const streak = gameState.loginStreak?.currentStreak ?? 0;

  // Unclaimed Achievements Count
  const unclaimedAchievements = (gameState.achievements ?? []).filter(
    (a) => a.unlocked && !a.claimed
  ).length;

  return (
    <div className="space-y-6 select-none" data-testid="season-hub-screen">
      {/* ===================================================================== */}
      {/* 1. HERO SEASON STATUS BANNER                                          */}
      {/* ===================================================================== */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-xs font-black uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>Season Command &amp; Operations Hub</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <span>{userClub.name}</span>
            <span className="text-slate-400 font-medium text-lg sm:text-2xl">
              &bull; Campaign {gameState.currentSeason}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {formatDateDisplay(currentDateIso)} &bull; Matchweek {gameState.currentWeek} of {gameState.maxWeeksPerSeason}.
            Direct all squad development, daily calendar simulation, and competition operations.
          </p>
        </div>

        {/* Quick Simulation Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={async () => {
              soundManager.playUiClick();
              await advanceSimulationDay();
            }}
            className="px-4 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-pitch-600/30 transition-all hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate 1 Day</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              soundManager.playUiClick();
              await advanceSimulationToMatch();
            }}
            className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-gold-400 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>To Next Match</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fixtures')}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Clock className="w-3.5 h-3.5 text-pitch-400" />
            <span>World Calendar</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. LIVE SEASON METRICS GRID                                           */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* League Ranking */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>League Position</span>
            <TrendingUp className="w-3.5 h-3.5 text-lime-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              #{userRowIndex >= 0 ? userRowIndex + 1 : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">
              ({userRow?.points ?? 0} Pts)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Division {userClub.division} &bull; Form: {userRow?.form.slice(-3).join('-') || 'W-D-W'}
          </span>
        </div>

        {/* Transfer Window Status */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Transfer Window</span>
            <Zap className="w-3.5 h-3.5 text-purple-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl font-black ${
                isWindowOpen ? 'text-lime-400' : 'text-slate-400'
              }`}
            >
              {isWindowOpen ? 'WINDOW OPEN' : 'WINDOW CLOSED'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isWindowOpen ? 'Bids, free agents & loans active' : 'Opens next scheduled window'}
          </span>
        </div>

        {/* Squad Availability */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Squad Health</span>
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {userPlayers.length - injuredPlayers.length} / {userPlayers.length}
            </span>
            <span className="text-xs font-bold text-emerald-400">Available</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {injuredPlayers.length > 0
              ? `${injuredPlayers.length} player(s) in medical recovery`
              : 'Clean bill of health'}
          </span>
        </div>

        {/* Login Streak & Rewards Widget */}
        <div
          onClick={() => setShowLoginStreakModal(true)}
          className="rounded-2xl bg-gradient-to-br from-gold-500/10 via-slate-900 to-slate-900 border border-gold-400/30 p-4 space-y-1 shadow-lg cursor-pointer hover:border-gold-400 transition-all hover:scale-[1.02]"
        >
          <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider flex items-center justify-between">
            <span>7-Day Login Streak</span>
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gold-300">Day {streak}/7</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold-400/20 text-gold-300">
              Claim
            </span>
          </div>
          <span className="text-[11px] text-slate-300">
            {unclaimedAchievements > 0
              ? `${unclaimedAchievements} Football Achievement(s) ready!`
              : 'Tap to view streak & rewards'}
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN DASHBOARD CONTENT GRID                                        */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: UPCOMING FIXTURES & MATCH PREVIEW */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next Match Spotlight */}
          {nextFixture && nextOpponent ? (
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pitch-500 animate-ping inline-block" />
                  <span className="text-xs font-black uppercase tracking-wider text-pitch-400">
                    Next Fixture Spotlight
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-bold">
                  {nextFixture.competition.toUpperCase()} &bull; Matchweek {nextFixture.week}
                </span>
              </div>

              {/* Matchup Header */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3.5 flex-1">
                  <ClubCrest club={userClub} size={48} />
                  <div>
                    <h3 className="text-base font-black text-white">{userClub.name}</h3>
                    <p className="text-xs text-slate-400">Tactics: {userClub.tactics.formation}</p>
                  </div>
                </div>

                <div className="text-center px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-black text-gold-400">VS</span>
                  <p className="text-[10px] text-slate-400">15:00 Kickoff</p>
                </div>

                <div className="flex items-center gap-3.5 flex-1 justify-end text-right">
                  <div>
                    <h3 className="text-base font-black text-white">{nextOpponent.name}</h3>
                    <p className="text-xs text-slate-400">Tactics: {nextOpponent.tactics.formation}</p>
                  </div>
                  <ClubCrest club={nextOpponent} size={48} />
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setActiveTab('matchday')}
                className="w-full py-3 rounded-2xl bg-pitch-600 hover:bg-pitch-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pitch-600/30 transition-transform hover:scale-[1.01]"
              >
                <span>Enter Matchday Center</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 text-center space-y-2">
              <Trophy className="w-10 h-10 text-gold-400 mx-auto" />
              <h3 className="text-base font-black text-white">Season Campaign Concluded</h3>
              <p className="text-xs text-slate-400">
                All scheduled fixtures have been settled. Prepare for seasonal awards &amp; rollover!
              </p>
            </div>
          )}

          {/* Mini League Standings Table */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-lime-400" />
                <span>Division {userClub.division} Campaign Table</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('competitions')}
                className="text-[11px] font-bold text-pitch-400 hover:text-pitch-300"
              >
                Full Standings &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-[10px] font-black uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Club</th>
                    <th className="py-2.5 px-2 text-center">P</th>
                    <th className="py-2.5 px-2 text-center">W</th>
                    <th className="py-2.5 px-2 text-center">D</th>
                    <th className="py-2.5 px-2 text-center">L</th>
                    <th className="py-2.5 px-2 text-center">GD</th>
                    <th className="py-2.5 px-3 text-center font-black text-lime-400">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {standings.slice(0, 8).map((row, idx) => {
                    const isUser = row.clubId === userClubId;
                    return (
                      <tr
                        key={row.clubId}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isUser ? 'bg-pitch-950/40 font-bold border-l-4 border-l-pitch-500' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-300 font-bold">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-white flex items-center gap-2">
                          <span>{row.clubName}</span>
                          {isUser && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-pitch-500/20 text-pitch-300 uppercase font-black">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-400">{row.played}</td>
                        <td className="py-2 px-2 text-center text-emerald-400 font-semibold">{row.won}</td>
                        <td className="py-2 px-2 text-center text-slate-400">{row.drawn}</td>
                        <td className="py-2 px-2 text-center text-rose-400">{row.lost}</td>
                        <td className="py-2 px-2 text-center text-slate-400">
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td className="py-2 px-3 text-center font-black text-lime-400">{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SQUAD HEALTH & FOOTBALL ACHIEVEMENTS */}
        <div className="space-y-6">
          {/* Squad Medical & Recovery Ward */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                <span>Medical Campus &amp; Hospital Ward</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                Hospital Lv.{gameState.clubEmpire?.buildings?.club_hospital?.level ?? 1}
              </span>
            </div>

            {injuredPlayers.length > 0 ? (
              <div className="space-y-2">
                {injuredPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <PlayerAvatar player={p} club={userClub} size={36} />
                      <div>
                        <h4 className="font-bold text-white">
                          {p.firstName} {p.lastName}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {p.primaryPosition} &bull; OVR {p.overall}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 font-black text-[10px]">
                      {p.injuryWeeks} wk(s) left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                <p className="font-bold text-white">Zero Injured Squad Members</p>
                <p className="text-[11px] text-slate-400">All first-team footballers are cleared for competitive action.</p>
              </div>
            )}
          </div>

          {/* Squad Top Performers */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-gold-400" />
                <span>Squad Golden Boot Contenders</span>
              </h3>
            </div>

            <div className="space-y-2">
              {squadTopScorers.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-[11px] font-black text-gold-400 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <PlayerAvatar player={p} club={userClub} size={36} />
                    <div>
                      <h4 className="font-bold text-white">
                        {p.firstName} {p.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-400">{p.primaryPosition} &bull; OVR {p.overall}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-pitch-400">{p.stats?.goals ?? 0}</span>
                    <span className="text-[10px] text-slate-400 block">Goals</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Football Achievements Button */}
          <button
            type="button"
            onClick={() => setShowAchievementsModal(true)}
            className="w-full py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-gold-400/40 text-gold-400 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01]"
          >
            <Award className="w-4 h-4" />
            <span>Football Achievements &amp; Laurels</span>
            {unclaimedAchievements > 0 && (
              <span className="w-5 h-5 rounded-full bg-gold-400 text-navy-950 font-black text-[10px] flex items-center justify-center">
                {unclaimedAchievements}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showLoginStreakModal && (
        <LoginStreakModal onClose={() => setShowLoginStreakModal(false)} />
      )}
      {showAchievementsModal && (
        <AchievementModal onClose={() => setShowAchievementsModal(false)} />
      )}
    </div>
  );
}
