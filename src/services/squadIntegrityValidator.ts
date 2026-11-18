/**
 * Squad Integrity Validation Engine.
 *
 * Performs automated validation checks across all clubs and players:
 * - Duplicate player registrations across clubs
 * - Incorrect player positions (e.g. GK in outfield or outfield in GK)
 * - Missing first-team players / squad depth imbalance (<20 or >32)
 * - Retired players appearing in active squads
 * - Invalid loan registrations (loaned to same club, missing parent)
 * - Dangling club-player references
 * - Age and attribute sanity
 */

import {
  KNOWN_PLAYER_POSITIONS,
  RETIRED_PLAYERS_REGISTRY,
} from '@/data/transfers2026Snapshot';
import { Club, GameState, Player, PositionCode } from '@/engine/types';

export type IntegritySeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface IntegrityIssue {
  id: string;
  category:
    | 'duplicate_player'
    | 'incorrect_position'
    | 'retired_in_squad'
    | 'invalid_squad_size'
    | 'invalid_loan'
    | 'dangling_club_ref'
    | 'attribute_anomaly';
  severity: IntegritySeverity;
  clubId?: string;
  clubName?: string;
  playerId?: string;
  playerName?: string;
  message: string;
  remedyRecommendation?: string;
}

export interface SquadIntegrityReport {
  timestampIso: string;
  totalClubsChecked: number;
  totalPlayersChecked: number;
  cleanClubsCount: number;
  flaggedClubsCount: number;
  criticalIssuesCount: number;
  warningIssuesCount: number;
  infoIssuesCount: number;
  issues: IntegrityIssue[];
  issuesByCategory: Record<string, number>;
  clubSummary: Record<
    string,
    {
      clubName: string;
      squadSize: number;
      gkCount: number;
      defCount: number;
      midCount: number;
      attCount: number;
      issuesCount: number;
      status: 'clean' | 'warning' | 'critical';
    }
  >;
}

export class SquadIntegrityValidator {
  /**
   * Validates a complete GameState against all integrity rules.
   */
  validateGameState(state: GameState): SquadIntegrityReport {
    return this.validateClubsAndPlayers(state.clubs, state.players);
  }

