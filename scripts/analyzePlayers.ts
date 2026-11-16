import { GLOBAL_CLUBS_REGISTRY } from '../src/data/globalClubsRegistry';
import { REAL_WORLD_CLUBS } from '../src/data/realWorldDatabase';
import rawBadges from '../src/data/clubBadgeEntries.json';

console.log('Total Clubs:', GLOBAL_CLUBS_REGISTRY.length);

const fallbackClubs = Object.values(rawBadges).filter((b: any) => b.badge_status === 'fallback');
console.log('Clubs currently in fallback:', fallbackClubs.length);
console.log('List of fallback clubs:');
fallbackClubs.forEach((c: any, i) => {
  console.log(`${i + 1}. [${c.country_id}] (${c.league_id}) ${c.club_name} (ID: ${c.club_id})`);
});
