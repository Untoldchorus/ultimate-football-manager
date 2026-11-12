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
  CloudRain,
  MapPin,
  Flame,
  Rewind,
  Sparkles,
  Users,
  Star,
  Cpu,
} from 'lucide-react';
import { resimulateFromMinute, simulateMatch } from '@/engine/matchEngine';
import { Club, MatchResult, Player, TacticalMentality } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { Pitch2DViewer } from './Pitch2DViewer';
import type { CameraPreset, QualityLevel } from '../match3d/Pitch3DViewer';
import { ClubCrest, getPlayerShirtNumber, PlayerAvatar } from '../ui/FootballVisuals';

const LazyPitch3DViewer = dynamic(() => import('../match3d/Pitch3DViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-center text-sm font-bold text-pitch-400">
      Loading 3D Stadium, Articulated Players &amp; Floodlights...
    </div>
  ),
});

const LazyGodotMatchViewer = dynamic(() => import('./GodotMatchViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-2xl bg-navy-900 border border-slate-800 flex items-center justify-center text-sm font-bold text-sky-400">
      Connecting Godot 4 Engine JavaScriptBridge...
    </div>
  ),
});

export type ViewMode = 'text' | '2d' | '3d' | 'godot';

const WEATHER_CONDITIONS = [
  { label: 'Clear Floodlit Night • 14°C', pitch: 'Pristine Fast Turf' },
  { label: 'Light Evening Rain • 11°C', pitch: 'Slick Wet Surface' },
  { label: 'Overcast & Breezy • 13°C', pitch: 'Firm Dry Grass' },
  { label: 'Crisp Autumn Dusk • 9°C', pitch: 'Lush Cushion Turf' },
];

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
  const [showPreMatchSheet, setShowPreMatchSheet] = useState<boolean>(false);

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
    const stepSeconds = speed * 25;
    const timer = setInterval(() => {
      setClockSeconds((prev) => {
        const next = Math.min(5400, prev + stepSeconds);
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

  const goalEvents = matchResult.events.filter((e) => e.type === 'goal');

  // Compute live score at current playback minute
  let displayedHomeScore = 0;
  let displayedAwayScore = 0;
  for (const ev of visibleEvents) {
    if (ev.type === 'goal') {
      if (ev.teamId === liveHomeClub.id) displayedHomeScore++;
      else if (ev.teamId === liveAwayClub.id) displayedAwayScore++;
    }
  }

  const weatherInfo = WEATHER_CONDITIONS[matchResult.seed % WEATHER_CONDITIONS.length];
  const matchImportance =
    currentFixture.competition === 'championsCup'
      ? 'Continental Showcase • High Stakes'
      : currentFixture.competition === 'domesticCup'
        ? 'Knockout Cup Tie • Must Win'
        : Math.abs(liveHomeClub.reputation - liveAwayClub.reputation) <= 5
          ? 'Rivalry Clash • Six-Pointer'
          : 'League Campaign Fixture';

  const isUserHome = liveHomeClub.id === userClubId;
  const userLiveClub = isUserHome ? liveHomeClub : liveAwayClub;

  const handleSkipToEnd = () => {
    soundManager.playWhistle(true);
    setIsPlaying(false);
    setClockSeconds(5400);
  };

  const handleRewind10Mins = () => {
    soundManager.playUiClick();
    setClockSeconds((prev) => Math.max(0, prev - 600));
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
      {/* Broadcast Scoreboard & Venue Banner */}
      <div className="bg-gradient-to-b from-navy-900 via-navy-950 to-navy-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        {/* Top Venue, Weather & Importance Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-pitch-400 font-bold">
              <MapPin className="w-3.5 h-3.5" />
              {liveHomeClub.stadiumName} ({liveHomeClub.stadiumCapacity.toLocaleString()})
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1 text-slate-300">
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              {weatherInfo.label} ({weatherInfo.pitch})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 font-bold inline-flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {matchImportance}
            </span>
            <button
              type="button"
              onClick={() => setShowPreMatchSheet(!showPreMatchSheet)}
              className="px-2.5 py-0.5 rounded-lg bg-navy-800 hover:bg-navy-700 border border-slate-700 text-slate-200 font-bold inline-flex items-center gap-1"
            >
              <Users className="w-3 h-3 text-pitch-400" />
              <span>{showPreMatchSheet ? 'Hide Lineups' : 'Lineups & Tactical Sheet'}</span>
            </button>
          </div>
        </div>

        {/* Main Broadcast Scoreboard Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex items-center gap-3.5 flex-1 justify-end">
            <div className="text-right">
              <div className="text-lg md:text-xl font-black text-white">{liveHomeClub.name}</div>
              <div className="text-xs text-slate-400">
                {liveHomeClub.tactics.formation} &bull;{' '}
                <span className="capitalize text-pitch-400">{liveHomeClub.tactics.mentality}</span>
              </div>
            </div>
            <ClubCrest club={liveHomeClub} size={54} />
          </div>

          {/* Score & Minute */}
          <div className="px-7 py-3 rounded-2xl bg-navy-950 border-2 border-slate-700/80 text-center min-w-[185px] shadow-inner">
            <div
              data-testid="match-scoreline"
              className="text-3xl md:text-4xl font-black tracking-tight text-white"
            >
              {displayedHomeScore} <span className="text-pitch-400">-</span> {displayedAwayScore}
            </div>
            <div
              data-testid="match-clock"
              className="text-xs font-extrabold uppercase tracking-wider text-gold-400 mt-0.5"
            >
              {isFinished
                ? "FULL TIME (90')"
                : clockSeconds === 0
                  ? 'PRE-MATCH READY'
                  : `${currentMinute}' MIN`}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3.5 flex-1 justify-start">
            <ClubCrest club={liveAwayClub} size={54} />
            <div>
              <div className="text-lg md:text-xl font-black text-white">{liveAwayClub.name}</div>
              <div className="text-xs text-slate-400">
                {liveAwayClub.tactics.formation} &bull;{' '}
                <span className="capitalize text-gold-400">{liveAwayClub.tactics.mentality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar: Mode Switcher (Text, 2D, 3D) + Playback & Replay Controls */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
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
            <button
              type="button"
              data-testid="view-mode-godot"
              onClick={() => setViewMode('godot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'godot' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Godot Engine</span>
            </button>
          </div>

          {/* Playback Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {clockSeconds > 0 && (
              <button
                type="button"
                onClick={handleRewind10Mins}
                title="Rewind 10 Minutes for Instant Replay"
                className="px-2.5 py-2 rounded-xl bg-navy-950 hover:bg-navy-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1"
              >
                <Rewind className="w-3.5 h-3.5 text-gold-400" />
                <span>-10&apos; Replay</span>
              </button>
            )}

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
                      type: clockSeconds === 0 ? 'tunnelWalkout' : clockSeconds >= 2700 ? 'halfTimeTalk' : 'preMatchTalk',
                      title:
                        clockSeconds === 0
                          ? `${liveHomeClub.stadiumName} Tunnel Walkout`
                          : clockSeconds >= 2700
                            ? 'Half-Time Dressing Room'
                            : 'Pre-Match Team Talk',
                      subtitle:
                        clockSeconds === 0
                          ? `${liveHomeClub.name} vs ${liveAwayClub.name} • Players emerge under the stadium floodlights!`
                          : `"Stay focused, stick to our ${userLiveClub.tactics.attackingStyle} identity, and win every second ball!"`,
                      primaryColor: userLiveClub.primaryColor,
                      secondaryColor: userLiveClub.secondaryColor,
                      clubName: userLiveClub.name,
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-pitch-400" />
                  <span>{clockSeconds === 0 ? 'Tunnel Walkout' : 'Team Talk'}</span>
                </button>
              </>
            )}

            {isFinished && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    triggerCutscene({
                      type: 'fullTime',
                      title: `Full-Time Whistle: ${liveHomeClub.shortName} ${displayedHomeScore} - ${displayedAwayScore} ${liveAwayClub.shortName}`,
                      subtitle: `After 90 minutes of intense action at ${liveHomeClub.stadiumName}, the referee brings the contest to a close.`,
                      primaryColor: userLiveClub.primaryColor,
                      secondaryColor: userLiveClub.secondaryColor,
                      clubName: userLiveClub.name,
                    })
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-xs font-bold text-gold-400 flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Full-Time Scene</span>
                </button>
                <button
                  type="button"
                  data-testid="complete-matchday-btn"
                  onClick={handleCompleteMatchday}
                  className="px-5 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pitch-600/30 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Result &amp; Advance Week</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Match Lineups & Tactical Comparison Drawer (Collapsible or shown before kickoff) */}
      {(showPreMatchSheet || clockSeconds === 0) && (
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pitch-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                Confirmed Starting Lineups &amp; Tactical Matchup
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {liveHomeClub.tactics.formation} vs {liveAwayClub.tactics.formation}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[liveHomeClub, liveAwayClub].map((club) => (
              <div
                key={club.id}
                className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ClubCrest club={club} size={28} />
                    <div>
                      <div className="text-xs font-extrabold text-white">{club.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {club.tactics.formation} &bull; {club.tactics.attackingStyle} &bull;{' '}
                        {club.tactics.pressing} Press
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gold-400">Rep {club.reputation}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {club.startingXI.slice(0, 11).map((pid, idx) => {
                    const p = playerMap.get(pid);
                    if (!p) return null;
                    return (
                      <div
                        key={p.id}
                        className="px-2 py-1 rounded bg-navy-900/90 border border-slate-800/80 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-[9px] font-black text-slate-500 w-4">
                            #{getPlayerShirtNumber(p, idx)}
                          </span>
                          <span className="text-pitch-400 font-bold w-6">{p.primaryPosition}</span>
                          <span className="text-white font-semibold truncate">
                            {p.firstName[0]}. {p.lastName}
                          </span>
                        </div>
                        <span className="text-gold-400 font-black ml-1">{p.overall}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D Camera & Quality Sub-bar when in 3D or Godot mode */}
      {(viewMode === '3d' || viewMode === 'godot') && (
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

          {viewMode === 'godot' && (
            <Suspense fallback={<div className="p-8 text-center">Loading Godot 4 Bridge...</div>}>
              <LazyGodotMatchViewer
                events={matchResult.events}
                currentClockSeconds={clockSeconds}
                homeClubId={liveHomeClub.id}
                homeColor={liveHomeClub.primaryColor}
                awayColor={liveAwayClub.primaryColor}
                cameraPreset={cameraPreset}
                quality={quality}
                playerMap={playerMap}
              />
            </Suspense>
          )}

          {/* Goal Highlight Replay Bar */}
          {goalEvents.length > 0 && (
            <div className="bg-navy-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-extrabold uppercase text-gold-400 mr-1">
                Goal Replay Timeline:
              </span>
              {goalEvents.map((g) => {
                const scorer = g.playerId ? playerMap.get(g.playerId) : null;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      soundManager.playUiClick();
                      setIsPlaying(false);
                      setClockSeconds(Math.max(0, (g.minute - 1) * 60 + g.second));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-navy-950 hover:bg-pitch-600/20 border border-gold-500/40 text-white font-bold flex items-center gap-1.5 transition"
                  >
                    <span className="text-gold-400">{g.minute}&apos;</span>
                    <span>{scorer ? scorer.lastName : 'Goal'}</span>
                  </button>
                );
              })}
            </div>
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
              className="space-y-2 max-h-[320px] overflow-y-auto pr-1"
            >
              {[...visibleEvents].reverse().map((ev) => {
                const isGoal = ev.type === 'goal';
                const isCard = ev.type === 'yellowCard' || ev.type === 'redCard';
                return (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      isGoal
                        ? 'bg-pitch-600/20 border-pitch-500 text-white font-bold'
                        : isCard
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                          : 'bg-navy-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-navy-800 font-black text-pitch-400 shrink-0">
                        {ev.minute}&apos;
                      </span>
                      <div className="flex-1">
                        {ev.metadata?.commentary ?? `${ev.type.toUpperCase()} event`}
                      </div>
                    </div>
                    {isGoal && (
                      <button
                        type="button"
                        onClick={() =>
                          triggerCutscene({
                            type: 'goalCelebration',
                            title: `GOAL! (${ev.minute}')`,
                            subtitle: ev.metadata?.commentary ?? 'The stadium erupts!',
                            primaryColor:
                              ev.teamId === liveHomeClub.id
                                ? liveHomeClub.primaryColor
                                : liveAwayClub.primaryColor,
                            secondaryColor:
                              ev.teamId === liveHomeClub.id
                                ? liveHomeClub.secondaryColor
                                : liveAwayClub.secondaryColor,
                            clubName:
                              ev.teamId === liveHomeClub.id ? liveHomeClub.name : liveAwayClub.name,
                          })
                        }
                        className="px-2 py-1 rounded bg-gold-500 text-navy-950 text-[10px] font-black uppercase shrink-0"
                      >
                        Scene
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Match Stats, Live Ratings & Live Tactical Adjustments */}
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

          {/* Live Player Match Ratings */}
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-gold-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
                  Player Match Ratings
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">{userLiveClub.shortName} Squad</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {userLiveClub.startingXI.map((pid) => {
                const p = playerMap.get(pid);
                if (!p) return null;
                const rating = matchResult.playerRatings[pid] ?? 6.5;
                return (
                  <div
                    key={pid}
                    className="px-2.5 py-1.5 rounded-lg bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <PlayerAvatar player={p} club={userLiveClub} size={22} />
                      <span className="text-pitch-400 font-bold w-6 text-[10px]">{p.primaryPosition}</span>
                      <span className="text-white font-semibold truncate">
                        {p.firstName[0]}. {p.lastName}
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded font-black text-[11px] ${
                        rating >= 7.5
                          ? 'bg-pitch-500/20 text-pitch-400'
                          : rating >= 6.5
                            ? 'bg-gold-500/20 text-gold-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {rating.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
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
