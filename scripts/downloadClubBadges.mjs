import fs from 'node:fs';
import path from 'node:path';

const ENTRIES_PATH = path.resolve('src/data/clubBadgeEntries.json');
const PUBLIC_DIR = path.resolve('public/assets/football/clubs');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'UltimateFootballManager/1.0 (https://ultimate-football-manager-taupe.vercel.app; dev@ultimate-football-manager.local)',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

function safeWriteJson(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch {
    // Retry once after 200ms
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch {
      // Ignored
    }
  }
}

export async function downloadAllClubBadges(concurrency = 8) {
  const entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf8'));
  const clubs = Object.values(entries);

  console.log(`Starting local asset download for ${clubs.length} club crests...`);
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  let downloaded = 0;
  let alreadyExists = 0;
  let failed = 0;

  for (let i = 0; i < clubs.length; i += concurrency) {
    const batch = clubs.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (club) => {
        if (!club.badge_url) return;
        const countryDir = path.join(PUBLIC_DIR, club.country_id || 'OTHER');
        if (!fs.existsSync(countryDir)) fs.mkdirSync(countryDir, { recursive: true });

        const isSvg = club.badge_url.includes('.svg') && !club.badge_url.includes('.svg.png');
        const ext = isSvg ? 'svg' : 'png';
        const filename = `${club.club_id}.${ext}`;
        const localFilePath = path.join(countryDir, filename);
        const webPath = `/assets/football/clubs/${club.country_id || 'OTHER'}/${filename}`;

        if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 200) {
          club.local_image_path = webPath;
          alreadyExists++;
          return;
        }

        try {
          await downloadImage(club.badge_url, localFilePath);
          club.local_image_path = webPath;
          downloaded++;
        } catch (err) {
          failed++;
        }
      })
    );

    if ((i + concurrency) % 80 === 0 || i + concurrency >= clubs.length) {
      console.log(`Downloaded: ${downloaded}, Existing: ${alreadyExists}, Failed: ${failed} (Processed: ${Math.min(i + concurrency, clubs.length)}/${clubs.length})`);
      safeWriteJson(ENTRIES_PATH, entries);
    }
    await sleep(80);
  }

  safeWriteJson(ENTRIES_PATH, entries);
  console.log(`\n🎉 Club Crest Local Download Finished!`);
  console.log(`Downloaded: ${downloaded}, Pre-existing: ${alreadyExists}, Failed: ${failed}`);
}

if (process.argv[1]?.includes('downloadClubBadges')) {
  downloadAllClubBadges(8).catch(console.error);
}
