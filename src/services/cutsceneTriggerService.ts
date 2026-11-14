import { CanonicalCutsceneId, CutsceneType, MatchEvent, Player } from '@/engine/types';

export interface DerivedPlayerAppearance {
  skinColor: string;
  hairColor: string;
  heightScale: number;
  buildScale: number;
  shirtNumber: number;
}

const SKIN_PALETTE = [
  '#f4d0b5', // Fair warm
  '#eac09e', // Light Mediterranean
  '#d8a07a', // Olive / Mestizo
  '#b87b52', // Warm Bronze
  '#8c5332', // Rich Brown
  '#52301c', // Deep Espresso
];

const HAIR_PALETTE = [
  '#0f0c0a', // Jet Black
  '#1f1610', // Dark Espresso Brown
  '#3b2618', // Chestnut Brown
  '#6e4726', // Medium Golden Brown
  '#b88b4a', // Dirty Blonde
  '#8c2d19', // Auburn
];

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function derivePlayerAppearance(
  player?: Partial<Player> | null,
  fallbackName = 'Player'
): DerivedPlayerAppearance {
  const seedKey = `${player?.id ?? ''}_${player?.firstName ?? ''}_${player?.lastName ?? fallbackName}_${player?.nationality ?? ''}`;
  const hash = hashString(seedKey);
  const nat = (player?.nationality ?? '').toLowerCase();

  let skinIdx = hash % SKIN_PALETTE.length;
  if (nat.includes('nigeria') || nat.includes('senegal') || nat.includes('ghana') || nat.includes('cameroon') || nat.includes('ivory') || nat.includes('mali')) {
    skinIdx = 4 + (hash % 2);
  } else if (nat.includes('norway') || nat.includes('sweden') || nat.includes('denmark') || nat.includes('poland') || nat.includes('germany')) {
    skinIdx = hash % 2;
  } else if (nat.includes('spain') || nat.includes('italy') || nat.includes('portugal') || nat.includes('argentina') || nat.includes('mexico') || nat.includes('japan') || nat.includes('korea')) {
    skinIdx = 1 + (hash % 2);
  } else if (nat.includes('brazil') || nat.includes('colombia') || nat.includes('france') || nat.includes('england') || nat.includes('usa') || nat.includes('netherlands')) {
    skinIdx = hash % SKIN_PALETTE.length;
  }

  const hairIdx =
    skinIdx >= 3 ? (hash >> 3) % 2 : (hash >> 3) % HAIR_PALETTE.length;

  const heightCm = player?.heightCm ?? 175 + (hash % 18);
  const strength = player?.attributes?.strength ?? 68 + (hash % 22);

  const heightScale = Number(Math.max(0.94, Math.min(1.16, (heightCm / 180) * 1.05)).toFixed(3));
  const buildScale = Number(Math.max(0.93, Math.min(1.12, 0.92 + (strength / 100) * 0.18)).toFixed(3));
  const shirtNumber = player?.shirtNumber ?? ((hash % 29) + 2);

  return {
    skinColor: SKIN_PALETTE[skinIdx],
    hairColor: HAIR_PALETTE[hairIdx],
    heightScale,
    buildScale,
    shirtNumber,
  };
}

export type CutsceneRenderMode = 'cinematic' | 'live' | 'off';
export type CutsceneFrequency = 'all' | 'key_moments' | 'off';
export type CutsceneQuality = 'low' | 'medium' | 'high';

export interface CutsceneSettings {
  mode: CutsceneRenderMode;
  frequency: CutsceneFrequency;
  quality: CutsceneQuality;
  skipAll: boolean;
  hideGoalIn4xSpeed: boolean;
}

export const DEFAULT_CUTSCENE_SETTINGS: CutsceneSettings = {
  mode: 'cinematic',
  frequency: 'all',
  quality: 'high',
  skipAll: false,
  hideGoalIn4xSpeed: true,
};

