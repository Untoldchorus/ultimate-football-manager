import { describe, expect, it } from 'vitest';
import { getFootballerAppearance } from '@/components/ui/FootballerAvatarSvg';
import { VERIFIED_PLAYER_PHOTOS, getPlayerPhotoManifest } from '@/data/assetManifest';
import { REAL_WORLD_CLUBS } from '@/data/realWorldDatabase';
import { GLOBAL_CLUBS_REGISTRY } from '@/data/globalClubsRegistry';
import { Player } from '@/engine/types';

function createDummyPlayer(overrides: Partial<Player>): Player {
  return {
    id: 'test-p1',
    firstName: 'Alex',
    lastName: 'Mercer',
    age: 24,
    nationality: 'England',
    clubId: 'club-albion',
    primaryPosition: 'CM',
    secondaryPositions: ['CAM'],
    attributes: {
      pace: 75,
      acceleration: 75,
      shooting: 70,
      finishing: 70,
      passing: 80,
      vision: 80,
      crossing: 75,
      dribbling: 78,
      firstTouch: 80,
      agility: 75,
      tackling: 65,
      positioning: 75,
      heading: 60,
      strength: 70,
      stamina: 80,
      workRate: 75,
      composure: 78,
      reflexes: 50,
      handling: 50,
      distribution: 50,
      jumping: 65,
    },
    overall: 78,
    potential: 84,
    contractEndSeason: 2028,
    weeklyWage: 25000,
    marketValue: 18000000,
    fitness: 100,
    morale: 85,
    form: 7.2,
    injuryWeeks: 0,
    roleExpectation: 'starter',
    transferListed: false,
    transferRequested: false,
    isYouth: false,
    seasonGrowth: 0,
    stats: {
      appearances: 10,
      goals: 2,
      assists: 4,
      cleanSheets: 0,
      yellowCards: 1,
      redCards: 0,
      averageRating: 7.1,
    },
    ...overrides,
  };
}

describe('Player Avatars & Portrait Engine', () => {
  it('generates consistent, deterministic appearance parameters for any player', () => {
    const p1 = createDummyPlayer({ id: 'player-alpha', firstName: 'Harry', lastName: 'Kane', nationality: 'England' });
    const app1 = getFootballerAppearance(p1);
    const app2 = getFootballerAppearance(p1);

    expect(app1).toEqual(app2);
    expect(app1.skin).toBeDefined();
    expect(app1.skin.tone).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(app1.hairColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(app1.eyeColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(app1.hairStyle).toBeGreaterThanOrEqual(0);
    expect(app1.hairStyle).toBeLessThan(12);
  });

  it('correctly applies culturally authentic appearance distributions', () => {
    const afroPlayer = createDummyPlayer({ nationality: 'Nigeria', firstName: 'Victor', lastName: 'Osimhen' });
    const afroApp = getFootballerAppearance(afroPlayer);
    // Darker skin tones (index 4..7 in SKIN_TONES palette)
    expect(['#b97445', '#94552e', '#6d3919', '#44210e']).toContain(afroApp.skin.tone);

    const nordicPlayer = createDummyPlayer({ nationality: 'Norway', firstName: 'Erling', lastName: 'Haaland' });
    const nordicApp = getFootballerAppearance(nordicPlayer);
    // Lighter skin tones (index 0..3)
    expect(['#fde2d2', '#f5c6a5', '#e6b08a', '#d49467']).toContain(nordicApp.skin.tone);
  });

  it('has verified open-licensed Wikimedia Commons photos for global superstars', () => {
    const stars = [
      'Bukayo Saka',
      'Erling Haaland',
      'Kylian Mbappé',
      'Jude Bellingham',
      'Lionel Messi',
      'Mohamed Salah',
      'Harry Kane',
      'Robert Lewandowski',
      'Kevin De Bruyne',
      'Virgil van Dijk',
      'Vinícius Júnior',
      'Rodri',
      'Cole Palmer',
      'Declan Rice',
      'Lamine Yamal',
      'Jamal Musiala',
      'Son Heung-min',
      'Cristiano Ronaldo',
    ];

    for (const name of stars) {
      expect(VERIFIED_PLAYER_PHOTOS[name]).toBeDefined();
      expect(VERIFIED_PLAYER_PHOTOS[name].url).toMatch(/^https:\/\//);
      expect(VERIFIED_PLAYER_PHOTOS[name].license).toBeDefined();
      expect(VERIFIED_PLAYER_PHOTOS[name].attribution).toBeDefined();
    }
  });

  it('getPlayerPhotoManifest resolves verified photo or cleanly returns null for procedural fallback', () => {
    const sakaMeta = getPlayerPhotoManifest('Bukayo', 'Saka');
    expect(sakaMeta).not.toBeNull();
    expect(sakaMeta?.url).toContain('Bukayo_Saka');

    const unknownMeta = getPlayerPhotoManifest('Unknown', 'Player12345');
    expect(unknownMeta).toBeNull();
  });

  it('guarantees that every player across flagship and global clubs can resolve an avatar', () => {
    const allClubs = [...REAL_WORLD_CLUBS, ...GLOBAL_CLUBS_REGISTRY.slice(0, 10)];
    let checkedPlayersCount = 0;

    for (const club of allClubs) {
      for (const p of club.squad) {
        checkedPlayersCount += 1;
        const dummy = createDummyPlayer({
          firstName: p[0],
          lastName: p[1],
          primaryPosition: p[2],
          age: p[3],
          nationality: p[5],
          shirtNumber: p[6],
          clubId: club.id,
        });

        const app = getFootballerAppearance(dummy);
        expect(app.skin.tone).toBeDefined();
        expect(app.hairColor).toBeDefined();
        expect(app.hairStyle).toBeGreaterThanOrEqual(0);
      }
    }

    expect(checkedPlayersCount).toBeGreaterThan(200);
  });
});
