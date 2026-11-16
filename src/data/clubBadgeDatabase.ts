import { ClubBadgeRecord } from '@/engine/types';
import rawEntries from './clubBadgeEntries.json';

/**
 * Dedicated Real-World Club Badge Database.
 * Keyed by stable `club_id`.
 * Provides official transparent SVG/PNG club crests sourced openly from Wikimedia Commons,
 * with neutral vector heraldic fallbacks and broken-link management.
 */
let CLUB_BADGE_MAP: Record<string, ClubBadgeRecord> = {
  ...(rawEntries as Record<string, ClubBadgeRecord>),
};

export function getClubBadgeRecord(clubId: string): ClubBadgeRecord | null {
  return CLUB_BADGE_MAP[clubId] ?? null;
}

export function getClubBadgeUrl(clubId: string): string | null {
  const rec = CLUB_BADGE_MAP[clubId];
  if (!rec || rec.badge_status === 'broken' || !rec.badge_url) {
    return null;
  }
  return rec.badge_url;
}

export function getAllClubBadgeRecords(): ClubBadgeRecord[] {
  return Object.values(CLUB_BADGE_MAP);
}

export function upsertClubBadgeRecords(records: ClubBadgeRecord[]): {
  added: number;
  updated: number;
  duplicatesSkipped: number;
} {
  let added = 0;
  let updated = 0;
  let duplicatesSkipped = 0;

  for (const rec of records) {
    if (!rec.club_id) continue;
    if (CLUB_BADGE_MAP[rec.club_id]) {
      if (CLUB_BADGE_MAP[rec.club_id].badge_url === rec.badge_url) {
        duplicatesSkipped++;
        continue;
      }
      CLUB_BADGE_MAP[rec.club_id] = rec;
      updated++;
    } else {
      CLUB_BADGE_MAP[rec.club_id] = rec;
      added++;
    }
  }

  return { added, updated, duplicatesSkipped };
}

export function markClubBadgeBroken(clubId: string): void {
  const existing = CLUB_BADGE_MAP[clubId];
  if (existing) {
    CLUB_BADGE_MAP[clubId] = {
      ...existing,
      badge_status: 'broken',
    };
  }
}
