import { describe, it, expect } from 'vitest';
import {
  generateDraftPool,
  generateHybridSquad,
  replaceClubInCareer,
} from '@/engine/originalClubEngine';
import {
  evaluateContractOffer,
  filterFreeAgents,
  getFreeAgents,
  runAiFreeAgentCompetition,
} from '@/engine/freeAgentEngine';
import { createRng } from '@/engine/rng';
import { Club, ManagerProfile, Player } from '@/engine/types';
import { generateInitialGameState, selectActiveSimulationClubSeeds } from '@/engine/generator';

const MOCK_CLUBS: Club[] = [
  {
    id: 'club-a',
    name: 'Bristol Rovers',
    shortName: 'BRV',
    division: 2,
    primaryColor: '#003399',
    secondaryColor: '#ffffff',
    stadiumName: 'Memorial Stadium',
    stadiumCapacity: 12000,
    reputation: 64,
    cash: 2500000,
    transferBudget: 1000000,
    wageBudget: 80000,
    boardConfidence: 75,
  } as unknown as Club,
  {
    id: 'club-b',
    name: 'Derby County',
    shortName: 'DER',
    division: 2,
    primaryColor: '#ffffff',
    secondaryColor: '#000000',
    stadiumName: 'Pride Park',
    stadiumCapacity: 33000,
    reputation: 70,
    cash: 5000000,
    transferBudget: 2000000,
    wageBudget: 120000,
    boardConfidence: 80,
  } as unknown as Club,
];

