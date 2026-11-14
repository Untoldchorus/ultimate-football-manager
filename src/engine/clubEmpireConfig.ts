import {
  BuildingLevelConfig,
  BuildingPrerequisiteRule,
  BuildingVisualStage,
  ClubDevelopmentTier,
  ClubEmpireBuildingCategory,
  ClubEmpireBuildingDefinition,
  ClubEmpireBuildingId,
  LandPlot,
} from './types';

export const CLUB_DEVELOPMENT_TIERS: {
  tier: ClubDevelopmentTier;
  maxBuildingLevel: number;
  minScore: number;
  minReputation: number;
  maxExpansionsAllowed: number;
}[] = [
  { tier: 'Local Club', maxBuildingLevel: 2, minScore: 0, minReputation: 0, maxExpansionsAllowed: 0 },
  { tier: 'Developing Club', maxBuildingLevel: 4, minScore: 140, minReputation: 52, maxExpansionsAllowed: 1 },
  { tier: 'Professional Club', maxBuildingLevel: 6, minScore: 340, minReputation: 64, maxExpansionsAllowed: 2 },
  { tier: 'Elite Club', maxBuildingLevel: 8, minScore: 600, minReputation: 76, maxExpansionsAllowed: 3 },
  { tier: 'World-Class Club', maxBuildingLevel: 10, minScore: 840, minReputation: 86, maxExpansionsAllowed: 5 },
];

export function getVisualStageForLevel(level: number): BuildingVisualStage {
  if (level <= 2) return 'Basic';
  if (level <= 4) return 'Developing';
  if (level <= 6) return 'Professional';
  if (level <= 8) return 'Elite';
  return 'World-Class';
}

export function getMaxLevelForTier(tier: ClubDevelopmentTier): number {
  return CLUB_DEVELOPMENT_TIERS.find((t) => t.tier === tier)?.maxBuildingLevel ?? 2;
}

export const PITCH_INJURY_REDUCTION_BY_LEVEL: number[] = [
  0, 5, 12, 20, 30, 40, 52, 64, 75, 84, 90,
];

export const STADIUM_CAPACITY_BY_LEVEL: number[] = [
  1500, 2000, 4500, 8000, 11500, 15000, 22000, 31000, 42000, 52000, 60000,
];

export const YOUTH_CAPACITY_BY_LEVEL: number[] = [
  0, 5, 7, 10, 15, 20, 26, 32, 38, 44, 50,
];

export const HOSPITAL_PRODUCTION_SCHEDULE: {
  minLevel: number;
  individualIntervalHours: number;
  individualStorageCap: number;
  teamIntervalHours: number | null;
  teamStorageCap: number;
}[] = [
  { minLevel: 1, individualIntervalHours: 12, individualStorageCap: 3, teamIntervalHours: null, teamStorageCap: 0 },
  { minLevel: 3, individualIntervalHours: 8, individualStorageCap: 5, teamIntervalHours: 48, teamStorageCap: 1 },
  { minLevel: 5, individualIntervalHours: 6, individualStorageCap: 8, teamIntervalHours: 36, teamStorageCap: 2 },
  { minLevel: 7, individualIntervalHours: 4, individualStorageCap: 11, teamIntervalHours: 24, teamStorageCap: 3 },
  { minLevel: 9, individualIntervalHours: 3, individualStorageCap: 15, teamIntervalHours: 18, teamStorageCap: 5 },
];

export function getHospitalScheduleForLevel(level: number) {
  let matched = HOSPITAL_PRODUCTION_SCHEDULE[0];
  for (const row of HOSPITAL_PRODUCTION_SCHEDULE) {
    if (level >= row.minLevel) matched = row;
  }
  return matched;
}

