'use client';

import React from 'react';
import { Player } from '@/engine/types';
import { hashStringToSeed } from '@/engine/rng';
import { getPlayerShirtNumber } from './FootballVisuals';

// 8 Realistic Skin Tones from Scandinavian Fair to Rich Ebony
const SKIN_TONES = [
  { tone: '#fde2d2', dark: '#d9a98e', highlight: '#fff3ea' }, // 0: Fair Nordic
  { tone: '#f5c6a5', dark: '#ca906e', highlight: '#fae0ce' }, // 1: Light Peach
  { tone: '#e6b08a', dark: '#b87c56', highlight: '#f0c7a9' }, // 2: Golden Tan
  { tone: '#d49467', dark: '#a3663a', highlight: '#e2ac84' }, // 3: Olive Mediterranean
  { tone: '#b97445', dark: '#884920', highlight: '#cb895d' }, // 4: Bronze Latino
  { tone: '#94552e', dark: '#693311', highlight: '#a96a42' }, // 5: Rich Caramel
  { tone: '#6d3919', dark: '#461f08', highlight: '#844b27' }, // 6: Deep Espresso
  { tone: '#44210e', dark: '#280f03', highlight: '#5d321b' }, // 7: Ebony African
];

// 8 Hair Colors
const HAIR_COLORS = [
  '#131418', // 0: Jet Black
  '#2a1a14', // 1: Dark Espresso
  '#4a291a', // 2: Chestnut Brown
  '#6e4327', // 3: Medium Brown
  '#9a6b3d', // 4: Dark Golden Blonde
  '#cb9d62', // 5: Honey Blonde
  '#9c4524', // 6: Auburn / Ginger
  '#7a8089', // 7: Salt & Pepper / Silver
];

// Eye Colors
const EYE_COLORS = [
  '#3d2314', // Dark Brown
  '#59371d', // Amber / Hazel
  '#274c35', // Deep Green
  '#2b4a68', // Slate Blue
];

/**
 * Derives authentic, culturally plausible appearance parameters deterministically from player data.
 */
