import { ensureEconomyState } from './boosterEconomy';
import {
  deriveSpokenLanguagesForNationality,
  resolvePlayerPersonality,
} from './chemistryEngine';
import { resolvePlayerTacticalRole } from './synergyEngine';
import { GameState, PlayerAttributes, SaveEnvelope } from './types';
import { REAL_WORLD_CLUBS } from '@/data/realWorldDatabase';

export const CURRENT_SAVE_VERSION = 2;

function backfillPlayerAttributes(raw: Partial<PlayerAttributes>): PlayerAttributes {
  const passing = raw.passing ?? 65;
  const shooting = raw.shooting ?? 65;
  const finishing = raw.finishing ?? 65;
  const dribbling = raw.dribbling ?? 65;
  const firstTouch = raw.firstTouch ?? raw.ballControl ?? 65;
  const crossing = raw.crossing ?? 60;
  const tackling = raw.tackling ?? raw.standingTackle ?? 60;
  const heading = raw.heading ?? raw.headingAccuracy ?? 60;
  const pace = raw.pace ?? raw.sprintSpeed ?? 68;
  const acceleration = raw.acceleration ?? pace;
  const strength = raw.strength ?? 65;
  const stamina = raw.stamina ?? 68;
  const jumping = raw.jumping ?? 64;
  const agility = raw.agility ?? 65;
  const vision = raw.vision ?? 65;
  const positioning = raw.positioning ?? 65;
  const decisions = raw.decisions ?? 65;
  const composure = raw.composure ?? 65;
  const leadership = raw.leadership ?? 60;
  const workRate = raw.workRate ?? 68;
  const aggression = raw.aggression ?? 60;
  const reflexes = raw.reflexes ?? 35;
  const handling = raw.handling ?? 35;
  const distribution = raw.distribution ?? raw.kicking ?? 40;

  // EA FC 28 Outfield Attributes + 5 GK Attributes
  const sprintSpeed = raw.sprintSpeed ?? pace;
  const shotPower = raw.shotPower ?? shooting;
  const longShots = raw.longShots ?? shooting;
  const volleys = raw.volleys ?? Math.round((shooting + finishing) / 2);
  const penalties = raw.penalties ?? Math.round((finishing + composure) / 2);
  const freeKicks = raw.freeKicks ?? Math.round((passing + shooting) / 2);
  const shortPassing = raw.shortPassing ?? passing;
  const longPassing = raw.longPassing ?? Math.round((passing * 0.9 + vision * 0.1));
  const curve = raw.curve ?? Math.round((crossing * 0.6 + freeKicks * 0.4));
  const balance = raw.balance ?? Math.round((agility + strength) / 2);
  const reactions = raw.reactions ?? Math.round((composure * 0.6 + decisions * 0.4));
  const ballControl = raw.ballControl ?? Math.round((firstTouch + dribbling) / 2);
  const interceptions = raw.interceptions ?? Math.round((positioning * 0.5 + tackling * 0.5));
  const headingAccuracy = raw.headingAccuracy ?? heading;
  const defensiveAwareness = raw.defensiveAwareness ?? raw.marking ?? Math.round((tackling + positioning) / 2);
  const standingTackle = raw.standingTackle ?? tackling;
  const slidingTackle = raw.slidingTackle ?? Math.round(tackling * 0.9);

  const diving = raw.diving ?? reflexes;
  const kicking = raw.kicking ?? distribution;
  const gkPositioning = raw.gkPositioning ?? positioning;

  return {
    acceleration,
    sprintSpeed,
    pace,
    positioning,
    finishing,
    shotPower,
    longShots,
    volleys,
    penalties,
    shooting,
    vision,
    crossing,
    freeKicks,
    shortPassing,
    longPassing,
    curve,
    passing,
    agility,
    balance,
    reactions,
    ballControl,
    dribbling,
    composure,
    firstTouch,
    interceptions,
    headingAccuracy,
    heading,
    defensiveAwareness,
    marking: defensiveAwareness,
    standingTackle,
    slidingTackle,
    tackling,
    jumping,
    stamina,
    strength,
    aggression,
    decisions,
    leadership,
    workRate,
    anticipation: raw.anticipation ?? Math.round((positioning + decisions) / 2),
    diving,
    handling,
    kicking,
    reflexes,
    gkPositioning,
    distribution: kicking,
    aerialAbility: raw.aerialAbility ?? Math.round((handling + jumping) / 2),
  };
}

/**
 * Validates and migrates raw saved JSON envelopes across schema versions (v0 -> v1 -> v2).
 * Ensures backward compatibility so existing career saves load seamlessly into the
 * Real-World Football Database & 31-attribute schema.
 */
