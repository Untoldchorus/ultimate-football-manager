'use client';

import React, { useState } from 'react';
import { Club, Player } from '@/engine/types';
import { hashStringToSeed } from '@/engine/rng';
import { getPlayerPhotoManifest } from '@/data/assetManifest';
import { buildStablePlayerImageId, markPlayerImageBroken } from '@/data/playerImageDatabase';
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

  const stableId = buildStablePlayerImageId(
    player.clubId,
    player.shirtNumber ?? 0,
    player.firstName,
    player.lastName
  );
  const photoMeta = getPlayerPhotoManifest(player.firstName, player.lastName, stableId);
  const resolvedPhotoUrl = player.photoUrl ?? photoMeta?.url;

  const isGK = player.primaryPosition === 'GK';
  const resolvedPrimary =
    clubColor ?? (isGK ? '#f59e0b' : club?.primaryColor ?? '#10b981');

  const initials = `${player.firstName?.[0] ?? ''}${player.lastName?.[0] ?? ''}`.toUpperCase();
  const shirtNum = getPlayerShirtNumber(player);

  const useRealPhoto = Boolean(resolvedPhotoUrl && !imgError);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-xl overflow-hidden shrink-0 select-none bg-navy-950 border border-slate-800/80 ${className}`}
      title={
        useRealPhoto && photoMeta
          ? `${player.firstName} ${player.lastName} • Verified Real Photo (${photoMeta.license}, ${photoMeta.attribution})`
          : `${player.firstName} ${player.lastName} • Real Photograph Missing (Pending Acquisition)`
      }
    >
      {useRealPhoto && (
        <img
          src={resolvedPhotoUrl}
          alt={`${player.firstName} ${player.lastName} photograph`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true);
            markPlayerImageBroken(stableId);
          }}
          className={`w-full h-full object-cover object-top transition-opacity duration-200 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {(!useRealPhoto || !imgLoaded) && (
        <div
          className="w-full h-full flex flex-col items-center justify-center text-center"
          style={{
            background: `linear-gradient(135deg, ${resolvedPrimary}33 0%, #090d16 80%)`,
          }}
          aria-label={`${player.firstName} ${player.lastName} photo missing`}
        >
          <span
            className="font-black tracking-tight text-white leading-none"
            style={{ fontSize: Math.max(11, Math.round(size * 0.34)) }}
          >
            {initials}
          </span>
          {size >= 40 && (
            <span
              className="font-bold text-slate-400 uppercase mt-0.5 leading-none"
              style={{ fontSize: Math.max(7, Math.round(size * 0.14)) }}
            >
              #{shirtNum}
            </span>
          )}
        </div>
      )}

      {showBadge && (
        <span
          className={`absolute bottom-0.5 left-0.5 right-0.5 text-center py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
            useRealPhoto
              ? 'bg-pitch-600/90 text-white'
              : 'bg-amber-950/90 text-amber-300 border border-amber-500/40'
          }`}
        >
          {useRealPhoto ? 'Verified Photo' : 'Photo Missing'}
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
