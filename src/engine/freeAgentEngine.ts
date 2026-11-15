import { Club, Player } from './types';

type Position = Player['primaryPosition'];

export interface FreeAgentFilters {
  search?: string;
  position?: Position | 'ALL';
  minOvr?: number;
  maxAge?: number;
  maxWage?: number;
  preferredFoot?: 'ALL' | 'Left' | 'Right';
  category?: 'all' | 'recently_released' | 'high_potential' | 'experienced' | 'recommended';
}

export interface ContractOffer {
  weeklyWage: number;
  durationYears: number;
  signingBonus: number;
  appearanceBonus: number;
  squadRole: 'star' | 'starter' | 'rotation' | 'prospect';
}

export interface ContractNegotiationResult {
  outcome: 'accepted' | 'improved_terms' | 'rejected' | 'delayed';
  message: string;
  counterOffer?: Partial<ContractOffer>;
}

export function getFreeAgents(players: Player[]): Player[] {
  return players.filter((p) => p.clubId === 'free-agent' || p.clubId === 'free_agent');
}

export function filterFreeAgents(
  freeAgents: Player[],
  filters: FreeAgentFilters
): Player[] {
  return freeAgents.filter((p) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      if (!fullName.includes(q) && !p.nationality.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters.position && filters.position !== 'ALL' && p.primaryPosition !== filters.position) {
      return false;
    }
    if (typeof filters.minOvr === 'number' && p.overall < filters.minOvr) {
      return false;
    }
    if (typeof filters.maxAge === 'number' && p.age > filters.maxAge) {
      return false;
    }
    if (typeof filters.maxWage === 'number' && p.weeklyWage > filters.maxWage) {
      return false;
    }
    if (
      filters.preferredFoot &&
      filters.preferredFoot !== 'ALL' &&
      p.preferredFoot !== filters.preferredFoot
    ) {
      return false;
    }
    if (filters.category === 'high_potential' && p.potential < 78) {
      return false;
    }
    if (filters.category === 'experienced' && p.age < 28) {
      return false;
    }
    if (filters.category === 'recently_released' && !(p as unknown as Record<string, unknown>).formerClubName) {
      return false;
    }
    return true;
  });
}

export function evaluateContractOffer(
  player: Player,
  offer: ContractOffer,
  clubReputation: number
): ContractNegotiationResult {
  const expectedWage = Math.max(1500, player.weeklyWage || player.overall * 180);
  const wageRatio = offer.weeklyWage / expectedWage;
  const repFactor = clubReputation >= 75 ? 1.08 : clubReputation >= 60 ? 1.0 : 0.92;
  const roleBonus =
    offer.squadRole === 'star' ? 1.1 : offer.squadRole === 'starter' ? 1.04 : 0.95;

  const effectiveScore = wageRatio * repFactor * roleBonus + (offer.signingBonus > 0 ? 0.05 : 0);

  if (effectiveScore >= 1.02) {
    return {
      outcome: 'accepted',
      message: `${player.firstName} ${player.lastName} has accepted your contract offer!`,
    };
  }
  if (effectiveScore >= 0.85) {
    return {
      outcome: 'improved_terms',
      message: `${player.firstName} ${player.lastName} is interested, but requests slightly improved terms.`,
      counterOffer: {
        weeklyWage: Math.round((expectedWage * 1.05) / 100) * 100,
        signingBonus: Math.max(offer.signingBonus, Math.round(expectedWage * 2)),
      },
    };
  }
  if (effectiveScore >= 0.72) {
    return {
      outcome: 'delayed',
      message: `${player.firstName} ${player.lastName} wants time to consider other offers.`,
    };
  }
  return {
    outcome: 'rejected',
    message: `${player.firstName} ${player.lastName} rejected the offer — wage or squad role is below expectations.`,
  };
}

/**
 * AI clubs evaluate free agents and sign players that fit their reputation & wage budget.
 */
export function runAiFreeAgentCompetition(
  clubs: Club[],
  players: Player[],
  userClubId: string,
  rng: () => number
): { updatedPlayers: Player[]; signings: string[] } {
  const freeAgents = getFreeAgents(players).sort((a, b) => b.overall - a.overall);
  if (freeAgents.length === 0) return { updatedPlayers: players, signings: [] };

  const signings: string[] = [];
  const signedIds = new Set<string>();
  const playerMap = new Map(players.map((p) => [p.id, { ...p }]));

  for (const club of clubs) {
    if (club.id === userClubId) continue;
    const clubSquad = Array.from(playerMap.values()).filter((p) => p.clubId === club.id);
    if (clubSquad.length >= 25 || rng() > 0.25) continue;

    const target = freeAgents.find(
      (fa) => !signedIds.has(fa.id) && fa.overall <= club.reputation + 8 && fa.overall >= club.reputation - 15
    );
    if (!target) continue;

    signedIds.add(target.id);
    const updated = playerMap.get(target.id);
    if (updated) {
      updated.clubId = club.id;
      signings.push(`${target.firstName} ${target.lastName} (${target.overall} OVR) signed for ${club.name}`);
    }
  }

  return {
    updatedPlayers: Array.from(playerMap.values()),
    signings,
  };
}
