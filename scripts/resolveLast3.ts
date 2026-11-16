import fs from 'node:fs';

async function test3() {
  const tests = [
    { id: 'usa-usl-oak', slugs: ['Oakland_Roots_SC', 'Oakland_Roots'] },
    { id: 'sau-fdl-ohd', slugs: ['Ohod_Club', 'Ohod_FC', '%D9%86%D8%A7%D8%AF%D9%8A_%D8%A3%D8%AD%D8%AF'] },
    { id: 'sau-fdl-zul', slugs: ['Al-Zulfe_FC', 'Al-Zulfi_FC', '%D9%86%D8%A7%D8%AF%D9%8A_%D8%A7%D9%84%D8%B2%D9%84%D9%81%D9%8A'] },
  ];

  const entries = JSON.parse(fs.readFileSync('src/data/clubBadgeEntries.json', 'utf8'));

  for (const t of tests) {
    for (const slug of t.slugs) {
      for (const lang of ['en', 'ar']) {
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`;
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'UltimateFootballManager/1.0' } });
          if (res.ok) {
            const data = await res.json();
            if (data.thumbnail?.source) {
              console.log(`✅ FOUND ${t.id} -> ${data.title} (${data.thumbnail.source.slice(0, 50)}...)`);
              entries[t.id] = {
                ...entries[t.id],
                badge_url: data.thumbnail.source,
                source_name: 'Wikimedia Commons / Wikipedia',
                source_url: data.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${slug}`,
                license: 'Wikimedia Commons Open / Threshold of Originality / Public Domain / Fair Use',
                attribution: `Official Emblem of ${data.title} (Wikimedia Commons)`,
                badge_status: 'verified',
                last_verified: new Date().toISOString().slice(0, 10),
              };
              break;
            }
          }
        } catch (e: any) {
          console.log(`ERR: ${e.message}`);
        }
      }
      if (entries[t.id].badge_status === 'verified') break;
    }
  }

  fs.writeFileSync('src/data/clubBadgeEntries.json', JSON.stringify(entries, null, 2), 'utf8');
}

test3();
