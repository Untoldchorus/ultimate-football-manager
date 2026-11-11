'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Play,
  Pause,
  FastForward,
  CheckCircle,
  Tv,
  Compass,
  Box,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { resimulateFromMinute, simulateMatch } from '@/engine/matchEngine';
import { Club, MatchResult, Player, TacticalMentality } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { Pitch2DViewer } from './Pitch2DViewer';
import type { CameraPreset, QualityLevel } from '../match3d/Pitch3DViewer';

const LazyPitch3DViewer = dynamic(() => import('../match3d/Pitch3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-center text-sm font-bold text-pitch-400">
      Loading 3D Stadium &amp; Floodlights...
    </div>
  ),
});

export type ViewMode = 'text' | '2d' | '3d';

export function MatchdayScreen() {
  const {
    gameState,
    recordUserMatchResult,
    advanceWeek,
    setActiveTab,
    triggerCutscene,
  } = useGameStore();

  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(2);
  const [clockSeconds, setClockSeconds] = useState(0); // 0 .. 5400 (90 mins)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [liveHomeClub, setLiveHomeClub] = useState<Club | null>(null);
  const [liveAwayClub, setLiveAwayClub] = useState<Club | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('broadcast');
  const [quality, setQuality] = useState<QualityLevel>('medium');
  const [subOutId, setSubOutId] = useState<string>('');
  const [subInId, setSubInId] = useState<string>('');

  const userClubId = gameState?.manager.clubId ?? '';
  const currentFixture = useMemo(() => {
    if (!gameState) return null;
    return (
      gameState.fixtures.find(
        (f) =>
          f.week === gameState.currentWeek &&
          (f.homeClubId === userClubId || f.awayClubId === userClubId)
      ) ??
      gameState.fixtures.find((f) => f.week === gameState.currentWeek) ??
      null
    );
  }, [gameState, userClubId]);

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    if (gameState) {
      for (const p of gameState.players) map.set(p.id, p);
    }
    return map;
  }, [gameState]);

  // Initialize deterministic match result once per fixture
  useEffect(() => {
    if (!gameState || !currentFixture) return;
    const hClub = gameState.clubs.find((c) => c.id === currentFixture.homeClubId)!;
    const aClub = gameState.clubs.find((c) => c.id === currentFixture.awayClubId)!;
    setLiveHomeClub(hClub);
    setLiveAwayClub(aClub);

    if (currentFixture.played && currentFixture.result) {
      setMatchResult(currentFixture.result);
      setClockSeconds(5400);
      setIsPlaying(false);
      return;
    }

    const matchSeed =
      (gameState.worldSeed ^
        Math.imul(gameState.currentSeason * 100 + gameState.currentWeek, 0x9e3779b9)) >>>
      0;

    const homePlayers = gameState.players.filter((p) => p.clubId === hClub.id);
    const awayPlayers = gameState.players.filter((p) => p.clubId === aClub.id);

    const simulated = simulateMatch(
      {
        fixtureId: currentFixture.id,
        homeClub: hClub,
        awayClub: aClub,
        homePlayers,
        awayPlayers,
      },
      matchSeed
    );

    setMatchResult(simulated);
    setClockSeconds(0);
    setIsPlaying(false);
  }, [gameState, currentFixture]);

  // Playback interval timer
  useEffect(() => {
    if (!isPlaying || !matchResult) return;
    const stepSeconds = speed * 25; // Fast, engaging playback pace
    const timer = setInterval(() => {
      setClockSeconds((prev) => {
        const next = Math.min(5400, prev + stepSeconds);
        // Check if a goal occurred in this tick window to play sound
        const prevMin = Math.floor(prev / 60) + 1;
        const nextMin = Math.floor(next / 60) + 1;
        const newGoal = matchResult.events.find(
          (e) => e.type === 'goal' && e.minute > prevMin && e.minute <= nextMin
        );
        if (newGoal) {
          soundManager.playGoalCheer();
        }
        if (next >= 5400) {
          setIsPlaying(false);
          soundManager.playWhistle(true);
        }
        return next;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [isPlaying, speed, matchResult]);

  if (!gameState || !currentFixture || !matchResult || !liveHomeClub || !liveAwayClub) {
    return (
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">No Fixture Scheduled This Week</h2>
        <button
          type="button"
          onClick={() => advanceWeek()}
          className="px-5 py-2.5 rounded-xl bg-pitch-600 text-white font-bold text-sm"
        >
          Advance to Next Week
        </button>
      </div>
    );
  }

  const currentMinute = Math.min(90, Math.max(1, Math.floor(clockSeconds / 60) + 1));
  const isFinished = clockSeconds >= 5400;

  const visibleEvents = matchResult.events.filter(
    (e) => (e.minute - 1) * 60 + e.second <= clockSeconds
  );

  // Compute live score at current playback minute
  let displayedHomeScore = 0;
  let displayedAwayScore = 0;
  for (const ev of visibleEvents) {
    if (ev.type === 'goal') {
      if (ev.teamId === liveHomeClub.id) displayedHomeScore++;
      else if (ev.teamId === liveAwayClub.id) displayedAwayScore++;
    }
  }

  const isUserHome = liveHomeClub.id === userClubId;
  const userLiveClub = isUserHome ? liveHomeClub : liveAwayClub;

  const handleSkipToEnd = () => {
    soundManager.playWhistle(true);
    setIsPlaying(false);
    setClockSeconds(5400);
  };

  const handleLiveMentalityChange = (mentality: TacticalMentality) => {
    if (isFinished) return;
    soundManager.playUiClick();
    const updatedUserClub: Club = {
      ...userLiveClub,
      tactics: { ...userLiveClub.tactics, mentality },
    };
    const nextHome = isUserHome ? updatedUserClub : liveHomeClub;
    const nextAway = isUserHome ? liveAwayClub : updatedUserClub;
    setLiveHomeClub(nextHome);
    setLiveAwayClub(nextAway);

    const homePlayers = gameState.players.filter((p) => p.clubId === nextHome.id);
    const awayPlayers = gameState.players.filter((p) => p.clubId === nextAway.id);

    const resim = resimulateFromMinute(
      {
        fixtureId: currentFixture.id,
        homeClub: nextHome,
        awayClub: nextAway,
        homePlayers,
        awayPlayers,
      },
      matchResult.seed,
      matchResult,
      currentMinute
    );
    setMatchResult(resim);
  };

  const handleLiveSubstitution = () => {
    if (isFinished || !subOutId || !subInId) return;
    soundManager.playUiClick();
    const updatedStartingXI = userLiveClub.startingXI.map((id) =>
      id === subOutId ? subInId : id
    );
    const updatedSubs = userLiveClub.substitutes.filter((id) => id !== subInId);
    const updatedUserClub: Club = {
      ...userLiveClub,
      startingXI: updatedStartingXI,
      substitutes: updatedSubs,
    };

    const nextHome = isUserHome ? updatedUserClub : liveHomeClub;
    const nextAway = isUserHome ? liveAwayClub : updatedUserClub;
    setLiveHomeClub(nextHome);
    setLiveAwayClub(nextAway);

    const homePlayers = gameState.players.filter((p) => p.clubId === nextHome.id);
    const awayPlayers = gameState.players.filter((p) => p.clubId === nextAway.id);

    const resim = resimulateFromMinute(
      {
        fixtureId: currentFixture.id,
        homeClub: nextHome,
        awayClub: nextAway,
        homePlayers,
        awayPlayers,
      },
      matchResult.seed,
      matchResult,
      currentMinute
    );
    setMatchResult(resim);
    setSubOutId('');
    setSubInId('');
  };

  const handleCompleteMatchday = async () => {
    soundManager.playUiClick();
    await recordUserMatchResult(currentFixture.id, matchResult);
    await advanceWeek();
    setActiveTab('home');
  };

  return (
    <div className="space-y-5" data-testid="matchday-screen">
      {/* Scoreboard Header */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-right">
              <div className="text-lg md:text-xl font-black text-white">{liveHomeClub.name}</div>
              <div className="text-xs text-slate-400">
                {liveHomeClub.tactics.formation} &bull; {liveHomeClub.tactics.mentality}
              </div>
            </div>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border border-white/20 shadow"
              style={{
                backgroundColor: liveHomeClub.primaryColor,
                color: liveHomeClub.secondaryColor,
              }}
            >
              {liveHomeClub.shortName}
            </div>
          </div>

          {/* Score & Minute */}
          <div className="px-6 py-2.5 rounded-2xl bg-navy-950 border border-slate-700 text-center min-w-[170px]">
            <div
              data-testid="match-scoreline"
              className="text-3xl font-black tracking-tight text-white"
            >
              {displayedHomeScore} <span className="text-pitch-400">-</span> {displayedAwayScore}
            </div>
            <div
              data-testid="match-clock"
              className="text-xs font-extrabold uppercase tracking-wider text-gold-400 mt-0.5"
            >
              {isFinished ? 'FULL TIME (90\')' : `${currentMinute}' MIN`}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 justify-start">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border border-white/20 shadow"
              style={{
                backgroundColor: liveAwayClub.primaryColor,
                color: liveAwayClub.secondaryColor,
              }}
            >
              {liveAwayClub.shortName}
            </div>
            <div>
              <div className="text-lg md:text-xl font-black text-white">{liveAwayClub.name}</div>
              <div className="text-xs text-slate-400">
                {liveAwayClub.tactics.formation} &bull; {liveAwayClub.tactics.mentality}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar: Mode Switcher (Text, 2D, 3D) + Playback Controls */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Viewing Modes */}
          <div className="flex items-center gap-1.5 bg-navy-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              data-testid="view-mode-text"
              onClick={() => setViewMode('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'text' ? 'bg-pitch-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Text Mode</span>
            </button>
            <button
              type="button"
              data-testid="view-mode-2d"
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === '2d' ? 'bg-pitch-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>2D Pitch</span>
            </button>
            <button
              type="button"
              data-testid="view-mode-3d"
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === '3d' ? 'bg-pitch-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Stadium</span>
            </button>
          </div>

          {/* Playback Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {!isFinished && (
              <>
                <button
                  type="button"
                  data-testid="play-pause-btn"
                  onClick={() => {
                    if (clockSeconds === 0) soundManager.playWhistle(false);
                    setIsPlaying(!isPlaying);
                  }}
                  className="px-4 py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Pause' : clockSeconds === 0 ? 'Kick Off' : 'Resume'}</span>
                </button>

                {([1, 2, 4] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    data-testid={`speed-${spd}x-btn`}
                    onClick={() => setSpeed(spd)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition ${
                      speed === spd
                        ? 'bg-navy-800 border-pitch-500 text-pitch-400'
                        : 'bg-navy-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}

                <button
                  type="button"
                  data-testid="skip-to-end-btn"
                  onClick={handleSkipToEnd}
                  className="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 text-xs font-extrabold flex items-center gap-1.5 transition"
                >
                  <FastForward className="w-4 h-4" />
                  <span>Instant Result / Skip to End</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    triggerCutscene({
                      type: clockSeconds >= 2700 ? 'halfTimeTalk' : 'preMatchTalk',
                      title: clockSeconds >= 2700 ? 'Half-Time Dressing Room' : 'Pre-Match Team Talk',
                      subtitle: `"Stay focused, stick to our ${userLiveClub.tactics.attackingStyle} identity, and win every second ball!"`,
                      primaryColor: userLiveClub.primaryColor,
                      secondaryColor: userLiveClub.secondaryColor,
                      clubName: userLiveClub.name,
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-pitch-400" />
                  <span>Team Talk</span>
                </button>
              </>
            )}

            {isFinished && (
              <button
                type="button"
                data-testid="complete-matchday-btn"
                onClick={handleCompleteMatchday}
                className="px-5 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pitch-600/30 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Result &amp; Advance Week</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3D Camera & Quality Sub-bar when in 3D mode */}
      {viewMode === '3d' && (
        <div className="bg-navy-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Camera:</span>
            {(
              [
                ['broadcast', 'Broadcast'],
                ['overhead', 'Tactical Overhead'],
                ['followBall', 'Follow-Ball'],
                ['goalReplay', 'Goal Replay'],
              ] as const
            ).map(([camKey, label]) => (
              <button
                key={camKey}
                type="button"
                onClick={() => setCameraPreset(camKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  cameraPreset === camKey
                    ? 'bg-pitch-600 text-white'
                    : 'bg-navy-950 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Graphics Quality:</span>
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition ${
                  quality === q
                    ? 'bg-gold-500 text-navy-950'
                    : 'bg-navy-950 text-slate-400 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left/Center Viewer */}
        <div className="lg:col-span-8 space-y-5">
          {viewMode === '2d' && (
            <Pitch2DViewer
              events={matchResult.events}
              currentClockSeconds={clockSeconds}
              homeClubId={liveHomeClub.id}
              homeColor={liveHomeClub.primaryColor}
              awayColor={liveAwayClub.primaryColor}
              playerMap={playerMap}
            />
          )}

          {viewMode === '3d' && (
            <Suspense fallback={<div className="p-8 text-center">Loading 3D Engine...</div>}>
              <LazyPitch3DViewer
                events={matchResult.events}
                currentClockSeconds={clockSeconds}
                homeClubId={liveHomeClub.id}
                homeColor={liveHomeClub.primaryColor}
                awayColor={liveAwayClub.primaryColor}
                cameraPreset={cameraPreset}
                quality={quality}
              />
            </Suspense>
          )}

          {/* Commentary Feed */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-pitch-400">
                Live Match Commentary Feed ({visibleEvents.length} Events)
              </h3>
              <span className="text-xs text-slate-400">
                Deterministic Seed #{matchResult.seed}
              </span>
            </div>

            <div
              data-testid="commentary-feed"
              className="space-y-2 max-h-[340px] overflow-y-auto pr-1"
            >
              {[...visibleEvents].reverse().map((ev) => {
                const isGoal = ev.type === 'goal';
                const isCard = ev.type === 'yellowCard' || ev.type === 'redCard';
                return (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                      isGoal
                        ? 'bg-pitch-600/20 border-pitch-500 text-white font-bold'
                        : isCard
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-navy-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="px-2 py-0.5 rounded bg-navy-800 font-black text-pitch-400 shrink-0">
                      {ev.minute}&apos;
                    </span>
                    <div className="flex-1">
                      {ev.metadata?.commentary ?? `${ev.type.toUpperCase()} event`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Match Stats & Live Tactical Adjustments */}
        <div className="lg:col-span-4 space-y-5">
          {/* Match Stats */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-400">
              Match Statistics
            </h3>
            {[
              ['Possession %', `${matchResult.homeStats.possession}%`, `${matchResult.awayStats.possession}%`],
              ['Total Shots', matchResult.homeStats.shots, matchResult.awayStats.shots],
              ['Shots on Target', matchResult.homeStats.shotsOnTarget, matchResult.awayStats.shotsOnTarget],
              ['Expected Goals (xG)', matchResult.homeStats.xg.toFixed(2), matchResult.awayStats.xg.toFixed(2)],
              ['Corners', matchResult.homeStats.corners, matchResult.awayStats.corners],
              ['Fouls', matchResult.homeStats.fouls, matchResult.awayStats.fouls],
              ['Yellow Cards', matchResult.homeStats.yellowCards, matchResult.awayStats.yellowCards],
              ['Red Cards', matchResult.homeStats.redCards, matchResult.awayStats.redCards],
            ].map(([label, hVal, aVal]) => (
              <div key={String(label)} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                <span className="font-bold text-white">{hVal}</span>
                <span className="text-slate-400">{label}</span>
                <span className="font-bold text-white">{aVal}</span>
              </div>
            ))}
          </div>

          {/* Live Touchline Tactics & Substitutions (Re-simulates remaining minutes) */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-pitch-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Touchline Live Adjustments
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Changes made during playback preserve events up to minute {currentMinute}&apos; and re-simulate only the remaining minutes.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Live Team Mentality
              </label>
              <select
                disabled={isFinished}
                value={userLiveClub.tactics.mentality}
                onChange={(e) => handleLiveMentalityChange(e.target.value as TacticalMentality)}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-white disabled:opacity-50"
              >
                <option value="ultraDefensive">Ultra Defensive</option>
                <option value="defensive">Defensive</option>
                <option value="balanced">Balanced</option>
                <option value="attacking">Attacking</option>
                <option value="allOutAttack">All-Out Attack</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                Make Live Substitution
              </div>
              <select
                disabled={isFinished}
                value={subOutId}
                onChange={(e) => setSubOutId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white"
              >
                <option value="">Select Player Coming OFF...</option>
                {userLiveClub.startingXI.map((id) => {
                  const p = playerMap.get(id);
                  return p ? (
                    <option key={p.id} value={p.id}>
                      {p.primaryPosition} - {p.firstName} {p.lastName} ({p.overall})
                    </option>
                  ) : null;
                })}
              </select>

              <select
                disabled={isFinished}
                value={subInId}
                onChange={(e) => setSubInId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white"
              >
                <option value="">Select Substitute Coming ON...</option>
                {userLiveClub.substitutes.map((id) => {
                  const p = playerMap.get(id);
                  return p ? (
                    <option key={p.id} value={p.id}>
                      {p.primaryPosition} - {p.firstName} {p.lastName} ({p.overall})
                    </option>
                  ) : null;
                })}
              </select>

              <button
                type="button"
                disabled={isFinished || !subOutId || !subInId}
                onClick={handleLiveSubstitution}
                className="w-full py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-40 text-white text-xs font-bold transition"
              >
                Confirm Touchline Substitution
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
