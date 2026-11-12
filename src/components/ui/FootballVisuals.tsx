'use client';

import React, { useState } from 'react';
import { Club, Player } from '@/engine/types';
import { hashStringToSeed } from '@/engine/rng';
import { getPlayerPhotoManifest } from '@/data/assetManifest';
import { REAL_WORLD_CLUBS } from '@/data/realWorldDatabase';

const SKIN_TONES = ['#f8d5c2', '#e8b89a', '#d2996c', '#a86e44', '#6b3e26', '#4a2918'];
const HAIR_COLORS = ['#111827', '#292524', '#451a03', '#78350f', '#b45309', '#d97706', '#e5e7eb'];

/**
 * Returns the player's official squad shirt number if assigned, or generates a deterministic shirt number (1..99).
 */
export function getPlayerShirtNumber(player: Player, indexHint?: number): number {
  if (typeof player.shirtNumber === 'number' && player.shirtNumber > 0) {
    return player.shirtNumber;
  }
  if (typeof indexHint === 'number' && indexHint >= 0 && indexHint < 11) {
    const classicNumbers = [1, 3, 4, 5, 2, 6, 8, 10, 11, 9, 7];
    return classicNumbers[indexHint] ?? indexHint + 1;
  }
  const seed = hashStringToSeed(player.id);
  if (player.primaryPosition === 'GK') return seed % 3 === 0 ? 1 : seed % 2 === 0 ? 13 : 25;
  if (player.primaryPosition === 'ST') return [9, 10, 18, 19, 27][seed % 5];
  if (player.primaryPosition === 'LW' || player.primaryPosition === 'RW')
    return [7, 11, 14, 17, 20, 21][seed % 6];
  if (player.primaryPosition === 'CAM' || player.primaryPosition === 'CM')
    return [8, 10, 15, 16, 22, 23][seed % 6];
  if (player.primaryPosition === 'CDM') return [6, 12, 16, 24, 28][seed % 5];
  return [2, 3, 4, 5, 12, 15, 26, 29][seed % 8];
}

/**
 * Computes the 6 key radar macro-attributes (PAC, SHO, PAS, DRI, DEF, PHY) for a player.
 */
export function computeRadarStats(player: Player): {
  PAC: number;
  SHO: number;
  PAS: number;
  DRI: number;
  DEF: number;
  PHY: number;
} {
  const a = player.attributes;
  if (player.primaryPosition === 'GK') {
    return {
      PAC: a.reflexes,
      SHO: a.handling,
      PAS: a.distribution,
      DRI: a.agility,
      DEF: a.positioning,
      PHY: a.jumping,
    };
  }
  return {
    PAC: Math.round((a.pace + a.acceleration) / 2),
    SHO: Math.round((a.shooting + a.finishing + a.composure) / 3),
    PAS: Math.round((a.passing + a.vision + a.crossing) / 3),
    DRI: Math.round((a.dribbling + a.firstTouch + a.agility) / 3),
    DEF: Math.round((a.tackling + a.positioning + a.heading) / 3),
    PHY: Math.round((a.strength + a.stamina + a.workRate) / 3),
  };
}

/**
 * Reusable Player Portrait & Realistic Footballer Avatar Component:
 * 1. Displays open-licensed verified player photograph when available (`photoUrl` / `VERIFIED_PLAYER_PHOTOS`)
 *    with lazy loading, skeleton state, consistent cropping, and error fallback.
 * 2. Falls back to a realistic generated footballer portrait (reflecting position/kit/appearance)
 *    and clearly labels generated portraits when `showBadge` is enabled (e.g., on profile cards).
 */
