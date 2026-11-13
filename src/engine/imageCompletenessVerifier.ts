/**
 * Automated Player Image Completeness Checker.
 *
 * Audits every country and all 40 domestic divisions against `GLOBAL_CLUBS_REGISTRY`
 * and `playerImageDatabase.ts` using stable `player_id` keys.
 */

import { COUNTRIES_REGISTRY, FORTY_DOMESTIC_DIVISIONS } from '@/data/competitionsRegistry';
import { GLOBAL_CLUBS_REGISTRY } from '@/data/globalClubsRegistry';
import { buildStablePlayerImageId, getPlayerImageRecord } from '@/data/playerImageDatabase';

export interface DivisionImageCompletenessRecord {
  countryId: string;
  countryName: string;
  flagEmoji: string;
  worldRank: number;
  divisionTier: 1 | 2;
  leagueId: string;
  leagueName: string;
  totalPlayers: number;
  realPhotos: number;
  missingPhotos: number;
  verifiedPhotos: number;
  unverifiedPhotos: number;
  brokenLinks: number;
  duplicateImages: number;
  completionPct: number;
}

export interface GlobalImageCompletenessSummary {
  lastCheckedIso: string;
  totalCountries: number;
  totalDivisions: number;
  totalPlayers: number;
  totalRealPhotos: number;
  totalMissingPhotos: number;
  totalVerifiedPhotos: number;
  totalUnverifiedPhotos: number;
  totalBrokenLinks: number;
  totalDuplicateImages: number;
  globalCompletionPct: number;
  divisions: DivisionImageCompletenessRecord[];
}

export function verifyGlobalImageCompleteness(): GlobalImageCompletenessSummary {
  const countryMap = new Map(COUNTRIES_REGISTRY.map((c) => [c.id, c]));
  const seenImageUrls = new Map<string, string>(); // image_url -> first player_id

  const sortedDivisions = [...FORTY_DOMESTIC_DIVISIONS].sort((a, b) => {
    const rankA = countryMap.get(a.countryId)?.worldRank ?? 99;
    const rankB = countryMap.get(b.countryId)?.worldRank ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return a.tier - b.tier;
  });

  const divisions: DivisionImageCompletenessRecord[] = [];
  let totalPlayers = 0;
  let totalRealPhotos = 0;
  let totalMissingPhotos = 0;
  let totalVerifiedPhotos = 0;
  let totalUnverifiedPhotos = 0;
  let totalBrokenLinks = 0;
  let totalDuplicateImages = 0;

  for (const comp of sortedDivisions) {
    const country = countryMap.get(comp.countryId);
    const clubs = GLOBAL_CLUBS_REGISTRY.filter((c) => c.leagueId === comp.id);

    let divTotalPlayers = 0;
    let realPhotos = 0;
    let missingPhotos = 0;
    let verifiedPhotos = 0;
    let unverifiedPhotos = 0;
    let brokenLinks = 0;
    let duplicateImages = 0;

    for (const club of clubs) {
      for (const tuple of club.squad) {
        divTotalPlayers += 1;
        const stableId = buildStablePlayerImageId(club.id, tuple[6], tuple[0], tuple[1]);
        const rec = getPlayerImageRecord(stableId);

        if (!rec || rec.image_status === 'missing' || !rec.image_url) {
          missingPhotos += 1;
          continue;
        }

        if (rec.image_status === 'broken') {
          brokenLinks += 1;
          missingPhotos += 1;
          continue;
        }

        realPhotos += 1;
        if (rec.identity_verified && rec.image_status === 'verified') {
          verifiedPhotos += 1;
        } else {
          unverifiedPhotos += 1;
        }

        const existingOwner = seenImageUrls.get(rec.image_url);
        if (existingOwner && existingOwner !== stableId) {
          duplicateImages += 1;
        } else {
          seenImageUrls.set(rec.image_url, stableId);
        }
      }
    }

    const completionPct =
      divTotalPlayers > 0 ? Math.round((realPhotos / divTotalPlayers) * 1000) / 10 : 0;

    divisions.push({
      countryId: comp.countryId,
      countryName: country?.name ?? comp.countryId,
      flagEmoji: country?.flagEmoji ?? '🏳️',
      worldRank: country?.worldRank ?? 99,
      divisionTier: (comp.tier === 2 ? 2 : 1) as 1 | 2,
      leagueId: comp.id,
      leagueName: comp.name,
      totalPlayers: divTotalPlayers,
      realPhotos,
      missingPhotos,
      verifiedPhotos,
      unverifiedPhotos,
      brokenLinks,
      duplicateImages,
      completionPct,
    });

    totalPlayers += divTotalPlayers;
    totalRealPhotos += realPhotos;
    totalMissingPhotos += missingPhotos;
    totalVerifiedPhotos += verifiedPhotos;
    totalUnverifiedPhotos += unverifiedPhotos;
    totalBrokenLinks += brokenLinks;
    totalDuplicateImages += duplicateImages;
  }

  const globalCompletionPct =
    totalPlayers > 0 ? Math.round((totalRealPhotos / totalPlayers) * 1000) / 10 : 0;

  return {
    lastCheckedIso: new Date().toISOString().slice(0, 10),
    totalCountries: 20,
    totalDivisions: divisions.length,
    totalPlayers,
    totalRealPhotos,
    totalMissingPhotos,
    totalVerifiedPhotos,
    totalUnverifiedPhotos,
    totalBrokenLinks,
    totalDuplicateImages,
    globalCompletionPct,
    divisions,
  };
}