function buildLevels(
  baseCost: number,
  baseDurationMin: number,
  baseMaint: number,
  benefitFn: (lvl: number) => { value: number; label: string },
  prereqFn?: (lvl: number) => BuildingPrerequisiteRule | undefined
): BuildingLevelConfig[] {
  const levels: BuildingLevelConfig[] = [];
  for (let lvl = 1; lvl <= 10; lvl++) {
    const costMult = Math.pow(1.68, lvl - 1);
    const durMult = Math.pow(1.58, lvl - 1);
    const { value, label } = benefitFn(lvl);
    levels.push({
      level: lvl,
      upgradeCost: Math.round((baseCost * costMult) / 1000) * 1000,
      durationMinutes: Math.round(baseDurationMin * durMult),
      maintenanceWeekly: Math.round((baseMaint * Math.pow(1.42, lvl - 1)) / 100) * 100,
      benefitValue: value,
      benefitLabel: label,
      prerequisites: prereqFn ? prereqFn(lvl) : undefined,
    });
  }
  return levels;
}

export const CLUB_EMPIRE_BUILDINGS_CATALOG: Record<
  ClubEmpireBuildingId,
  ClubEmpireBuildingDefinition
> = {
  // ==========================================================================
  // CATEGORY A: STADIUM AND MATCHDAY INFRASTRUCTURE (7)
  // ==========================================================================
  football_pitch: {
    id: 'football_pitch',
    name: 'Football Pitch',
    category: 'stadium',
    description:
      'Improves grass quality, drainage, irrigation, and surface technology to reduce underlying injury risk (up to 90%) and boost squad morale.',
    plotSizeRequired: 'stadium',
    maxLevel: 10,
    startsBuiltAtLevel1: true,
    levels: buildLevels(
      120_000,
      15,
      3_500,
      (lvl) => ({
        value: PITCH_INJURY_REDUCTION_BY_LEVEL[lvl],
        label: `-${PITCH_INJURY_REDUCTION_BY_LEVEL[lvl]}% Injury Risk, +${Math.min(5, Math.ceil(lvl / 2))} Morale`,
      })
    ),
  },
  stadium_stands: {
    id: 'stadium_stands',
    name: 'Stadium Stands',
    category: 'stadium',
    description:
      'Expands matchday seating capacity across general, premium, and spectator concourses.',
    plotSizeRequired: 'stadium',
    maxLevel: 10,
    startsBuiltAtLevel1: true,
    levels: buildLevels(
      250_000,
      30,
      6_000,
      (lvl) => ({
        value: STADIUM_CAPACITY_BY_LEVEL[lvl],
        label: `${STADIUM_CAPACITY_BY_LEVEL[lvl].toLocaleString()} Seat Capacity`,
      })
    ),
  },
  vip_hospitality: {
    id: 'vip_hospitality',
    name: 'VIP Hospitality Centre',
    category: 'stadium',
    description:
      'Unlocks executive suites, hospitality lounges, and high-margin VIP matchday seating.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    levels: buildLevels(
      220_000,
      25,
      4_800,
      (lvl) => ({
        value: lvl * 120,
        label: `${lvl * 120} VIP Seats & +${lvl * 4}% Hospitality Yield`,
      }),
      (lvl) => ({
        requiredBuildings: [{ buildingId: 'stadium_stands', minLevel: Math.max(3, lvl) }],
      })
    ),
  },
  parking_transport: {
    id: 'parking_transport',
    name: 'Parking & Transport Centre',
    category: 'stadium',
    description:
      'Expands visitor parking, shuttle hubs, and matchday access convenience.',
    plotSizeRequired: 'large',
    maxLevel: 10,
    levels: buildLevels(
      180_000,
      20,
      3_200,
      (lvl) => ({
        value: lvl * 4,
        label: `+${lvl * 4}% Matchday Attendance Demand`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'stadium_stands', minLevel: 4 }],
      })
    ),
  },
  stadium_roof: {
    id: 'stadium_roof',
    name: 'Stadium Roof',
    category: 'stadium',
    description:
      'All-weather acoustic canopy that elevates spectator comfort and stadium prestige.',
    plotSizeRequired: 'stadium',
    maxLevel: 10,
    levels: buildLevels(
      320_000,
      40,
      5_500,
      (lvl) => ({
        value: lvl * 3,
        label: `+${lvl * 3}% Weather-Proof Attendance & Prestige`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'stadium_stands', minLevel: 3 }],
      })
    ),
  },
  lighting_scoreboard: {
    id: 'lighting_scoreboard',
    name: 'Lighting & Scoreboard',
    category: 'stadium',
    description:
      'Broadcast-grade LED floodlights and 360-degree stadium jumbo screens.',
    plotSizeRequired: 'small',
    maxLevel: 10,
    levels: buildLevels(
      140_000,
      15,
      2_500,
      (lvl) => ({
        value: lvl * 2,
        label: `+${lvl * 2}% Night-Match Atmosphere & Broadcast Value`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'stadium_stands', minLevel: 2 }],
      })
    ),
  },
  fan_plaza: {
    id: 'fan_plaza',
    name: 'Fan Plaza & Concourse',
    category: 'stadium',
    description:
      'Matchday food, beverage, and supporter retail concourses.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    isPassiveIncomeGenerator: true,
    levels: buildLevels(
      160_000,
      20,
      2_800,
      (lvl) => ({
        value: lvl * 3_500,
        label: `+$${(lvl * 3_500).toLocaleString()} Matchday F&B Revenue`,
      })
    ),
  },

  // ==========================================================================
  // CATEGORY B: TRAINING AND PLAYER DEVELOPMENT (4)
  // ==========================================================================
  training_complex: {
    id: 'training_complex',
    name: 'Training Complex',
    category: 'training',
    description:
      'Unlocks tactical, technical, and specialised player development programmes.',
    plotSizeRequired: 'large',
    maxLevel: 10,
    levels: buildLevels(
      200_000,
      25,
      4_500,
      (lvl) => ({
        value: lvl * 3,
        label: `+${lvl * 3}% Training Efficiency (Capped)`,
      }),
      (lvl) => ({
        requiredBuildings: [{ buildingId: 'football_pitch', minLevel: Math.max(2, Math.min(10, lvl - 1)) }],
      })
    ),
  },
  fitness_gym: {
    id: 'fitness_gym',
    name: 'Fitness & Gym Centre',
    category: 'training',
    description:
      'Dedicated strength, conditioning, and stamina development centre.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    levels: buildLevels(
      175_000,
      20,
      3_800,
      (lvl) => ({
        value: lvl * 2.5,
        label: `+${(lvl * 2.5).toFixed(1)}% Physical & Stamina Conditioning`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'training_complex', minLevel: 2 }],
      })
    ),
  },
  youth_academy: {
    id: 'youth_academy',
    name: 'Youth Academy',
    category: 'training',
    description:
      'Develops youth prospects, expands academy intake capacity, and supports first-team graduation.',
    plotSizeRequired: 'large',
    maxLevel: 10,
    levels: buildLevels(
      210_000,
      30,
      4_200,
      (lvl) => ({
        value: YOUTH_CAPACITY_BY_LEVEL[lvl],
        label: `${YOUTH_CAPACITY_BY_LEVEL[lvl]} Youth Prospect Capacity`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'scouting_centre', minLevel: 1 }],
      })
    ),
  },
  youth_residence: {
    id: 'youth_residence',
    name: 'Youth Residence',
    category: 'training',
    description:
      'Residential campus housing for academy scholars, boosting prospect retention and growth.',
    plotSizeRequired: 'large',
    maxLevel: 10,
    levels: buildLevels(
      190_000,
      25,
      3_600,
      (lvl) => ({
        value: lvl * 3,
        label: `+${lvl * 3}% Academy Prospect Development`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'youth_academy', minLevel: 3 }],
      })
    ),
  },

  // ==========================================================================
  // CATEGORY C: MEDICAL AND RECOVERY INFRASTRUCTURE (3)
  // ==========================================================================
  club_hospital: {
    id: 'club_hospital',
    name: 'Club Hospital',
    category: 'medical',
    description:
      'Generates Individual and Team Recovery Boosters on an offline-capable server schedule.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    startsBuiltAtLevel1: true,
    levels: buildLevels(
      195_000,
      20,
      4_500,
      (lvl) => {
        const sch = getHospitalScheduleForLevel(lvl);
        return {
          value: sch.individualStorageCap,
          label: `Ind: 1/${sch.individualIntervalHours}h (Cap ${sch.individualStorageCap})${
            sch.teamIntervalHours ? ` • Team: 1/${sch.teamIntervalHours}h (Cap ${sch.teamStorageCap})` : ''
          }`,
        };
      }
    ),
  },
  rehabilitation_centre: {
    id: 'rehabilitation_centre',
    name: 'Rehabilitation Centre',
    category: 'medical',
    description:
      'Hydrotherapy and physiotherapy suites that reduce injury recovery timelines within balanced limits.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    levels: buildLevels(
      215_000,
      25,
      4_200,
      (lvl) => ({
        value: lvl * 4,
        label: `-${lvl * 4}% Rehab Duration (Min 1w Floor)`,
      }),
      (lvl) => ({
        requiredBuildings: [{ buildingId: 'club_hospital', minLevel: Math.max(3, Math.min(10, lvl - 1)) }],
      })
    ),
  },
  sports_science_lab: {
    id: 'sports_science_lab',
    name: 'Sports Science Laboratory',
    category: 'medical',
    description:
      'Biometric fatigue monitoring, load management, and recovery optimisation.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    levels: buildLevels(
      240_000,
      30,
      5_000,
      (lvl) => ({
        value: lvl * 2.5,
        label: `-${(lvl * 2.5).toFixed(1)}% Post-Match Fatigue Accumulation`,
      }),
      () => ({
        requiredBuildings: [
          { buildingId: 'fitness_gym', minLevel: 3 },
          { buildingId: 'club_hospital', minLevel: 3 },
        ],
      })
    ),
  },

  // ==========================================================================
  // CATEGORY D: COMMERCIAL INFRASTRUCTURE (4)
  // ==========================================================================
  club_merchandise_store: {
    id: 'club_merchandise_store',
    name: 'Club Merchandise Store',
    category: 'commercial',
    description:
      'Generates passive jersey and merchandise revenue scaled by popularity, loyalty, and superstar influence.',
    plotSizeRequired: 'small',
    maxLevel: 10,
    isPassiveIncomeGenerator: true,
    levels: buildLevels(
      170_000,
      20,
      3_000,
      (lvl) => ({
        value: lvl * 6_500,
        label: `Up to +$${(lvl * 6_500).toLocaleString()}/wk Merch Revenue`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'stadium_stands', minLevel: 2 }],
      })
    ),
  },
  club_museum: {
    id: 'club_museum',
    name: 'Club Museum & Tour Centre',
    category: 'commercial',
    description:
      'Exhibits official club trophies and legendary players to generate stadium tour & tourism income.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    isPassiveIncomeGenerator: true,
    levels: buildLevels(
      280_000,
      35,
      4_500,
      (lvl) => ({
        value: lvl * 10,
        label: `+$${(lvl * 8_000).toLocaleString()}/wk Base Tourism Capacity`,
      }),
      () => ({
        minOfficialTrophies: 2,
        requiredBuildings: [{ buildingId: 'stadium_stands', minLevel: 2 }],
      })
    ),
  },
  media_broadcast_centre: {
    id: 'media_broadcast_centre',
    name: 'Media & Broadcasting Centre',
    category: 'commercial',
    description:
      'Expands global media reach, press conference facilities, and commercial exposure.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    levels: buildLevels(
      195_000,
      25,
      3_600,
      (lvl) => ({
        value: lvl * 5,
        label: `+${lvl * 5}% Media Reach & Commercial Exposure`,
      }),
      () => ({
        minReputation: 50,
      })
    ),
  },
  sponsorship_centre: {
    id: 'sponsorship_centre',
    name: 'Sponsorship & Business Centre',
    category: 'commercial',
    description:
      'Unlocks main shirt, sleeve, training kit, stadium naming, equipment, and academy sponsorship negotiations.',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    isPassiveIncomeGenerator: true,
    levels: buildLevels(
      230_000,
      30,
      4_000,
      (lvl) => ({
        value: lvl,
        label: `Unlocks Tier ${lvl} Sponsorship Categories`,
      }),
      (lvl) => ({
        requiredBuildings: [{ buildingId: 'media_broadcast_centre', minLevel: Math.max(2, Math.min(10, lvl - 1)) }],
      })
    ),
  },

  // ==========================================================================
  // CATEGORY E: MANAGEMENT AND RECRUITMENT (2)
  // ==========================================================================
  club_headquarters: {
    id: 'club_headquarters',
    name: 'Club Headquarters',
    category: 'management',
    description:
      'Administrative nerve centre. Upgrading HQ unlocks additional simultaneous construction slots (up to 4).',
    plotSizeRequired: 'medium',
    maxLevel: 10,
    startsBuiltAtLevel1: true,
    levels: buildLevels(
      220_000,
      25,
      4_200,
      (lvl) => ({
        value: lvl >= 7 ? 4 : lvl >= 4 ? 3 : 2,
        label: `${lvl >= 7 ? 4 : lvl >= 4 ? 3 : 2} Simultaneous Construction Slots`,
      })
    ),
  },
  scouting_centre: {
    id: 'scouting_centre',
    name: 'Scouting & Recruitment Centre',
    category: 'management',
    description:
      'Expands scouting reach from Local (Lv1) to National (Lv3), Continental (Lv5), Worldwide (Lv8), and Elite (Lv10).',
    plotSizeRequired: 'small',
    maxLevel: 10,
    startsBuiltAtLevel1: true,
    levels: buildLevels(
      150_000,
      15,
      3_000,
      (lvl) => ({
        value: lvl,
        label:
          lvl >= 10
            ? 'Elite Global Scouting Network'
            : lvl >= 8
              ? 'Worldwide Scouting'
              : lvl >= 5
                ? 'Continental Scouting'
                : lvl >= 3
                  ? 'National Scouting'
                  : 'Local Scouting',
      })
    ),
  },

  // ==========================================================================
  // CATEGORY F: COMMUNITY AND SUPPORTER INFRASTRUCTURE (3)
  // ==========================================================================
  supporters_club: {
    id: 'supporters_club',
    name: 'Supporters Club',
    category: 'community',
    description:
      'Drives supporter loyalty, official membership programmes, and recurring membership income.',
    plotSizeRequired: 'small',
    maxLevel: 10,
    isPassiveIncomeGenerator: true,
    levels: buildLevels(
      135_000,
      15,
      2_200,
      (lvl) => ({
        value: lvl * 4_000,
        label: `+${lvl * 3}% Loyalty & +$${(lvl * 4_000).toLocaleString()}/wk Memberships`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'stadium_stands', minLevel: 2 }],
      })
    ),
  },
  community_centre: {
    id: 'community_centre',
    name: 'Community Centre',
    category: 'community',
    description:
      'Local outreach, grassroots football clinics, and community reputation programmes.',
    plotSizeRequired: 'small',
    maxLevel: 10,
    levels: buildLevels(
      125_000,
      15,
      2_000,
      (lvl) => ({
        value: lvl * 2,
        label: `+${lvl * 2} Community Reputation & Fan Engagement`,
      })
    ),
  },
  security_operations: {
    id: 'security_operations',
    name: 'Security & Operations Centre',
    category: 'community',
    description:
      'Matchday stewarding, stadium safety, and high-capacity event operational readiness.',
    plotSizeRequired: 'small',
    maxLevel: 10,
    levels: buildLevels(
      165_000,
      20,
      3_400,
      (lvl) => ({
        value: lvl * 5,
        label: `+${lvl * 5}% Event Safety & Matchday Efficiency`,
      }),
      () => ({
        requiredBuildings: [{ buildingId: 'stadium_stands', minLevel: 3 }],
      })
    ),
  },
};