export function PlayerAvatar({
  player,
  club,
  clubColor,
  secondaryColor,
  size = 48,
  className = '',
  showBadge = false,
}: {
  player: Player;
  club?: Pick<Club, 'primaryColor' | 'secondaryColor'>;
  clubColor?: string;
  secondaryColor?: string;
  size?: number;
  className?: string;
  showBadge?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const photoMeta = getPlayerPhotoManifest(player.firstName, player.lastName);
  const resolvedPhotoUrl = player.photoUrl ?? photoMeta?.url;

  const isGK = player.primaryPosition === 'GK';
  const resolvedPrimary =
    clubColor ?? (isGK ? '#f59e0b' : club?.primaryColor ?? '#10b981');
  const resolvedSecondary = secondaryColor ?? club?.secondaryColor ?? '#ffffff';

  const seed = hashStringToSeed(`${player.id}-${player.firstName}-${player.lastName}`);
  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const hair = HAIR_COLORS[(seed >>> 3) % HAIR_COLORS.length];
  const hairStyle = (seed >>> 6) % 5;
  const hasBeard = player.age >= 21 && (seed >>> 9) % 3 === 0;

  const useRealPhoto = Boolean(resolvedPhotoUrl && !imgError);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-xl overflow-hidden shrink-0 select-none bg-navy-950 ${className}`}
      title={
        useRealPhoto && photoMeta
          ? `${player.firstName} ${player.lastName} • Licensed Photo (${photoMeta.license}, ${photoMeta.attribution})`
          : `${player.firstName} ${player.lastName} • Generated Footballer Portrait`
      }
    >
      {useRealPhoto && (
        <img
          src={resolvedPhotoUrl}
          alt={`${player.firstName} ${player.lastName} photograph`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover object-top transition-opacity duration-200 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {(!useRealPhoto || !imgLoaded) && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="w-full h-full block"
          aria-label={`${player.firstName} ${player.lastName} portrait`}
        >
          <defs>
            <linearGradient id={`bg-${player.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          {/* Studio Portrait Backdrop */}
          <rect width="100" height="100" fill={`url(#bg-${player.id})`} />
          <circle cx="50" cy="48" r="42" fill={resolvedPrimary} opacity="0.18" />

          {/* Athletic Shoulders & Authentic Football Kit Collar */}
          <path d="M14 100 C17 72, 83 72, 86 100 Z" fill={resolvedPrimary} />
          <path d="M26 82 L26 100 M74 82 L74 100" stroke={resolvedSecondary} strokeWidth="3.5" opacity="0.55" />
          <path d="M34 77 L50 92 L66 77" fill="none" stroke={resolvedSecondary} strokeWidth="4" />

          {/* Neck & Shading */}
          <rect x="42" y="59" width="16" height="19" rx="6" fill={skin} />
          <path d="M42 64 Q50 69 58 64" fill="none" stroke="#00000028" strokeWidth="2.5" />

          {/* Proportional Head & Jawline */}
          <path
            d="M30 40 C30 22, 70 22, 70 40 C70 55, 61 66, 50 66 C39 66, 30 55, 30 40 Z"
            fill={skin}
          />

          {/* Ears */}
          <circle cx="29" cy="44" r="3.8" fill={skin} />
          <circle cx="71" cy="44" r="3.8" fill={skin} />

          {/* Eyes, Pupils & Brows */}
          <ellipse cx="41.5" cy="42.5" rx="2.6" ry="2.1" fill="#ffffff" />
          <ellipse cx="58.5" cy="42.5" rx="2.6" ry="2.1" fill="#ffffff" />
          <circle cx="41.5" cy="42.5" r="1.5" fill="#0f172a" />
          <circle cx="58.5" cy="42.5" r="1.5" fill="#0f172a" />
          <path d="M36 37.5 Q41.5 35.5 46 37.5" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M54 37.5 Q58.5 35.5 64 37.5" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />

          {/* Nose & Expression */}
          <path d="M50 41 L48.2 49.5 L52 49.5" stroke="#00000038" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M44 55.5 Q50 59 56 55.5" stroke="#451a03" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Beard / Stubble */}
          {hasBeard && (
            <path
              d="M31.5 48 Q34 65.5 50 66.5 Q66 65.5 68.5 48 Q64 58 50 59 Q36 58 31.5 48 Z"
              fill={hair}
              opacity="0.72"
            />
          )}

          {/* Varied Footballer Hairstyles */}
          {hairStyle === 0 && (
            <path d="M29 38 C29 17, 71 17, 71 38 C66 27, 34 27, 29 38 Z" fill={hair} />
          )}
          {hairStyle === 1 && (
            <path d="M28 40 C26 14, 74 14, 72 40 C65 24, 35 24, 28 40 Z" fill={hair} />
          )}
          {hairStyle === 2 && (
            <g fill={hair}>
              <path d="M30 35 C32 16, 68 16, 70 35 Z" />
              <circle cx="50" cy="19" r="7.5" />
            </g>
          )}
          {hairStyle === 3 && (
            <path d="M31 33 Q50 17 69 33 Q60 24 50 24 Q40 24 31 33 Z" fill={hair} />
          )}
          {hairStyle === 4 && (
            <path d="M29 36 C31 15, 69 15, 71 36 C67 22, 33 22, 29 36 Z" fill={hair} />
          )}
        </svg>
      )}

      {showBadge && (
        <span
          className={`absolute bottom-0.5 left-0.5 right-0.5 text-center py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
            useRealPhoto
              ? 'bg-pitch-600/90 text-white'
              : 'bg-navy-950/90 text-slate-300 border border-slate-700/80'
          }`}
        >
          {useRealPhoto ? 'Verified Photo' : 'Generated Portrait'}
        </span>
      )}
    </div>
  );
}