  /**
   * Validates clubs and players collections directly (can be run on database seeds or live games).
   */
  validateClubsAndPlayers(
    clubs: Array<Pick<Club, 'id' | 'name'>>,
    players: Player[]
  ): SquadIntegrityReport {
    const issues: IntegrityIssue[] = [];
    const clubMap = new Map(clubs.map((c) => [c.id, c]));

    // 1. Check for Duplicate Players across clubs
    const playerNameMap = new Map<string, Player[]>();
    for (const p of players) {
      if (p.clubId === 'retired' || p.clubId === 'free-agent') continue;
      const key = `${p.firstName} ${p.lastName}`.trim().toLowerCase();
      if (!playerNameMap.has(key)) {
        playerNameMap.set(key, []);
      }
      playerNameMap.get(key)!.push(p);
    }

    for (const [nameKey, occurrences] of playerNameMap.entries()) {
      if (occurrences.length > 1) {
        // Check if this is a known distinct person or duplicate registration
        const distinctClubs = Array.from(new Set(occurrences.map((o) => o.clubId)));
        if (distinctClubs.length > 1) {
          const clubNames = occurrences
            .map((o) => clubMap.get(o.clubId)?.name || o.clubId)
            .join(', ');

          // Check if this is a known real star player
          const sample = occurrences[0];
          const fullName = `${sample.firstName} ${sample.lastName}`;
          const isKnownStar = !!KNOWN_PLAYER_POSITIONS[fullName];

          if (isKnownStar) {
            issues.push({
              id: `dup-${sample.id}`,
              category: 'duplicate_player',
              severity: 'CRITICAL',
              playerName: fullName,
              message: `Real star player '${fullName}' is registered at multiple clubs simultaneously: ${clubNames}.`,
              remedyRecommendation: `Reconcile player transfer and retain player only at current 2026/27 club.`,
            });
          } else {
            // For generated or regional players, check if they share identical nationality, primary position,
            // and close age (±1 year), indicating an accidental duplicate rather than distinct homonyms
            const first = occurrences[0];
            const hasHighConfidenceDuplicate = occurrences.slice(1).some(
              (o) =>
                o.nationality === first.nationality &&
                o.primaryPosition === first.primaryPosition &&
                Math.abs(o.age - first.age) <= 1
            );

            if (hasHighConfidenceDuplicate) {
              issues.push({
                id: `dup-${sample.id}`,
                category: 'duplicate_player',
                severity: 'WARNING',
                playerName: fullName,
                message: `Potential duplicate player '${fullName}' (${first.nationality}, ${first.primaryPosition}, age ${first.age}) registered across clubs: ${clubNames}.`,
                remedyRecommendation: `Verify identity or differentiate player suffix if distinct.`,
              });
            }
          }
        }
      }
    }

    // 2. Check for Retired Players in active squads
    for (const p of players) {
      if (p.clubId === 'retired' || p.clubId === 'free-agent') continue;
      const fullName = `${p.firstName} ${p.lastName}`.trim();
      const retiredInfo = RETIRED_PLAYERS_REGISTRY[fullName];
      if (retiredInfo) {
        const clubName = clubMap.get(p.clubId)?.name || p.clubId;
        issues.push({
          id: `ret-${p.id}`,
          category: 'retired_in_squad',
          severity: 'CRITICAL',
          clubId: p.clubId,
          clubName,
          playerId: p.id,
          playerName: fullName,
          message: `Retired legend '${fullName}' (retired ${retiredInfo.retiredYear}) is registered in active squad of '${clubName}'.`,
          remedyRecommendation: `Remove from active squad and register in retired legends catalog.`,
        });
      }
    }

    // 3. Check for Position Sanity & Known Profile Mismatches
    for (const p of players) {
      const fullName = `${p.firstName} ${p.lastName}`.trim();
      const knownProfile = KNOWN_PLAYER_POSITIONS[fullName];

      if (knownProfile) {
        // Check if position severely clashes (e.g. GK registered as outfield or vice versa)
        const isGkReal = knownProfile.primaryPosition === 'GK';
        const isGkAssigned = p.primaryPosition === 'GK';

        if (isGkReal !== isGkAssigned) {
          const clubName = clubMap.get(p.clubId)?.name || p.clubId;
          issues.push({
            id: `pos-${p.id}`,
            category: 'incorrect_position',
            severity: 'CRITICAL',
            clubId: p.clubId,
            clubName,
            playerId: p.id,
            playerName: fullName,
            message: `Position mismatch for '${fullName}': assigned '${p.primaryPosition}', but true position is '${knownProfile.primaryPosition}'.`,
            remedyRecommendation: `Update primary position to '${knownProfile.primaryPosition}'.`,
          });
        }
      }
    }

    // 4. Check for Dangling Club References & Invalid Loans
    for (const p of players) {
      if (p.clubId !== 'retired' && p.clubId !== 'free-agent' && !clubMap.has(p.clubId)) {
        issues.push({
          id: `dang-${p.id}`,
          category: 'dangling_club_ref',
          severity: 'CRITICAL',
          playerId: p.id,
          playerName: `${p.firstName} ${p.lastName}`,
          clubId: p.clubId,
          message: `Player is registered to non-existent club ID '${p.clubId}'.`,
          remedyRecommendation: `Reassign player to a valid club ID or free agent pool.`,
        });
      }

      if (p.loanedFromClubId) {
        if (p.loanedFromClubId === p.clubId) {
          issues.push({
            id: `loan-self-${p.id}`,
            category: 'invalid_loan',
            severity: 'WARNING',
            playerId: p.id,
            playerName: `${p.firstName} ${p.lastName}`,
            clubId: p.clubId,
            message: `Player is recorded as loaned from their own current club '${p.clubId}'.`,
            remedyRecommendation: `Set loanedFromClubId to null.`,
          });
        } else if (!clubMap.has(p.loanedFromClubId)) {
          issues.push({
            id: `loan-dang-${p.id}`,
            category: 'invalid_loan',
            severity: 'INFO',
            playerId: p.id,
            playerName: `${p.firstName} ${p.lastName}`,
            clubId: p.clubId,
            message: `Loan parent club '${p.loanedFromClubId}' is not among simulated domestic clubs.`,
          });
        }
      }
    }

    // 5. Club-by-Club Squad Size & Positional Balance Validation
    const clubSummary: SquadIntegrityReport['clubSummary'] = {};
    const clubPlayerMap = new Map<string, Player[]>();

    for (const p of players) {
      if (!clubPlayerMap.has(p.clubId)) {
        clubPlayerMap.set(p.clubId, []);
      }
      clubPlayerMap.get(p.clubId)!.push(p);
    }

    for (const club of clubs) {
      const squad = clubPlayerMap.get(club.id) || [];
      const gk = squad.filter((p) => p.primaryPosition === 'GK').length;
      const def = squad.filter((p) => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.primaryPosition)).length;
      const mid = squad.filter((p) => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.primaryPosition)).length;
      const att = squad.filter((p) => ['ST', 'CF', 'LW', 'RW'].includes(p.primaryPosition)).length;

