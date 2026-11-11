import React from 'react';
import { MatchEvent, Player, PlayerPositionSnapshot, Vector2D } from '@/engine/types';
import { getPlayerShirtNumber } from '../ui/FootballVisuals';

export interface InterpolatedFrame {
  ball: Vector2D;
  prevBall: Vector2D;
  players: PlayerPositionSnapshot[];
  latestEvent: MatchEvent;
}

/**
 * Pure interpolation helper shared by both 2D and 3D match viewers.
 * Strictly reads from `MatchEvent[]` so that Instant, Text, 2D, and 3D modes
 * always share the exact same events and final score.
 */
export function interpolateMatchStateAtClock(
  events: MatchEvent[],
  currentClockSeconds: number
): InterpolatedFrame {
  if (events.length === 0) {
    return {
      ball: { x: 50, y: 50 },
      prevBall: { x: 50, y: 50 },
      players: [],
      latestEvent: {
        id: 'empty',
        minute: 1,
        second: 0,
        type: 'kickoff',
        teamId: '',
        ballPosition: { x: 50, y: 50 },
        outcome: 'neutral',
      },
    };
  }

  const eventTimeSec = (ev: MatchEvent) => (ev.minute - 1) * 60 + ev.second;

  let prevIdx = 0;
  for (let i = 0; i < events.length; i++) {
    if (eventTimeSec(events[i]) <= currentClockSeconds) {
      prevIdx = i;
    } else {
      break;
    }
  }

  const prevEv = events[prevIdx];
  const nextEv = events[Math.min(events.length - 1, prevIdx + 1)];

  const t0 = eventTimeSec(prevEv);
  const t1 = eventTimeSec(nextEv);
  const alpha = t1 > t0 ? Math.max(0, Math.min(1, (currentClockSeconds - t0) / (t1 - t0))) : 0;

  const ball: Vector2D = {
    x: prevEv.ballPosition.x + (nextEv.ballPosition.x - prevEv.ballPosition.x) * alpha,
    y: prevEv.ballPosition.y + (nextEv.ballPosition.y - prevEv.ballPosition.y) * alpha,
  };

  const prevPlayers = prevEv.playerPositions ?? [];
  const nextPlayersMap = new Map(
    (nextEv.playerPositions ?? []).map((p) => [p.playerId, p])
  );

  const interpolatedPlayers: PlayerPositionSnapshot[] = prevPlayers.map((p) => {
    const nextP = nextPlayersMap.get(p.playerId);
    if (!nextP) return p;
    return {
      playerId: p.playerId,
      teamId: p.teamId,
      x: p.x + (nextP.x - p.x) * alpha,
      y: p.y + (nextP.y - p.y) * alpha,
      action: alpha < 0.5 ? p.action : nextP.action,
    };
  });

  return {
    ball,
    prevBall: prevEv.ballPosition,
    players: interpolatedPlayers,
    latestEvent: prevEv,
  };
}

interface Pitch2DViewerProps {
  events: MatchEvent[];
  currentClockSeconds: number;
  homeClubId: string;
  homeColor: string;
  awayColor: string;
  playerMap: Map<string, Player>;
}

