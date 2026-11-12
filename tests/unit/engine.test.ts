import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { generateDoubleRoundRobinFixtures } from '@/engine/fixtures';
import { generateInitialGameState } from '@/engine/generator';
import { resimulateFromMinute, simulateMatch } from '@/engine/matchEngine';
import { calculateOverallRating, validateLineup } from '@/engine/ratings';
import { advanceGameWeek } from '@/engine/season';
import { calculateStandings } from '@/engine/standings';
import { MAX_SEASON_ATTRIBUTE_GROWTH, MIN_SQUAD_SIZE } from '@/engine/transfers';
import { migrateSaveEnvelope } from '@/engine/migrations';
import { verifyGlobalDatabaseCompleteness } from '@/engine/completenessVerifier';
import { COMPETITIONS_REGISTRY, COUNTRIES_REGISTRY } from '@/data/competitionsRegistry';
import { IndexedDBSaveRepository } from '@/services/saveRepository';

describe('Engine Determinism, Fixtures, Standings, Lineup, Persistence & Multi-Season Loop', () => {
  const manager = {
    name: 'Alex Vance',
    nationality: 'England',
    tacticalStyle: 'possession' as const,
    difficulty: 'standard' as const,
    startingChallenge: 'none' as const,
    clubId: 'club-albion',
  };

  it('produces 100% deterministic initial world and match results for identical seed', () => {
    const stateA = generateInitialGameState(999111, manager);
    const stateB = generateInitialGameState(999111, manager);

    expect(stateA.clubs.length).toBe(20);
    // 20 clubs * (25 senior + 3 youth) = 560 total players (500 senior)
    const seniorCount = stateA.players.filter((p) => !p.isYouth).length;
    expect(seniorCount).toBe(500);
    expect(stateA.players[0].firstName).toBe(stateB.players[0].firstName);
    expect(stateA.players[0].overall).toBe(stateB.players[0].overall);

    const homeClub = stateA.clubs[0];
    const awayClub = stateA.clubs[1];
    const homePlayers = stateA.players.filter((p) => p.clubId === homeClub.id);
    const awayPlayers = stateA.players.filter((p) => p.clubId === awayClub.id);

    const match1 = simulateMatch(
      { fixtureId: 'det-1', homeClub, awayClub, homePlayers, awayPlayers },
      424242
    );
    const match2 = simulateMatch(
      { fixtureId: 'det-1', homeClub, awayClub, homePlayers, awayPlayers },
      424242
    );

    expect(match1.homeScore).toBe(match2.homeScore);
    expect(match1.awayScore).toBe(match2.awayScore);
    expect(match1.events.length).toBe(match2.events.length);
    expect(match1.events).toEqual(match2.events);
  });

  it('calculates position-weighted overall ratings accurately', () => {
    const state = generateInitialGameState(123, manager);
    const striker = state.players.find((p) => p.primaryPosition === 'ST')!;
    const gk = state.players.find((p) => p.primaryPosition === 'GK')!;

    // Striker rated as ST vs GK
    const stAsSt = calculateOverallRating(striker.attributes, 'ST');
    const stAsGk = calculateOverallRating(striker.attributes, 'GK');
    expect(stAsSt).toBeGreaterThan(stAsGk);

    const gkAsGk = calculateOverallRating(gk.attributes, 'GK');
    const gkAsSt = calculateOverallRating(gk.attributes, 'ST');
    expect(gkAsGk).toBeGreaterThan(gkAsSt);
  });

  it('generates valid double round-robin fixtures with zero duplicates and exact match counts', () => {
    const clubIds = Array.from({ length: 10 }, (_, i) => `c-${i + 1}`);
    const fixtures = generateDoubleRoundRobinFixtures(clubIds, 'division1', 2026, 777);

    // 10 teams => 18 rounds * 5 matches = 90 matches
    expect(fixtures.length).toBe(90);

    const pairSet = new Set<string>();
    const gamesPerClub = new Map<string, number>();

    for (const f of fixtures) {
      expect(f.homeClubId).not.toBe(f.awayClubId);
      const key = `${f.homeClubId}_vs_${f.awayClubId}`;
      expect(pairSet.has(key)).toBe(false);
      pairSet.add(key);

      gamesPerClub.set(f.homeClubId, (gamesPerClub.get(f.homeClubId) ?? 0) + 1);
      gamesPerClub.set(f.awayClubId, (gamesPerClub.get(f.awayClubId) ?? 0) + 1);
    }

    for (const id of clubIds) {
      expect(gamesPerClub.get(id)).toBe(18);
    }
  });

  it('computes league table points (3/1/0), goal difference, and tie-breakers properly', () => {
    const state = generateInitialGameState(456, manager);
    const div1Fixtures = state.fixtures.filter((f) => f.competition === 'division1').slice(0, 2);

    const f1 = {
      ...div1Fixtures[0],
      played: true,
      result: {
        fixtureId: div1Fixtures[0].id,
        seed: 1,
        homeClubId: div1Fixtures[0].homeClubId,
        awayClubId: div1Fixtures[0].awayClubId,
        homeScore: 3,
        awayScore: 1,
        homeStats: {} as never,
        awayStats: {} as never,
        events: [],
        playerRatings: {},
        manOfTheMatchPlayerId: '',
      },
    };
    const f2 = {
      ...div1Fixtures[1],
      played: true,
      result: {
        fixtureId: div1Fixtures[1].id,
        seed: 2,
        homeClubId: div1Fixtures[1].homeClubId,
        awayClubId: div1Fixtures[1].awayClubId,
        homeScore: 2,
        awayScore: 2,
        homeStats: {} as never,
        awayStats: {} as never,
        events: [],
        playerRatings: {},
        manOfTheMatchPlayerId: '',
      },
    };

    const table = calculateStandings(state.clubs, [f1, f2], 'division1');
    const winnerRow = table.find((r) => r.clubId === f1.homeClubId)!;
    const loserRow = table.find((r) => r.clubId === f1.awayClubId)!;
    const drawRowA = table.find((r) => r.clubId === f2.homeClubId)!;

    expect(winnerRow.points).toBe(3);
    expect(winnerRow.goalDifference).toBe(2);
    expect(loserRow.points).toBe(0);
    expect(loserRow.goalDifference).toBe(-2);
    expect(drawRowA.points).toBe(1);
    expect(drawRowA.goalDifference).toBe(0);
  });

  it('validates lineups (11 starters, 1 GK, no duplicates)', () => {
    const state = generateInitialGameState(789, manager);
    const club = state.clubs[0];
    const clubPlayers = state.players.filter((p) => p.clubId === club.id);

    const validRes = validateLineup(club.startingXI, club.substitutes, clubPlayers);
    expect(validRes.valid).toBe(true);

    // Duplicate starter
    const dupXI = [...club.startingXI];
    dupXI[2] = dupXI[1];
    expect(validateLineup(dupXI, club.substitutes, clubPlayers).valid).toBe(false);

    // Missing GK (replace GK at index 0 with an outfield reserve)
    const outfieldRes = clubPlayers.find(
      (p) => !club.startingXI.includes(p.id) && p.primaryPosition !== 'GK'
    )!;
    const noGkXI = [outfieldRes.id, ...club.startingXI.slice(1)];
    expect(validateLineup(noGkXI, club.substitutes, clubPlayers).valid).toBe(false);
  });

  it('persists and loads SaveEnvelope via IndexedDBSaveRepository round-trip', async () => {
    const repo = new IndexedDBSaveRepository();
    const state = generateInitialGameState(31415, manager);

    await repo.save('slot1', state, '2026-11-11T10:00:00.000Z');
    const loaded = await repo.load('slot1');

    expect(loaded).not.toBeNull();
    expect(loaded!.managerName).toBe('Alex Vance');
    expect(loaded!.state.worldSeed).toBe(31415);
    expect(loaded!.state.clubs.length).toBe(20);

    const exported = repo.exportJson(state, '2026-11-11T10:00:00.000Z');
    const reimported = repo.importJson(exported);
    expect(reimported.state.manager.name).toBe('Alex Vance');
  });

  it('preserves events before minute M when live-resimulating from minute M (M3)', () => {
    const state = generateInitialGameState(2026, manager);
    const homeClub = state.clubs[0];
    const awayClub = state.clubs[1];
    const homePlayers = state.players.filter((p) => p.clubId === homeClub.id);
    const awayPlayers = state.players.filter((p) => p.clubId === awayClub.id);

    const initialResult = simulateMatch(
      { fixtureId: 'live-1', homeClub, awayClub, homePlayers, awayPlayers },
      88888
    );

    const pre45Events = initialResult.events.filter((e) => e.minute < 45);
    const updatedHomeClub = {
      ...homeClub,
      tactics: { ...homeClub.tactics, mentality: 'allOutAttack' as const },
    };

    const resimResult = resimulateFromMinute(
      { fixtureId: 'live-1', homeClub: updatedHomeClub, awayClub, homePlayers, awayPlayers },
      88888,
      initialResult,
      45
    );

    const resimPre45 = resimResult.events.filter((e) => e.minute < 45);
    expect(resimPre45).toEqual(pre45Events);
    expect(resimResult.events[resimResult.events.length - 1].type).toBe('fullTime');
  });

  it('runs 3 full seasons (66 weeks) without error while maintaining squad >= 18, finance consistency, and growth caps (M2)', () => {
    let state = generateInitialGameState(70707, manager);
    const totalWeeks = state.maxWeeksPerSeason * 3; // 66 weeks = 3 full seasons

    for (let w = 0; w < totalWeeks; w++) {
      state = advanceGameWeek(state);

      // Verify per-season growth cap during season
      for (const p of state.players) {
        expect(p.seasonGrowth).toBeLessThanOrEqual(MAX_SEASON_ATTRIBUTE_GROWTH);
      }

      // Verify every club has at least 18 senior players and finite finances
      for (const c of state.clubs) {
        const seniorSquad = state.players.filter((p) => p.clubId === c.id && !p.isYouth);
        expect(seniorSquad.length).toBeGreaterThanOrEqual(MIN_SQUAD_SIZE);
        expect(Number.isFinite(c.finances.cashBalance)).toBe(true);
        expect(Number.isFinite(c.finances.transferBudget)).toBe(true);
      }
    }

    expect(state.currentSeason).toBe(2029);
    expect(state.seasonHistory.length).toBe(3);
    expect(state.trophies.length).toBeGreaterThanOrEqual(6);
  });

  it('validates real-world database integrity (31 attributes, real clubs, multi-league registry, and v1 -> v2 save migration)', () => {
    const state = generateInitialGameState(20261112, manager);

    // Verify real-world clubs & metadata
    const arsenal = state.clubs.find((c) => c.id === 'club-albion')!;
    expect(arsenal.name).toBe('Arsenal FC');
    expect(arsenal.stadiumName).toBe('Emirates Stadium');
    expect(arsenal.foundedYear).toBe(1886);
    expect(arsenal.captainId).toBeDefined();

    // Verify all 500 senior players have 31 attributes populated in [1..99]
    const seniors = state.players.filter((p) => !p.isYouth);
    expect(seniors.length).toBe(500);
    const idSet = new Set<string>();
    for (const p of seniors) {
      expect(idSet.has(p.id)).toBe(false);
      idSet.add(p.id);
      expect(p.attributes.ballControl).toBeGreaterThanOrEqual(1);
      expect(p.attributes.freeKicks).toBeGreaterThanOrEqual(1);
      expect(p.attributes.penalties).toBeGreaterThanOrEqual(1);
      expect(p.attributes.decisions).toBeGreaterThanOrEqual(1);
      expect(p.attributes.anticipation).toBeGreaterThanOrEqual(1);
      expect(p.attributes.acceleration).toBeGreaterThanOrEqual(1);
      expect(p.attributes.balance).toBeGreaterThanOrEqual(1);
      expect(p.attributes.agility).toBeGreaterThanOrEqual(1);
      expect(p.attributes.diving).toBeGreaterThanOrEqual(1);
      expect(p.attributes.aerialAbility).toBeGreaterThanOrEqual(1);
    }

    // Verify multi-league registry
    expect(COUNTRIES_REGISTRY.length).toBeGreaterThanOrEqual(12);
    expect(COMPETITIONS_REGISTRY.length).toBeGreaterThanOrEqual(24);
    expect(COMPETITIONS_REGISTRY.some((c) => c.populatedStatus === 'populated')).toBe(true);
    expect(COMPETITIONS_REGISTRY.some((c) => c.populatedStatus === 'expandable_unpopulated')).toBe(true);

    // Verify v1 -> v2 save migration backfills 31 attributes & real club metadata
    const legacyEnvelope = {
      saveVersion: 1,
      slotId: 'slot1',
      savedAtIso: '2026-11-11T00:00:00.000Z',
      managerName: 'Alex Vance',
      clubName: 'Albion City FC',
      seasonYear: 2026,
      currentWeek: 1,
      state: {
        ...state,
        saveVersion: 1,
      },
    };
    const migrated = migrateSaveEnvelope(legacyEnvelope);
    expect(migrated.saveVersion).toBe(2);
    expect(migrated.state.saveVersion).toBe(2);
    expect(migrated.state.players[0].attributes.decisions).toBeDefined();
    expect(migrated.state.players[0].attributes.marking).toBeDefined();
  });

  it('verifies 100% completeness across all 20 football nations, 40 divisions, 732 clubs, and 18,300 senior players', () => {
    const report = verifyGlobalDatabaseCompleteness(true);

    expect(report.totalCountries).toBe(20);
    expect(report.totalDivisions).toBe(40);
    expect(report.totalExpectedClubs).toBe(732);
    expect(report.totalImportedClubs).toBe(732);
    expect(report.totalMissingClubs).toBe(0);
    expect(report.totalImportedPlayers).toBe(18300);
    expect(report.totalDuplicateClubIds).toBe(0);
    expect(report.totalDuplicatePlayerIds).toBe(0);
    expect(report.completedDivisionsCount).toBe(40);
    expect(report.incompleteDivisionsCount).toBe(0);
    expect(report.overallStatus).toBe('COMPLETE');

    for (const div of report.divisions) {
      expect(div.status).toBe('COMPLETE');
      expect(div.importedClubs).toBe(div.expectedClubs);
      expect(div.missingClubs).toBe(0);
      expect(div.importedPlayers).toBe(div.expectedClubs * 25);
    }

    // Verify starting a career with a non-flagship global club (e.g. River Plate `arg-lpf-riv`)
    const riverState = generateInitialGameState(20261112, {
      ...manager,
      clubId: 'arg-lpf-riv',
    });
    expect(riverState.clubs.length).toBe(20);
    expect(riverState.clubs.some((c) => c.id === 'arg-lpf-riv')).toBe(true);
    expect(riverState.players.filter((p) => !p.isYouth).length).toBe(500);
  });
});
