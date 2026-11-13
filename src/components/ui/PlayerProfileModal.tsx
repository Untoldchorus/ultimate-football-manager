'use client';

import React, { useMemo, useState } from 'react';
import {
  X,
  GitCompare,
  Shield,
  TrendingUp,
  Activity,
  Award,
  Globe,
  History,
  FileSignature,
  CheckCircle2,
} from 'lucide-react';
import { Club, Player } from '@/engine/types';
import { getPlayerPhotoManifest } from '@/data/assetManifest';
import { buildStablePlayerImageId } from '@/data/playerImageDatabase';
import { ClubCrest, computeRadarStats, getPlayerShirtNumber, PlayerAvatar } from './FootballVisuals';

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

      {comparePolygon && (
        <polygon
          points={comparePolygon}
          fill={compareColor}
          fillOpacity="0.25"
          stroke={compareColor}
          strokeWidth="2.5"
        />
      )}

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
  const stableId = buildStablePlayerImageId(
    player.clubId,
    player.shirtNumber ?? 0,
    player.firstName,
    player.lastName
  );
  const photoMeta = getPlayerPhotoManifest(player.firstName, player.lastName, stableId);

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

  const a = player.attributes;
  const ca = comparePlayer?.attributes;

  return (
    <div
      data-testid="player-profile-modal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto"
    >
      <div className="max-w-6xl w-full bg-navy-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl my-auto">
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
                size={116}
                showBadge
                className="border-2 border-gold-400 shadow-xl"
              />
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-lg bg-gold-500 text-navy-950 font-black text-xs shadow">
                #{shirtNumber}
              </span>
            </div>

            <div className="space-y-1.5">
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
                <span className="text-xs text-slate-300 font-semibold">
                  {player.nationality} &bull; Age {player.age} ({player.dateOfBirth ?? '1999-05-14'})
                </span>
                <span className="text-xs text-slate-400">
                  &bull; {player.heightCm ?? 181} cm &bull; {player.preferredFoot ?? 'Right'} Foot
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {player.firstName} {player.lastName}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  {club ? <ClubCrest club={club} size={20} /> : <Shield className="w-3.5 h-3.5 text-pitch-400" />}
                  <span>{club?.name ?? 'Free Agent'}</span>
                </span>
                <span>&bull;</span>
                <span>
                  Market Value: <strong className="text-pitch-400">£{(player.marketValue / 1000000).toFixed(2)}M</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Release Clause:{' '}
                  <strong className="text-sky-400">
                    £{((player.releaseClause ?? player.marketValue * 1.45) / 1000000).toFixed(2)}M
                  </strong>
                </span>
                <span>&bull;</span>
                <span>
                  Wage: <strong className="text-gold-400">£{player.weeklyWage.toLocaleString()}/wk</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Contract Until: <strong>{player.contractEndSeason}</strong>
                </span>
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

        {/* Status Bar: Fitness, Morale, Form, Season Stats, International Caps */}
        <div className="bg-navy-950 px-6 py-3 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-7 gap-3 text-xs">
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
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Season Apps</span>
            <span className="font-extrabold text-white">{player.stats.appearances}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Goals / Assists</span>
            <span className="font-extrabold text-white">
              {player.stats.goals}G / {player.stats.assists}A
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Intl Caps / Goals</span>
            <span className="font-extrabold text-sky-400">
              {player.internationalApps ?? 0} Caps / {player.internationalGoals ?? 0}G
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Squad Role</span>
            <span className="font-extrabold uppercase text-pitch-400">{player.roleExpectation}</span>
          </div>
        </div>

        {/* Main Body: Radar & Career History + Full 31 Attributes across 4 Categories */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[65vh] overflow-y-auto">
          {/* Left: Radar Chart, Comparison & Career History */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-4 space-y-3">
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
                    className="px-2 py-1 rounded-lg bg-navy-900 border border-slate-700 text-[11px] text-white font-bold max-w-[145px]"
                  >
                    <option value="">Compare Player...</option>
                    {allPlayers
                      .filter((p) => p.id !== player.id && !p.isYouth)
                      .slice(0, 80)
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
                <div className="p-2.5 rounded-xl bg-navy-900 border border-gold-500/30 flex items-center justify-between text-xs">
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

            {/* Career History & Image Attribution Box */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Career Statistics &amp; Bio</span>
              </div>
              {player.careerHistory && player.careerHistory.length > 0 ? (
                <div className="space-y-1.5">
                  {player.careerHistory.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1 border-b border-slate-800/60 text-[11px]"
                    >
                      <span className="text-slate-300 font-semibold">
                        {h.season} &bull; {h.clubName}
                      </span>
                      <span className="text-white font-bold">
                        {h.appearances} Apps &bull; {h.goals}G &bull; {h.assists}A
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-[11px]">Debut senior campaign recorded.</div>
              )}

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FileSignature className="w-3 h-3 text-pitch-400" />
                  Agent Fee: <strong>{player.agentFeePct ?? 8}%</strong>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-sky-400" />
                  {photoMeta
                    ? `Photo: ${photoMeta.license}`
                    : 'Photo: Missing (Pending Acquisition)'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Complete 31-Attribute Breakdown (Technical 10, Mental 8, Physical 7, GK 6) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Technical (10) */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-pitch-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Technical (10)</span>
              </div>
              {(
                [
                  ['Finishing', a.finishing, ca?.finishing],
                  ['Passing', a.passing, ca?.passing],
                  ['Crossing', a.crossing, ca?.crossing],
                  ['Dribbling', a.dribbling, ca?.dribbling],
                  ['Ball Control', a.ballControl ?? a.firstTouch, ca?.ballControl],
                  ['First Touch', a.firstTouch, ca?.firstTouch],
                  ['Tackling', a.tackling, ca?.tackling],
                  ['Marking', a.marking ?? a.tackling, ca?.marking],
                  ['Heading', a.heading, ca?.heading],
                  ['Long Shots', a.longShots ?? a.shooting, ca?.longShots],
                  ['Free Kicks', a.freeKicks ?? a.passing, ca?.freeKicks],
                  ['Penalties', a.penalties ?? a.finishing, ca?.penalties],
                ] as const
              ).map(([label, val, cmp]) => (
                <div key={label} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={attrColor(val)}>{val}</span>
                    {typeof cmp === 'number' && (
                      <span className="text-[10px] text-amber-400 font-bold">({cmp})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mental (8) */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-sky-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Mental (8)</span>
              </div>
              {(
                [
                  ['Decisions', a.decisions, ca?.decisions],
                  ['Vision', a.vision, ca?.vision],
                  ['Positioning', a.positioning, ca?.positioning],
                  ['Anticipation', a.anticipation ?? a.positioning, ca?.anticipation],
                  ['Composure', a.composure, ca?.composure],
                  ['Leadership', a.leadership, ca?.leadership],
                  ['Aggression', a.aggression, ca?.aggression],
                  ['Work Rate', a.workRate, ca?.workRate],
                ] as const
              ).map(([label, val, cmp]) => (
                <div key={label} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={attrColor(val)}>{val}</span>
                    {typeof cmp === 'number' && (
                      <span className="text-[10px] text-amber-400 font-bold">({cmp})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Physical (7) */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-gold-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Physical (7)</span>
              </div>
              {(
                [
                  ['Pace', a.pace, ca?.pace],
                  ['Acceleration', a.acceleration, ca?.acceleration],
                  ['Strength', a.strength, ca?.strength],
                  ['Stamina', a.stamina, ca?.stamina],
                  ['Jumping', a.jumping, ca?.jumping],
                  ['Balance', a.balance ?? a.agility, ca?.balance],
                  ['Agility', a.agility, ca?.agility],
                ] as const
              ).map(([label, val, cmp]) => (
                <div key={label} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={attrColor(val)}>{val}</span>
                    {typeof cmp === 'number' && (
                      <span className="text-[10px] text-amber-400 font-bold">({cmp})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Goalkeeping (6) */}
            <div className="bg-navy-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Goalkeeping (6)</span>
              </div>
              {(
                [
                  ['Reflexes', a.reflexes, ca?.reflexes],
                  ['Handling', a.handling, ca?.handling],
                  ['GK Positioning', a.gkPositioning ?? a.positioning, ca?.gkPositioning],
                  ['Diving', a.diving ?? a.reflexes, ca?.diving],
                  ['Distribution', a.distribution, ca?.distribution],
                  ['Aerial Ability', a.aerialAbility ?? a.jumping, ca?.aerialAbility],
                ] as const
              ).map(([label, val, cmp]) => (
                <div key={label} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <div className="flex items-center gap-1.5">
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