export function Pitch2DViewer({
  events,
  currentClockSeconds,
  homeClubId,
  homeColor,
  awayColor,
  playerMap,
}: Pitch2DViewerProps) {
  const frame = interpolateMatchStateAtClock(events, currentClockSeconds);
  const isGoalEvent = frame.latestEvent.type === 'goal';

  const ballX = 30 + (frame.ball.x / 100) * 940;
  const ballY = 25 + (frame.ball.y / 100) * 570;
  const prevBallX = 30 + (frame.prevBall.x / 100) * 940;
  const prevBallY = 25 + (frame.prevBall.y / 100) * 570;

  return (
    <div
      data-testid="pitch-2d-viewer"
      className="relative w-full aspect-[16/10] max-h-[460px] rounded-2xl overflow-hidden border-2 border-pitch-500/50 shadow-2xl bg-emerald-950"
    >
      <svg viewBox="0 0 1000 620" className="w-full h-full block select-none">
        <defs>
          <pattern id="pitchStripes" width="94" height="620" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="47" height="620" fill="#065f46" />
            <rect x="47" y="0" width="47" height="620" fill="#047857" />
          </pattern>
          <radialGradient id="stadiumVignette" cx="50%" cy="50%" r="65%">
            <stop offset="65%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(2,6,23,0.55)" />
          </radialGradient>
        </defs>

        {/* Striped turf */}
        <rect x="0" y="0" width="1000" height="620" fill="url(#pitchStripes)" />
        <rect x="0" y="0" width="1000" height="620" fill="url(#stadiumVignette)" />

        {/* Pitch boundary & markings */}
        <g stroke="rgba(255,255,255,0.78)" strokeWidth="2.5" fill="none">
          <rect x="30" y="25" width="940" height="570" />
          <line x1="500" y1="25" x2="500" y2="595" />
          <circle cx="500" cy="310" r="72" />
          <circle cx="500" cy="310" r="4.5" fill="#fff" />

          {/* Corner arcs */}
          <path d="M 30 42 A 17 17 0 0 0 47 25" />
          <path d="M 953 25 A 17 17 0 0 0 970 42" />
          <path d="M 30 578 A 17 17 0 0 1 47 595" />
          <path d="M 953 595 A 17 17 0 0 1 970 578" />

          {/* Left Penalty Area, 6-Yard Box, Spot & Arc */}
          <rect x="30" y="145" width="145" height="330" />
          <rect x="30" y="225" width="52" height="170" />
          <circle cx="132" cy="310" r="4" fill="#fff" />
          <path d="M 175 250 A 72 72 0 0 1 175 370" />
          <rect
            x="12"
            y="265"
            width="18"
            height="90"
            fill="rgba(255,255,255,0.22)"
            stroke="#fff"
            strokeWidth="2"
          />

          {/* Right Penalty Area, 6-Yard Box, Spot & Arc */}
          <rect x="825" y="145" width="145" height="330" />
          <rect x="918" y="225" width="52" height="170" />
          <circle cx="868" cy="310" r="4" fill="#fff" />
          <path d="M 825 250 A 72 72 0 0 0 825 370" />
          <rect
            x="970"
            y="265"
            width="18"
            height="90"
            fill="rgba(255,255,255,0.22)"
            stroke="#fff"
            strokeWidth="2"
          />
        </g>

        {/* Ball trajectory trail */}
        <line
          x1={prevBallX}
          y1={prevBallY}
          x2={ballX}
          y2={ballY}
          stroke="rgba(251, 191, 36, 0.55)"
          strokeWidth="3"
          strokeDasharray="6 4"
        />

        {/* Players */}
        {frame.players.map((snap, idx) => {
          const cx = 30 + (snap.x / 100) * 940;
          const cy = 25 + (snap.y / 100) * 570;
          const isHome = snap.teamId === homeClubId;
          const player = playerMap.get(snap.playerId);
          const isActive = frame.latestEvent.playerId === snap.playerId;
          const shirtNo = player ? getPlayerShirtNumber(player, idx) : idx + 1;

          return (
            <g key={snap.playerId} transform={`translate(${cx}, ${cy})`}>
              {/* Ground shadow */}
              <ellipse cx="0" cy="12" rx="12" ry="5" fill="rgba(0,0,0,0.4)" />

              {isActive && (
                <circle
                  r="20"
                  fill="rgba(251,191,36,0.15)"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeDasharray="5 3"
                />
              )}

              {/* Player Token */}
              <circle
                r="14"
                fill={isHome ? homeColor : awayColor}
                stroke="#ffffff"
                strokeWidth="2.5"
              />

              {/* Shirt Number */}
              <text
                y="4"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="900"
              >
                {shirtNo}
              </text>

              {/* Position + Name pill */}
              <g transform="translate(0, 25)">
                <rect
                  x="-34"
                  y="-9"
                  width="68"
                  height="14"
                  rx="4"
                  fill="rgba(2, 6, 23, 0.82)"
                />
                <text
                  y="1"
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {player?.lastName ?? snap.action}
                </text>
              </g>
            </g>
          );
        })}

        {/* Ball */}
        <g transform={`translate(${ballX}, ${ballY})`}>
          <circle r="10" fill="rgba(0,0,0,0.4)" cy="4" />
          <circle r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <polygon points="0,-4 3.5,-1 2,3 -2,3 -3.5,-1" fill="#0f172a" />
          <circle r="2.5" fill="#f59e0b" />
        </g>
      </svg>

      {/* Goal Flash Banner Overlay */}
      {isGoalEvent && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gold-500 text-navy-950 font-black text-xs uppercase tracking-widest shadow-2xl border-2 border-white animate-bounce">
          GOAL! {frame.latestEvent.minute}&apos; &bull; {frame.latestEvent.metadata?.commentary}
        </div>
      )}

      {/* Live Commentary Banner Overlay */}
      <div className="absolute bottom-3 left-3 right-3 px-4 py-2 rounded-xl bg-navy-950/90 border border-slate-700/80 text-xs font-bold text-white flex items-center justify-between shadow-lg">
        <span className="truncate pr-2">
          <strong className="text-pitch-400 mr-2">{frame.latestEvent.minute}&apos;</strong>
          {frame.latestEvent.metadata?.commentary ?? 'Play continues on the pitch.'}
        </span>
        <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-slate-800 text-gold-400 shrink-0 font-black">
          {frame.latestEvent.type}
        </span>
      </div>
    </div>
  );
}
