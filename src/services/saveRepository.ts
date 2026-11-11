import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CURRENT_SAVE_VERSION, migrateSaveEnvelope } from '@/engine/migrations';
import { GameState, SaveEnvelope } from '@/engine/types';

export type SaveSlotId = 'autosave' | 'slot1' | 'slot2' | 'slot3';

export interface SaveRepository {
  save(slotId: SaveSlotId, state: GameState, savedAtIso?: string): Promise<SaveEnvelope>;
  load(slotId: SaveSlotId): Promise<SaveEnvelope | null>;
  listSlots(): Promise<SaveEnvelope[]>;
  deleteSlot(slotId: SaveSlotId): Promise<void>;
  exportJson(state: GameState, savedAtIso?: string): string;
  importJson(jsonString: string): SaveEnvelope;
}

const DB_NAME = 'ufm_career_db';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

function openSaveDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slotId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function buildSaveEnvelope(
  slotId: SaveSlotId,
  state: GameState,
  savedAtIso = new Date().toISOString()
): SaveEnvelope {
  const userClub = state.clubs.find((c) => c.id === state.manager.clubId);
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    slotId,
    savedAtIso,
    managerName: state.manager.name,
    clubName: userClub?.name ?? 'Unknown Club',
    seasonYear: state.currentSeason,
    currentWeek: state.currentWeek,
    state: JSON.parse(JSON.stringify(state)) as GameState,
  };
}

export class IndexedDBSaveRepository implements SaveRepository {
  async save(
    slotId: SaveSlotId,
    state: GameState,
    savedAtIso?: string
  ): Promise<SaveEnvelope> {
    const envelope = buildSaveEnvelope(slotId, state, savedAtIso);
    const db = await openSaveDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(envelope);
      tx.oncomplete = () => {
        db.close();
        resolve(envelope);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async load(slotId: SaveSlotId): Promise<SaveEnvelope | null> {
    const db = await openSaveDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(slotId);
      req.onsuccess = () => {
        db.close();
        if (!req.result) {
          resolve(null);
          return;
        }
        try {
          resolve(migrateSaveEnvelope(req.result));
        } catch (err) {
          reject(err);
        }
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  }

  async listSlots(): Promise<SaveEnvelope[]> {
    const db = await openSaveDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        const rawList = Array.isArray(req.result) ? req.result : [];
        const migrated = rawList
          .map((item) => {
            try {
              return migrateSaveEnvelope(item);
            } catch {
              return null;
            }
          })
          .filter((x): x is SaveEnvelope => x !== null);
        resolve(migrated);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  }

  async deleteSlot(slotId: SaveSlotId): Promise<void> {
    const db = await openSaveDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(slotId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  exportJson(state: GameState, savedAtIso?: string): string {
    const envelope = buildSaveEnvelope('slot1', state, savedAtIso);
    return JSON.stringify(envelope, null, 2);
  }

  importJson(jsonString: string): SaveEnvelope {
    const parsed = JSON.parse(jsonString);
    return migrateSaveEnvelope(parsed);
  }
}

/**
 * Optional Supabase SaveRepository implementation that syncs to Supabase when configured,
 * while always keeping a local IndexedDB mirror so offline play never breaks.
 */
export class HybridSaveRepository implements SaveRepository {
  private local = new IndexedDBSaveRepository();
  private supabase: SupabaseClient | null = null;

  constructor() {
    const url = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
    const key = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;
    if (url && key && url.startsWith('http')) {
      try {
        this.supabase = createClient(url, key);
      } catch {
        this.supabase = null;
      }
    }
  }

  async save(slotId: SaveSlotId, state: GameState, savedAtIso?: string): Promise<SaveEnvelope> {
    const envelope = await this.local.save(slotId, state, savedAtIso);
    if (this.supabase) {
      try {
        await this.supabase.from('careers').upsert({
          slot_id: slotId,
          save_version: envelope.saveVersion,
          saved_at: envelope.savedAtIso,
          manager_name: envelope.managerName,
          club_name: envelope.clubName,
          season_year: envelope.seasonYear,
          current_week: envelope.currentWeek,
          state_json: envelope.state,
        });
      } catch {
        // Ignore cloud sync error and rely on local IndexedDB save
      }
    }
    return envelope;
  }

  async load(slotId: SaveSlotId): Promise<SaveEnvelope | null> {
    return this.local.load(slotId);
  }

  async listSlots(): Promise<SaveEnvelope[]> {
    return this.local.listSlots();
  }

  async deleteSlot(slotId: SaveSlotId): Promise<void> {
    await this.local.deleteSlot(slotId);
  }

  exportJson(state: GameState, savedAtIso?: string): string {
    return this.local.exportJson(state, savedAtIso);
  }

  importJson(jsonString: string): SaveEnvelope {
    return this.local.importJson(jsonString);
  }
}

export const defaultSaveRepository: SaveRepository = new HybridSaveRepository();
