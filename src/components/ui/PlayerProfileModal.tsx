'use client';

import React, { useMemo, useState } from 'react';
import { X, GitCompare, Shield, TrendingUp, Activity, Award } from 'lucide-react';
import { Club, Player } from '@/engine/types';
import { computeRadarStats, getPlayerShirtNumber, PlayerAvatar } from './FootballVisuals';

interface PlayerProfileModalProps {
  player: Player | null;
  onClose: () => void;
  allPlayers: Player[];
  clubs?: Club[];
  club?: Club;
  currentSeason?: number;
  onActionClick?: (player: Player) => void;
  actionLabel?: string;
}

function HexRadarChart({
  primaryStats,
  compareStats,
  primaryColor = '#10b981',
  compareColor = '#f59e0b',
}: {
  primaryStats: { PAC: number; SHO: number; PAS: number; DRI: number; DEF: number; PHY: number };
  compareStats?: { PAC: number; SHO: number; PAS: number; DRI: number; DEF: number; PHY: number } | null;
  primaryColor?: string;
  compareColor?: string;
}) {
  const keys: (keyof typeof primaryStats)[] = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  const cx = 130;
  const cy = 130;
  const maxR = 90;

  const getPoint = (idx: number, val: number) => {
    const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
    const r = (Math.max(10, Math.min(100, val)) / 100) * maxR;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  };

  const primaryPolygon = keys
    .map((k, i) => {
      const pt = getPoint(i, primaryStats[k]);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  const comparePolygon = compareStats
    ? keys
        .map((k, i) => {
          const pt = getPoint(i, compareStats[k]);
          return `${pt.x},${pt.y}`;
        })
        .join(' ')
    : null;

  return (
    <svg viewBox="0 0 260 260" className="w-full max-w-[260px] mx-auto select-none">
      {/* Concentric Hexagon Rings */}
      {[0.25, 0.5, 0.75, 1].map((scale, sIdx) => {
        const pts = keys
          .map((_, i) => {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            const r = maxR * scale;
            return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
          })
          .join(' ');
        return (
          <polygon
            key={sIdx}
            points={pts}
            fill="none"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis Spokes & Labels */}
      {keys.map((key, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const endX = cx + Math.cos(angle) * maxR;
        const endY = cy + Math.sin(angle) * maxR;
        const labelX = cx + Math.cos(angle) * (maxR + 24);
        const labelY = cy + Math.sin(angle) * (maxR + 24);

        return (
          <g key={key}>
            <line
              x1={cx}
              y1={cy}
              x2={endX}
              y2={endY}
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1"
            />
            <text
              x={labelX}
              y={labelY + 4}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="11"
              fontWeight="800"
            >
              {key} ({primaryStats[key]})
            </text>
          </g>
        );
      })}

      {/* Compare Polygon */}
      {comparePolygon && (
        <polygon
          points={comparePolygon}
          fill={compareColor}
          fillOpacity="0.25"
          stroke={compareColor}
          strokeWidth="2.5"
        />
      )}

      {/* Primary Player Polygon */}
      <polygon
        points={primaryPolygon}
        fill={primaryColor}
        fillOpacity="0.35"
        stroke={primaryColor}
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function PlayerProfileModal({
  player,
  onClose,
  allPlayers,
  clubs = [],
  club: explicitClub,
  onActionClick,
  actionLabel,
}: PlayerProfileModalProps) {
  const [comparePlayerId, setComparePlayerId] = useState<string>('');

  const clubMap = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  if (!player) return null;

  const club = explicitClub ?? clubMap.get(player.clubId);
  const shirtNumber = getPlayerShirtNumber(player);
  const radarStats = computeRadarStats(player);

  const comparePlayer = comparePlayerId
    ? allPlayers.find((p) => p.id === comparePlayerId) ?? null
    : null;
  const compareRadar = comparePlayer ? computeRadarStats(comparePlayer) : null;

  const attrColor = (val: number) =>
    val >= 82
      ? 'text-pitch-400 font-black'
      : val >= 70
        ? 'text-gold-400 font-bold'
        : 'text-slate-300 font-medium';

  return (
    <div
      data-testid="player-profile-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto"
    >
      <div className="max-w-5xl w-full bg-navy-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl my-auto">
        {/* Top Hero Banner */}
        <div
          className="p-6 relative border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{
            background: `linear-gradient(135deg, ${club?.primaryColor ?? '#065f46'}33 0%, #0b0f19 75%)`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-navy-950/80 hover:bg-navy-800 text-slate-300"
            aria-label="Close Player Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <PlayerAvatar
                player={player}
                clubColor={club?.primaryColor}
                secondaryColor={club?.secondaryColor}
                size={84}
                className="border-2 border-gold-400 shadow-xl"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-gold-500 text-navy-950 font-black text-xs shadow">
                #{shirtNumber}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-pitch-600 text-white text-xs font-black">
                  {player.primaryPosition}
                </span>
                {player.secondaryPositions.map((sp) => (
                  <span
                    key={sp}
                    className="px-2 py-0.5 rounded bg-navy-800 text-slate-300 text-[11px] font-bold"
                  >
                    {sp}
                  </span>
                ))}
                <span className="text-xs text-slate-400 font-semibold">
                  {player.nationality} &bull; Age {player.age}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {player.firstName} {player.lastName}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1 font-bold text-white">
                  <Shield className="w-3.5 h-3.5 text-pitch-400" />
                  {club?.name ?? 'Free Agent'}
                </span>
                <span>&bull;</span>
                <span>Value: <strong className="text-pitch-400">£{(player.marketValue / 1000000).toFixed(2)}M</strong></span>
                <span>&bull;</span>
                <span>Wage: <strong className="text-gold-400">£{player.weeklyWage.toLocaleString()}/wk</strong></span>
                <span>&bull;</span>
                <span>Contract Until: <strong>{player.contractEndSeason}</strong></span>
              </div>
            </div>
          </div>

          {/* OVR & POT Badges */}
          <div className="flex items-center gap-3 pr-8">
            <div className="px-4 py-2.5 rounded-2xl bg-navy-950 border border-gold-500/40 text-center">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Overall</div>
              <div className="text-2xl font-black text-gold-400">{player.overall}</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-navy-950 border border-pitch-500/40 text-center">
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Potential</div>
              <div className="text-2xl font-black text-pitch-400">{player.potential}</div>
            </div>
            {onActionClick && actionLabel && (
              <button
                type="button"
                onClick={() => onActionClick(player)}
                className="px-4 py-3 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg"
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>

        {/* Status Bar: Fitness, Morale, Form, Season Stats */}
        <div className="bg-navy-950 px-6 py-3 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Fitness</span>
            <span className="font-extrabold text-pitch-400">{player.fitness}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Morale</span>
            <span className="font-extrabold text-white">{player.morale}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Form Rating</span>
            <span className="font-extrabold text-gold-400">{player.form.toFixed(1)} / 10</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Appearances</span>
            <span className="font-extrabold text-white">{player.stats.appearances}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Goals / Assists</span>
            <span className="font-extrabold text-white">
              {player.stats.goals}G / {player.stats.assists}A
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Squad Role</span>
            <span className="font-extrabold uppercase text-pitch-400">{player.roleExpectation}</span>
          </div>
        </div>

        {/* Main Body: Radar & Comparison + Full 24 Attributes */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[65vh] overflow-y-auto">
          {/* Left: Radar Chart & Player Comparison */}
          <div className="lg:col-span-5 bg-navy-950 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase tracking-wider text-pitch-400 flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>Attribute Radar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-gold-400" />
                <select
                  aria-label="Compare with player"
                  value={comparePlayerId}
                  onChange={(e) => setComparePlayerId(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-navy-900 border border-slate-700 text-[11px] text-white font-bold max-w-[160px]"
                >
                  <option value="">Compare Player...</option>
                  {allPlayers
                    .filter((p) => p.id !== player.id && !p.isYouth)
                    .slice(0, 60)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.overall} {p.primaryPosition})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <HexRadarChart primaryStats={radarStats} compareStats={compareRadar} />

            {comparePlayer && (
              <div className="p-3 rounded-xl bg-navy-900 border border-gold-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase text-gold-400 font-bold block">
                    Comparing Against
                  </span>
                  <strong className="text-white">
                    {comparePlayer.firstName} {comparePlayer.lastName} ({comparePlayer.overall} OVR)
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => setComparePlayerId('')}
                  className="text-slate-400 hover:text-white text-[11px] underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Right: Technical, Physical, Mental & GK Attributes */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Technical */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-pitch-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Technical</span>
              </div>
              {(
                [
                  ['Passing', player.attributes.passing, comparePlayer?.attributes.passing],
                  ['Shooting', player.attributes.shooting, comparePlayer?.attributes.shooting],
                  ['Finishing', player.attributes.finishing, comparePlayer?.attributes.finishing],
                  ['Dribbling', player.attributes.dribbling, comparePlayer?.attributes.dribbling],
                  ['Crossing', player.attributes.crossing, comparePlayer?.attributes.crossing],
                  ['Tackling', player.attributes.tackling, comparePlayer?.attributes.tackling],
                  ['First Touch', player.attributes.firstTouch, comparePlayer?.attributes.firstTouch],
                  ['Heading', player.attributes.heading, comparePlayer?.attributes.heading],
                ] as const
              ).map(([label, val, cmp]) => (
                <div key={label} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={attrColor(val)}>{val}</span>
                    {typeof cmp === 'number' && (
                      <span className="text-[10px] text-amber-400 font-bold">({cmp})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Physical */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-gold-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Physical &amp; GK</span>
              </div>
              {(
                [
                  ['Pace', player.attributes.pace, comparePlayer?.attributes.pace],
                  ['Acceleration', player.attributes.acceleration, comparePlayer?.attributes.acceleration],
                  ['Strength', player.attributes.strength, comparePlayer?.attributes.strength],
                  ['Stamina', player.attributes.stamina, comparePlayer?.attributes.stamina],
                  ['Jumping', player.attributes.jumping, comparePlayer?.attributes.jumping],
                  ['Agility', player.attributes.agility, comparePlayer?.attributes.agility],
                  ['GK Reflexes', player.attributes.reflexes, comparePlayer?.attributes.reflexes],
                  ['GK Handling', player.attributes.handling, comparePlayer?.attributes.handling],
                ] as const
              ).map(([label, val, cmp]) => (
                <div key={label} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={attrColor(val)}>{val}</span>
                    {typeof cmp === 'number' && (
                      <span className="text-[10px] text-amber-400 font-bold">({cmp})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mental */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1.5">
                Mental
              </div>
              {(
                [
                  ['Vision', player.attributes.vision, comparePlayer?.attributes.vision],
                  ['Positioning', player.attributes.positioning, comparePlayer?.attributes.positioning],
                  ['Decisions', player.attributes.decisions, comparePlayer?.attributes.decisions],
                  ['Composure', player.attributes.composure, comparePlayer?.attributes.composure],
                  ['Leadership', player.attributes.leadership, comparePlayer?.attributes.leadership],
                  ['Work Rate', player.attributes.workRate, comparePlayer?.attributes.workRate],
                  ['Aggression', player.attributes.aggression, comparePlayer?.attributes.aggression],
                  ['Distribution', player.attributes.distribution, comparePlayer?.attributes.distribution],
                ] as const
              ).map(([label, val, cmp]) => (
                <div key={label} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={attrColor(val)}>{val}</span>
                    {typeof cmp === 'number' && (
                      <span className="text-[10px] text-amber-400 font-bold">({cmp})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
