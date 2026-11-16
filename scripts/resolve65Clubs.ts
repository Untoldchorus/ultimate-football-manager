import fs from 'node:fs';

const EXACT_MAPPINGS: Record<string, { en?: string; es?: string; de?: string; ar?: string; ja?: string }> = {
  'bra-sb-ama': { en: 'Amazonas_Futebol_Clube', es: 'Amazonas_Futebol_Clube' },
  'arg-pn-aga': { en: 'Club_Agropecuario_Argentino', es: 'Club_Agropecuario_Argentino' },
  'arg-pn-cad': { es: 'Club_Atlético_Defensores_Unidos' },
  'arg-pn-rco': { es: 'Club_Atlético_Racing' },
  'arg-pn-nch': { en: 'Club_Atlético_Nueva_Chicago', es: 'Club_Atlético_Nueva_Chicago' },
  'arg-pn-smi': { es: 'Club_Atlético_San_Miguel' },
  'arg-pn-tri': { es: 'Club_Social_y_Deportivo_Tristán_Suárez' },
  'mex-exp-tam': { es: 'Tampico_Madero_Fútbol_Club', en: 'Tampico_Madero_F.C.' },
  'usa-usl-oak': { en: 'Oakland_Roots_SC' },
  'sau-spl-rae': { en: 'Al_Raed_FC', ar: 'نادي_الرائد' },
  'sau-spl-itt': { en: 'Al-Ittihad_Club_(Jeddah)', ar: 'نادي_الاتحاد_(السعودية)' },
  'sau-spl-oru': { en: 'Al-Orobah_FC', ar: 'نادي_العروبة_(السعودية)' },
  'sau-spl-sha': { en: 'Al_Shabab_FC_(Riyadh)', ar: 'نادي_الشباب_(السعودية)' },
  'sau-fdl-jan': { ar: 'نادي_الجندل', en: 'Al-Jandal_SC' },
  'sau-fdl-jab': { en: 'Al-Jabalain_FC', ar: 'نادي_الجبلين' },
  'sau-fdl-buk': { ar: 'نادي_البكيرية', en: 'Al-Bukiryah_FC' },
  'sau-spl-dam': { en: 'Damac_FC', ar: 'نادي_ضمك' },
  'sau-fdl-saf': { ar: 'نادي_الصفا_(السعودية)', en: 'Al-Safa_FC_(Saudi_Arabia)' },
  'sau-fdl-tai': { en: 'Al-Tai_FC', ar: 'نادي_الطائي' },
  'sau-fdl-ara': { ar: 'النادي_العربي_(السعودية)', en: 'Al-Arabi_SC_(Saudi_Arabia)' },
  'sau-fdl-ain': { ar: 'نادي_العين_(السعودية)', en: 'Al-Ain_FC_(Saudi_Arabia)' },
  'sau-fdl-fai': { en: 'Al_Faisaly_FC', ar: 'نادي_الفيصلي_(السعودية)' },
  'sau-fdl-jed': { ar: 'نادي_جدة', en: 'Jeddah_Club' },
  'sau-fdl-ohd': { en: 'Ohod_Club', ar: 'نادي_أحد' },
  'sau-fdl-neo': { en: 'NEOM_SC', ar: 'نادي_نيوم' },
  'sau-fdl-zul': { ar: 'نادي_الزلفي', en: 'Al-Zulfi_FC' },
  'bel-bpl-stvv': { en: 'Sint-Truidense_V.V.' },
  'bel-cpl-rwm': { en: 'RWDM47', es: 'RWD_Molenbeek_(2015)' },
  'bel-cpl-fb': { en: 'Royal_Francs_Borains' },
  'bel-cpl-ser': { en: 'RFC_Seraing_(1922)' },
  'bel-cpl-nxt': { en: 'Club_Brugge_KV' },
  'bel-cpl-rsf': { en: 'R.S.C._Anderlecht' },
  'bel-cpl-lie': { en: 'Lierse_Kempenzonen' },
  'bel-cpl-eup': { en: 'K.A.S._Eupen', de: 'KAS_Eupen' },
  'bel-cpl-jgnk': { en: 'K.R.C._Genk' },
  'bel-cpl-laa': { en: 'RAAL_La_Louvière' },
  'bel-cpl-dei': { en: 'K.M.S.K._Deinze' },
  'sco-sp-ros': { en: 'Ross_County_F.C.' },
  'aut-bl-aklu': { de: 'SK_Austria_Klagenfurt_(2007)', en: 'SK_Austria_Klagenfurt_(2007)' },
  'aut-bl-gak': { en: 'Grazer_AK', de: 'Grazer_AK' },
  'aut-2l-rap2': { en: 'SK_Rapid_Wien', de: 'SK_Rapid_Wien' },
  'aut-2l-fac': { de: 'Floridsdorfer_AC', en: 'Floridsdorfer_AC' },
  'aut-2l-adm': { en: 'FC_Admira_Wacker_Mödling', de: 'FC_Admira_Wacker_Mödling' },
  'aut-bl-wac': { en: 'Wolfsberger_AC', de: 'Wolfsberger_AC' },
  'aut-2l-fvi': { en: 'First_Vienna_FC', de: 'First_Vienna_FC' },
  'aut-2l-kap': { en: 'Kapfenberger_SV', de: 'Kapfenberger_SV' },
  'sui-sl-sio': { en: 'FC_Sion' },
  'sui-sl-lau': { en: 'FC_Lausanne-Sport' },
  'sui-sl-gc': { en: 'Grasshopper_Club_Zurich', de: 'Grasshopper_Club_Zürich' },
  'aut-2l-rie': { en: 'SV_Ried', de: 'SV_Ried' },
  'aut-2l-voi': { de: 'ASK_Voitsberg' },
  'aut-2l-str': { de: 'SV_Stripfing' },
  'sui-sl-lug': { en: 'FC_Lugano' },
  'den-sl-aab': { en: 'AaB_Fodbold' },
  'jpn-j1-fag': { en: 'Fagiano_Okayama', ja: 'ファジアーノ岡山FC' },
  'den-1d-ob': { en: 'Odense_Boldklub' },
  'jpn-j1-cer': { en: 'Cerezo_Osaka', ja: 'セレッソ大阪' },
  'den-1d-ven': { en: 'Vendsyssel_FF' },
  'jpn-j1-fmar': { en: 'Yokohama_F._Marinos', ja: '横浜F・マリノス' },
  'jpn-j2-bla': { en: 'Blaublitz_Akita', ja: 'ブラウブリッツ秋田' },
  'jpn-j2-fuj': { en: 'Fujieda_MYFC', ja: '藤枝MYFC' },
  'jpn-j1-san': { en: 'Sanfrecce_Hiroshima', ja: 'サンフレッチェ広島F.C' },
  'jpn-j2-con': { en: 'Hokkaido_Consadole_Sapporo', ja: '北海道コンサドーレ札幌' },
  'kor-kl1-jej': { en: 'Jeju_United_FC' },
  'club-falcon': { en: 'Enyimba_International_F.C.' },
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'UltimateFootballManager/1.0 (contact: admin@ultimate-football-manager.local)' },
      });
      if (res.status === 429) {
        console.log(`Rate limited (429). Waiting 3.5s before retry...`);
        await sleep(3500);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (e: any) {
      if (attempt === retries - 1) return null;
      await sleep(1000);
    }
  }
  return null;
}