export function getFootballerAppearance(player: Player) {
  const seedStr = `${player.id || ''}:${player.firstName || ''}:${player.lastName || ''}:${player.nationality || ''}`;
  const rawSeed = hashStringToSeed(seedStr);
  const seed = Math.abs(rawSeed);

  const nat = (player.nationality || '').toUpperCase();

  // Region Bias for Skin Tone
  let skinIdx = seed % SKIN_TONES.length;
  let hairIdx = Math.floor(seed / 8) % HAIR_COLORS.length;
  let eyeIdx = Math.floor(seed / 32) % EYE_COLORS.length;

  const isAfrican = [
    'NIGERIA', 'GHANA', 'SENEGAL', 'CAMEROON', 'IVORY COAST', 'MALI',
    'CONGO', 'ALGERIA', 'MOROCCO', 'EGYPT', 'SOUTH AFRICA', 'JAMAICA',
  ].some((c) => nat.includes(c));

  const isNordicOrNorthEuro = [
    'NORWAY', 'SWEDEN', 'DENMARK', 'FINLAND', 'ICELAND', 'GERMANY',
    'ENGLAND', 'SCOTLAND', 'IRELAND', 'NETHERLANDS', 'POLAND', 'CZECH',
  ].some((c) => nat.includes(c));

  const isLatinoOrMed = [
    'SPAIN', 'PORTUGAL', 'ITALY', 'ARGENTINA', 'BRAZIL', 'URUGUAY',
    'MEXICO', 'COLOMBIA', 'CHILE', 'FRANCE', 'GREECE', 'TURKEY',
  ].some((c) => nat.includes(c));

  const isEastAsian = ['JAPAN', 'SOUTH KOREA', 'CHINA'].some((c) => nat.includes(c));

  if (isAfrican) {
    // Bias toward tones 4..7 and jet black / dark brown hair
    skinIdx = [4, 5, 6, 6, 7, 7, 5][seed % 7];
    hairIdx = [0, 0, 0, 1, 1, 6][Math.floor(seed / 4) % 6];
    eyeIdx = 0; // Dark brown
  } else if (isNordicOrNorthEuro) {
    // Bias toward tones 0..3 and blonde / brown / ginger hair
    skinIdx = [0, 0, 1, 1, 2, 2, 3][seed % 7];
    hairIdx = [0, 1, 2, 3, 4, 5, 6][Math.floor(seed / 4) % 7];
    eyeIdx = [0, 1, 2, 3][Math.floor(seed / 16) % 4];
  } else if (isLatinoOrMed) {
    // Bias toward tones 1..5 and dark hair
    skinIdx = [1, 2, 3, 3, 4, 4, 5][seed % 7];
    hairIdx = [0, 0, 1, 1, 2, 3][Math.floor(seed / 4) % 6];
    eyeIdx = [0, 0, 1, 2][Math.floor(seed / 16) % 4];
  } else if (isEastAsian) {
    skinIdx = [0, 1, 2][seed % 3];
    hairIdx = 0; // Jet Black
    eyeIdx = 0;
  }

  // Veteran Silver Hair Override
  if (player.age >= 34 && (seed % 10 < 3)) {
    hairIdx = 7; // Salt & Pepper
  }

  // Hair Style (12 styles)
  let hairStyle = Math.floor(seed / 128) % 12;
  if (isAfrican && (hairStyle === 3 || hairStyle === 5)) {
    hairStyle = [2, 6, 7, 8][seed % 4]; // Braids, Locs, Afro, Fade
  }

  // Facial Hair (age dependent)
  const hasFacialHair = player.age >= 23 && Math.floor(seed / 512) % 10 < (player.age >= 28 ? 7 : 4);
  const facialHairType = Math.floor(seed / 2048) % 4; // 0: Stubble, 1: Goatee, 2: Trimmed Beard, 3: Chinstrap

  // Athletic Accessories
  const hasHeadband = (hairStyle === 6 || hairStyle === 8 || hairStyle === 10) && Math.floor(seed / 8192) % 2 === 0;
  const hasEarStud = Math.floor(seed / 32768) % 8 === 0;

  return {
    skin: SKIN_TONES[skinIdx],
    hairColor: HAIR_COLORS[hairIdx],
    eyeColor: EYE_COLORS[eyeIdx],
    hairStyle,
    hasFacialHair,
    facialHairType,
    hasHeadband,
    hasEarStud,
  };
}

/**
 * High-definition vector procedural footballer avatar in SVG.
 * Produces crisp, beautiful, authentic player cards across any screen resolution.
 */
