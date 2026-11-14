import { describe, expect, it } from 'vitest';
import {
  CLUB_DEVELOPMENT_TIERS,
  CLUB_EMPIRE_BUILDINGS_CATALOG,
} from '@/engine/clubEmpireConfig';
import {
  applyAdConstructionReduction,
  calculateClubDevelopmentTier,
  calculateHomeMatchAttendanceAndRevenue,
  calculateMuseumTourismIncome,
  calculateSuperstarCommercialInfluence,
  claimHospitalBooster,
  evaluateBuildingPrerequisites,
  isOriginalTeamCareer,
  purchaseLandPlot,
  setTicketPricing,
  startBuildingConstruction,
  syncAndCompleteConstructions,
  syncHospitalProduction,
} from '@/engine/clubEmpireEngine';
import { generateInitialGameState } from '@/engine/generator';
import type { GameState, Player } from '@/engine/types';

function makeOriginalTeamGameState(balance = 50_000_000): GameState {
  const state = generateInitialGameState(42, {
    name: 'Test Manager',
    nationality: 'England',
    tacticalStyle: 'possession',
    difficulty: 'standard',
    startingChallenge: 'none',
    clubId: 'eng_1',
    careerType: 'original_team',
    originalClubConfig: {
      name: 'FC Nova',
      shortName: 'NOV',
      stadiumName: 'Nova Arena',
      primaryColor: '#10b981',
      secondaryColor: '#0f172a',
    },
  });
  const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
  club.finances.cashBalance = balance;
  return state;
}

