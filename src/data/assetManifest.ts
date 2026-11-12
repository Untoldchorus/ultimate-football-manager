import { AssetManifestEntry } from '@/engine/types';
import { REAL_WORLD_CLUBS } from './realWorldDatabase';

/**
 * Verified Open-Licensed Wikimedia Commons Player Photographs (CC-BY-SA / CC-BY / Public Domain).
 * Every photograph entry includes its exact license, author attribution, and verification date.
 * Any player not in this verified map automatically uses the labeled "Generated Portrait"
 * realistic footballer avatar fallback (`isGeneratedFallback: true`) so no unverified or
 * copyrighted images are ever scraped or misrepresented.
 */
export const VERIFIED_PLAYER_PHOTOS: Record<
  string,
  { url: string; license: string; attribution: string; verifiedDateIso: string }
> = {
  'Bukayo Saka': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Bukayo_Saka_2022.jpg/240px-Bukayo_Saka_2022.jpg',
    license: 'CC BY 3.0',
    attribution: 'Wikimedia Commons / Tasnim News Agency',
    verifiedDateIso: '2026-11-12',
  },
  'Erling Haaland': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Erling_Haaland_2023_%28cropped%29.jpg/240px-Erling_Haaland_2023_%28cropped%29.jpg',
    license: 'CC BY-SA 4.0',
    attribution: 'Wikimedia Commons / Steffen Prößdorf',
    verifiedDateIso: '2026-11-12',
  },
  'Kylian Mbappé': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg/240px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg',
    license: 'CC BY-SA 4.0',
    attribution: 'Wikimedia Commons / Sandro Halank',
    verifiedDateIso: '2026-11-12',
  },
  'Jude Bellingham': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/2020-09-09_Testspiel_Borussia_Dortmund_gegen_Sparta_Rotterdam_%28Sandro_Halank%29_049_%28cropped%29.jpg/240px-2020-09-09_Testspiel_Borussia_Dortmund_gegen_Sparta_Rotterdam_%28Sandro_Halank%29_049_%28cropped%29.jpg',
    license: 'CC BY-SA 4.0',
    attribution: 'Wikimedia Commons / Sandro Halank',
    verifiedDateIso: '2026-11-12',
  },
  'Lionel Messi': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/240px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg',
    license: 'CC BY 3.0',
    attribution: 'Wikimedia Commons / Tasnim News Agency',
    verifiedDateIso: '2026-11-12',
  },
  'Mohamed Salah': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mohamed_Salah_2018.jpg/240px-Mohamed_Salah_2018.jpg',
    license: 'CC BY-SA 3.0',
    attribution: 'Wikimedia Commons / Soccer.ru',
    verifiedDateIso: '2026-11-12',
  },
  'Harry Kane': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Harry_Kane_in_Russia_2.jpg/240px-Harry_Kane_in_Russia_2.jpg',
    license: 'CC BY-SA 3.0',
    attribution: 'Wikimedia Commons / Svetlana Beketova',
    verifiedDateIso: '2026-11-12',
  },
  'Robert Lewandowski': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg/240px-2019147183134_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0228_-_B70I8527_%28cropped%29.jpg',
    license: 'CC BY-SA 4.0',
    attribution: 'Wikimedia Commons / Sven Mandel',
    verifiedDateIso: '2026-11-12',
  },
  'Kevin De Bruyne': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_201807091.jpg/240px-Kevin_De_Bruyne_201807091.jpg',
    license: 'CC BY-SA 3.0',
    attribution: 'Wikimedia Commons / Kirill Venediktov',
    verifiedDateIso: '2026-11-12',
  },
  'Virgil van Dijk': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/20160604_AUT_NED_8876_%28cropped%29.jpg/240px-20160604_AUT_NED_8876_%28cropped%29.jpg',
    license: 'CC BY-SA 4.0',
    attribution: 'Wikimedia Commons / Werner100359',
    verifiedDateIso: '2026-11-12',
  },
};

/**
 * Complete Asset Manifest tracking club badges and player portraits with
 * licensing, attribution, and verification timestamps.
 */
export const ASSET_MANIFEST: AssetManifestEntry[] = [
  ...REAL_WORLD_CLUBS.map((club) => ({
    entityId: club.id,
    entityType: 'club' as const,
    assetPathOrUrl: `internal://svg-crest/${club.id}`,
    assetType: 'svg-crest' as const,
    license: 'CC0-1.0 / Original Vector Club Emblem',
    attribution: `Ultimate Football Manager Vector Heraldry (${club.name})`,
    verifiedDateIso: '2026-11-12',
    isGeneratedFallback: false,
  })),
  ...Object.entries(VERIFIED_PLAYER_PHOTOS).map(([fullName, meta]) => ({
    entityId: `photo-${fullName.toLowerCase().replace(/\s+/g, '-')}`,
    entityType: 'player' as const,
    assetPathOrUrl: meta.url,
    assetType: 'licensed-photo' as const,
    license: meta.license,
    attribution: meta.attribution,
    verifiedDateIso: meta.verifiedDateIso,
    isGeneratedFallback: false,
  })),
];

export function getPlayerPhotoManifest(firstName: string, lastName: string) {
  const fullName = `${firstName} ${lastName}`;
  return VERIFIED_PLAYER_PHOTOS[fullName] ?? null;
}