export function FootballerAvatarSvg({
  player,
  primaryColor = '#10b981',
  secondaryColor = '#ffffff',
  size = 48,
  className = '',
}: {
  player: Player;
  primaryColor?: string;
  secondaryColor?: string;
  size?: number;
  className?: string;
}) {
  const shirtNum = getPlayerShirtNumber(player);
  const isGK = player.primaryPosition === 'GK';
  const kitColor = isGK ? '#f59e0b' : primaryColor;
  const kitTrim = isGK ? '#111827' : secondaryColor;

  const app = getFootballerAppearance(player);
  const { skin, hairColor, eyeColor, hairStyle, hasFacialHair, facialHairType, hasHeadband, hasEarStud } = app;

  const uniqueId = `fav-${player.id?.replace(/[^a-zA-Z0-9]/g, '') || 'p'}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`shrink-0 select-none overflow-hidden ${className}`}
      aria-label={`${player.firstName} ${player.lastName} Avatar`}
    >
      <defs>
        {/* Studio Spotlight Vignette */}
        <radialGradient id={`${uniqueId}-bg`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="65%" stopColor="#0b0f19" />
          <stop offset="100%" stopColor="#04060a" />
        </radialGradient>

        {/* Ambient Club Glow */}
        <radialGradient id={`${uniqueId}-glow`} cx="50%" cy="30%" r="50%">
          <stop offset="0%" stopColor={kitColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={kitColor} stopOpacity="0" />
        </radialGradient>

        {/* Kit Shading Gradient */}
        <linearGradient id={`${uniqueId}-kit`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={kitColor} />
          <stop offset="100%" stopColor="#0b101d" stopOpacity="0.85" />
        </linearGradient>

        {/* Skin Tone Shadow */}
        <linearGradient id={`${uniqueId}-skin`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skin.highlight} />
          <stop offset="70%" stopColor={skin.tone} />
          <stop offset="100%" stopColor={skin.dark} />
        </linearGradient>

        {/* Hair Gradient */}
        <linearGradient id={`${uniqueId}-hair`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={hairColor} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      {/* 1. Backdrop */}
      <rect width="120" height="120" fill={`url(#${uniqueId}-bg)`} />
      <circle cx="60" cy="48" r="42" fill={`url(#${uniqueId}-glow)`} />

      {/* 2. Trapezius / Neck */}
      <path
        d="M48,64 L44,92 Q60,98 76,92 L72,64 Z"
        fill={skin.dark}
      />
      <path
        d="M50,65 L48,88 Q60,94 72,88 L70,65 Z"
        fill={skin.tone}
      />
      {/* Adam's apple & throat shading */}
      <path
        d="M58,74 Q60,78 62,74"
        stroke={skin.dark}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* 3. Athlete Jersey / Kit Shoulders */}
      <path
        d="M20,120 L24,96 L36,88 L46,92 Q60,97 74,92 L84,88 L96,96 L100,120 Z"
        fill={`url(#${uniqueId}-kit)`}
      />

      {/* Kit Collar & Accent Trim */}
      <path
        d="M46,92 Q60,97 74,92 L71,96 Q60,102 49,96 Z"
        fill={kitTrim}
      />
      {/* Kit V-Neck Opening */}
      <polygon
        points="56,92 64,92 60,98"
        fill={skin.tone}
      />

      {/* Kit Shoulder Stripes */}
      <path
        d="M26,97 L37,89 M29,101 L40,93"
        stroke={kitTrim}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M94,97 L83,89 M91,101 L80,93"
        stroke={kitTrim}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Mini Heraldic Club Crest Emblem on Left Chest */}
      <g transform="translate(36, 103) scale(0.65)">
        <path d="M0,0 L8,0 L8,6 Q8,11 4,13 Q0,11 0,6 Z" fill={kitTrim} />
        <path d="M1.5,1.5 L6.5,1.5 L6.5,5.5 Q6.5,9.5 4,11 Q1.5,9.5 1.5,5.5 Z" fill={kitColor} />
      </g>

      {/* Squad Shirt Number on Right Chest */}
      <text
        x="77"
        y="112"
        fill={kitTrim}
        fontSize="10"
        fontWeight="900"
        fontFamily="sans-serif"
        textAnchor="middle"
        opacity="0.9"
      >
        {shirtNum}
      </text>

      {/* 4. Athletic Head & Ears */}
      {/* Left Ear */}
      <path
        d="M39,47 C34,47 33,52 33,57 C33,63 37,65 40,62"
        fill={skin.tone}
        stroke={skin.dark}
        strokeWidth="0.8"
      />
      <path d="M36,52 C35,54 35,58 37,59" stroke={skin.dark} strokeWidth="0.8" fill="none" />
      {hasEarStud && <circle cx="36" cy="60" r="1.2" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />}

      {/* Right Ear */}
      <path
        d="M81,47 C86,47 87,52 87,57 C87,63 83,65 80,62"
        fill={skin.tone}
        stroke={skin.dark}
        strokeWidth="0.8"
      />
      <path d="M84,52 C85,54 85,58 83,59" stroke={skin.dark} strokeWidth="0.8" fill="none" />
      {hasEarStud && <circle cx="84" cy="60" r="1.2" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />}

      {/* Jawline & Face Shape */}
      <path
        d="M40,43 C40,27 80,27 80,43 C80,56 74,68 60,72 C46,68 40,56 40,43 Z"
        fill={`url(#${uniqueId}-skin)`}
      />

      {/* Cheekbone & Jaw Shading */}
      <path
        d="M42,54 Q44,64 54,69"
        stroke={skin.dark}
        strokeWidth="1.2"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />
      <path
        d="M78,54 Q76,64 66,69"
        stroke={skin.dark}
        strokeWidth="1.2"
        fill="none"
        opacity="0.35"
        strokeLinecap="round"
      />

      {/* 5. Eyes & Eyebrows */}
      {/* Left Eyebrow */}
      <path
        d="M43,44 Q49,41 55,43"
        stroke={hairColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right Eyebrow */}
      <path
        d="M65,43 Q71,41 77,44"
        stroke={hairColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left Eye */}
      <g>
        <ellipse cx="49" cy="48" rx="4.6" ry="2.8" fill="#ffffff" />
        <circle cx="49.2" cy="48" r="2.2" fill={eyeColor} />
        <circle cx="49.2" cy="48" r="1.1" fill="#090d16" />
        <circle cx="48.4" cy="47.2" r="0.75" fill="#ffffff" />
        <path d="M44,48 Q49,45 54,48" stroke={skin.dark} strokeWidth="0.9" fill="none" />
      </g>

      {/* Right Eye */}
      <g>
        <ellipse cx="71" cy="48" rx="4.6" ry="2.8" fill="#ffffff" />
        <circle cx="70.8" cy="48" r="2.2" fill={eyeColor} />
        <circle cx="70.8" cy="48" r="1.1" fill="#090d16" />
        <circle cx="70.0" cy="47.2" r="0.75" fill="#ffffff" />
        <path d="M66,48 Q71,45 76,48" stroke={skin.dark} strokeWidth="0.9" fill="none" />
      </g>

      {/* 6. Nose */}
      <path
        d="M60,45 L58.5,56 Q60,58 61.5,56 Z"
        fill="none"
        stroke={skin.dark}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="57" cy="56" r="0.8" fill={skin.dark} />
      <circle cx="63" cy="56" r="0.8" fill={skin.dark} />

      {/* 7. Mouth & Lips */}
      <path
        d="M53,63 Q60,65.5 67,63"
        stroke="#964343"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M55.5,64 Q60,66.8 64.5,64"
        stroke={skin.dark}
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* 8. Facial Hair / Beard / Stubble */}
      {hasFacialHair && (
        <g opacity="0.75">
          {facialHairType === 0 && (
            // Light 5 O'clock Stubble
            <path
              d="M48,63 Q60,68 72,63 Q68,72 60,72 Q52,72 48,63 Z"
              fill={hairColor}
              opacity="0.3"
            />
          )}
          {facialHairType === 1 && (
            // Goatee
            <path
              d="M54,61 Q60,63 66,61 L64,71 Q60,73 56,71 Z"
              fill={hairColor}
            />
          )}
          {facialHairType === 2 && (
            // Trimmed Full Beard
            <path
              d="M41,52 Q44,66 60,73 Q76,66 79,52 L76,58 Q60,71 44,58 Z"
              fill={hairColor}
            />
          )}
          {facialHairType === 3 && (
            // Clean Chinstrap
            <path
              d="M41,55 Q45,67 60,72.5 Q75,67 79,55 L77,58 Q60,70.5 43,58 Z"
              fill={hairColor}
            />
          )}
        </g>
      )}

      {/* 9. Hair Styles (12 Variants) */}
      <g fill={`url(#${uniqueId}-hair)`}>
        {/* Style 0: Modern High Fade Textured Crop */}
        {hairStyle === 0 && (
          <path d="M38,43 C38,25 48,22 60,22 C72,22 82,25 82,43 C80,38 74,32 60,32 C46,32 40,38 38,43 Z M42,27 Q48,20 54,26 Q60,19 66,26 Q72,20 78,27 Z" />
        )}

        {/* Style 1: Buzz Cut / Close Shave */}
        {hairStyle === 1 && (
          <path d="M39,43 C39,26 47,23 60,23 C73,23 81,26 81,43 C79,36 73,30 60,30 C47,30 41,36 39,43 Z" />
        )}

        {/* Style 2: Slicked Undercut / Pompadour */}
        {hairStyle === 2 && (
          <path d="M38,43 C37,22 47,16 60,16 C73,16 83,22 82,43 C80,33 73,26 60,26 C47,26 40,33 38,43 Z M44,20 Q60,14 76,20 Q68,26 52,26 Z" />
        )}

        {/* Style 3: Wavy Side Part */}
        {hairStyle === 3 && (
          <path d="M37,44 C36,24 46,18 60,18 C74,18 84,24 83,44 C80,33 70,28 55,27 C45,26 39,34 37,44 Z M42,22 Q54,16 70,22 Q60,28 46,27 Z" />
        )}

        {/* Style 4: Curly / Coily High Top Afro */}
        {hairStyle === 4 && (
          <path d="M36,42 C33,26 42,16 60,16 C78,16 87,26 84,42 C82,34 76,28 60,28 C44,28 38,34 36,42 Z M35,28 Q42,18 52,20 Q60,13 68,20 Q78,18 85,28 Z" />
        )}

        {/* Style 5: Modern Tousled Fringe */}
        {hairStyle === 5 && (
          <path d="M38,43 C37,23 46,19 60,19 C74,19 83,23 82,43 C78,35 68,36 60,37 C52,38 42,37 38,43 Z M44,36 L48,42 L52,36 L56,43 L60,36 L64,42 L68,36" />
        )}

        {/* Style 6: Dreadlocks / Braided Locs */}
        {hairStyle === 6 && (
          <g>
            <path d="M36,44 C34,24 45,18 60,18 C75,18 86,24 84,44 C82,34 75,28 60,28 C45,28 38,34 36,44 Z" />
            <path
              d="M36,36 L32,54 M40,30 L36,58 M46,24 L42,62 M74,24 L78,62 M80,30 L84,58 M84,36 L88,54"
              stroke={hairColor}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Style 7: Cornrows Geometric Taper */}
        {hairStyle === 7 && (
          <g>
            <path d="M39,43 C39,26 47,23 60,23 C73,23 81,26 81,43 C79,35 73,30 60,30 C47,30 41,35 39,43 Z" />
            <path
              d="M48,24 Q48,34 46,40 M54,23 Q54,34 53,40 M60,23 L60,40 M66,23 Q66,34 67,40 M72,24 Q72,34 74,40"
              stroke="#0b0e14"
              strokeWidth="1.4"
            />
          </g>
        )}

        {/* Style 8: Topknot / Samurai Man-Bun */}
        {hairStyle === 8 && (
          <g>
            <path d="M38,43 C38,26 47,23 60,23 C73,23 82,26 82,43 C80,36 74,31 60,31 C46,31 40,36 38,43 Z" />
            <circle cx="60" cy="18" r="5.5" />
            <path d="M57,21 Q60,24 63,21" stroke={kitTrim} strokeWidth="1.2" fill="none" />
          </g>
        )}

        {/* Style 9: Medium Rounded Afro */}
        {hairStyle === 9 && (
          <path d="M33,45 C30,22 42,14 60,14 C78,14 90,22 87,45 C83,36 76,30 60,30 C44,30 37,36 33,45 Z" />
        )}

        {/* Style 10: Messy Mid-Length Flow */}
        {hairStyle === 10 && (
          <g>
            <path d="M36,45 C35,22 45,17 60,17 C75,17 85,22 84,45 C81,34 74,28 60,28 C46,28 39,34 36,45 Z" />
            <path
              d="M36,38 Q32,48 35,56 M84,38 Q88,48 85,56"
              stroke={hairColor}
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* Style 11: Veteran Short Receding */}
        {hairStyle === 11 && (
          <path d="M40,44 C40,32 46,27 48,27 C50,33 56,36 60,36 C64,36 70,33 72,27 C74,27 80,32 80,44 C78,38 73,34 60,34 C47,34 42,38 40,44 Z" />
        )}
      </g>

      {/* 10. Athletic Headband */}
      {hasHeadband && (
        <path
          d="M38,34 Q60,36 82,34"
          stroke={kitTrim}
          strokeWidth="3.2"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
