import React from 'react';
import { MatchEvent, Player, PlayerPositionSnapshot, Vector2D } from '@/engine/types';

export interface InterpolatedFrame {
  ball: Vector2D;
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

  return (
    <div
      data-testid="pitch-2d-viewer"
      className="relative w-full aspect-[16/10] max-h-[460px] rounded-2xl overflow-hidden border-2 border-pitch-500/50 shadow-2xl bg-emerald-900"
    >
      <svg viewBox="0 0 1000 620" className="w-full h-full block select-none">
        <defs>
          <pattern id="pitchStripes" width="100" height="620" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="50" height="620" fill="#065f46" />
            <rect x="50" y="0" width="50" height="620" fill="#047857" />
          </pattern>
        </defs>

        {/* Striped turf */}
        <rect x="0" y="0" width="1000" height="620" fill="url(#pitchStripes)" />

        {/* Pitch boundary & markings */}
        <rect
          x="30"
          y="25"
          width="940"
          height="570"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
        />
        <line
          x1="500"
          y1="25"
          x2="500"
          y2="595"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
        />
        <circle
          cx="500"
          cy="310"
          r="72"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
        />
        <circle cx="500" cy="310" r="5" fill="#fff" />

        {/* Left Penalty Area & Goal */}
        <rect
          x="30"
          y="145"
          width="145"
          height="330"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
        />
        <rect
          x="30"
          y="225"
          width="52"
          height="170"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
        />
        <rect x="14" y="265" width="16" height="90" fill="rgba(255,255,255,0.25)" stroke="#fff" strokeWidth="2" />

        {/* Right Penalty Area & Goal */}
        <rect
          x="825"
          y="145"
          width="145"
          height="330"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
        />
        <rect
          x="918"
          y="225"
          width="52"
          height="170"
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="3"
        />
        <rect x="970" y="265" width="16" height="90" fill="rgba(255,255,255,0.25)" stroke="#fff" strokeWidth="2" />

        {/* Players */}
        {frame.players.map((snap) => {
          const cx = 30 + (snap.x / 100) * 940;
          const cy = 25 + (snap.y / 100) * 570;
          const isHome = snap.teamId === homeClubId;
          const player = playerMap.get(snap.playerId);
          const isActive = frame.latestEvent.playerId === snap.playerId;

          return (
            <g key={snap.playerId} transform={`translate(${cx}, ${cy})`}>
              {isActive && (
                <circle
                  r="19"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                />
              )}
              <circle
                r="13"
                fill={isHome ? homeColor : awayColor}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <text
                y="4"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
              >
                {player?.primaryPosition ?? ''}
              </text>
              <text
                y="26"
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="bold"
                style={{ textShadow: '0px 1px 3px #000' }}
              >
                {player?.lastName ?? ''}
              </text>
            </g>
          );
        })}

        {/* Ball */}
        <g
          transform={`translate(${30 + (frame.ball.x / 100) * 940}, ${
            25 + (frame.ball.y / 100) * 570
          })`}
        >
          <circle r="9" fill="rgba(0,0,0,0.35)" cy="3" />
          <circle r="7.5" fill="#ffffff" stroke="#111827" strokeWidth="2" />
          <circle r="3" fill="#f59e0b" />
        </g>
      </svg>

      {/* Live Commentary Banner Overlay */}
      <div className="absolute bottom-3 left-3 right-3 px-4 py-2 rounded-xl bg-navy-950/90 border border-slate-700/80 text-xs font-bold text-white flex items-center justify-between shadow-lg">
        <span>
          <strong className="text-pitch-400 mr-2">{frame.latestEvent.minute}&apos;</strong>
          {frame.latestEvent.metadata?.commentary ?? 'Play continues on the pitch.'}
        </span>
        <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-slate-800 text-gold-400">
          {frame.latestEvent.type}
        </span>
      </div>
    </div>
  );
}