/**
 * Authentic Club Crest & Heraldic Emblem Renderer.
 * Preserves aspect ratio, never stretches badges, and uses club-specific heraldry
 * (`crestStyle`, official club colours, founding year, and shortName).
 */
export function ClubCrest({
  club,
  size = 48,
  className = '',
}: {
  club: Pick<Club, 'id' | 'shortName' | 'primaryColor' | 'secondaryColor' | 'division'> & {
    foundedYear?: number;
  };
  size?: number;
  className?: string;
}) {
  const seedClub = REAL_WORLD_CLUBS.find((c) => c.id === club.id);
  const style = seedClub?.crestStyle ?? 'shield-stripes';
  const founded = club.foundedYear ?? seedClub?.foundedYear;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className={`shrink-0 select-none drop-shadow ${className}`}
      aria-label={`${club.shortName} crest`}
    >
      {style === 'royal-circle' ? (
        <>
          <circle cx="50" cy="50" r="45" fill="#f59e0b" />
          <circle cx="50" cy="50" r="41" fill={club.primaryColor} />
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="none"
            stroke={club.secondaryColor}
            strokeWidth="3.5"
            opacity="0.85"
          />
          <path
            d="M25 50 L75 50"
            stroke={club.secondaryColor}
            strokeWidth="12"
            opacity="0.25"
          />
        </>
      ) : style === 'cannon-crest' ? (
        <>
          <path
            d="M50 4 L90 16 L86 58 C84 78 50 96 50 96 C50 96 16 78 14 58 L10 16 Z"
            fill="#d4af37"
          />
          <path
            d="M50 9 L85 19 L81 56 C79 74 50 90 50 90 C50 90 21 74 19 56 L15 19 Z"
            fill={club.primaryColor}
          />
          <path
            d="M19 19 L30 19 L30 78 L19 66 Z M70 19 L81 19 L81 66 L70 78 Z"
            fill={club.secondaryColor}
            opacity="0.9"
          />
        </>
      ) : style === 'diamond-crown' ? (
        <>
          <polygon points="50,3 63,13 37,13" fill="#fbbf24" />
          <circle cx="50" cy="53" r="41" fill="#fbbf24" />
          <circle cx="50" cy="53" r="37" fill="#ffffff" />
          <path d="M22 36 L78 68" stroke={club.secondaryColor} strokeWidth="9" />
          <circle cx="50" cy="53" r="37" fill="none" stroke={club.primaryColor} strokeWidth="4" />
        </>
      ) : (
        <>
          {/* Classic Heraldic Shield with Stripes */}
          <path
            d="M50 4 L90 18 L90 52 C90 77 50 96 50 96 C50 96 10 77 10 52 L10 18 Z"
            fill="#f59e0b"
          />
          <path
            d="M50 9 L85 21 L85 51 C85 73 50 90 50 90 C50 90 15 73 15 51 L15 21 Z"
            fill={club.primaryColor}
          />
          <g fill={club.secondaryColor} opacity="0.28">
            <rect x="29" y="13" width="11" height="71" />
            <rect x="60" y="13" width="11" height="71" />
          </g>
        </>
      )}

      {/* Crown Star for Tier 1 Elite */}
      {club.division === 1 && (
        <polygon
          points="50,14 52.5,20 59,20 53.8,24 55.8,30 50,26.2 44.2,30 46.2,24 41,20 47.5,20"
          fill="#fbbf24"
        />
      )}

      {/* Club Short Name Banner */}
      <rect x="16" y="41" width="68" height="22" rx="4" fill="#070a12" opacity="0.88" />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="15.5"
        fontWeight="900"
        letterSpacing="1.5"
      >
        {club.shortName}
      </text>

      {/* Founding Year Sub-label */}
      {founded && (
        <text
          x="50"
          y="76"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="9.5"
          fontWeight="800"
          opacity="0.9"
        >
          {founded}
        </text>
      )}
    </svg>
  );
}
