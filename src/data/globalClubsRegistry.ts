/**
 * Global 20-Nation / 40-Division Football Database Assembler & Squad Expander.
 *
 * Combines:
 * 1. The 20 hand-detailed flagship clubs (`REAL_WORLD_CLUBS` in `realWorldDatabase.ts` with 25-man squads)
 * 2. All 732 real participating clubs across the 40 domestic divisions (`europeTop5`, `europeAndAmericas`, `globalContenders`)
 * 3. Deterministic, culturally-authentic 23-man senior squad generation for every club, incorporating
 *    all verified real-world star rosters (`starRoster`) plus regionally accurate senior squad members
 *    so that every single club in all 40 divisions has a complete 22-25 man registered senior squad.
 */

import { createRng, hashStringToSeed } from '@/engine/rng';
import { FinancialStatus, FormationCode, PositionCode } from '@/engine/types';
import { COMPETITIONS_REGISTRY, FORTY_DOMESTIC_DIVISIONS } from './competitionsRegistry';
import { EUROPE_AND_AMERICAS_LEAGUE_CLUBS } from './leagues/europeAndAmericas';
import { CompactClubTuple, EUROPE_TOP5_LEAGUE_CLUBS } from './leagues/europeTop5';
import { GLOBAL_CONTENDERS_LEAGUE_CLUBS } from './leagues/globalContenders';
import { REAL_WORLD_CLUBS, RealClubSeed } from './realWorldDatabase';

