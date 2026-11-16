import fs from 'node:fs';
import { GLOBAL_CLUBS_REGISTRY } from '../src/data/globalClubsRegistry';
import { REAL_WORLD_CLUBS } from '../src/data/realWorldDatabase';
import { EUROPE_TOP5_LEAGUE_CLUBS } from '../src/data/leagues/europeTop5';
import { EUROPE_AND_AMERICAS_LEAGUE_CLUBS } from '../src/data/leagues/europeAndAmericas';
import { GLOBAL_CONTENDERS_LEAGUE_CLUBS } from '../src/data/leagues/globalContenders';
import wikidataPhotos from '../src/data/wikidataPlayerPhotos.json';
import { VERIFIED_PLAYER_PHOTOS } from '../src/data/assetManifest';
import rawPlayerImages from '../src/data/playerImageEntries.json';

const wikidataMap = wikidataPhotos as Record<string, string>;
const playerImageMap = rawPlayerImages as Record<string, any>;

interface RealPlayerTarget {
  stableId: string;
  fullName: string;
  clubId: string;
  clubName: string;
  countryId: string;
  pos: string;
  hasPhoto: boolean;
  photoUrl?: string;
}

const allExplicitRealPlayers: RealPlayerTarget[] = [];

for (const club of GLOBAL_CLUBS_REGISTRY) {
  const isFlagship = REAL_WORLD_CLUBS.some((rc) => rc.id === club.id);
  const squad = club.squad || [];

  for (let i = 0; i < squad.length; i++) {
    const [firstName, lastName, pos, , , , shirtNo] = squad[i];
    const fullName = `${firstName} ${lastName}`;
    const stableId = `${club.id}:${shirtNo}:${firstName}:${lastName}`;

    let isExplicitReal = isFlagship;
    if (!isExplicitReal) {
      const allTuples = [
        ...(EUROPE_TOP5_LEAGUE_CLUBS[club.leagueId] || []),
        ...(EUROPE_AND_AMERICAS_LEAGUE_CLUBS[club.leagueId] || []),
        ...(GLOBAL_CONTENDERS_LEAGUE_CLUBS[club.leagueId] || []),
      ];
      const tuple = allTuples.find((t) => t[0] === club.id);
      const starRoster = tuple ? tuple[11] : undefined;
      if (starRoster && i < starRoster.length) {
        isExplicitReal = true;
      }
    }

    if (isExplicitReal) {
      const rec = playerImageMap[stableId];
      const photoUrl =
        rec?.image_url ||
        VERIFIED_PLAYER_PHOTOS[fullName]?.url ||
        wikidataMap[fullName];

      allExplicitRealPlayers.push({
        stableId,
        fullName,
        clubId: club.id,
        clubName: club.name,
        countryId: club.countryId,
        pos,
        hasPhoto: Boolean(photoUrl),
        photoUrl,
      });
    }
  }
}

const withPhotos = allExplicitRealPlayers.filter((p) => p.hasPhoto);
const missingPhotos = allExplicitRealPlayers.filter((p) => !p.hasPhoto);

console.log(`Explicit Real-World Players: ${allExplicitRealPlayers.length}`);
console.log(`With Verified Real Photo: ${withPhotos.length} (${((withPhotos.length / allExplicitRealPlayers.length) * 100).toFixed(1)}%)`);
console.log(`Missing Real Photo: ${missingPhotos.length}`);
console.log('\nSample missing real players:');
missingPhotos.slice(0, 15).forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.countryId}] ${p.fullName} (${p.clubName}, Pos: ${p.pos})`);
});