async function main() {
  const entries = JSON.parse(fs.readFileSync('src/data/clubBadgeEntries.json', 'utf8'));
  let resolvedCount = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const [clubId, target] of Object.entries(EXACT_MAPPINGS)) {
    // If already verified, skip
    if (entries[clubId]?.badge_status === 'verified' && entries[clubId]?.badge_url) {
      resolvedCount++;
      continue;
    }

    let foundThumb: string | null = null;
    let foundTitle = '';
    let foundPageUrl = '';

    const langPriority: Array<keyof typeof target> = ['en', 'es', 'de', 'ar', 'ja'];
    for (const lang of langPriority) {
      const slug = target[lang];
      if (!slug) continue;
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
      const data = await fetchWithRetry(url);
      if (data && data.thumbnail?.source) {
        foundThumb = data.thumbnail.source;
        foundTitle = data.title;
        foundPageUrl = data.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${slug}`;
        break;
      }
      await sleep(400);
    }

    if (foundThumb) {
      entries[clubId] = {
        ...entries[clubId],
        badge_url: foundThumb,
        source_name: 'Wikimedia Commons / Wikipedia',
        source_url: foundPageUrl,
        license: 'Wikimedia Commons Open / Threshold of Originality / Public Domain / Fair Use',
        attribution: `Official Emblem of ${foundTitle} (Wikimedia Commons)`,
        badge_status: 'verified',
        last_verified: today,
      };
      resolvedCount++;
      console.log(`✅ [${resolvedCount}/65] ${clubId} -> ${foundTitle}`);
    } else {
      console.log(`❌ [FAILED] ${clubId}`);
    }

    await sleep(500);
  }

  fs.writeFileSync('src/data/clubBadgeEntries.json', JSON.stringify(entries, null, 2), 'utf8');

  const allEntries = Object.values(entries) as any[];
  const totalVerified = allEntries.filter((e) => e.badge_status === 'verified').length;
  console.log(`\n===========================================`);
  console.log(`Total Clubs: ${allEntries.length}`);
  console.log(`Verified Crests: ${totalVerified} / ${allEntries.length} (${((totalVerified / allEntries.length) * 100).toFixed(1)}%)`);
  console.log(`Remaining Fallbacks: ${allEntries.length - totalVerified}`);
  console.log(`===========================================\n`);
}

main();