const REGIONAL_NAME_POOLS: Record<string, { nationality: string; first: string[]; last: string[] }> = {
  ENG: {
    nationality: 'England',
    first: ['Harry', 'Jack', 'Oliver', 'James', 'Liam', 'Connor', 'Callum', 'Ben', 'Harvey', 'Morgan', 'Ryan', 'Josh', 'Alex', 'Sam', 'Tom', 'Luke', 'Mason', 'Lewis', 'Kieran', 'Jordan', 'Toby', 'Finley', 'Archie', 'Cameron'],
    last: ['Smith', 'Walker', 'Robinson', 'Wright', 'hall', 'Clarke', 'Mitchell', 'Anderson', 'Harrison', 'Palmer', 'Wharton', 'Branthwaite', 'Armstrong', 'Knight', 'Fellows', 'Hackney', 'Colwill', 'Morton', 'Greaves', 'hughes', 'Dawson', 'collins', 'Murphy', 'kelly'],
  },
  ESP: {
    nationality: 'Spain',
    first: ['Alejandro', 'Álvaro', 'Pablo', 'Sergio', 'Iker', 'Unai', 'Mikel', 'Aitor', 'Dani', 'Javi', 'Carlos', 'Diego', 'Hugo', 'Adrián', 'Marc', 'Pau', 'Gorka', 'Aimar', 'Yeremy', 'Jon', 'Óscar', 'Rubén', 'Fran', 'Jorge'],
    last: ['García', 'Martínez', 'López', 'Sánchez', 'González', 'Rodríguez', 'Fernández', 'Gómez', 'Zubimendi', 'Sancet', 'Oroz', 'Baena', 'Barrios', 'Paredes', 'Vivian', 'Gutiérrez', 'Muñoz', 'Pacheco', 'Beltrán', 'Milla', 'Carmona', 'Mosquera', 'Cardona', 'Puado'],
  },
  GER: {
    nationality: 'Germany',
    first: ['Lukas', 'Maximilian', 'Felix', 'Jonas', 'Niklas', 'Florian', 'Julian', 'Tim', 'jan', 'Leon', 'Robin', 'Marvin', 'Patrick', 'Kevin', 'Paul', 'Moritz', 'Benedikt', 'Rocco', 'Tom', 'Dennis', 'Philipp', 'Luca', 'Fabian', 'Anton'],
    last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Stiller', 'Reitz', 'Burkardt', 'Beier', 'Schlotterbeck', 'Atubolu', 'Bischof', 'Mittelstädt', 'Undav', 'Karazor', 'Mainka', 'Martel', 'Weiser', 'Stage', 'Kleindienst', 'Nebel'],
  },
  ITA: {
    nationality: 'Italy',
    first: ['Lorenzo', 'Matteo', 'Andrea', 'Alessandro', 'Federico', 'Davide', 'Simone', 'Nicolò', 'Giacomo', 'Marco', 'Luca', 'Stefano', 'Riccardo', 'Samuele', 'Pietro', 'Filippo', 'Tommaso', 'Edoardo', 'Mattia', 'Roberto', 'Daniele', 'Gabriele', 'Giovanni', 'Christian'],
    last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Galli', 'Conti', 'Mancini', 'Locatelli', 'Buongiorno', 'Cambiaso', 'Bellanova', 'Fabbian', 'Comuzzo', 'Rovella', 'Casadei', 'Lucca', 'Orsolini', 'Pinamonti', 'Baldanzi', 'Coppola'],
  },
  FRA: {
    nationality: 'France',
    first: ['Lucas', 'Hugo', 'Maxime', 'Enzo', 'Rayan', 'Théo', 'Antoine', 'Clément', 'Baptiste', 'Quentin', 'Romain', 'Adrien', 'Valentin', 'gaëtan', 'Moussa', 'Ibrahima', 'Mamadou', 'Youssouf', 'Mahdi', 'Evann', 'Arnaud', 'Bradley', 'castello', 'leny'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Chevalier', 'Restes', 'Merlin', 'Akliouche', 'Cherki', 'Kalimuendo', 'Chotard', 'Zézé', 'Doué', 'Diakité', 'Lepenant', 'Truffert', 'Singo'],
  },
  POR: {
    nationality: 'Portugal',
    first: ['João', 'Diogo', 'Gonçalo', 'Tiago', 'Rúben', 'Pedro', 'Nuno', 'Francisco', 'Vasco', 'Afonso', 'Rodrigo', 'Miguel', 'Tomás', 'André', 'Bruno', 'Fábio', 'Ricardo', 'bernardo', 'Mateus', 'eduardo', 'Gustavo', 'Martim', 'Samuel', 'henrique'],
    last: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Araújo', 'Quaresma', 'Bragança', 'Horta', 'Trincão', 'Sá', 'Händel', 'Varela', 'Moura', 'Veiga', 'Ribeiro', 'Teixeira', 'Pinto'],
  },
  NED: {
    nationality: 'Netherlands',
    first: ['Sem', 'Daan', 'Luuk', 'Thijs', 'Mees', 'Bram', 'Finn', 'Jesse', 'Ruben', 'Sven', 'Wouter', 'Jordy', 'Joey', 'Quinten', 'Ryan', 'Bart', 'Tijjani', 'Kenneth', 'Jorrel', 'Youri', 'Kian', 'Devyne', 'gijs', 'Stijn'],
    last: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer', 'Steijn', 'Schouten', 'Veerman', 'Goes', 'Flamingo', 'Hilgers', 'Regeer', 'van Bommel', 'Mijnans', 'Timber', 'Hato', 'Baas', 'vlaar', 'Klaassen'],
  },
  BRA: {
    nationality: 'Brazil',
    first: ['Lucas', 'Gabriel', 'Matheus', 'Pedro', 'Guilherme', 'Gustavo', 'Rafael', 'Felipe', 'Bruno', 'Vinícius', 'Caio', 'João', 'Igor', 'Thiago', 'Leonardo', 'Rodrigo', 'Murilo', 'Wesley', 'Estêvão', 'Kauã', 'Breno', 'André', 'Marlon', 'Luiz'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Alves', 'Araújo', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Barbosa', 'Cardoso', 'Teixeira', 'Mendes', 'Freitas', 'Cavalcanti'],
  },
  ARG: {
    nationality: 'Argentina',
    first: ['Santiago', 'Mateo', 'Juan', 'Matías', 'Nicolás', 'Facundo', 'Agustín', 'Franco', 'Lautaro', 'Valentín', 'Joaquín', 'Tomás', 'Enzo', 'Gonzalo', 'Ezequiel', 'Rodrigo', 'Lucas', 'Federico', 'Nahuel', 'Claudio', 'Maximiliano', 'Ignacio', 'Ramiro', 'Thiago'],
    last: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'Sánchez', 'Romero', 'Sosa', 'Torres', 'Álvarez', 'Ruiz', 'Ramírez', 'Flores', 'Acosta', 'Benítez', 'Medina', 'Suárez', 'Herrera', 'Aguirre', 'Molina', 'Castro'],
  },
  MEX: {
    nationality: 'Mexico',
    first: ['Luis', 'Carlos', 'Jorge', 'Jesús', 'Erick', 'Alexis', 'Roberto', 'César', 'Diego', 'Fernando', 'Sebastián', 'Alan', 'Marcel', 'Rodrigo', 'Guillermo', 'Víctor', 'Israel', 'Ozziel', 'bryan', 'kevin', 'Gilberto', 'Uriel', 'ramón', 'Fidel'],
    last: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Gutiérrez', 'Ruiz', 'Mendoza', 'Aguilar', 'Ortiz', 'Alvarado'],
  },
  USA: {
    nationality: 'USA',
    first: ['Christian', 'Tyler', 'Weston', 'Brenden', 'Yunus', 'Giovanni', 'Matt', 'Miles', 'Walker', 'Jordan', 'Jesús', 'Cade', 'Diego', 'Jack', 'Aidan', 'Cole', 'Caleb', 'Paxten', 'john', 'Tanner', 'Jackson', 'Patrick', 'Griffin', 'noah'],
    last: ['Robinson', 'Zimmerman', 'Morris', 'Roldan', 'Acosta', 'Sands', 'McGlynn', 'Luna', 'Tolkin', 'Tessmann', 'Vázquez', 'Busio', 'Trusty', 'Scally', 'harriel', 'Schulte', 'Celentano', 'Freese', 'Gutiérrez', 'Cremaschi', 'Sullivan', 'Downs', 'nealis', 'Ream'],
  },
  SAU: {
    nationality: 'Saudi Arabia',
    first: ['Salem', 'Salman', 'Yasser', 'Mohammed', 'Ali', 'Hassan', 'Saud', 'Firas', 'Abdullah', 'Nasser', 'Sultan', 'Abdulellah', 'Saleh', 'Fahad', 'Moteb', 'Nawaf', 'Ayman', 'faisal', 'Musab', 'Marwan', 'Ziyad', 'Hamed', 'Khalid', 'Saad'],
    last: ['Al-Dawsari', 'Al-Faraj', 'Al-Shahrani', 'Al-Owais', 'Al-Bulaihi', 'Al-Tambakti', 'Abdulhamid', 'Al-Buraikan', 'Al-Hamdan', 'Al-Ghannam', 'Al-Amri', 'Al-Malki', 'Al-Shehri', 'Al-Muwallad', 'Al-Harbi', 'Al-Aqidi', 'Yahya', 'Al-Ghamdi', 'Al-Juwayr', 'Al-Sahafi', 'Lajami', 'Kanno', 'Al-Khaibari', 'Al-Najei'],
  },
  TUR: {
    nationality: 'Turkey',
    first: ['Hakan', 'Arda', 'Kenan', 'Ferdi', 'Orkun', 'Kerem', 'Barış', 'İsmail', 'Mert', 'Merih', 'Çağlar', 'Samet', 'Zeki', 'İrfan', 'Yunus', 'Semih', 'Uğurcan', 'Salih', 'Kaan', 'Oğuz', 'Bertuğ', 'Enes', 'Yusuf', 'Emre'],
    last: ['Çalhanoğlu', 'Güler', 'Yıldız', 'Kadıoğlu', 'Kökçü', 'Aktürkoğlu', 'Yılmaz', 'Yüksek', 'Günok', 'Demiral', 'Söyüncü', 'Akaydin', 'Çelik', 'Kahveci', 'Akgün', 'Kılıçsoy', 'Çakır', 'Özcan', 'Ayhan', 'Aydın', 'Yıldırım', 'Ünal', 'Yazıcı', 'Bardakcı'],
  },
  BEL: {
    nationality: 'Belgium',
    first: ['Kevin', 'Romelu', 'Jérémy', 'Leandro', 'Youri', 'Amadou', 'Orel', 'Wout', 'Arthur', 'Zeno', 'Maxim', 'Charles', 'Johan', 'Arne', 'Malick', 'Mario', 'Killian', 'Senne', 'Matte', 'Hans', 'Toby', 'Jan', 'Hans', 'Noah'],
    last: ['De Bruyne', 'Lukaku', 'Doku', 'Trossard', 'Tielemans', 'Onana', 'Mangala', 'Faes', 'Theate', 'Debast', 'De Cuyper', 'De Ketelaere', 'Bakayoko', 'Engels', 'Fofana', 'Stroeykens', 'Sardella', 'Lammens', 'Smets', 'Vanaken', 'Alderweireld', 'Vertonghen', 'Mechele', 'Heynen'],
  },
  SCO: {
    nationality: 'Scotland',
    first: ['Andrew', 'Scott', 'John', 'Callum', 'Billy', 'Ryan', 'Kieran', 'Che', 'Lawrence', 'Lewis', 'Jack', 'Grant', 'Kenny', 'Greg', 'Liam', 'Stuart', 'Ross', 'Tommy', 'Ben', 'Max', 'Lyndon', 'Josh', 'Aidan', 'craig'],
    last: ['Robertson', 'McTominay', 'McGinn', 'McGregor', 'Gilmour', 'Christie', 'Tierney', 'Adams', 'Shankland', 'Ferguson', 'Hendry', 'Hanley', 'McLean', 'Taylor', 'Souttar', 'Armstrong', 'McCrorie', 'Conway', 'Doak', 'Johnston', 'Dykes', 'nisbet', 'Porteous', 'Gordon'],
  },
  AUT: {
    nationality: 'Austria',
    first: ['Marcel', 'Konrad', 'Christoph', 'Michael', 'Marko', 'Kevin', 'Philipp', 'Xaver', 'Nicolas', 'Florian', 'Alexander', 'Romano', 'Patrick', 'Maximilian', 'Leopold', 'Samson', 'Matthias', 'Niklas', 'Flavius', 'lukas', 'Marco', 'Andreas', 'Gernot', 'stefan'],
    last: ['Sabitzer', 'Laimer', 'Baumgartner', 'Gregoritsch', 'Arnautović', 'Danso', 'Lienhart', 'Schlager', 'Seiwald', 'Grillitsch', 'Prass', 'Schmid', 'Wimmer', 'Wöber', 'Querfeld', 'Baidoo', 'Seidl', 'Hedl', 'Daniliuc', 'Grgić', 'Grüll', 'Weimann', 'Trauner', 'Posch'],
  },
  SUI: {
    nationality: 'Switzerland',
    first: ['Granit', 'Manuel', 'Gregor', 'Yann', 'Remo', 'Ricardo', 'Dan', 'Ruben', 'Breel', 'Zeki', 'Denis', 'Fabian', 'Michel', 'Silvan', 'Vincent', 'noah', 'Filip', 'Uran', 'Albian', 'Ardon', 'Becir', 'Leon', 'Kwadwo', 'cedric'],
    last: ['Xhaka', 'Akanji', 'Kobel', 'Sommer', 'Freuler', 'Rodriguez', 'Ndoye', 'Vargas', 'Embolo', 'Amdouni', 'Zakaria', 'Rieder', 'Aebischer', 'Widmer', 'Sierro', 'Okafor', 'Ugrinić', 'Bislimi', 'Hajdari', 'Jashari', 'Omeragic', 'Avdullahu', 'Duah', 'Itten'],
  },
  DEN: {
    nationality: 'Denmark',
    first: ['Christian', 'Pierre-Emile', 'Rasmus', 'Joachim', 'Andreas', 'Jannik', 'Kasper', 'Morten', 'Jonas', 'Mikkel', 'Victor', 'Alexander', 'Gustav', 'Patrick', 'Matt', 'Mads', 'Oliver', 'Mathias', 'Yussuf', 'Thomas', 'Jacob', 'Lukas', 'Filip', 'nicolai'],
    last: ['Eriksen', 'Højbjerg', 'Højlund', 'Andersen', 'Christensen', 'Vestergaard', 'Schmeichel', 'Hjulmand', 'Wind', 'Damsgaard', 'Kristiansen', 'Bah', 'Isaksen', 'Dorgu', 'O’Riley', 'Hermansen', 'Sørensen', 'Kvistgaarden', 'Poulsen', 'Delaney', 'Rasmussen', 'Lerager', 'Jörgensen', 'Vallys'],
  },
  JPN: {
    nationality: 'Japan',
    first: ['Wataru', 'Takefusa', 'Kaoru', 'Hidemasa', 'Takumi', 'Junya', 'Ritsu', 'Daizen', 'Kyogo', 'Reo', 'Ko', 'Takehiro', 'Yukinari', 'Ayase', 'Zion', 'Keito', 'Daichi', 'Koki', 'Ao', 'Shogo', 'Mao', 'Kota', 'Yuya', 'yoshinori'],
    last: ['Endo', 'Kubo', 'Mitoma', 'Morita', 'Minamino', 'Ito', 'Dōan', 'Maeda', 'Furuhashi', 'Hatate', 'Itakura', 'Tomiyasu', 'Sugawara', 'Ueda', 'Suzuki', 'Nakamura', 'Kamada', 'Machida', 'Tanaka', 'Taniguchi', 'Hosoya', 'Takai', 'Osako', 'Muto'],
  },
  KOR: {
    nationality: 'South Korea',
    first: ['Heung-min', 'Min-jae', 'Kang-in', 'Jae-sung', 'In-beom', 'Hee-chan', 'Hyeon-woo', 'Young-gwon', 'Jin-su', 'Seung-beom', 'Min-kyu', 'Hyeon-gyu', 'Jun-ho', 'Ji-sung', 'Woo-yeong', 'Kyu-sung', 'Seol', 'Paik', 'Hong', 'Yang', 'Um', 'Song', 'Kwon', 'Cho'],
    last: ['Son', 'Kim', 'Lee', 'Hwang', 'Jo', 'Park', 'Cho', 'Jeong', 'Bae', 'Oh', 'Eom', 'Seol', 'Paik', 'Hong', 'Yang', 'Kwon', 'Jung', 'Yoon', 'Kang', 'Moon', 'Na', 'Joo', 'Ko', '주민규'],
  },
};