describe('Original Club Career & Free Agent Market', () => {
  it('generates a balanced 23-player hybrid squad and draft pool', () => {
    const squad = generateHybridSquad('orig_1', 'England', 12345, 67);
    expect(squad).toHaveLength(23);
    expect(squad.filter((p) => p.primaryPosition === 'GK').length).toBe(3);

    const draft = generateDraftPool('England', 12345, 74);
    expect(draft).toHaveLength(12);
    expect(draft.every((p) => p.overall <= 74)).toBe(true);
  });

  it('replaces displaced club in career and releases its players as free agents', () => {
    const displacedPlayers = generateHybridSquad('club-a', 'England', 777, 65);
    const result = replaceClubInCareer(
      MOCK_CLUBS,
      displacedPlayers,
      'club-a',
      {
        name: 'Untold Athletic',
        shortName: 'UNT',
        country: 'England',
        city: 'London',
        primaryColor: '#84cc16',
        secondaryColor: '#070a12',
        stadiumName: 'Untold Arena',
        stadiumCapacity: 18000,
      },
      999
    );

    expect(result.updatedClubs.some((c) => c.name === 'Untold Athletic')).toBe(true);
    expect(result.updatedClubs.some((c) => c.id === 'club-a')).toBe(false);
    expect(result.releasedPlayerIds).toHaveLength(23);

    const freeAgents = getFreeAgents(result.updatedPlayers);
    expect(freeAgents).toHaveLength(23);
    expect(
      (freeAgents[0] as unknown as Record<string, unknown>).formerClubName
    ).toBe('Bristol Rovers');
  });

  it('evaluates contract offers and runs AI free-agent competition', () => {
    const freeAgents = generateHybridSquad('free-agent', 'Spain', 555, 68);
    const filtered = filterFreeAgents(freeAgents, { position: 'GK', minOvr: 55 });
    expect(filtered.length).toBe(3);

    const target = freeAgents[0];
    const accepted = evaluateContractOffer(
      target,
      {
        weeklyWage: (target.weeklyWage || 5000) * 1.5,
        durationYears: 3,
        signingBonus: 15000,
        appearanceBonus: 500,
        squadRole: 'star',
      },
      75
    );
    expect(accepted.outcome).toBe('accepted');

    const rejected = evaluateContractOffer(
      target,
      {
        weeklyWage: 500,
        durationYears: 1,
        signingBonus: 0,
        appearanceBonus: 0,
        squadRole: 'prospect',
      },
      55
    );
    expect(rejected.outcome).toBe('rejected');

    const seeded = createRng(42);
    const aiRes = runAiFreeAgentCompetition(MOCK_CLUBS, freeAgents, 'club-a', () => seeded.next());
    expect(aiRes.updatedPlayers).toHaveLength(freeAgents.length);
  });

  it('guarantees hybrid squad players have valid stats objects preventing reading goals crash', () => {
    const squad = generateHybridSquad('orig_test', 'England', 888, 66);
    for (const player of squad) {
      expect(player.stats).toBeDefined();
      expect(typeof player.stats.goals).toBe('number');
      expect(typeof player.stats.appearances).toBe('number');
      expect(typeof player.stats.assists).toBe('number');
      expect(player.stats.goals).toBe(0);
    }
  });

  it('selectActiveSimulationClubSeeds maintains 100% domestic country purity without mixing foreign leagues', () => {
    // English seeds (Arsenal in Tier 1 or Leeds in Tier 2)
    const engSeeds = selectActiveSimulationClubSeeds('club-redcliff');
    expect(engSeeds).toHaveLength(20);
    expect(engSeeds.every((c) => c.countryId === 'ENG')).toBe(true);

    const engT1 = engSeeds.slice(0, 10);
    const engT2 = engSeeds.slice(10, 20);
    expect(engT1.every((c) => c.division === 1)).toBe(true);
    expect(engT2.every((c) => c.division === 2)).toBe(true);
    expect(engT2.some((c) => c.id === 'club-redcliff')).toBe(true);

    // Spanish seeds (Real Madrid in Tier 1)
    const espSeeds = selectActiveSimulationClubSeeds('club-kingsbridge');
    expect(espSeeds).toHaveLength(20);
    expect(espSeeds.every((c) => c.countryId === 'ESP')).toBe(true);

    const espT1 = espSeeds.slice(0, 10);
    const espT2 = espSeeds.slice(10, 20);
    expect(espT1.every((c) => c.division === 1)).toBe(true);
    expect(espT2.every((c) => c.division === 2)).toBe(true);
    expect(espT1.some((c) => c.id === 'club-kingsbridge')).toBe(true);
  });

  it('generates full game state for Original Club Career locked strictly to Tier 2 with pure domestic divisions', () => {
    const manager: ManagerProfile = {
      name: 'Elena Rostova',
      nationality: 'England',
      tacticalStyle: 'possession',
      difficulty: 'standard',
      startingChallenge: 'none',
      clubId: 'club-redcliff',
      careerType: 'original_team',
      originalClubConfig: {
        name: 'Apex Stars FC',
        shortName: 'APX',
        stadiumName: 'Apex Arena',
        primaryColor: '#84cc16',
        secondaryColor: '#070a12',
      },
    };

    const state = generateInitialGameState(99991, manager);

    expect(state.careerType).toBe('original_team');
    expect(state.clubs).toHaveLength(20);

    const userClub = state.clubs.find((c) => c.id === state.manager.clubId)!;
    expect(userClub).toBeDefined();
    expect(userClub.name).toBe('Apex Stars FC');
    expect(userClub.division).toBe(2);
    expect(userClub.countryId).toBe('ENG');

    // All Tier 1 clubs must be English
    const tier1 = state.clubs.filter((c) => c.division === 1);
    expect(tier1).toHaveLength(10);
    expect(tier1.every((c) => c.countryId === 'ENG')).toBe(true);

    // All Tier 2 clubs must be English
    const tier2 = state.clubs.filter((c) => c.division === 2);
    expect(tier2).toHaveLength(10);
    expect(tier2.every((c) => c.countryId === 'ENG')).toBe(true);

    // Every player must have valid stats
    for (const p of state.players) {
      expect(p.stats).toBeDefined();
      expect(typeof p.stats.goals).toBe('number');
      expect(typeof p.stats.appearances).toBe('number');
    }
  });
});