export const ALL_23_BUILDING_IDS: ClubEmpireBuildingId[] = Object.keys(
  CLUB_EMPIRE_BUILDINGS_CATALOG
) as ClubEmpireBuildingId[];

export function createInitialLandPlots(): LandPlot[] {
  return [
    // Starting Campus (Owned)
    {
      plotId: 'plot-stadium-core',
      name: 'Central Stadium Plot',
      category: 'standard',
      size: 'stadium',
      zone: 'stadium',
      owned: true,
      purchaseCost: 0,
      requiredTier: 'Local Club',
      expansionOrder: 0,
      gridX: 0,
      gridZ: 0,
      assignedBuildingId: 'stadium_stands',
    },
    {
      plotId: 'plot-training-1',
      name: 'Training Ground Plot',
      category: 'standard',
      size: 'large',
      zone: 'training',
      owned: true,
      purchaseCost: 0,
      requiredTier: 'Local Club',
      expansionOrder: 0,
      gridX: -28,
      gridZ: -12,
    },
    {
      plotId: 'plot-medical-1',
      name: 'Medical Campus Plot',
      category: 'standard',
      size: 'medium',
      zone: 'medical',
      owned: true,
      purchaseCost: 0,
      requiredTier: 'Local Club',
      expansionOrder: 0,
      gridX: 28,
      gridZ: -12,
      assignedBuildingId: 'club_hospital',
    },
    {
      plotId: 'plot-academy-1',
      name: 'Academy & Scouting Plot',
      category: 'standard',
      size: 'large',
      zone: 'management',
      owned: true,
      purchaseCost: 0,
      requiredTier: 'Local Club',
      expansionOrder: 0,
      gridX: -28,
      gridZ: 16,
      assignedBuildingId: 'scouting_centre',
    },
    {
      plotId: 'plot-exp-start-1',
      name: 'East Operations Plot',
      category: 'standard',
      size: 'medium',
      zone: 'expansion',
      owned: true,
      purchaseCost: 0,
      requiredTier: 'Local Club',
      expansionOrder: 0,
      gridX: 28,
      gridZ: 16,
      assignedBuildingId: 'club_headquarters',
    },
    {
      plotId: 'plot-exp-start-2',
      name: 'South Community Plot',
      category: 'standard',
      size: 'medium',
      zone: 'expansion',
      owned: true,
      purchaseCost: 0,
      requiredTier: 'Local Club',
      expansionOrder: 0,
      gridX: 0,
      gridZ: 28,
    },

    // Locked Expansion Plots (1..5)
    {
      plotId: 'plot-exp-1',
      name: 'North Commercial Avenue (Expansion 1)',
      category: 'standard',
      size: 'large',
      zone: 'commercial',
      owned: false,
      purchaseCost: 350_000,
      requiredTier: 'Developing Club',
      expansionOrder: 1,
      gridX: 0,
      gridZ: -32,
    },
    {
      plotId: 'plot-exp-2',
      name: 'West Transport Hub (Expansion 2)',
      category: 'standard',
      size: 'large',
      zone: 'stadium',
      owned: false,
      purchaseCost: 650_000,
      requiredTier: 'Professional Club',
      expansionOrder: 2,
      gridX: -48,
      gridZ: 0,
    },
    {
      plotId: 'plot-exp-3',
      name: 'East VIP Boulevard (Expansion 3)',
      category: 'premium',
      size: 'large',
      zone: 'commercial',
      owned: false,
      purchaseCost: 1_200_000,
      requiredTier: 'Elite Club',
      expansionOrder: 3,
      gridX: 48,
      gridZ: 0,
    },
    {
      plotId: 'plot-exp-4',
      name: 'Grand Museum Plaza (Expansion 4)',
      category: 'premium',
      size: 'large',
      zone: 'commercial',
      owned: false,
      purchaseCost: 2_000_000,
      requiredTier: 'World-Class Club',
      expansionOrder: 4,
      gridX: -24,
      gridZ: -34,
    },
    {
      plotId: 'plot-exp-5',
      name: 'World-Class Performance Park (Expansion 5)',
      category: 'premium',
      size: 'large',
      zone: 'training',
      owned: false,
      purchaseCost: 2_800_000,
      requiredTier: 'World-Class Club',
      expansionOrder: 5,
      gridX: 24,
      gridZ: -34,
    },
  ];
}
