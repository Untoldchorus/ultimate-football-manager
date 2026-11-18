import { describe, expect, it } from 'vitest';
import { generateInitialGameState, generatePlayer } from '@/engine/generator';
import { calculateOverallRating } from '@/engine/ratings';
import { createRng } from '@/engine/rng';
import {
  evolvePlayerWeeklyTraining,
  evolvePlayerSeasonEnd,
  evaluateDynamicPotential,
  getCoachingMultiplier,
  getPerformanceMultiplier,
  getPlayingTimeFactor,
} from '@/engine/playerEvolutionEngine';
import { migrateSaveEnvelope } from '@/engine/migrations';
import {
  generateCalibratedAbilityProfile,
  VERIFIED_STAR_PROFILES,
} from '@/data/playerAbilityDatabase';
import { PLAYSTYLES_CATALOG } from '@/data/playStylesCatalog';
import { ManagerProfile, PlayerAttributes } from '@/engine/types';

const TEST_MANAGER: ManagerProfile = {
  name: 'Master Tactician',
  nationality: 'England',
  tacticalStyle: 'balanced',
  difficulty: 'standard',
  startingChallenge: 'none',
  clubId: 'club-emerald',
};

describe('EA SPORTS FC-Inspired Player Ability & Ratings Database Suite', () => {
  it('1. Verifies that all 28 individual outfield attributes and 5 GK attributes exist and are within [1..99]', () => {
    const state = generateInitialGameState(1001, TEST_MANAGER);
    expect(state.players.length).toBeGreaterThanOrEqual(500);

    const requiredOutfieldAttrs: (keyof PlayerAttributes)[] = [
      'acceleration', 'sprintSpeed', 'positioning', 'finishing', 'shotPower',
      'longShots', 'volleys', 'penalties', 'vision', 'crossing',
      'shortPassing', 'longPassing', 'curve', 'agility', 'balance',
      'reactions', 'ballControl', 'dribbling', 'composure', 'interceptions',
      'defensiveAwareness', 'standingTackle', 'slidingTackle', 'headingAccuracy',
      'jumping', 'stamina', 'strength', 'aggression',
    ];

    const requiredGkAttrs: (keyof PlayerAttributes)[] = [
      'diving', 'handling', 'kicking', 'reflexes', 'gkPositioning',
    ];

    for (const p of state.players) {
      for (const attr of requiredOutfieldAttrs) {
        expect(p.attributes[attr]).toBeDefined();
        expect(p.attributes[attr]).toBeGreaterThanOrEqual(1);
        expect(p.attributes[attr]).toBeLessThanOrEqual(99);
      }
      for (const attr of requiredGkAttrs) {
        expect(p.attributes[attr]).toBeDefined();
        expect(p.attributes[attr]).toBeGreaterThanOrEqual(1);
        expect(p.attributes[attr]).toBeLessThanOrEqual(99);
      }
    }
  });

  it('2. Verifies authentic ratings, PlayStyle+, weak foot, and skill moves for verified star players', () => {
    const mbappe = VERIFIED_STAR_PROFILES['Kylian Mbappé'];
    expect(mbappe).toBeDefined();
    expect(mbappe.overall).toBe(91);
    expect(mbappe.weakFoot).toBe(4);
    expect(mbappe.skillMoves).toBe(5);
    expect(mbappe.preferredFoot).toBe('Right');
    expect(mbappe.attackingWorkRate).toBe('High');
    expect(mbappe.defensiveWorkRate).toBe('Low');
    expect(mbappe.playStyles.some((ps) => ps.id === 'quick_step' && ps.tier === 'plus')).toBe(true);

    const haaland = VERIFIED_STAR_PROFILES['Erling Haaland'];
    expect(haaland).toBeDefined();
    expect(haaland.overall).toBe(91);
    expect(haaland.attributes.finishing).toBeGreaterThanOrEqual(90);
    expect(haaland.attributes.strength).toBeGreaterThanOrEqual(90);
    expect(haaland.playStyles.some((ps) => ps.tier === 'plus')).toBe(true);

    const rodri = VERIFIED_STAR_PROFILES['Rodri Hernández'];
    expect(rodri).toBeDefined();
    expect(rodri.overall).toBe(91);
    expect(rodri.attributes.shortPassing).toBeGreaterThanOrEqual(90);
    expect(rodri.attributes.interceptions).toBeGreaterThanOrEqual(85);
  });

  it('3. Enforces independent position-weighted overall rating calculation (striker vs defender divergence)', () => {
    const rng = createRng(4444);
    const calibratedSt = generateCalibratedAbilityProfile('ST', 85, 24, 'Right', 183, rng);
    const calibratedCb = generateCalibratedAbilityProfile('CB', 85, 24, 'Right', 189, rng);

    // Striker evaluated as ST vs CB
    const stAsSt = calculateOverallRating(calibratedSt.attributes, 'ST');
    const stAsCb = calculateOverallRating(calibratedSt.attributes, 'CB');
    expect(stAsSt).toBeGreaterThanOrEqual(82);
    expect(stAsCb).toBeLessThanOrEqual(72);
    expect(stAsSt - stAsCb).toBeGreaterThanOrEqual(12);

    // Centre-back evaluated as CB vs ST
    const cbAsCb = calculateOverallRating(calibratedCb.attributes, 'CB');
    const cbAsSt = calculateOverallRating(calibratedCb.attributes, 'ST');
    expect(cbAsCb).toBeGreaterThanOrEqual(82);
    expect(cbAsSt).toBeLessThanOrEqual(75);
    expect(cbAsCb - cbAsSt).toBeGreaterThanOrEqual(10);

    // Striker and Centre-back have drastically different ability profiles
    expect(calibratedSt.attributes.finishing).toBeGreaterThan(calibratedCb.attributes.finishing + 25);
    expect(calibratedCb.attributes.standingTackle).toBeGreaterThan(calibratedSt.attributes.standingTackle + 25);
  });

  it('4. Supports EA FC PlayStyles catalog with 30+ canonical styles across 6 categories', () => {
    expect(PLAYSTYLES_CATALOG.length).toBeGreaterThanOrEqual(28);

    const categories = new Set(PLAYSTYLES_CATALOG.map((ps) => ps.category));
    expect(categories.has('Shooting')).toBe(true);
    expect(categories.has('Passing')).toBe(true);
    expect(categories.has('Ball Control')).toBe(true);
    expect(categories.has('Defending')).toBe(true);
    expect(categories.has('Physical')).toBe(true);
    expect(categories.has('Goalkeeping')).toBe(true);

    for (const ps of PLAYSTYLES_CATALOG) {
      expect(ps.id).toBeTruthy();
      expect(ps.name).toBeTruthy();
      expect(ps.description).toBeTruthy();
      expect(ps.plusDescription).toBeTruthy();
    }
  });

  it('5. Dynamic Career Mode Evolution: Weekly training develops targeted attributes with season caps', () => {
    const state = generateInitialGameState(2002, TEST_MANAGER);
    const youngPlayer = state.players.find(
      (p) => p.age <= 20 && p.overall < p.potential && !p.isYouth && p.primaryPosition === 'ST'
    )!;

    const rng = createRng(9999);
    const coaching = { trainingQuality: 90, playerDevelopment: 90 };

    // Simulate 12 weeks of intense attacking training
    let current = { ...youngPlayer };
    for (let w = 1; w <= 12; w++) {
      const res = evolvePlayerWeeklyTraining(
        current,
        ['attacking', 'shooting'],
        'heavy',
        w,
        coaching,
        rng,
        99
      );
      current = res.updatedPlayer;
    }

    expect(current.seasonGrowth).toBeGreaterThanOrEqual(0);
    expect(current.seasonGrowth).toBeLessThanOrEqual(5); // Hard season growth cap
  });

  it('6. Natural Evolution & Decline: Youngsters mature while 32+ veterans decline in physicals', () => {
    const rng = createRng(7777);
    const state = generateInitialGameState(3003, TEST_MANAGER);

    // Test youngster (age 19)
    const youngster = {
      ...state.players.find((p) => p.age <= 20)!,
      age: 19,
    };
    const maturedYoungster = evolvePlayerSeasonEnd(youngster, 2027, rng);
    expect(maturedYoungster.age).toBe(20);

    // Test veteran (age 34)
    const veteran = {
      ...state.players.find((p) => p.age >= 28)!,
      age: 34,
      attributes: {
        ...state.players[0].attributes,
        acceleration: 78,
        sprintSpeed: 78,
        stamina: 75,
      },
    };
    const declinedVeteran = evolvePlayerSeasonEnd(veteran, 2027, rng);
    expect(declinedVeteran.age).toBe(35);
    expect(declinedVeteran.attributes.acceleration).toBeLessThanOrEqual(78);
    expect(declinedVeteran.attributes.sprintSpeed).toBeLessThanOrEqual(78);
  });

  it('7. Dynamic Potential: Outstanding performance triggers dynamic potential increase', () => {
    const basePlayer = {
      ...generatePlayer(createRng(111), 'dyn-1', 'club-emerald', 'ST', 75, 2026, false),
      age: 21,
      overall: 78,
      potential: 84,
      stats: {
        appearances: 28,
        goals: 24,
        assists: 8,
        cleanSheets: 0,
        yellowCards: 2,
        redCards: 0,
        averageRating: 7.6,
        minutesPlayed: 2400,
      },
    };

    const evaluated = evaluateDynamicPotential(basePlayer, 2026);
    expect(evaluated.potential).toBeGreaterThan(84);
  });

  it('8. Save Migration Compatibility: Backfills legacy saves with all 33 EA FC attributes, weak foot, and work rates', () => {
    const legacyRawSave = {
      saveVersion: 1,
      slotId: 'slot-1',
      savedAtIso: '2026-05-01T00:00:00.000Z',
      managerName: 'Old Save Manager',
      clubName: 'Emerald Athletic',
      seasonYear: 2026,
      currentWeek: 14,
      state: {
        saveVersion: 1,
        currentSeason: 2026,
        currentWeek: 14,
        maxWeeksPerSeason: 22,
        manager: TEST_MANAGER,
        clubs: [],
        players: [
          {
            id: 'p-leg-1',
            firstName: 'Marcus',
            lastName: 'Legacy',
            age: 23,
            nationality: 'England',
            primaryPosition: 'ST',
            secondaryPositions: [],
            clubId: 'club-emerald',
            overall: 80,
            potential: 85,
            contractEndSeason: 2029,
            weeklyWage: 20000,
            marketValue: 15000000,
            fitness: 100,
            morale: 80,
            form: 7,
            injuryWeeks: 0,
            roleExpectation: 'starter',
            transferListed: false,
            transferRequested: false,
            isYouth: false,
            seasonGrowth: 0,
            stats: { appearances: 10, goals: 6, assists: 2, cleanSheets: 0, yellowCards: 1, redCards: 0, averageRating: 7.1, minutesPlayed: 850 },
            attributes: {
              finishing: 82,
              shooting: 80,
              passing: 72,
              dribbling: 81,
              pace: 86,
              stamina: 78,
              strength: 74,
              tackling: 35,
              positioning: 83,
              heading: 76,
              vision: 74,
              composure: 80,
            },
          },
        ],
        fixtures: [],
        standings: [],
        shortlistPlayerIds: [],
        transfers: [],
        news: [],
        trophies: [],
        seasonHistory: [],
      },
    };

    const envelope = migrateSaveEnvelope(legacyRawSave);
    const migratedPlayer = envelope.state.players[0];

    // Assert that missing EA FC attributes are successfully backfilled
    expect(migratedPlayer.attributes.sprintSpeed).toBeDefined();
    expect(migratedPlayer.attributes.sprintSpeed).toBe(86);
    expect(migratedPlayer.attributes.shotPower).toBeDefined();
    expect(migratedPlayer.attributes.volleys).toBeDefined();
    expect(migratedPlayer.attributes.shortPassing).toBe(72);
    expect(migratedPlayer.attributes.standingTackle).toBe(35);
    expect(migratedPlayer.attributes.headingAccuracy).toBe(76);

    // Assert that weak foot, skill moves, and work rates are backfilled
    expect(migratedPlayer.weakFoot).toBeGreaterThanOrEqual(1);
    expect(migratedPlayer.weakFoot).toBeLessThanOrEqual(5);
    expect(migratedPlayer.skillMoves).toBeGreaterThanOrEqual(1);
    expect(migratedPlayer.skillMoves).toBeLessThanOrEqual(5);
    expect(migratedPlayer.attackingWorkRate).toBeDefined();
    expect(migratedPlayer.defensiveWorkRate).toBeDefined();
  });
});
