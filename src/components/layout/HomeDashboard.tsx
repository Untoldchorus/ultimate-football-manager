'use client';

import React, { useState } from 'react';
import {
  Play,
  Trophy,
  Newspaper,
  TrendingUp,
  Users,
  Landmark,
  ShieldCheck,
  Target,
  Calendar,
  Sparkles,
  Award,
  Flame,
} from 'lucide-react';
import { calculateStandings } from '@/engine/standings';
import { Player } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest, getPlayerShirtNumber, PlayerAvatar } from '../ui/FootballVisuals';
import { PlayerProfileModal } from '../ui/PlayerProfileModal';

export function HomeDashboard() {
  const { gameState, setActiveTab } = useGameStore();
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const clubMap = new Map(gameState.clubs.map((c) => [c.id, c]));
  const comp = userClub.division === 1 ? 'division1' : 'division2';
  const standings = calculateStandings(gameState.clubs, gameState.fixtures, comp);
  const userRowIdx = standings.findIndex((r) => r.clubId === userClub.id);
  const userRank = userRowIdx + 1;
  const userStandingsRow = standings[userRowIdx] ?? standings[0];

  const nextFixture = gameState.fixtures.find(
    (f) =>
      f.week === gameState.currentWeek &&
      (f.homeClubId === userClub.id || f.awayClubId === userClub.id)
  );
  const opponentClub = nextFixture
    ? clubMap.get(
        nextFixture.homeClubId === userClub.id
          ? nextFixture.awayClubId
          : nextFixture.homeClubId
      ) ?? null
    : null;

  const opponentRank = opponentClub
    ? standings.findIndex((r) => r.clubId === opponentClub.id) + 1
    : null;

  // Last 5 played matches for user's club
  const recentMatches = gameState.fixtures
    .filter(
      (f) =>
        f.played &&
        f.result &&
        (f.homeClubId === userClub.id || f.awayClubId === userClub.id)
    )
    .slice(-5)
    .reverse();

  // Upcoming 4 fixtures for user's club
  const upcomingFixtures = gameState.fixtures
    .filter(
      (f) =>
        !f.played &&
        f.week >= gameState.currentWeek &&
        (f.homeClubId === userClub.id || f.awayClubId === userClub.id)
    )
    .slice(0, 4);

  // Star player spotlight (highest OVR or top goalscorer in user's squad)
  const clubSquad = gameState.players
    .filter((p) => p.clubId === userClub.id && !p.isYouth)
    .sort((a, b) => b.overall + b.stats.goals * 2 - (a.overall + a.stats.goals * 2));
  const starPlayer = clubSquad[0] ?? null;

  const squadAvgOvr = Math.round(
    clubSquad.reduce((s, p) => s + p.overall, 0) / Math.max(1, clubSquad.length)
  );

  return (
    <div className="space-y-6" data-testid="home-dashboard">
      <PlayerProfileModal
        player={inspectedPlayer}
        onClose={() => setInspectedPlayer(null)}
        allPlayers={gameState.players}
        clubs={gameState.clubs}
      />

      {/* 1. Large Club Stadium Hero Section & Next Matchday Preview */}
      <div className="relative rounded-3xl overflow-hidden border border-pitch-500/40 shadow-2xl bg-navy-900">
        {/* SVG Stadium Floodlights & Night Sky Backdrop */}
        <svg
          viewBox="0 0 1200 320"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
        >
          <defs>
            <radialGradient id="floodlightLeft" cx="15%" cy="15%" r="55%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#070a12" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="floodlightRight" cx="85%" cy="15%" r="55%">
              <stop offset="0%" stopColor={userClub.primaryColor} stopOpacity="0.65" />
              <stop offset="100%" stopColor="#070a12" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="turfGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#070a12" stopOpacity="0.2" />
              <stop offset="70%" stopColor="#064e3b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect width="1200" height="320" fill="#070a12" />
          <rect width="1200" height="320" fill="url(#floodlightLeft)" />
          <rect width="1200" height="320" fill="url(#floodlightRight)" />
          <path d="M0 220 Q600 175 1200 220 L1200 320 L0 320 Z" fill="url(#turfGlow)" />
          {/* Stadium Roof Arch */}
          <path
            d="M-40 120 Q600 -20 1240 120"
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="6"
          />
          {/* Floodlight Beams */}
          <polygon points="120,25 40,320 340,320" fill="#ffffff" opacity="0.06" />
          <polygon points="1080,25 860,320 1160,320" fill="#ffffff" opacity="0.06" />
        </svg>

        <div className="relative z-10 p-6 md:p-8 grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Left: Club Crest, Stadium Info & Manager Profile */}
          <div className="xl:col-span-5 space-y-4">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-navy-950/90 border border-pitch-500/40 text-pitch-400 text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>
                Season {gameState.currentSeason}/{gameState.currentSeason + 1} &bull; Week{' '}
                {gameState.currentWeek} of {gameState.maxWeeksPerSeason}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <ClubCrest club={userClub} size={74} />
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {userClub.name}
                </h2>
                <p className="text-xs text-slate-300 font-semibold">
                  {userClub.stadiumName} ({userClub.stadiumCapacity.toLocaleString()} capacity) &bull; Division{' '}
                  {userClub.division}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-md bg-navy-950/90 border border-slate-700 text-slate-200 font-bold">
                    Manager: <strong className="text-white">{gameState.manager.name}</strong> ({gameState.manager.nationality})
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-navy-950/90 border border-slate-700 text-gold-400 font-bold">
                    OVR {squadAvgOvr} &bull; Rep {userClub.reputation}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Next Match Preview with Both Club Crests */}
          <div className="xl:col-span-4 bg-navy-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-gold-400">
              <span>Next Matchday Preview</span>
              <span>{nextFixture?.roundName ?? `Week ${gameState.currentWeek}`}</span>
            </div>

            {nextFixture && opponentClub ? (
              <div className="flex items-center justify-between gap-2 py-1">
                <div className="flex flex-col items-center text-center flex-1">
                  <ClubCrest club={userClub} size={46} />
                  <span className="text-xs font-extrabold text-white mt-1 truncate max-w-[110px]">
                    {userClub.name}
                  </span>
                  <span className="text-[10px] text-slate-400">#{userRank} Div {userClub.division}</span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-700 text-center">
                  <div className="text-xs font-black text-pitch-400">VS</div>
                  <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                    {nextFixture.homeClubId === userClub.id ? 'HOME' : 'AWAY'}
                  </div>
                </div>

                <div className="flex flex-col items-center text-center flex-1">
                  <ClubCrest club={opponentClub} size={46} />
                  <span className="text-xs font-extrabold text-white mt-1 truncate max-w-[110px]">
                    {opponentClub.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {opponentRank ? `#${opponentRank}` : ''} Rep {opponentClub.reputation}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-300 py-3 text-center">
                No club fixture scheduled this week. Advance week when ready.
              </div>
            )}

            <div className="text-[11px] text-slate-400 text-center border-t border-slate-800/80 pt-2">
              Venue:{' '}
              <strong className="text-slate-200">
                {nextFixture?.homeClubId === userClub.id
                  ? userClub.stadiumName
                  : opponentClub?.stadiumName ?? userClub.stadiumName}
              </strong>
            </div>
          </div>

          {/* Right: Prominent MATCHDAY Action & Recent Form Strip */}
          <div className="xl:col-span-3 flex flex-col justify-between gap-3">
            <button
              type="button"
              data-testid="go-to-matchday-btn"
              onClick={() => {
                soundManager.playUiClick();
                setActiveTab('matchday');
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pitch-600 to-emerald-500 hover:from-pitch-500 hover:to-emerald-400 text-white font-black uppercase tracking-wider text-sm shadow-xl shadow-pitch-600/30 flex items-center justify-center gap-3 transition transform hover:scale-[1.01]"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Play Matchday</span>
            </button>

            <div className="bg-navy-950/85 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-slate-400">
                Recent Form
              </span>
              <div className="flex items-center gap-1">
                {userStandingsRow && userStandingsRow.form.length > 0 ? (
                  userStandingsRow.form.map((res, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${
                        res === 'W'
                          ? 'bg-pitch-600 text-white'
                          : res === 'D'
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-red-600 text-white'
                      }`}
                    >
                      {res}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">Season Opener</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Row (League Position, Tactics, Transfer Budget, Board Confidence) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('competitions')}
          className="cursor-pointer bg-navy-900 hover:bg-navy-800/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>League Position</span>
            <Trophy className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl font-black text-white">
            #{userRank}{' '}
            <span className="text-xs font-bold text-pitch-400">
              ({userStandingsRow?.points ?? 0} pts)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Board Objective: Top {gameState.board.targetLeaguePosition}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('squad')}
          className="cursor-pointer bg-navy-900 hover:bg-navy-800/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Tactical System</span>
            <Users className="w-4 h-4 text-pitch-400" />
          </div>
          <div className="text-2xl font-black text-white">{userClub.tactics.formation}</div>
          <div className="text-[11px] text-slate-400 capitalize">
            {userClub.tactics.attackingStyle} &bull; {userClub.tactics.mentality}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('finances')}
          className="cursor-pointer bg-navy-900 hover:bg-navy-800/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Transfer Warchest</span>
            <Landmark className="w-4 h-4 text-pitch-400" />
          </div>
          <div className="text-2xl font-black text-pitch-400">
            £{(userClub.finances.transferBudget / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400">
            Wage Bill: £{(userClub.finances.currentWageBillWeekly / 1000).toFixed(1)}k/wk
          </div>
        </div>

        <div
          onClick={() => setActiveTab('myClub')}
          className="cursor-pointer bg-navy-900 hover:bg-navy-800/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Board Confidence</span>
            <ShieldCheck className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl font-black text-gold-400">{gameState.board.confidence}%</div>
          <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pitch-500 to-gold-400"
              style={{ width: `${gameState.board.confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Star Player Spotlight + Club Objectives & Last 5 Match Results + Upcoming Fixtures */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Star Player Spotlight */}
        <div className="lg:col-span-4 bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>Star Player Spotlight</span>
            </h3>
            <span className="text-[11px] text-slate-400">Click to inspect</span>
          </div>

          {starPlayer && (
            <div
              onClick={() => setInspectedPlayer(starPlayer)}
              className="cursor-pointer p-4 rounded-2xl bg-navy-950 border border-slate-800 hover:border-gold-400/50 transition space-y-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <PlayerAvatar
                    player={starPlayer}
                    clubColor={userClub.primaryColor}
                    secondaryColor={userClub.secondaryColor}
                    size={64}
                  />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded bg-gold-500 text-navy-950 font-black text-[10px]">
                    #{getPlayerShirtNumber(starPlayer, 9)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-black text-white truncate">
                    {starPlayer.firstName} {starPlayer.lastName}
                  </div>
                  <div className="text-xs text-pitch-400 font-bold">
                    {starPlayer.primaryPosition} &bull; {starPlayer.nationality} &bull; Age {starPlayer.age}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Value: £{(starPlayer.marketValue / 1000000).toFixed(2)}M &bull; Form{' '}
                    {starPlayer.form.toFixed(1)}
                  </div>
                </div>
                <div className="text-center px-3 py-1.5 rounded-xl bg-navy-900 border border-gold-500/30">
                  <div className="text-[9px] uppercase text-slate-400 font-bold">OVR</div>
                  <div className="text-xl font-black text-gold-400">{starPlayer.overall}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
                <div className="p-1.5 rounded-lg bg-navy-900">
                  <div className="text-[10px] text-slate-400">Apps</div>
                  <div className="font-black text-white">{starPlayer.stats.appearances}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-navy-900">
                  <div className="text-[10px] text-slate-400">Goals</div>
                  <div className="font-black text-pitch-400">{starPlayer.stats.goals}</div>
                </div>
                <div className="p-1.5 rounded-lg bg-navy-900">
                  <div className="text-[10px] text-slate-400">Assists</div>
                  <div className="font-black text-gold-400">{starPlayer.stats.assists}</div>
                </div>
              </div>
            </div>
          )}

          {/* Board & Season Objectives */}
          <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-extrabold uppercase text-pitch-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>Board Season Objectives</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {gameState.board.expectationsText}
            </p>
            <div className="text-[11px] text-slate-400">
              Cup Target: <strong className="text-white">{gameState.board.targetCupRound}</strong>
            </div>
          </div>
        </div>

        {/* Last 5 Match Results & Upcoming Fixtures */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Last 5 Match Results */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-pitch-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                <span>Last 5 Match Results</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('fixtures')}
                className="text-xs text-slate-400 hover:text-white"
              >
                All Results &rarr;
              </button>
            </div>

            {recentMatches.length === 0 ? (
              <div className="p-6 rounded-xl bg-navy-950 border border-slate-800 text-center text-xs text-slate-400">
                No completed matches yet this season. Click <strong>Play Matchday</strong> to kick off your campaign!
              </div>
            ) : (
              <div className="space-y-2">
                {recentMatches.map((f) => {
                  const h = clubMap.get(f.homeClubId)!;
                  const a = clubMap.get(f.awayClubId)!;
                  const res = f.result!;
                  const isHome = f.homeClubId === userClub.id;
                  const userGoals = isHome ? res.homeScore : res.awayScore;
                  const oppGoals = isHome ? res.awayScore : res.homeScore;
                  const badge = userGoals > oppGoals ? 'W' : userGoals === oppGoals ? 'D' : 'L';

                  return (
                    <div
                      key={f.id}
                      className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 ${
                            badge === 'W'
                              ? 'bg-pitch-600 text-white'
                              : badge === 'D'
                                ? 'bg-slate-700 text-white'
                                : 'bg-red-600 text-white'
                          }`}
                        >
                          {badge}
                        </span>
                        <span className="truncate font-bold text-white">
                          {isHome ? `vs ${a.name}` : `@ ${h.name}`}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-navy-800 font-black text-gold-400 shrink-0">
                        {res.homeScore} - {res.awayScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Fixtures */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Upcoming Fixtures Schedule</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('fixtures')}
                className="text-xs text-slate-400 hover:text-white"
              >
                Calendar &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {upcomingFixtures.map((f) => {
                const isHome = f.homeClubId === userClub.id;
                const opp = clubMap.get(isHome ? f.awayClubId : f.homeClubId);
                if (!opp) return null;
                return (
                  <div
                    key={f.id}
                    className="p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ClubCrest club={opp} size={28} />
                      <div className="truncate">
                        <div className="font-bold text-white truncate">
                          {isHome ? `${opp.name} (H)` : `${opp.name} (A)`}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase">
                          Week {f.week} &bull; {f.competition}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-navy-900 border border-slate-700 text-[10px] font-bold text-pitch-400 shrink-0">
                      Rep {opp.reputation}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: League Table Snapshot with Club Badges & Latest News */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Division {userClub.division} Live Table</span>
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('competitions')}
              className="text-xs text-pitch-400 hover:underline font-bold"
            >
              Full Competition Hub &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase text-[11px]">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Club</th>
                  <th className="py-2 px-2">P</th>
                  <th className="py-2 px-2">W</th>
                  <th className="py-2 px-2">D</th>
                  <th className="py-2 px-2">L</th>
                  <th className="py-2 px-2">GD</th>
                  <th className="py-2 px-2 font-black text-white">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {standings.map((row, idx) => {
                  const c = clubMap.get(row.clubId);
                  const isUser = row.clubId === userClub.id;
                  return (
                    <tr
                      key={row.clubId}
                      className={
                        isUser
                          ? 'bg-pitch-600/20 font-bold text-white'
                          : 'text-slate-300 hover:bg-navy-800/40'
                      }
                    >
                      <td className="py-2 px-2 font-bold">
                        <span
                          className={`inline-block w-5 text-center rounded text-[10px] ${
                            idx < 2
                              ? 'bg-pitch-500/30 text-pitch-400'
                              : idx >= 8
                                ? 'bg-red-500/30 text-red-400'
                                : ''
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-bold text-white">
                        <div className="flex items-center gap-2">
                          {c && <ClubCrest club={c} size={20} />}
                          <span>{row.clubName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">{row.played}</td>
                      <td className="py-2 px-2">{row.won}</td>
                      <td className="py-2 px-2">{row.drawn}</td>
                      <td className="py-2 px-2">{row.lost}</td>
                      <td className="py-2 px-2">{row.goalDifference}</td>
                      <td className="py-2 px-2 font-black text-gold-400">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-pitch-400 flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            <span>Latest Football &amp; Club Headlines</span>
          </h3>
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {gameState.news.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 space-y-1 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-[10px] text-gold-400 font-bold uppercase">
                  <span className="px-2 py-0.5 rounded bg-navy-900">{item.category}</span>
                  <span>
                    Season {item.season} &bull; Week {item.week}
                  </span>
                </div>
                <div className="text-xs font-bold text-white pt-0.5">{item.title}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
