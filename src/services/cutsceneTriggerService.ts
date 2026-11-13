import { CanonicalCutsceneId, CutsceneType, MatchEvent } from '@/engine/types';

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
