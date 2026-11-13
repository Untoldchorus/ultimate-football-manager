import { PlayerImageRecord } from '@/engine/types';
import rawEntries from './playerImageEntries.json';

/**
 * Dedicated Player Image Database keyed by stable `player_id` (`clubId:shirtNumber:firstName:lastName`).
 * Supports runtime bulk imports (CSV/JSON) and broken-link marking without mutating core match logic.
 */
const PLAYER_IMAGE_MAP: Record<string, PlayerImageRecord> = {
  ...(rawEntries as Record<string, PlayerImageRecord>),
};

export function buildStablePlayerImageId(
  clubId: string,
  shirtNumber: number,
  firstName: string,
  lastName: string
): string {
  return `${clubId}:${shirtNumber}:${firstName}:${lastName}`;
}

export function getPlayerImageRecord(playerId: string): PlayerImageRecord | null {
  return PLAYER_IMAGE_MAP[playerId] ?? null;
}

export function getAllPlayerImageRecords(): PlayerImageRecord[] {
  return Object.values(PLAYER_IMAGE_MAP);
}

export function upsertPlayerImageRecords(records: PlayerImageRecord[]): {
  added: number;
  updated: number;
  duplicatesSkipped: number;
} {
  let added = 0;
  let updated = 0;
  let duplicatesSkipped = 0;

  const seenUrls = new Set(
    Object.values(PLAYER_IMAGE_MAP)
      .filter((r) => r.image_url)
      .map((r) => `${r.player_id}::${r.image_url}`)
  );

  for (const rec of records) {
    if (!rec.player_id) continue;
    const urlKey = `${rec.player_id}::${rec.image_url}`;
    if (PLAYER_IMAGE_MAP[rec.player_id]) {
      if (seenUrls.has(urlKey)) {
        duplicatesSkipped += 1;
        continue;
      }
      PLAYER_IMAGE_MAP[rec.player_id] = rec;
      updated += 1;
    } else {
      PLAYER_IMAGE_MAP[rec.player_id] = rec;
      added += 1;
    }
    if (rec.image_url) seenUrls.add(urlKey);
  }

  return { added, updated, duplicatesSkipped };
}

export function markPlayerImageBroken(playerId: string): void {
  const existing = PLAYER_IMAGE_MAP[playerId];
  if (existing) {
    PLAYER_IMAGE_MAP[playerId] = {
      ...existing,
      image_status: 'broken',
    };
  }
}
