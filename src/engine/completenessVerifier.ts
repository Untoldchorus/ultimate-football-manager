/**
 * Global 20-Nation / 40-Division Football Database Completeness Verifier.
 *
 * Inspects the actual live database (`COUNTRIES_REGISTRY`, `FORTY_DOMESTIC_DIVISIONS`,
 * `GLOBAL_CLUBS_REGISTRY`, and `VERIFIED_PLAYER_PHOTOS`) to produce an exact, real-time
 * division-by-division completeness audit across all 20 countries and 40 domestic leagues.
 */

import { COUNTRIES_REGISTRY, FORTY_DOMESTIC_DIVISIONS } from '@/data/competitionsRegistry';
import { GLOBAL_CLUBS_REGISTRY } from '@/data/globalClubsRegistry';
import { getClubCrestManifest, getPlayerPhotoManifest } from '@/data/assetManifest';

export interface DivisionCompletenessRecord {
  countryId: string;
  countryName: string;
  flagEmoji: string;
  worldRank: number;
  divisionTier: 1 | 2;
  leagueId: string;
  leagueName: string;
  shortName: string;
  competitionFormat: string;
  expectedClubs: number;
  importedClubs: number;
  missingClubs: number;
  expectedPlayers: number;
  importedPlayers: number;
  missingPlayers: number;
  verifiedPhotosCount: number;
  generatedAvatarsCount: number;
  clubsWithBadgesCount: number;
  missingBadgesCount: number;
  duplicateClubIdsCount: number;
  duplicatePlayerIdsCount: number;
  status: 'COMPLETE' | 'INCOMPLETE';
}

export interface GlobalDatabaseCompletenessSummary {
  referenceDate: string;
  seasonLabel: string;
  totalCountries: number;
  totalDivisions: number;
  totalExpectedClubs: number;
  totalImportedClubs: number;
  totalMissingClubs: number;
  totalExpectedPlayers: number;
  totalImportedPlayers: number;
  totalMissingPlayers: number;
  totalVerifiedPhotos: number;
  totalGeneratedAvatars: number;
  totalClubsWithBadges: number;
  totalDuplicateClubIds: number;
  totalDuplicatePlayerIds: number;
  completedDivisionsCount: number;
  incompleteDivisionsCount: number;
  overallStatus: 'COMPLETE' | 'INCOMPLETE';
  divisions: DivisionCompletenessRecord[];
}

let cachedSummary: GlobalDatabaseCompletenessSummary | null = null;

/**
 * Computes the live completeness verification report across all 20 nations and 40 domestic divisions.
 */