const SQUAD_23_POSITIONS: PositionCode[] = [
  'GK', 'GK', 'GK',
  'LB', 'LB',
  'CB', 'CB', 'CB', 'CB',
  'RB', 'RB',
  'CDM', 'CDM',
  'CM', 'CM', 'CM',
  'CAM', 'CAM',
  'LW', 'LW',
  'RW', 'RW',
  'ST', 'ST', 'ST',
]; // 25 senior players per club

const SHIRT_NUMBERS_25 = [
  1, 13, 25,
  3, 12,
  4, 5, 6, 15,
  2, 22,
  14, 16,
  8, 18, 20,
  10, 21,
  11, 17,
  7, 19,
  9, 23, 24,
];

function buildSquadForCompactClub(
  clubId: string,
  countryId: string,
  reputation: number,
  starRoster?: string[]
): RealClubSeed['squad'] {
  const rng = createRng(hashStringToSeed(`squad_${clubId}_2025`));
  const pool = REGIONAL_NAME_POOLS[countryId] ?? REGIONAL_NAME_POOLS.ENG;
  const squad: RealClubSeed['squad'] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < 25; i++) {
    const pos = SQUAD_23_POSITIONS[i];
    const shirtNo = SHIRT_NUMBERS_25[i];
    let firstName = '';
    let lastName = '';

    if (starRoster && i < starRoster.length) {
      const full = starRoster[i].trim();
      const parts = full.split(/\s+/);
      if (parts.length === 1) {
        firstName = parts[0];
        lastName = pool.last[i % pool.last.length];
      } else {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }
      usedNames.add(`${firstName}_${lastName}`);
    } else {
      for (let attempt = 0; attempt < 25; attempt++) {
        const f = pool.first[(i * 3 + attempt + rng.nextInt(0, pool.first.length - 1)) % pool.first.length];
        const l = pool.last[(i * 5 + attempt * 2 + rng.nextInt(0, pool.last.length - 1)) % pool.last.length];
        const key = `${f}_${l}`;
        if (!usedNames.has(key)) {
          usedNames.add(key);
          firstName = f;
          lastName = l;
          break;
        }
      }
      if (!firstName) {
        firstName = pool.first[i % pool.first.length];
        lastName = `${pool.last[i % pool.last.length]}-${i + 1}`;
      }
    }

    const isStarter = i < 14;
    const baseOvr = isStarter ? reputation - 1 : reputation - 4;
    const targetOvr = Math.max(58, Math.min(91, baseOvr + rng.nextInt(-3, 3)));
    const age = i === 2 || i === 17 || i === 24 ? rng.nextInt(18, 21) : rng.nextInt(21, 33);
    const foot: 'Right' | 'Left' | 'Both' =
      pos === 'LB' || pos === 'RW'
        ? rng.chance(0.75)
          ? 'Left'
          : 'Right'
        : rng.chance(0.18)
          ? 'Left'
          : rng.chance(0.08)
            ? 'Both'
            : 'Right';
    const heightCm =
      pos === 'GK' || pos === 'CB'
        ? rng.nextInt(185, 197)
        : pos === 'ST'
          ? rng.nextInt(178, 193)
          : rng.nextInt(170, 185);
    const intlCaps = targetOvr >= 82 ? rng.nextInt(15, 75) : targetOvr >= 77 ? rng.nextInt(2, 25) : 0;

    squad.push([
      firstName,
      lastName,
      pos,
      age,
      targetOvr,
      pool.nationality,
      shirtNo,
      foot,
      heightCm,
      intlCaps,
    ]);
  }

  return squad;
}