const ALIAS_TO_CANONICAL: Record<CutsceneType, CanonicalCutsceneId> = {
  manager_intro: 'manager_intro',
  managerIntro: 'manager_intro',
  stadium_entrance: 'stadium_entrance',
  tunnel_walkout: 'tunnel_walkout',
  tunnelWalkout: 'tunnel_walkout',
  pre_match_talk: 'pre_match_talk',
  preMatchTalk: 'pre_match_talk',
  goal_celebration: 'goal_celebration',
  goalCelebration: 'goal_celebration',
  half_time_talk: 'half_time_talk',
  halfTimeTalk: 'half_time_talk',
  red_card_reaction: 'red_card_reaction',
  redCardReaction: 'red_card_reaction',
  missed_penalty: 'missed_penalty',
  missedPenalty: 'missed_penalty',
  full_time: 'full_time',
  fullTime: 'full_time',
  player_signing: 'player_signing',
  playerSigning: 'player_signing',
  trophy_presentation: 'trophy_presentation',
  trophyPresentation: 'trophy_presentation',
  league_championship: 'league_championship',
  leagueChampionship: 'league_championship',
  career_milestone: 'career_milestone',
};

export function normalizeCutsceneId(type: CutsceneType): CanonicalCutsceneId {
  return ALIAS_TO_CANONICAL[type] ?? 'goal_celebration';
}

export function mapMatchEventToCutscene(event: MatchEvent): CanonicalCutsceneId | null {
  switch (event.type) {
    case 'goal':
      return 'goal_celebration';
    case 'redCard':
      return 'red_card_reaction';
    case 'penalty':
      return event.outcome === 'fail' ? 'missed_penalty' : null;
    case 'halfTime':
      return 'half_time_talk';
    case 'fullTime':
      return 'full_time';
    default:
      return null;
  }
}

const PRIORITY_WEIGHT: Record<CanonicalCutsceneId, number> = {
  league_championship: 100,
  trophy_presentation: 95,
  red_card_reaction: 90,
  full_time: 85,
  goal_celebration: 80,
  missed_penalty: 75,
  half_time_talk: 70,
  player_signing: 65,
  manager_intro: 60,
  tunnel_walkout: 55,
  stadium_entrance: 50,
  pre_match_talk: 45,
  career_milestone: 40,
};

export class CutsceneTriggerService {
  private lastGoalMinute = -99;

  shouldTrigger(
    id: CanonicalCutsceneId,
    minute: number,
    settings: CutsceneSettings,
    options: { isInstantResult?: boolean; speedMultiplier?: number } = {}
  ): boolean {
    if (settings.mode === 'off' || settings.frequency === 'off' || settings.skipAll) {
      return false;
    }
    if (options.isInstantResult) {
      return false;
    }
    if (
      settings.frequency === 'key_moments' &&
      (id === 'stadium_entrance' || id === 'pre_match_talk')
    ) {
      return false;
    }
    if (id === 'goal_celebration') {
      if (settings.hideGoalIn4xSpeed && (options.speedMultiplier ?? 1) >= 4) {
        return false;
      }
      if (minute - this.lastGoalMinute < 3) {
        return false;
      }
      this.lastGoalMinute = minute;
    }
    return true;
  }

  sortByPriority(ids: CanonicalCutsceneId[]): CanonicalCutsceneId[] {
    return [...ids].sort((a, b) => (PRIORITY_WEIGHT[b] ?? 0) - (PRIORITY_WEIGHT[a] ?? 0));
  }

  resetMatchThrottle(): void {
    this.lastGoalMinute = -99;
  }
}

export type ResolvedRenderPath = 'video' | 'godot_live' | 'static_fallback';

export function resolveCutsceneRenderPath(
  mode: CutsceneRenderMode,
  hasPreRenderedVariant: boolean,
  hasGodotWebBundle: boolean
): ResolvedRenderPath {
  if (mode === 'cinematic' && hasPreRenderedVariant) return 'video';
  if ((mode === 'cinematic' || mode === 'live') && hasGodotWebBundle) return 'godot_live';
  return 'static_fallback';
}