export function verifyGlobalDatabaseCompleteness(forceRecompute = false): GlobalDatabaseCompletenessSummary {
  if (cachedSummary && !forceRecompute) {
    return cachedSummary;
  }

  const countryMap = new Map(COUNTRIES_REGISTRY.map((c) => [c.id, c]));
  const globalClubIdSeen = new Set<string>();
  const globalPlayerKeysSeen = new Set<string>();

  const divisions: DivisionCompletenessRecord[] = [];

  let totalExpectedClubs = 0;
  let totalImportedClubs = 0;
  let totalMissingClubs = 0;
  let totalExpectedPlayers = 0;
  let totalImportedPlayers = 0;
  let totalMissingPlayers = 0;
  let totalVerifiedPhotos = 0;
  let totalGeneratedAvatars = 0;
  let totalClubsWithBadges = 0;
  let totalDuplicateClubIds = 0;
  let totalDuplicatePlayerIds = 0;

  // Sort divisions by Country World Rank (1..20), then Division Tier (1..2)
  const sortedDivisions = [...FORTY_DOMESTIC_DIVISIONS].sort((a, b) => {
    const rankA = countryMap.get(a.countryId)?.worldRank ?? 99;
    const rankB = countryMap.get(b.countryId)?.worldRank ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return a.tier - b.tier;
  });

  for (const comp of sortedDivisions) {
    const country = countryMap.get(comp.countryId);
    const divisionClubs = GLOBAL_CLUBS_REGISTRY.filter((c) => c.leagueId === comp.id);

    const expectedClubs = comp.rules.expectedClubCount ?? 20;
    const importedClubs = divisionClubs.length;
    const missingClubs = Math.max(0, expectedClubs - importedClubs);

    const minSquadSize = comp.rules.expectedMinSquadSize ?? 22;
    const expectedPlayers = expectedClubs * 25;

    let importedPlayers = 0;
    let verifiedPhotosCount = 0;
    let generatedAvatarsCount = 0;
    let clubsWithBadgesCount = 0;
    let duplicateClubIdsCount = 0;
    let duplicatePlayerIdsCount = 0;
    let clubsBelowMinSquad = 0;

    for (const club of divisionClubs) {
      if (globalClubIdSeen.has(club.id)) {
        duplicateClubIdsCount += 1;
      } else {
        globalClubIdSeen.add(club.id);
      }

      const crest = getClubCrestManifest(club.id);
      if (crest && (crest.sourceType === 'verified-svg' || crest.sourceType === 'generated-svg')) {
        clubsWithBadgesCount += 1;
      }

      if (club.squad.length < minSquadSize) {
        clubsBelowMinSquad += 1;
      }

      for (const player of club.squad) {
        importedPlayers += 1;
        const playerKey = `${club.id}:${player[6]}:${player[0]}:${player[1]}`;
        if (globalPlayerKeysSeen.has(playerKey)) {
          duplicatePlayerIdsCount += 1;
        } else {
          globalPlayerKeysSeen.add(playerKey);
        }

        const photo = getPlayerPhotoManifest(player[0], player[1]);
        if (photo) {
          verifiedPhotosCount += 1;
        } else {
          generatedAvatarsCount += 1;
        }
      }
    }

    const missingPlayers = Math.max(0, expectedPlayers - importedPlayers);
    const missingBadgesCount = Math.max(0, importedClubs - clubsWithBadgesCount);

    const isComplete =
      importedClubs === expectedClubs &&
      missingClubs === 0 &&
      clubsBelowMinSquad === 0 &&
      importedPlayers >= expectedClubs * minSquadSize &&
      duplicateClubIdsCount === 0 &&
      duplicatePlayerIdsCount === 0;

    const record: DivisionCompletenessRecord = {
      countryId: comp.countryId,
      countryName: country?.name ?? comp.countryId,
      flagEmoji: country?.flagEmoji ?? '🏳️',
      worldRank: country?.worldRank ?? 99,
      divisionTier: (comp.tier === 2 ? 2 : 1) as 1 | 2,
      leagueId: comp.id,
      leagueName: comp.name,
      shortName: comp.shortName,
      competitionFormat: comp.rules.competitionFormat ?? 'Double Round-Robin',
      expectedClubs,
      importedClubs,
      missingClubs,
      expectedPlayers,
      importedPlayers,
      missingPlayers,
      verifiedPhotosCount,
      generatedAvatarsCount,
      clubsWithBadgesCount,
      missingBadgesCount,
      duplicateClubIdsCount,
      duplicatePlayerIdsCount,
      status: isComplete ? 'COMPLETE' : 'INCOMPLETE',
    };

    divisions.push(record);

    totalExpectedClubs += expectedClubs;
    totalImportedClubs += importedClubs;
    totalMissingClubs += missingClubs;
    totalExpectedPlayers += expectedPlayers;
    totalImportedPlayers += importedPlayers;
    totalMissingPlayers += missingPlayers;
    totalVerifiedPhotos += verifiedPhotosCount;
    totalGeneratedAvatars += generatedAvatarsCount;
    totalClubsWithBadges += clubsWithBadgesCount;
    totalDuplicateClubIds += duplicateClubIdsCount;
    totalDuplicatePlayerIds += duplicatePlayerIdsCount;
  }

  const completedDivisionsCount = divisions.filter((d) => d.status === 'COMPLETE').length;
  const incompleteDivisionsCount = divisions.length - completedDivisionsCount;

  cachedSummary = {
    referenceDate: '2025-02-01',
    seasonLabel: '2024/25 Global Reference Season',
    totalCountries: COUNTRIES_REGISTRY.filter((c) => c.worldRank && c.worldRank <= 20).length,
    totalDivisions: divisions.length,
    totalExpectedClubs,
    totalImportedClubs,
    totalMissingClubs,
    totalExpectedPlayers,
    totalImportedPlayers,
    totalMissingPlayers,
    totalVerifiedPhotos,
    totalGeneratedAvatars,
    totalClubsWithBadges,
    totalDuplicateClubIds,
    totalDuplicatePlayerIds,
    completedDivisionsCount,
    incompleteDivisionsCount,
    overallStatus: incompleteDivisionsCount === 0 && divisions.length === 40 ? 'COMPLETE' : 'INCOMPLETE',
    divisions,
  };

  return cachedSummary;
}
