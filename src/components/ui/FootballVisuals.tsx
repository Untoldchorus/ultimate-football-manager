import React from 'react';
import { Club, Player } from '@/engine/types';
import { hashStringToSeed } from '@/engine/rng';

const SKIN_TONES = ['#f8d5c2', '#e8b89a', '#d2996c', '#a86e44', '#6b3e26', '#4a2918'];
const HAIR_COLORS = ['#111827', '#292524', '#451a03', '#78350f', '#b45309', '#d97706', '#e5e7eb'];

/**
 * Generates a deterministic shirt number (1..99) for a player based on position and ID.
 */
export function getPlayerShirtNumber(player: Player, indexHint?: number): number {
  if (typeof indexHint === 'number' && indexHint >= 0 && indexHint < 11) {
    const classicNumbers = [1, 3, 4, 5, 2, 6, 8, 10, 11, 9, 7];
    return classicNumbers[indexHint] ?? indexHint + 1;
  }
  const seed = hashStringToSeed(player.id);
  if (player.primaryPosition === 'GK') return (seed % 3 === 0 ? 1 : seed % 2 === 0 ? 13 : 25);
  if (player.primaryPosition === 'ST') return [9, 10, 18, 19, 27][seed % 5];
  if (player.primaryPosition === 'LW' || player.primaryPosition === 'RW') return [7, 11, 14, 17, 20, 21][seed % 6];
  if (player.primaryPosition === 'CAM' || player.primaryPosition === 'CM') return [8, 10, 15, 16, 22, 23][seed % 6];
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
 * Original SVG Football Player Avatar Portrait.
 * Deterministically renders skin tone, hairstyle, facial structure, and club kit jersey.
 */
export function PlayerAvatar({
  player,
  club,
  clubColor,
  secondaryColor,
  size = 48,
  className = '',
}: {
  player: Player;
  club?: Pick<Club, 'primaryColor' | 'secondaryColor'>;
  clubColor?: string;
  secondaryColor?: string;
  size?: number;
  className?: string;
}) {
  const resolvedPrimary = clubColor ?? club?.primaryColor ?? '#10b981';
  const resolvedSecondary = secondaryColor ?? club?.secondaryColor ?? '#ffffff';
  const seed = hashStringToSeed(`${player.id}-${player.firstName}-${player.lastName}`);
  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const hair = HAIR_COLORS[(seed >>> 3) % HAIR_COLORS.length];
  const hairStyle = (seed >>> 6) % 4;
  const hasBeard = player.age >= 21 && ((seed >>> 9) % 3 === 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`rounded-xl overflow-hidden shrink-0 select-none ${className}`}
      aria-label={`${player.firstName} ${player.lastName} portrait`}
    >
      <defs>
        <linearGradient id={`bg-${player.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="100" height="100" fill={`url(#bg-${player.id})`} />
      <circle cx="50" cy="50" r="44" fill={resolvedPrimary} opacity="0.16" />

      {/* Shoulders / Football Kit */}
      <path d="M16 100 C18 74, 82 74, 84 100 Z" fill={resolvedPrimary} />
      <path d="M34 78 L50 93 L66 78" fill="none" stroke={resolvedSecondary} strokeWidth="4" />

      {/* Neck */}
      <rect x="42" y="60" width="16" height="18" rx="6" fill={skin} />

      {/* Head */}
      <ellipse cx="50" cy="44" rx="20" ry="23" fill={skin} />

      {/* Ears */}
      <circle cx="29" cy="45" r="4" fill={skin} />
      <circle cx="71" cy="45" r="4" fill={skin} />

      {/* Eyes & Brows */}
      <circle cx="42" cy="43" r="2.2" fill="#0f172a" />
      <circle cx="58" cy="43" r="2.2" fill="#0f172a" />
      <path d="M37 38 Q42 36 46 38" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M54 38 Q58 36 63 38" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* Nose & Smile */}
      <path d="M50 43 L48 50 L52 50" stroke="#00000033" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M44 56 Q50 60 56 56" stroke="#451a03" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Beard (optional) */}
      {hasBeard && (
        <path
          d="M32 49 Q34 67 50 68 Q66 67 68 49 Q64 59 50 60 Q36 59 32 49 Z"
          fill={hair}
          opacity="0.75"
        />
      )}

      {/* Hairstyles */}
      {hairStyle === 0 && (
        <path d="M29 38 C29 18, 71 18, 71 38 C66 28, 34 28, 29 38 Z" fill={hair} />
      )}
      {hairStyle === 1 && (
        <path d="M28 40 C26 15, 74 15, 72 40 C65 25, 35 25, 28 40 Z" fill={hair} />
      )}
      {hairStyle === 2 && (
        <g fill={hair}>
          <path d="M30 35 C32 16, 68 16, 70 35 Z" />
          <circle cx="50" cy="20" r="8" />
        </g>
      )}
      {hairStyle === 3 && (
        <path d="M31 33 Q50 18 69 33 Q60 25 50 25 Q40 25 31 33 Z" fill={hair} />
      )}
    </svg>
  );
}

/**
 * Original SVG Heraldic Club Crest Badge.
 */
export function ClubCrest({
  club,
  size = 48,
  className = '',
}: {
  club: Pick<Club, 'id' | 'shortName' | 'primaryColor' | 'secondaryColor' | 'division'>;
  size?: number;
  className?: string;
}) {
  const seed = hashStringToSeed(club.id);
  const pattern = seed % 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`shrink-0 select-none drop-shadow ${className}`}
      aria-label={`${club.shortName} crest`}
    >
      {/* Outer Gold/Metallic Shield */}
      <path
        d="M50 4 L90 18 L90 52 C90 77 50 96 50 96 C50 96 10 77 10 52 L10 18 Z"
        fill="#f59e0b"
      />
      {/* Inner Club Primary Shield */}
      <path
        d="M50 9 L85 21 L85 51 C85 73 50 90 50 90 C50 90 15 73 15 51 L15 21 Z"
        fill={club.primaryColor}
      />

      {/* Pattern Overlay */}
      {pattern === 0 && (
        <path
          d="M50 9 L85 21 L85 51 C85 73 50 90 50 90 Z"
          fill={club.secondaryColor}
          opacity="0.22"
        />
      )}
      {pattern === 1 && (
        <g fill={club.secondaryColor} opacity="0.22">
          <rect x="32" y="12" width="10" height="72" />
          <rect x="58" y="12" width="10" height="72" />
        </g>
      )}
      {pattern === 2 && (
        <path d="M18 35 L82 35 L82 52 L18 52 Z" fill={club.secondaryColor} opacity="0.25" />
      )}

      {/* Crown Star for Division 1 */}
      {club.division === 1 && (
        <polygon
          points="50,15 52.5,21 59,21 53.8,25 55.8,31 50,27.2 44.2,31 46.2,25 41,21 47.5,21"
          fill="#fbbf24"
        />
      )}

      {/* Club Short Name Banner */}
      <rect x="16" y="42" width="68" height="22" rx="4" fill="#070a12" opacity="0.82" />
      <text
        x="50"
        y="57"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="16"
        fontWeight="900"
        letterSpacing="1.5"
      >
        {club.shortName}
      </text>
    </svg>
  );
}