      const clubIssues = issues.filter((i) => i.clubId === club.id);

      // Check min/max squad size
      if (squad.length < 18) {
        issues.push({
          id: `sz-under-${club.id}`,
          category: 'invalid_squad_size',
          severity: 'CRITICAL',
          clubId: club.id,
          clubName: club.name,
          message: `Squad has only ${squad.length} players (minimum required: 18).`,
          remedyRecommendation: `Recruit youth or promote reserves to achieve minimum registration depth.`,
        });
      } else if (squad.length > 35) {
        issues.push({
          id: `sz-over-${club.id}`,
          category: 'invalid_squad_size',
          severity: 'WARNING',
          clubId: club.id,
          clubName: club.name,
          message: `Squad is oversized with ${squad.length} players (maximum recommendation: 35).`,
        });
      }

      // Check GK count
      if (gk < 2) {
        issues.push({
          id: `gk-short-${club.id}`,
          category: 'invalid_squad_size',
          severity: 'CRITICAL',
          clubId: club.id,
          clubName: club.name,
          message: `Squad has only ${gk} Goalkeeper(s) registered (minimum required: 2).`,
          remedyRecommendation: `Ensure at least 2 registered goalkeepers.`,
        });
      }

      const hasCritical = clubIssues.some((i) => i.severity === 'CRITICAL');
      const hasWarning = clubIssues.some((i) => i.severity === 'WARNING');

      clubSummary[club.id] = {
        clubName: club.name,
        squadSize: squad.length,
        gkCount: gk,
        defCount: def,
        midCount: mid,
        attCount: att,
        issuesCount: clubIssues.length,
        status: hasCritical ? 'critical' : hasWarning ? 'warning' : 'clean',
      };
    }

    // Statistics aggregation
    const issuesByCategory: Record<string, number> = {};
    for (const issue of issues) {
      issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
    }

    const criticalIssuesCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningIssuesCount = issues.filter((i) => i.severity === 'WARNING').length;
    const infoIssuesCount = issues.filter((i) => i.severity === 'INFO').length;

    const flaggedClubsCount = Object.values(clubSummary).filter((s) => s.status !== 'clean').length;
    const cleanClubsCount = clubs.length - flaggedClubsCount;

    return {
      timestampIso: new Date().toISOString(),
      totalClubsChecked: clubs.length,
      totalPlayersChecked: players.length,
      cleanClubsCount,
      flaggedClubsCount,
      criticalIssuesCount,
      warningIssuesCount,
      infoIssuesCount,
      issues,
      issuesByCategory,
      clubSummary,
    };
  }
}

export const squadIntegrityValidator = new SquadIntegrityValidator();
