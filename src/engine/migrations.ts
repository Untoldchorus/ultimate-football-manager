import { GameState, SaveEnvelope } from './types';

export const CURRENT_SAVE_VERSION = 1;

/**
 * Validates and migrates raw saved JSON envelopes across schema versions.
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