const CREST_STYLES: RealClubSeed['crestStyle'][] = [
  'shield-stripes',
  'royal-circle',
  'cannon-crest',
  'eagle-shield',
  'diamond-crown',
  'modern-hex',
];

const FORMATIONS: FormationCode[] = [
  '4-3-3',
  '4-2-3-1',
  '4-4-2',
  '3-5-2',
  '3-4-3',
  '4-1-4-1',
];

/**
 * Builds the complete global registry of 732+ real-world clubs across all 40 divisions
 * (plus legacy Enyimba International FC for backward-compatible saves).
 */
function buildCompleteGlobalClubsRegistry(): RealClubSeed[] {
  const detailedMap = new Map<string, RealClubSeed>();
  for (const club of REAL_WORLD_CLUBS) {
    detailedMap.set(club.id, club);
  }

  const allLeagueTables: Record<string, CompactClubTuple[]> = {
    ...EUROPE_TOP5_LEAGUE_CLUBS,
    ...EUROPE_AND_AMERICAS_LEAGUE_CLUBS,
    ...GLOBAL_CONTENDERS_LEAGUE_CLUBS,
  };

  const result: RealClubSeed[] = [];
  const addedIds = new Set<string>();

  for (const comp of FORTY_DOMESTIC_DIVISIONS) {
    const tuples = allLeagueTables[comp.id] ?? [];
    const divisionTier: 1 | 2 = comp.tier === 2 ? 2 : 1;

    for (let idx = 0; idx < tuples.length; idx++) {
      const [
        id,
        name,
        shortName,
        city,
        stadiumName,
        stadiumCapacity,
        foundedYear,
        primaryColor,
        secondaryColor,
        reputation,
        managerName,
        starRoster,
      ] = tuples[idx];

      if (addedIds.has(id)) continue;
      addedIds.add(id);

      const existingDetailed = detailedMap.get(id);
      if (existingDetailed) {
        result.push({
          ...existingDetailed,
          division: divisionTier,
          countryId: comp.countryId,
          leagueId: comp.id,
        });
        continue;
      }

      const finStatus: FinancialStatus =
        reputation >= 84
          ? 'Rich'
          : reputation >= 75
            ? 'Secure'
            : reputation >= 66
              ? 'Stable'
              : 'Tight';

      const crestStyle = CREST_STYLES[(id.length + foundedYear + idx) % CREST_STYLES.length];
      const defaultFormation = FORMATIONS[(id.length + idx) % FORMATIONS.length];

      result.push({
        id,
        name,
        shortName,
        division: divisionTier,
        countryId: comp.countryId,
        city,
        leagueId: comp.id,
        foundedYear,
        financialStatus: finStatus,
        managerName,
        rivalClubIds: [],
        clubHistory: `Founded in ${foundedYear} in ${city}, ${name} compete in ${comp.name} and play their home fixtures at ${stadiumName} (${stadiumCapacity.toLocaleString()} capacity).`,
        primaryColor,
        secondaryColor,
        crestStyle,
        stadiumName,
        stadiumCapacity,
        reputation,
        defaultFormation,
        squad: buildSquadForCompactClub(id, comp.countryId, reputation, starRoster),
      });
    }
  }

  // Also preserve any legacy club from REAL_WORLD_CLUBS not in the 40 divisions (e.g. Enyimba `club-falcon`)
  for (const legacy of REAL_WORLD_CLUBS) {
    if (!addedIds.has(legacy.id)) {
      addedIds.add(legacy.id);
      result.push(legacy);
    }
  }

  return result;
}

export const GLOBAL_CLUBS_REGISTRY: RealClubSeed[] = buildCompleteGlobalClubsRegistry();

/**
 * Helper to retrieve all clubs for a given country or league ID.
 */
export function getGlobalClubsByLeague(leagueId: string): RealClubSeed[] {
  return GLOBAL_CLUBS_REGISTRY.filter((c) => c.leagueId === leagueId);
}

export function getGlobalClubsByCountry(countryId: string): RealClubSeed[] {
  return GLOBAL_CLUBS_REGISTRY.filter((c) => c.countryId === countryId);
}

export function getCompetitionSummaryById(leagueId: string) {
  return COMPETITIONS_REGISTRY.find((c) => c.id === leagueId);
}