export function migrateSaveEnvelope(raw: unknown): SaveEnvelope {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid save data: expected an object.');
  }

  const obj = raw as Record<string, unknown>;
  const version = typeof obj.saveVersion === 'number' ? obj.saveVersion : 0;
  let state = obj.state as GameState;

  if (!state || typeof state !== 'object') {
    throw new Error('Invalid save envelope: missing state payload.');
  }

  // Migration v0 -> v1
  if (version < 1) {
    state = {
      ...state,
      saveVersion: 1,
      shortlistPlayerIds: Array.isArray(state.shortlistPlayerIds) ? state.shortlistPlayerIds : [],
      transfers: Array.isArray(state.transfers) ? state.transfers : [],
      trophies: Array.isArray(state.trophies) ? state.trophies : [],
      seasonHistory: Array.isArray(state.seasonHistory) ? state.seasonHistory : [],
    };
  }

  // Migration v1 -> v2 (Real-World Database & 31-Attribute Backfill)
  if (version < 2) {
    const seedMap = new Map(REAL_WORLD_CLUBS.map((c) => [c.id, c]));

    const migratedClubs = (state.clubs ?? []).map((club) => {
      const seed = seedMap.get(club.id);
      return {
        ...club,
        countryId: club.countryId ?? seed?.countryId ?? 'ENG',
        city: club.city ?? seed?.city ?? 'London',
        leagueId: club.leagueId ?? seed?.leagueId ?? (club.division === 1 ? 'division1' : 'division2'),
        foundedYear: club.foundedYear ?? seed?.foundedYear ?? 1900,
        financialStatus: club.financialStatus ?? seed?.financialStatus ?? 'Secure',
        managerName: club.managerName ?? seed?.managerName ?? state.manager.name,
        rivalClubIds: club.rivalClubIds ?? seed?.rivalClubIds ?? [],
        clubHistory: club.clubHistory ?? seed?.clubHistory ?? '',
        captainId: club.captainId ?? club.startingXI?.[0],
        viceCaptainId: club.viceCaptainId ?? club.startingXI?.[1],
      };
    });

    const migratedPlayers = (state.players ?? []).map((player, idx) => ({
      ...player,
      dateOfBirth: player.dateOfBirth ?? `${(state.currentSeason || 2026) - player.age}-06-15`,
      heightCm: player.heightCm ?? 181,
      preferredFoot: player.preferredFoot ?? 'Right',
      shirtNumber: player.shirtNumber ?? ((idx % 30) + 1),
      releaseClause: player.releaseClause ?? Math.round((player.marketValue || 1000000) * 1.45),
      agentFeePct: player.agentFeePct ?? 8,
      internationalApps: player.internationalApps ?? 0,
      internationalGoals: player.internationalGoals ?? 0,
      careerHistory: Array.isArray(player.careerHistory) ? player.careerHistory : [],
      attributes: backfillPlayerAttributes(player.attributes ?? {}),
    }));

    state = {
      ...state,
      saveVersion: CURRENT_SAVE_VERSION,
      clubs: migratedClubs,
      players: migratedPlayers,
    };
  }

  // Ensure all players have personality, spokenLanguages, tacticalRole, and complete EA FC abilities
  const enrichedPlayers = (state.players ?? []).map((p) => {
    const isW = p.primaryPosition === 'LW' || p.primaryPosition === 'RW';
    const isM = p.primaryPosition === 'CAM' || p.primaryPosition === 'CM';
    const isD =
      p.primaryPosition === 'CB' ||
      p.primaryPosition === 'CDM' ||
      p.primaryPosition === 'LB' ||
      p.primaryPosition === 'RB';
    const isG = p.primaryPosition === 'GK';

    const weakFoot = p.weakFoot ?? 3;
    const skillMoves = p.skillMoves ?? (isW || isM ? 4 : isD ? 2 : isG ? 1 : 3);
    const attackingWorkRate =
      p.attackingWorkRate ??
      (isW || p.primaryPosition === 'ST' || p.primaryPosition === 'CAM'
        ? 'High'
        : isD
        ? 'Medium'
        : 'Medium');
    const defensiveWorkRate =
      p.defensiveWorkRate ??
      (isD ? 'High' : isW || p.primaryPosition === 'ST' ? 'Low' : 'Medium');

    return {
      ...p,
      spokenLanguages: p.spokenLanguages ?? deriveSpokenLanguagesForNationality(p.nationality),
      personality: p.personality ?? resolvePlayerPersonality(p),
      tacticalRole: p.tacticalRole ?? resolvePlayerTacticalRole(p, p.primaryPosition),
      weakFoot,
      skillMoves,
      attackingWorkRate,
      defensiveWorkRate,
      workRates: p.workRates ?? { attacking: attackingWorkRate, defensive: defensiveWorkRate },
      traits: Array.isArray(p.traits) ? p.traits : [],
      playStyles: Array.isArray(p.playStyles) ? p.playStyles : [],
      ratingDataSource: p.ratingDataSource ?? 'calibrated_model',
      attributes: backfillPlayerAttributes(p.attributes ?? {}),
    };
  });

  state = {
    ...state,
    players: enrichedPlayers,
  };
  state = {
    ...state,
    economy: ensureEconomyState(state),
  };

  return {
    saveVersion: CURRENT_SAVE_VERSION,
    slotId: (obj.slotId as SaveEnvelope['slotId']) ?? 'autosave',
    savedAtIso: typeof obj.savedAtIso === 'string' ? obj.savedAtIso : '2026-08-01T00:00:00.000Z',
    managerName: typeof obj.managerName === 'string' ? obj.managerName : state.manager.name,
    clubName: typeof obj.clubName === 'string' ? obj.clubName : 'Club',
    seasonYear: typeof obj.seasonYear === 'number' ? obj.seasonYear : state.currentSeason,
    currentWeek: typeof obj.currentWeek === 'number' ? obj.currentWeek : state.currentWeek,
    state,
  };
}
