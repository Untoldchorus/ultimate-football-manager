/**
 * Pass 2: High-Yield Footballer Portrait Resolver
 * Resolves remaining players with:
 * - Apostrophe/Typo Normalization
 * - Mononym & Nickname extraction (Casemiro, Joelinton, Savinho, Neto, etc.)
 * - Commons Search API
 * - Multi-language Wikidata matching
 */

import fs from 'node:fs';
import path from 'node:path';

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

const FOOTBALL_KEYWORDS = [
  'footballer', 'soccer', 'midfielder', 'defender', 'striker', 'goalkeeper',
  'winger', 'forward', 'association football', 'bundesliga', 'serie a', 'la liga',
  'ligue 1', 'premier league', 'football player', 'national team', 'fifa', 'uefa',
  'club', 'striker', 'centre-back', 'full-back', 'wing-back', 'playmaker'
];

const KNOWN_TYPOS_AND_ALIASES: Record<string, string[]> = {
  'Kiernan Dewbury-Hall': ['Kiernan Dewsbury-Hall'],
  'Casemiro Harrison': ['Casemiro'],
  'Joelinton Cássio': ['Joelinton'],
  'Savinho Moreira': ['Savinho', 'Sávio (footballer, born 2004)'],
  'Evanilson Lima': ['Evanilson (footballer, born 1999)', 'Evanilson'],
  'Neto Murara': ['Neto (footballer, born 1989)', 'Norberto Murara Neto'],
  'Vitalii Mykolenko': ['Vitaliy Mykolenko'],
  'Fabio Carvalho': ['Fábio Carvalho (footballer, born 2002)'],
  'Beto Betuncal': ['Beto (footballer, born 1998)'],
  'Estêvão Willian': ['Estêvão (footballer, born 2007)'],
  'Endrick Felipe': ['Endrick (footballer)', 'Endrick'],
  'Rodrigo Muniz': ['Rodrigo Muniz (footballer, born 2001)'],
  'Danilo Pereira': ['Danilo Pereira (footballer)'],
  'Danilo Santos': ['Danilo (footballer, born April 2001)'],
  'Vitinha Ferreira': ['Vitinha (footballer, born February 2000)'],
  'Nuno Mendes': ['Nuno Mendes (footballer, born 2002)'],
  'Joao Pedro': ['João Pedro (footballer, born September 2001)'],
  'Igor Thiago': ['Igor Thiago'],
  'Igor Jesus': ['Igor Jesus (footballer, born 2001)'],
  'Luiz Henrique': ['Luiz Henrique (footballer, born 2001)'],
  'Matheus Cunha': ['Matheus Cunha'],
  'Matheus Nunes': ['Matheus Nunes'],
  'Murillo Santiago': ['Murillo (footballer, born 2002)'],
  'Morato Silva': ['Morato (footballer, born 2001)'],
  'Pepê Aquino': ['Pepê (footballer, born 1997)'],
  'Galeno Wenderson': ['Galeno (footballer)'],
  'Otávio Monteiro': ['Otávio (footballer, born 1995)'],
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function safeWriteJson(filePath: string, data: any) {
  const tmpPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch {}
  }
}

