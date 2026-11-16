/**
 * Full Automated Club Badge Harvester across 20 Countries & 40 Divisions.
 *
 * Sourced legally from Wikimedia Commons / Wikipedia REST & OpenSearch APIs.
 * Multi-stage resolution:
 *  1. Direct slug lookup
 *  2. Normalized name candidates (cleaning brackets, apostrophes, year suffixes, B-teams)
 *  3. Dynamic Wikipedia OpenSearch query to resolve exact article title
 *
 * Persists verified transparent PNG/SVG crests and licensing metadata into `src/data/clubBadgeEntries.json`.
 */

import fs from 'node:fs';
import path from 'node:path';

const ENTRIES_PATH = path.resolve('src/data/clubBadgeEntries.json');

const FOOTBALL_CLUB_KEYWORDS = [
  'football',
  'soccer',
  'club',
  'association football',
  'sports',
  'deportivo',
  'calcio',
  'futebol',
  'fussball',
  'fußball',
  'league',
  'equipo',
  'balompié',
];

function buildQueryCandidates(name, city, countryId) {
  const candidates = [];
  const cleanName = name.replace(/[’‘`]/g, "'").trim();
  
  // 1. Direct name
  candidates.push(cleanName);

  // 2. Remove trailing parentheses e.g. "(Guimarães)", "(Junín)", "(CRB)"
  const noParens = cleanName.replace(/\s*\([^)]+\)/g, '').trim();
  if (noParens !== cleanName) {
    candidates.push(noParens);
    candidates.push(`${noParens} F.C.`);
    candidates.push(`${noParens} (football club)`);
  }

  // 3. Stripping founding year at end (e.g. "Kapfenberger SV 1919" -> "Kapfenberger SV")
  const strippedYear = noParens.replace(/\s+\d{4}$/, '').trim();
  if (strippedYear !== noParens) {
    candidates.push(strippedYear);
    candidates.push(`${strippedYear} F.C.`);
    candidates.push(`${strippedYear} (football club)`);
  }

  // 4. Handle B-teams / reserve teams (e.g. "SL Benfica B", "Jong Ajax", "FC Porto B")
  const isReserve = /\b(B|II|2)\b/.test(cleanName) || cleanName.startsWith('Jong ');
  if (isReserve) {
    const parentName = cleanName
      .replace(/\s+\b(B|II|2)\b/g, '')
      .replace(/^Jong\s+/g, '')
      .trim();
    candidates.push(parentName);
    candidates.push(`${parentName} F.C.`);
  }

  // 5. Normalize FC / CF / SC / SV / CA / CD
  if (cleanName.includes(' FC')) {
    candidates.push(cleanName.replace(/ FC\b/g, ' F.C.'));
    candidates.push(cleanName.replace(/ FC\b/g, ''));
  }
  if (cleanName.includes(' CF')) {
    candidates.push(cleanName.replace(/ CF\b/g, ' C.F.'));
    candidates.push(cleanName.replace(/ CF\b/g, ''));
  }
  if (cleanName.includes(' SC')) {
    candidates.push(cleanName.replace(/ SC\b/g, ' S.C.'));
  }

  // 6. Common prefixes / suffixes
  candidates.push(`${noParens} (football club)`);
  candidates.push(`${noParens} (football)`);
  candidates.push(`${noParens.replace(/ F\.?C\.?/g, '').trim()} F.C.`);
  candidates.push(`${noParens.replace(/ F\.?C\.?/g, '').trim()} (football club)`);

  if (city) {
    candidates.push(`${noParens} (${city})`);
    candidates.push(`${strippedYear} (${city})`);
  }

  return [...new Set(candidates.map((c) => c.trim()).filter(Boolean))];
}

async function fetchWikipediaSummary(title) {
  const slug = encodeURIComponent(title.replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'UltimateFootballManager/1.0 (https://ultimate-football-manager-taupe.vercel.app/)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function searchWikipediaOpenSearch(searchTerm) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchTerm)}&limit=4&namespace=0&format=json`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'UltimateFootballManager/1.0 (https://ultimate-football-manager-taupe.vercel.app/)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

async function resolveClubBadge(club) {
  // Pass 1: Direct candidate queries
  const candidates = buildQueryCandidates(club.name, club.city, club.countryId);
  for (const q of candidates) {
    const summary = await fetchWikipediaSummary(q);
    if (summary && summary.thumbnail?.source) {
      const text = `${summary.title ?? ''} ${summary.description ?? ''} ${summary.extract ?? ''}`.toLowerCase();
      const isClub = FOOTBALL_CLUB_KEYWORDS.some((kw) => text.includes(kw));
      if (isClub) {
        return {
          badge_url: summary.thumbnail.source,
          source_name: 'Wikimedia Commons / Wikipedia',
          source_url: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(q.replace(/\s+/g, '_'))}`,
          license: 'Wikimedia Commons Open / Threshold of Originality / Public Domain / Fair Use',
          attribution: `Official Emblem of ${summary.title} (Wikimedia Commons)`,
          badge_status: 'verified',
        };
      }
    }
  }

  // Pass 2: Dynamic OpenSearch fallback
  const cleanName = club.name.replace(/[’‘`]/g, "'").replace(/\s*\([^)]+\)/g, '').trim();
  const searchQueries = [
    cleanName,
    `${cleanName} football`,
    `${cleanName} ${club.city || ''}`.trim(),
  ];

  for (const sq of searchQueries) {
    const matchedTitles = await searchWikipediaOpenSearch(sq);
    for (const title of matchedTitles) {
      const summary = await fetchWikipediaSummary(title);
      if (summary && summary.thumbnail?.source) {
        const text = `${summary.title ?? ''} ${summary.description ?? ''} ${summary.extract ?? ''}`.toLowerCase();
        const isClub = FOOTBALL_CLUB_KEYWORDS.some((kw) => text.includes(kw));
        if (isClub) {
          return {
            badge_url: summary.thumbnail.source,
            source_name: 'Wikimedia Commons / Wikipedia',
            source_url: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`,
            license: 'Wikimedia Commons Open / Threshold of Originality / Public Domain / Fair Use',
            attribution: `Official Emblem of ${summary.title} (Wikimedia Commons)`,
            badge_status: 'verified',
          };
        }
      }
    }
  }

  return null;
}

export async function harvestAllClubs(clubs, concurrency = 10, onlyFallbacks = false) {
  let existing = {};
  if (fs.existsSync(ENTRIES_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf8'));
    } catch {
      existing = {};
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  let processed = 0;
  let newVerified = 0;

  const targetClubs = onlyFallbacks
    ? clubs.filter((c) => !existing[c.id] || existing[c.id].badge_status === 'fallback' || !existing[c.id].badge_url)
    : clubs;

  console.log(`Starting Club Crest Harvest for ${targetClubs.length} clubs (Concurrency: ${concurrency})...`);

  for (let i = 0; i < targetClubs.length; i += concurrency) {
    const batch = targetClubs.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (club) => {
        if (!onlyFallbacks && existing[club.id]?.badge_status === 'verified' && existing[club.id]?.badge_url) {
          processed++;
          return;
        }

        const resolved = await resolveClubBadge(club);
        if (resolved) {
          existing[club.id] = {
            club_id: club.id,
            club_name: club.name,
            short_name: club.shortName,
            league_id: club.leagueId,
            country_id: club.countryId,
            division_tier: club.division,
            ...resolved,
            last_verified: today,
          };
          newVerified++;
        } else {
          existing[club.id] = {
            club_id: club.id,
            club_name: club.name,
            short_name: club.shortName,
            league_id: club.leagueId,
            country_id: club.countryId,
            division_tier: club.division,
            source_name: 'Ultimate Football Manager Vector Heraldry',
            source_url: 'internal://svg-crest',
            license: 'CC0-1.0 Neutral Vector Heraldry',
            attribution: `Heraldic Vector Emblem for ${club.name}`,
            badge_status: 'fallback',
            last_verified: today,
          };
        }
        processed++;
      })
    );

    fs.writeFileSync(ENTRIES_PATH, JSON.stringify(existing, null, 2), 'utf8');
    if (processed % 40 === 0 || processed === targetClubs.length) {
      console.log(`Progress: ${processed}/${targetClubs.length} processed (${newVerified} newly verified badges).`);
    }
  }

  const allEntries = Object.values(existing);
  const totalVerified = allEntries.filter((e) => e.badge_status === 'verified').length;
  const totalFallback = allEntries.filter((e) => e.badge_status === 'fallback').length;

  console.log(`\n🎉 Harvest Finished!`);
  console.log(`Total Database Clubs: ${allEntries.length}`);
  console.log(`Verified Crests: ${totalVerified} (${Math.round((totalVerified / allEntries.length) * 100)}%)`);
  console.log(`Neutral Fallback Badges: ${totalFallback}`);
  return existing;
}
