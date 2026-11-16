import { GLOBAL_CLUBS_REGISTRY } from '../src/data/globalClubsRegistry';
import { REAL_WORLD_CLUBS } from '../src/data/realWorldDatabase';
import { EUROPE_TOP5_LEAGUE_CLUBS } from '../src/data/leagues/europeTop5';
import { EUROPE_AND_AMERICAS_LEAGUE_CLUBS } from '../src/data/leagues/europeAndAmericas';
import { GLOBAL_CONTENDERS_LEAGUE_CLUBS } from '../src/data/leagues/globalContenders';

let totalPlayers = 0;
let realWorldClubPlayers = 0;
let starRosterPlayers = 0;
let proceduralPoolPlayers = 0;

const realNamedPlayers: Array<{ fullName: string; clubId: string; clubName: string; countryId: string; isReal: boolean }> = [];

for (const club of GLOBAL_CLUBS_REGISTRY) {
  const isFlagship = REAL_WORLD_CLUBS.some((rc) => rc.id === club.id);
  const squad = club.squad || [];
  totalPlayers += squad.length;

  for (let i = 0; i < squad.length; i++) {
    const [firstName, lastName, pos, age, ovr, nat, shirtNo] = squad[i];
    const fullName = `${firstName} ${lastName}`;
    
    // Check if this was a flagship player or starRoster
    if (isFlagship) {
      realWorldClubPlayers++;
      realNamedPlayers.push({ fullName, clubId: club.id, clubName: club.name, countryId: club.countryId, isReal: true });
    } else {
      // Find the club's tuple in league definitions
      const allTuples = [
        ...(EUROPE_TOP5_LEAGUE_CLUBS[club.leagueId] || []),
        ...(EUROPE_AND_AMERICAS_LEAGUE_CLUBS[club.leagueId] || []),
        ...(GLOBAL_CONTENDERS_LEAGUE_CLUBS[club.leagueId] || []),
      ];
      const tuple = allTuples.find((t) => t[0] === club.id);
      const starRoster = tuple ? tuple[11] : undefined;
      if (starRoster && i < starRoster.length) {
        starRosterPlayers++;
        realNamedPlayers.push({ fullName, clubId: club.id, clubName: club.name, countryId: club.countryId, isReal: true });
      } else {
        proceduralPoolPlayers++;
        realNamedPlayers.push({ fullName, clubId: club.id, clubName: club.name, countryId: club.countryId, isReal: false });
      }
    }
  }
}

console.log('Total Squad Players in DB:', totalPlayers);
console.log('Flagship Real Players (REAL_WORLD_CLUBS 25-man):', realWorldClubPlayers);
console.log('Star Roster Real Players (League definitions):', starRosterPlayers);
console.log('Total Explicit Real-World Named Players:', realWorldClubPlayers + starRosterPlayers);
console.log('Procedural Regional Pool Named Players:', proceduralPoolPlayers);