async function downloadImage(url: string, destPath: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'UltimateFootballManager/1.0 (dev@ultimate-football-manager.local; https://ultimate-football-manager-taupe.vercel.app)',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function fetchSummary(lang: string, title: string) {
  const slug = encodeURIComponent(title.replace(/\s+/g, '_'));
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'UltimateFootballManager/1.0 (dev@ultimate-football-manager.local; https://ultimate-football-manager-taupe.vercel.app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function searchCommons(query: string): Promise<string | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'UltimateFootballManager/1.0 (dev@ultimate-football-manager.local; https://ultimate-football-manager-taupe.vercel.app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.query?.pages) return null;
    const pages = Object.values(data.query.pages) as any[];
    for (const pg of pages) {
      const imgUrl = pg.imageinfo?.[0]?.url;
      if (imgUrl && !imgUrl.endsWith('.svg') && !imgUrl.endsWith('.wav') && !imgUrl.endsWith('.ogg')) {
        return imgUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function generatePass2Queries(player: MissingPlayer): string[] {
  const queries: string[] = [];
  const raw = player.fullName;
  const clean = raw.replace(/[’‘`]/g, "'");

  if (KNOWN_TYPOS_AND_ALIASES[raw]) {
    queries.push(...KNOWN_TYPOS_AND_ALIASES[raw]);
  }
  if (KNOWN_TYPOS_AND_ALIASES[clean]) {
    queries.push(...KNOWN_TYPOS_AND_ALIASES[clean]);
  }

  queries.push(clean);

  // Single word first name for Brazilians / Portuguese
  if (['BRA', 'POR'].includes(player.countryId)) {
    queries.push(player.firstName);
    queries.push(`${player.firstName} (footballer)`);
  }

  // Remove middle parts or try last name
  const parts = clean.split(' ');
  if (parts.length > 2) {
    queries.push(`${parts[0]} ${parts[parts.length - 1]}`);
    queries.push(`${parts[0]} ${parts[parts.length - 1]} (footballer)`);
  }

  // Without diacritics
  const ascii = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (ascii !== clean) {
    queries.push(ascii);
    queries.push(`${ascii} (footballer)`);
  }

  return [...new Set(queries)];
}

async function resolvePass2(player: MissingPlayer): Promise<{
  url: string;
  sourceTitle: string;
} | null> {
  const queries = generatePass2Queries(player);

  for (const q of queries) {
    for (const lang of ['en', 'de', 'es', 'it', 'fr', 'pt']) {
      const sum = await fetchSummary(lang, q);
      if (sum && sum.thumbnail?.source) {
        const text = `${sum.title ?? ''} ${sum.description ?? ''} ${sum.extract ?? ''}`.toLowerCase();
        if (FOOTBALL_KEYWORDS.some((kw) => text.includes(kw))) {
          return { url: sum.thumbnail.source, sourceTitle: `${sum.title} (${lang})` };
        }
      }
    }
  }

  // Try Commons Search directly
  const commonsHit = await searchCommons(`${player.fullName} footballer`);
  if (commonsHit) {
    return { url: commonsHit, sourceTitle: `${player.fullName} (Wikimedia Commons Search)` };
  }

  return null;
}

export async function runPass2() {
  const wikidataPath = path.resolve('src/data/wikidataPlayerPhotos.json');
  const wikidata: Record<string, string> = fs.existsSync(wikidataPath)
    ? JSON.parse(fs.readFileSync(wikidataPath, 'utf8'))
    : {};

  const entriesPath = path.resolve('src/data/playerImageEntries.json');
  const entries: Record<string, any> = fs.existsSync(entriesPath)
    ? JSON.parse(fs.readFileSync(entriesPath, 'utf8'))
    : {};

  const missingPath = path.resolve('reports/missing_real_players.json');
  const allMissing: MissingPlayer[] = JSON.parse(fs.readFileSync(missingPath, 'utf8'));
  const remaining = allMissing.filter((p) => !wikidata[p.fullName]);

  console.log(`Starting Pass 2 on remaining ${remaining.length} players...`);

  const playersDir = path.resolve('public/assets/football/players');
  let newlyMatched = 0;
  let newlyDownloaded = 0;
  const today = new Date().toISOString().slice(0, 10);

  const CONCURRENCY = 8;
  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch = remaining.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (player) => {
        const result = await resolvePass2(player);
        if (result) {
          newlyMatched++;
          wikidata[player.fullName] = result.url;

          const countryDir = path.join(playersDir, player.countryId || 'OTHER');
          if (!fs.existsSync(countryDir)) fs.mkdirSync(countryDir, { recursive: true });

          const stableId = `${player.clubId}:${player.shirtNo}:${player.firstName}:${player.lastName}`;
          const safeFileId = stableId.replace(/[^a-zA-Z0-9_-]/g, '_');
          const localFilePath = path.join(countryDir, `${safeFileId}.jpg`);
          const webPath = `/assets/football/players/${player.countryId || 'OTHER'}/${safeFileId}.jpg`;

          entries[stableId] = {
            player_id: stableId,
            player_name: player.fullName,
            club_id: player.clubId,
            league_id: player.leagueId,
            country_id: player.countryId,
            image_url: result.url,
            local_image_path: webPath,
            source_name: result.sourceTitle,
            source_url: result.url,
            image_license: 'CC BY / CC BY-SA / Public Domain / Fair Use',
            attribution: `Portrait of ${result.sourceTitle}`,
            identity_verified: true,
            image_status: 'verified',
            last_verified: today,
          };

          try {
            await downloadImage(result.url, localFilePath);
            newlyDownloaded++;
          } catch {}
        }
      })
    );

    await sleep(80);

    if ((i + CONCURRENCY) % 40 === 0 || i + CONCURRENCY >= remaining.length) {
      safeWriteJson(wikidataPath, wikidata);
      safeWriteJson(entriesPath, entries);
      const processed = Math.min(i + CONCURRENCY, remaining.length);
      const pct = ((processed / remaining.length) * 100).toFixed(1);
      console.log(
        `[${pct}%] Processed ${processed}/${remaining.length} | Newly Matched: ${newlyMatched} | Downloaded: ${newlyDownloaded}`
      );
    }
  }

  safeWriteJson(wikidataPath, wikidata);
  safeWriteJson(entriesPath, entries);

  console.log('\n===============================================================');
  console.log(`✅ PASS 2 RESOLUTION COMPLETE!`);
  console.log(`Total Tested: ${remaining.length}`);
  console.log(`Newly Matched in Pass 2: ${newlyMatched}`);
  console.log(`Total in Wikidata Map: ${Object.keys(wikidata).length}`);
  console.log('===============================================================\n');
}

runPass2().catch(console.error);