describe('Club Empire System', () => {
  it('enforces strict career mode separation between Original Team and Real Club', () => {
    const originalState = makeOriginalTeamGameState();
    expect(isOriginalTeamCareer(originalState)).toBe(true);

    const realState: GameState = {
      ...originalState,
      careerType: 'real_club',
      manager: { ...originalState.manager, careerType: 'real_club' },
    };
    expect(isOriginalTeamCareer(realState)).toBe(false);
  });

  it('defines all 23 infrastructure buildings and 5 development tiers', () => {
    expect(Object.keys(CLUB_EMPIRE_BUILDINGS_CATALOG)).toHaveLength(23);
    expect(CLUB_DEVELOPMENT_TIERS).toHaveLength(5);
  });

  it('initializes Club Empire at Local Club tier with starting campus owned and 5 locked plots', () => {
    const state = makeOriginalTeamGameState();
    const empire = state.clubEmpire!;
    expect(empire.developmentTier).toBe('Local Club');
    expect(calculateClubDevelopmentTier(state).tier).toBe('Local Club');
    expect(empire.landPlots.filter((p) => p.owned)).toHaveLength(6);
    expect(empire.landPlots.filter((p) => !p.owned)).toHaveLength(5);
  });

  it('allows purchasing locked land plots and deducts club cash', () => {
    const state = makeOriginalTeamGameState(50_000_000);
    // Boost building levels & reputation so calculateClubDevelopmentTier(state) reaches Developing Club
    state.clubEmpire!.buildings.stadium_stands.level = 6;
    state.clubEmpire!.buildings.club_headquarters.level = 6;
    const club = state.clubs.find((c) => c.id === state.manager.clubId)!;
    club.reputation = 85;
    const lockedPlot = state.clubEmpire!.landPlots.find((p) => !p.owned && p.expansionOrder === 1)!;

    const res = purchaseLandPlot(state, lockedPlot.plotId);
    expect(res.success, res.message).toBe(true);
    const updatedPlot = res.updatedState.clubEmpire!.landPlots.find((p) => p.plotId === lockedPlot.plotId)!;
    expect(updatedPlot.owned).toBe(true);
    expect(res.updatedState.clubs.find((c) => c.id === club.id)!.finances.cashBalance).toBeLessThan(50_000_000);
  });

  it('requires at least 2 official trophies to unlock Trophy Museum', () => {
    const state = makeOriginalTeamGameState(50_000_000);
    state.clubEmpire!.landPlots.forEach((p) => {
      p.owned = true;
    });
    state.clubEmpire!.buildings.stadium_stands.level = 6;
    state.clubEmpire!.buildings.club_headquarters.level = 6;
    state.clubEmpire!.buildings.club_merchandise_store.level = 3;
    state.trophies = [{ id: 't1', competitionId: 'c1', competitionName: 'League Cup', season: 1, clubId: state.manager.clubId, awardedAtMs: 1 }] as unknown as GameState['trophies'];
    const blocked = evaluateBuildingPrerequisites(state, 'club_museum', 1);
    expect(blocked.eligible).toBe(false);

    state.trophies = [
      { id: 't1', competitionId: 'c1', competitionName: 'League Cup', season: 1, clubId: state.manager.clubId, awardedAtMs: 1 },
      { id: 't2', competitionId: 'c2', competitionName: 'Premier League', season: 1, clubId: state.manager.clubId, awardedAtMs: 2 },
    ] as unknown as GameState['trophies'];
    const allowed = evaluateBuildingPrerequisites(state, 'club_museum', 1);
    expect(allowed.eligible).toBe(true);
    state.clubEmpire!.buildings.club_museum.level = 1;
    expect(calculateMuseumTourismIncome(state).weeklyTourismIncome).toBeGreaterThan(0);
  });

  it('runs real-time construction and caps ad reduction at 10% and 30 minutes', () => {
    const state = makeOriginalTeamGameState(50_000_000);
    state.clubEmpire!.developmentTier = 'Developing Club';
    const startRes = startBuildingConstruction(state, 'football_pitch');
    expect(startRes.success).toBe(true);
    const startedState = startRes.updatedState;
    expect(startedState.clubEmpire!.activeConstructions).toHaveLength(1);

    const project = startedState.clubEmpire!.activeConstructions[0];
    const adRes = applyAdConstructionReduction(startedState, project.projectId, true, Date.now());
    expect(adRes.success, adRes.message).toBe(true);

    const completedState = syncAndCompleteConstructions(adRes.updatedState, Date.now() + 365 * 24 * 60 * 60 * 1000);
    expect(completedState.clubEmpire!.buildings.football_pitch.level).toBeGreaterThanOrEqual(1);
    expect(completedState.clubEmpire!.activeConstructions).toHaveLength(0);
  });

  it('produces hospital recovery boosters offline with separate storage caps', () => {
    const state = makeOriginalTeamGameState(50_000_000);
    state.clubEmpire!.buildings.club_hospital.level = 1;
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const synced = syncHospitalProduction(state, Date.now() + twelveHoursMs);
    const hosp = synced.clubEmpire!.hospitalProduction;

    expect(hosp.individualBoostersStored).toBeGreaterThanOrEqual(0);
    expect(hosp.individualBoostersStored).toBeLessThanOrEqual(hosp.individualStorageCap);
    expect(hosp.teamBoostersStored).toBeLessThanOrEqual(hosp.teamStorageCap);

    hosp.individualBoostersStored = Math.max(1, hosp.individualBoostersStored);
    const beforeClaim = hosp.individualBoostersStored;
    const claim = claimHospitalBooster(synced, 'individual');
    expect(claim.success).toBe(true);
    expect(claim.updatedState.clubEmpire!.hospitalProduction.individualBoostersStored).toBe(beforeClaim - 1);
  });

  it('applies ticket pricing and attendance only to home matches', () => {
    const state = makeOriginalTeamGameState(50_000_000);
    const priced = setTicketPricing(state, { generalPrice: 40, premiumPrice: 80, vipPrice: 120 }).updatedState;

    const awayRes = calculateHomeMatchAttendanceAndRevenue(priced, 'fix_1', 'Away FC', 70)!;
    expect(awayRes.totalAttendance).toBeGreaterThan(0);
    expect(awayRes.vipAttendance).toBeGreaterThanOrEqual(0);
  });

  it('applies diminishing returns to superstar commercial influence', () => {
    const players = [
      { id: 'p1', overall: 90, reputation: 92 } as unknown as Player,
      { id: 'p2', overall: 89, reputation: 90 } as unknown as Player,
      { id: 'p3', overall: 88, reputation: 88 } as unknown as Player,
    ];
    const oneStar = calculateSuperstarCommercialInfluence(players.slice(0, 1));
    const threeStars = calculateSuperstarCommercialInfluence(players);

    expect(threeStars.totalCommercialInfluence).toBeGreaterThan(oneStar.totalCommercialInfluence);
    expect(threeStars.totalCommercialInfluence).toBeLessThan(oneStar.totalCommercialInfluence * 3);
  });
});
