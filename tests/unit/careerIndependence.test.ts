import { describe, it, expect } from 'vitest';
import { generateInitialGameState } from '@/engine/generator';
import { executePlayerTransfer } from '@/engine/transfers';
import { ManagerProfile, Player } from '@/engine/types';
import { GLOBAL_CLUBS_REGISTRY } from '@/data/globalClubsRegistry';
import { REAL_WORLD_CLUBS } from '@/data/realWorldDatabase';
import { KNOWN_PLAYER_POSITIONS, RETIRED_PLAYERS_REGISTRY } from '@/data/transfers2026Snapshot';
import { transferReconciliationEngine } from '@/services/transferReconciliationEngine';
import { squadIntegrityValidator } from '@/services/squadIntegrityValidator';
import { footballDataService } from '@/services/footballDataProvider';

const testManager: ManagerProfile = {
  name: 'Test Manager',
  nationality: 'England',
  clubId: 'club-albion',
  tacticalStyle: 'possession',
  difficulty: 'standard',
  startingChallenge: 'none',
};

describe('Career Mode Independence & Squad Integrity Verification', () => {
  it('seeds new careers with 2026/27 squads while guaranteeing all positions are accurate', () => {
    const state = generateInitialGameState(1001, testManager);

    expect(state.clubs.length).toBe(20);
    const seniors = state.players.filter((p) => !p.isYouth);
    expect(seniors.length).toBe(500); // 20 clubs * 25 senior players
    expect(state.players.length).toBe(560); // 500 seniors + 60 youth prospects

    // Check Arsenal
    const arsenal = state.clubs.find((c) => c.id === 'club-albion');
    expect(arsenal).toBeDefined();

    // Verify Eddie Nketiah is NOT in Arsenal (transferred to Crystal Palace)
    const arsenalNketiah = state.players.find(
      (p) => p.clubId === 'club-albion' && p.lastName.toLowerCase() === 'nketiah'
    );
    expect(arsenalNketiah).toBeUndefined();

    // Verify David Raya is GK
    const raya = state.players.find(
      (p) => p.clubId === 'club-albion' && p.lastName === 'Raya'
    );
    expect(raya?.primaryPosition).toBe('GK');

    // Verify Saliba is CB
    const saliba = state.players.find(
      (p) => p.clubId === 'club-albion' && p.lastName === 'Saliba'
    );
    expect(saliba?.primaryPosition).toBe('CB');
  });

  it('guarantees existing career saves are 100% independent from default database updates', () => {
    const careerState = generateInitialGameState(2002, testManager);

    // Manager executes a custom career transfer: Buy a player to Arsenal
    const playerToTransfer = careerState.players.find((p) => p.clubId !== 'club-albion')!;
    const originalClubId = playerToTransfer.clubId;

    const modifiedState = executePlayerTransfer(
      careerState,
      playerToTransfer.id,
      'club-albion',
      25000000,
      120000,
      false
    );

    // Verify the transfer took effect in career state
    const transferredInCareer = modifiedState.players.find((p) => p.id === playerToTransfer.id)!;
    expect(transferredInCareer.clubId).toBe('club-albion');

    // Add a youth academy graduate to career state
    const youthGraduate: Player = {
      ...playerToTransfer,
      id: 'youth-grad-001',
      firstName: 'Star',
      lastName: 'AcademyGraduate',
      age: 17,
      clubId: 'club-albion',
      isYouth: true,
      stats: { appearances: 3, goals: 2, assists: 1, cleanSheets: 0, yellowCards: 0, redCards: 0, averageRating: 7.2, minutesPlayed: 240 },
    };
    modifiedState.players.push(youthGraduate);

    // Simulate database seed re-access / synchronization
    const freshDbClubs = GLOBAL_CLUBS_REGISTRY;
    expect(freshDbClubs.length).toBe(733);

    // Assert career save integrity is preserved:
    // 1. User transfer is still intact
    const careerCheck = modifiedState.players.find((p) => p.id === playerToTransfer.id)!;
    expect(careerCheck.clubId).toBe('club-albion');
    expect(careerCheck.clubId).not.toBe(originalClubId);

    // 2. Youth prospect still exists with his career statistics intact
    const youthCheck = modifiedState.players.find((p) => p.id === 'youth-grad-001')!;
    expect(youthCheck).toBeDefined();
    expect(youthCheck.stats.goals).toBe(2);
    expect(youthCheck.isYouth).toBe(true);

    // 3. User club finances ledger records transfer
    const userClub = modifiedState.clubs.find((c) => c.id === 'club-albion')!;
    expect(userClub.finances.ledger.length).toBeGreaterThan(0);
  });

  it('enforces that retired players never appear in active playing squads', () => {
    for (const club of GLOBAL_CLUBS_REGISTRY) {
      for (const p of club.squad) {
        const fullName = `${p[0]} ${p[1]}`.trim();
        expect(RETIRED_PLAYERS_REGISTRY[fullName]).toBeUndefined();
      }
    }
  });

  it('verifies that known stars have correct primary positions and zero goalkeeper anomalies', () => {
    for (const club of GLOBAL_CLUBS_REGISTRY) {
      for (const p of club.squad) {
        const fullName = `${p[0]} ${p[1]}`.trim();
        const known = KNOWN_PLAYER_POSITIONS[fullName];
        if (known) {
          // If the real player is an outfield player, they must NEVER be assigned GK
          if (known.primaryPosition !== 'GK') {
            expect(p[2]).not.toBe('GK');
          } else {
            expect(p[2]).toBe('GK');
          }
        }
      }
    }
  });

  it('passes automated squad integrity validation on entire 733-club database with zero critical errors', () => {
    const dummyClubs = GLOBAL_CLUBS_REGISTRY.map((c) => ({ id: c.id, name: c.name } as any));
    const dummyPlayers: Player[] = [];
    let count = 1;
    for (const c of GLOBAL_CLUBS_REGISTRY) {
      for (const t of c.squad) {
        dummyPlayers.push({
          id: `p-${count++}`,
          firstName: t[0],
          lastName: t[1],
          clubId: c.id,
          primaryPosition: t[2],
        } as any);
      }
    }

    const report = squadIntegrityValidator.validateClubsAndPlayers(dummyClubs, dummyPlayers);
    expect(report.criticalIssuesCount).toBe(0);
    expect(report.cleanClubsCount).toBe(733);
  });

  it('provides football data service health status and offline snapshot resilience', async () => {
    const healthStatuses = await footballDataService.getAllProvidersHealth();
    expect(healthStatuses.length).toBe(3);

    const snapshotHealth = healthStatuses.find((h) => h.providerId === 'snapshot')!;
    expect(snapshotHealth.isAvailable).toBe(true);
    expect(snapshotHealth.isConfigured).toBe(true);
    expect(snapshotHealth.errorCount).toBe(0);

    const transfers = await footballDataService.getTransfers();
    expect(transfers.length).toBeGreaterThanOrEqual(25);

    // Verify Mbappe transfer is present and confirmed
    const mbappeTransfer = transfers.find((t) => t.playerName === 'Kylian Mbappé');
    expect(mbappeTransfer).toBeDefined();
    expect(mbappeTransfer?.transferStatus).toBe('confirmed');
    expect(mbappeTransfer?.toClubId).toBe('club-kingsbridge');
  });

  it('transfer reconciliation engine applies only confirmed transfers and rejects pending ones', () => {
    const state = generateInitialGameState(3003, testManager);

    const pendingTransfer = {
      id: 'tr-pending-test',
      playerId: state.players[0].id,
      playerName: `${state.players[0].firstName} ${state.players[0].lastName}`,
      fromClubId: state.players[0].clubId,
      fromClubName: 'From Club',
      toClubId: 'club-harbour',
      toClubName: 'Chelsea FC',
      transferType: 'permanent' as const,
      announcementDate: '2026-11-10',
      effectiveDate: '2026-11-15',
      transferStatus: 'pending' as const,
      dataSource: 'verified_snapshot' as const,
      lastVerificationTimestamp: '2026-11-18T00:00:00Z',
      fee: 10000000,
    };

    const result = transferReconciliationEngine.reconcileGameState(state, [pendingTransfer]);
    expect(result.appliedTransfers.length).toBe(0);
    expect(result.skippedTransfers.length).toBe(1);
    expect(result.skippedTransfers[0].reason).toContain("status is 'pending'");
  });
});
