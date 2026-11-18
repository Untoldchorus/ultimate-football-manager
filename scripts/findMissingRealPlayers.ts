import fs from 'node:fs';
import path from 'node:path';
import { GLOBAL_CLUBS_REGISTRY } from '../src/data/globalClubsRegistry';
import { REAL_WORLD_CLUBS } from '../src/data/realWorldDatabase';
import { EUROPE_TOP5_LEAGUE_CLUBS } from '../src/data/leagues/europeTop5';
import { EUROPE_AND_AMERICAS_LEAGUE_CLUBS } from '../src/data/leagues/europeAndAmericas';
import { GLOBAL_CONTENDERS_LEAGUE_CLUBS } from '../src/data/leagues/globalContenders';
import wikidataPhotos from '../src/data/wikidataPlayerPhotos.json';
import { VERIFIED_PLAYER_PHOTOS } from '../src/data/assetManifest';

interface MissingPlayer {
  fullName: string;
  firstName: string;
  lastName: string;
  clubId: string;
  clubName: string;
  countryId: string;
  leagueId: string;
  shirtNo: number;
  pos: string;
}

const wikidataMap = wikidataPhotos as Record<string, string>;
const missing: MissingPlayer[] = [];
const missingByCountry: Record<string, number> = {};

for (const club of GLOBAL_CLUBS_REGISTRY) {
  const isFlagship = REAL_WORLD_CLUBS.some((rc) => rc.id === club.id);
  const squad = club.squad || [];
  const allTuples = [
    ...(EUROPE_TOP5_LEAGUE_CLUBS[club.leagueId] || []),
    ...(EUROPE_AND_AMERICAS_LEAGUE_CLUBS[club.leagueId] || []),
    ...(GLOBAL_CONTENDERS_LEAGUE_CLUBS[club.leagueId] || []),
  ];
  const tuple = allTuples.find((t) => t[0] === club.id);
  const starRoster = tuple ? tuple[11] : undefined;

  for (let i = 0; i < squad.length; i++) {
    const isExplicitReal = isFlagship || (starRoster && i < starRoster.length);
    if (!isExplicitReal) continue;

    const [firstName, lastName, pos, , , , shirtNo] = squad[i];
    const fullName = `${firstName} ${lastName}`.trim();

    const hasPhoto =
      VERIFIED_PLAYER_PHOTOS[fullName] ||
      wikidataMap[fullName];

    if (!hasPhoto) {
      missing.push({
        fullName,
        firstName,
        lastName,
        clubId: club.id,
        clubName: club.name,
        countryId: club.countryId,
        leagueId: club.leagueId,
        shirtNo,
        pos,
      });
      missingByCountry[club.countryId] = (missingByCountry[club.countryId] || 0) + 1;
    }
  }
}

console.log(`Total explicit real players missing photos: ${missing.length}`);
console.log('Missing breakdown by country:', JSON.stringify(missingByCountry, null, 2));

const outputPath = path.resolve('reports/missing_real_players.json');
fs.writeFileSync(outputPath, JSON.stringify(missing, null, 2), 'utf8');
console.log(`Saved detailed list of ${missing.length} missing players to ${outputPath}`);
