import { ensureEconomyState, grantInventoryItems } from './boosterEconomy';
import {
  ALL_23_BUILDING_IDS,
  CLUB_DEVELOPMENT_TIERS,
  CLUB_EMPIRE_BUILDINGS_CATALOG,
  createInitialLandPlots,
  getHospitalScheduleForLevel,
  getMaxLevelForTier,
  getVisualStageForLevel,
  PITCH_INJURY_REDUCTION_BY_LEVEL,
  STADIUM_CAPACITY_BY_LEVEL,
} from './clubEmpireConfig';
import {
  ClubBuildingState,
  ClubDevelopmentTier,
  ClubEmpireBuildingId,
  ClubEmpireMission,
  ClubEmpireState,
  ClubEmpireTransaction,
  ConstructionBoosterGrade,
  ConstructionProject,
  GameState,
  MatchAttendanceRecord,
  Player,
  SponsorshipContract,
  TicketPricingConfig,
} from './types';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function isOriginalTeamCareer(state: GameState): boolean {
  return state.careerType === 'original_team' || state.manager.careerType === 'original_team';
}

function createInitialMissions(): ClubEmpireMission[] {
  return [
    {
      missionId: 'mis-tut-pitch',
      title: 'Upgrade the Football Pitch',
      description: 'Upgrade Football Pitch to Level 2 to protect your squad from injuries.',
      cadence: 'tutorial',
      targetValue: 2,
      currentValue: 1,
      completed: false,
      claimed: false,
      rewardTreasury: 120_000,
      rewardConstructionBoosters: { common: 2 },
    },
    {
      missionId: 'mis-tut-hospital',
      title: 'Claim Hospital Recovery',
      description: 'Claim your first Individual Recovery Booster from the Club Hospital.',
      cadence: 'tutorial',
      targetValue: 1,
      currentValue: 0,
      completed: false,
      claimed: false,
      rewardTreasury: 80_000,
      rewardConstructionBoosters: { common: 1 },
    },
    {
      missionId: 'mis-daily-match',
      title: 'Matchday Operations',
      description: 'Complete 1 official matchday to earn construction support.',
      cadence: 'daily',
      targetValue: 1,
      currentValue: 0,
      completed: false,
      claimed: false,
      rewardTreasury: 60_000,
      rewardConstructionBoosters: { common: 1 },
    },
    {
      missionId: 'mis-weekly-upgrades',
      title: 'Campus Expansion Drive',
      description: 'Complete 2 building construction or upgrade projects.',
      cadence: 'weekly',
      targetValue: 2,
      currentValue: 0,
      completed: false,
      claimed: false,
      rewardTreasury: 250_000,
      rewardConstructionBoosters: { rare: 1 },
    },
    {
      missionId: 'mis-long-museum',
      title: 'Trophy Heritage',
      description: 'Win 2 official trophies and construct the Club Museum & Tour Centre.',
      cadence: 'long_term',
      targetValue: 2,
      currentValue: 0,
      completed: false,
      claimed: false,
      rewardTreasury: 750_000,
      rewardConstructionBoosters: { elite: 1 },
      rewardReputation: 5,
    },
    {
      missionId: 'mis-long-worldclass',
      title: 'World-Class Institution',
      description: 'Reach the World-Class Club development tier.',
      cadence: 'long_term',
      targetValue: 1,
      currentValue: 0,
      completed: false,
      claimed: false,
      rewardTreasury: 2_000_000,
      rewardConstructionBoosters: { elite: 2 },
      rewardReputation: 8,
    },
  ];
}

function createInitialSponsorships(): SponsorshipContract[] {
  return [
    {
      contractId: 'sp-local-kit',
      sponsorName: 'Metro Sportswear',
      category: 'training_kit',
      weeklyIncome: 18_000,
      durationWeeks: 12,
      remainingWeeks: 12,
      minReputationRequired: 45,
      minSponsorshipCentreLevel: 1,
      performanceBonus: 40_000,
      status: 'available',
    },
    {
      contractId: 'sp-main-shirt-pro',
      sponsorName: 'Apex Financial Group',
      category: 'main_shirt',
      weeklyIncome: 55_000,
      durationWeeks: 22,
      remainingWeeks: 22,
      minReputationRequired: 60,
      minSponsorshipCentreLevel: 2,
      performanceBonus: 150_000,
      status: 'available',
    },
    {
      contractId: 'sp-stadium-elite',
      sponsorName: 'Nova Global Airlines',
      category: 'stadium_naming',
      weeklyIncome: 120_000,
      durationWeeks: 22,
      remainingWeeks: 22,
      minReputationRequired: 75,
      minSponsorshipCentreLevel: 5,
      performanceBonus: 350_000,
      status: 'available',
    },
  ];
}

export function createInitialClubEmpireState(
  careerId: string,
  nowMs = Date.now()
): ClubEmpireState {
  const buildings = {} as Record<ClubEmpireBuildingId, ClubBuildingState>;
  for (const id of ALL_23_BUILDING_IDS) {
    const def = CLUB_EMPIRE_BUILDINGS_CATALOG[id];
    const startsAt1 = Boolean(def.startsBuiltAtLevel1);
    buildings[id] = {
      buildingId: id,
      level: startsAt1 ? 1 : 0,
      condition: 100,
      operationalStatus: startsAt1 ? 'operational' : 'unbuilt',
      visualStage: getVisualStageForLevel(startsAt1 ? 1 : 0),
      totalInvested: 0,
    };
  }

  buildings.stadium_stands.plotId = 'plot-stadium-core';
  buildings.football_pitch.plotId = 'plot-stadium-core';
  buildings.club_hospital.plotId = 'plot-medical-1';
  buildings.scouting_centre.plotId = 'plot-academy-1';
  buildings.club_headquarters.plotId = 'plot-exp-start-1';

  const hospitalSch = getHospitalScheduleForLevel(1);

  return {
    careerId,
    developmentTier: 'Local Club',
    infrastructureScore: 55,
    maxSimultaneousConstructions: 2,
    landPlots: createInitialLandPlots(),
    buildings,
    activeConstructions: [],
    constructionBoosters: { common: 2, rare: 1, elite: 0 },
    adReductionsUsedToday: 0,
    adReductionDateKey: new Date(nowMs).toISOString().slice(0, 10),
    hospitalProduction: {
      individualBoostersStored: 1,
      individualStorageCap: hospitalSch.individualStorageCap,
      individualLastTickMs: nowMs,
      individualIntervalMs: hospitalSch.individualIntervalHours * 3600 * 1000,
      teamBoostersStored: 0,
      teamStorageCap: hospitalSch.teamStorageCap,
      teamLastTickMs: nowMs,
      teamIntervalMs: (hospitalSch.teamIntervalHours ?? 48) * 3600 * 1000,
      totalIndividualClaimed: 0,
      totalTeamClaimed: 0,
    },
    ticketPricing: {
      generalPrice: 28,
      premiumPrice: 65,
      vipPrice: 180,
    },
    attendanceHistory: [],
    sponsorships: createInitialSponsorships(),
    missions: createInitialMissions(),
    transactions: [],
    settledMatchRewardIds: [],
    supporterLoyalty: 62,
    lastPassiveTickMs: nowMs,
  };
}

export function ensureClubEmpireState(state: GameState): ClubEmpireState | null {
  if (!isOriginalTeamCareer(state)) return null;
  if (state.clubEmpire) return state.clubEmpire;
  return createInitialClubEmpireState(`career-${state.worldSeed}-${state.manager.clubId}`);
}

export function calculateClubDevelopmentTier(state: GameState): {
  tier: ClubDevelopmentTier;
  maxBuildingLevel: number;
  infrastructureScore: number;
} {
  const empire = ensureClubEmpireState(state);
  const club = state.clubs.find((c) => c.id === state.manager.clubId);
  if (!empire || !club) {
    return { tier: 'Local Club', maxBuildingLevel: 2, infrastructureScore: 0 };
  }

  const totalBuildingLevels = Object.values(empire.buildings).reduce(
    (sum, b) => sum + b.level,
    0
  );
  const trophyBonus = Math.min(180, state.trophies.length * 45);
  const financeBonus = club.finances.cashBalance > 0 ? Math.min(120, Math.round(club.finances.cashBalance / 150_000)) : 0;
  const repBonus = club.reputation * 3;
  const infrastructureScore = clamp(
    totalBuildingLevels * 6 + repBonus + trophyBonus + financeBonus,
    0,
    1000
  );

  let matched = CLUB_DEVELOPMENT_TIERS[0];
  for (const t of CLUB_DEVELOPMENT_TIERS) {
    if (infrastructureScore >= t.minScore && club.reputation >= t.minReputation) {
      matched = t;
    }
  }

  return {
    tier: matched.tier,
    maxBuildingLevel: matched.maxBuildingLevel,
    infrastructureScore,
  };
}

export function evaluateBuildingPrerequisites(
  state: GameState,
  buildingId: ClubEmpireBuildingId,
  targetLevel: number
): { eligible: boolean; missingReasons: string[]; cost: number; durationMinutes: number } {
  const empire = ensureClubEmpireState(state);
  const club = state.clubs.find((c) => c.id === state.manager.clubId);
  if (!empire || !club) {
    return {
      eligible: false,
      missingReasons: ['Club Empire is only available in Original Team Career Mode.'],
      cost: 0,
      durationMinutes: 0,
    };
  }

  const def = CLUB_EMPIRE_BUILDINGS_CATALOG[buildingId];
  const levelCfg = def.levels.find((l) => l.level === targetLevel);
  if (!levelCfg || targetLevel > def.maxLevel) {
    return {
      eligible: false,
      missingReasons: ['Maximum building level (10) reached.'],
      cost: 0,
      durationMinutes: 0,
    };
  }

  const missingReasons: string[] = [];
  const tierInfo = calculateClubDevelopmentTier(state);

  if (targetLevel > tierInfo.maxBuildingLevel) {
    missingReasons.push(
      `Requires higher Club Development Tier (Current: ${tierInfo.tier}, Max Lv ${tierInfo.maxBuildingLevel}).`
    );
  }

  const prereq = levelCfg.prerequisites;
  if (prereq?.requiredBuildings) {
    for (const req of prereq.requiredBuildings) {
      const currLvl = empire.buildings[req.buildingId]?.level ?? 0;
      if (currLvl < req.minLevel) {
        const reqName = CLUB_EMPIRE_BUILDINGS_CATALOG[req.buildingId].name;
        missingReasons.push(`Requires ${reqName} Level ${req.minLevel} (Current: Lv ${currLvl}).`);
      }
    }
  }

  if (prereq?.minReputation && club.reputation < prereq.minReputation) {
    missingReasons.push(
      `Requires Club Reputation ${prereq.minReputation} (Current: ${club.reputation}).`
    );
  }

  if (prereq?.minOfficialTrophies && state.trophies.length < prereq.minOfficialTrophies) {
    missingReasons.push(
      `Requires at least ${prereq.minOfficialTrophies} official trophies (Current: ${state.trophies.length}).`
    );
  }

  if (club.finances.cashBalance < levelCfg.upgradeCost) {
    missingReasons.push(
      `Insufficient Treasury: needs $${levelCfg.upgradeCost.toLocaleString()} (Available: $${club.finances.cashBalance.toLocaleString()}).`
    );
  }

  const alreadyConstructing = empire.activeConstructions.some((c) => c.buildingId === buildingId);
  if (alreadyConstructing) {
    missingReasons.push('Construction already in progress for this building.');
  }

  if (empire.activeConstructions.length >= empire.maxSimultaneousConstructions) {
    missingReasons.push(
      `Construction queue full (${empire.activeConstructions.length}/${empire.maxSimultaneousConstructions}). Upgrade Club Headquarters to expand capacity.`
    );
  }

  return {
    eligible: missingReasons.length === 0,
    missingReasons,
    cost: levelCfg.upgradeCost,
    durationMinutes: levelCfg.durationMinutes,
  };
}

function recordTransaction(
  empire: ClubEmpireState,
  category: ClubEmpireTransaction['category'],
  amount: number,
  description: string,
  idempotencyKey: string,
  nowMs: number
): ClubEmpireState {
  if (empire.transactions.some((t) => t.idempotencyKey === idempotencyKey)) {
    return empire;
  }
  const tx: ClubEmpireTransaction = {
    txId: `ce-tx-${nowMs}-${Math.floor(Math.random() * 10000)}`,
    idempotencyKey,
    timestampMs: nowMs,
    category,
    amount,
    description,
  };
  return {
    ...empire,
    transactions: [tx, ...empire.transactions].slice(0, 120),
  };
}

export function purchaseLandPlot(
  state: GameState,
  plotId: string,
  nowMs = Date.now()
): { success: boolean; message: string; updatedState: GameState } {
  const empire = ensureClubEmpireState(state);
  const club = state.clubs.find((c) => c.id === state.manager.clubId);
  if (!empire || !club) {
    return { success: false, message: 'Club Empire is disabled in Real Club Career.', updatedState: state };
  }

  const plot = empire.landPlots.find((p) => p.plotId === plotId);
  if (!plot) return { success: false, message: 'Land plot not found.', updatedState: state };
  if (plot.owned) return { success: false, message: 'Plot is already owned.', updatedState: state };

  const tierInfo = calculateClubDevelopmentTier(state);
  const tierConfig = CLUB_DEVELOPMENT_TIERS.find((t) => t.tier === tierInfo.tier)!;
  if (plot.expansionOrder > tierConfig.maxExpansionsAllowed) {
    return {
      success: false,
      message: `Requires ${plot.requiredTier} tier to unlock this expansion plot.`,
      updatedState: state,
    };
  }

  if (club.finances.cashBalance < plot.purchaseCost) {
    return {
      success: false,
      message: `Insufficient funds ($${plot.purchaseCost.toLocaleString()} required).`,
      updatedState: state,
    };
  }

  const nextPlots = empire.landPlots.map((p) =>
    p.plotId === plotId ? { ...p, owned: true } : p
  );
  let nextEmpire: ClubEmpireState = { ...empire, landPlots: nextPlots };
  nextEmpire = recordTransaction(
    nextEmpire,
    'land_purchase',
    -plot.purchaseCost,
    `Purchased land plot: ${plot.name}`,
    `land-${plotId}`,
    nowMs
  );

  const nextClubs = state.clubs.map((c) =>
    c.id === club.id
      ? { ...c, finances: { ...c.finances, cashBalance: c.finances.cashBalance - plot.purchaseCost } }
      : c
  );

  return {
    success: true,
    message: `Acquired ${plot.name}!`,
    updatedState: { ...state, clubs: nextClubs, clubEmpire: nextEmpire },
  };
}

export function startBuildingConstruction(
  state: GameState,
  buildingId: ClubEmpireBuildingId,
  plotId?: string,
  nowMs = Date.now()
): { success: boolean; message: string; updatedState: GameState } {
  const empire = ensureClubEmpireState(state);
  const club = state.clubs.find((c) => c.id === state.manager.clubId);
  if (!empire || !club) {
    return { success: false, message: 'Club Empire is disabled in Real Club Career.', updatedState: state };
  }

  const bState = empire.buildings[buildingId];
  const targetLevel = bState.level + 1;
  const check = evaluateBuildingPrerequisites(state, buildingId, targetLevel);
  if (!check.eligible) {
    return { success: false, message: check.missingReasons[0], updatedState: state };
  }

  const assignedPlotId =
    bState.plotId ??
    plotId ??
    empire.landPlots.find((p) => p.owned && !p.assignedBuildingId)?.plotId ??
    'plot-exp-start-2';

  const durationMs = check.durationMinutes * 60 * 1000;
  const project: ConstructionProject = {
    projectId: `proj-${buildingId}-lv${targetLevel}-${nowMs}`,
    careerId: empire.careerId,
    buildingId,
    plotId: assignedPlotId,
    previousLevel: bState.level,
    targetLevel,
    startTimestampMs: nowMs,
    expectedCompletionMs: nowMs + durationMs,
    originalDurationMs: durationMs,
    appliedReductionMs: 0,
    state: 'construction',
    costPaid: check.cost,
    adReductionsAppliedToday: 0,
  };

  let nextEmpire: ClubEmpireState = {
    ...empire,
    activeConstructions: [...empire.activeConstructions, project],
    buildings: {
      ...empire.buildings,
      [buildingId]: {
        ...bState,
        plotId: assignedPlotId,
        operationalStatus: 'under_construction',
      },
    },
  };

  nextEmpire = recordTransaction(
    nextEmpire,
    'construction_cost',
    -check.cost,
    `Started ${CLUB_EMPIRE_BUILDINGS_CATALOG[buildingId].name} Lv.${targetLevel}`,
    project.projectId,
    nowMs
  );

  const nextClubs = state.clubs.map((c) =>
    c.id === club.id
      ? { ...c, finances: { ...c.finances, cashBalance: c.finances.cashBalance - check.cost } }
      : c
  );

  return {
    success: true,
    message: `Started construction on ${CLUB_EMPIRE_BUILDINGS_CATALOG[buildingId].name} Level ${targetLevel}.`,
    updatedState: { ...state, clubs: nextClubs, clubEmpire: nextEmpire },
  };
}

export function applyConstructionSpeedBooster(
  state: GameState,
  projectId: string,
  grade: ConstructionBoosterGrade,
  nowMs = Date.now()
): { success: boolean; message: string; updatedState: GameState } {
  const empire = ensureClubEmpireState(state);
  if (!empire) {
    return { success: false, message: 'Club Empire is disabled.', updatedState: state };
  }

  if (empire.constructionBoosters[grade] <= 0) {
    return { success: false, message: `No ${grade} construction boosters available.`, updatedState: state };
  }

  const proj = empire.activeConstructions.find((p) => p.projectId === projectId);
  if (!proj) return { success: false, message: 'Active construction project not found.', updatedState: state };

  const remainingMs = Math.max(0, proj.expectedCompletionMs - nowMs);
  const pct = grade === 'elite' ? 0.2 : grade === 'rare' ? 0.1 : 0.05;
  const reductionMs = Math.round(remainingMs * pct);

  const nextProjects = empire.activeConstructions.map((p) =>
    p.projectId === projectId
      ? {
          ...p,
          expectedCompletionMs: Math.max(nowMs, p.expectedCompletionMs - reductionMs),
          appliedReductionMs: p.appliedReductionMs + reductionMs,
        }
      : p
  );

  const nextState: GameState = {
    ...state,
    clubEmpire: {
      ...empire,
      activeConstructions: nextProjects,
      constructionBoosters: {
        ...empire.constructionBoosters,
        [grade]: empire.constructionBoosters[grade] - 1,
      },
    },
  };

  return {
    success: true,
    message: `Applied ${grade} booster (-${Math.round(reductionMs / 60000)}m remaining).`,
    updatedState: syncAndCompleteConstructions(nextState, nowMs),
  };
}

export function applyAdConstructionReduction(
  state: GameState,
  projectId: string,
  adVerified: boolean,
  nowMs = Date.now()
): { success: boolean; message: string; updatedState: GameState } {
  const empire = ensureClubEmpireState(state);
  if (!empire) return { success: false, message: 'Club Empire is disabled.', updatedState: state };
  if (!adVerified) {
    return { success: false, message: 'Advertisement verification failed. No reduction applied.', updatedState: state };
  }

  const todayKey = new Date(nowMs).toISOString().slice(0, 10);
  const usedToday = empire.adReductionDateKey === todayKey ? empire.adReductionsUsedToday : 0;
  if (usedToday >= 5) {
    return { success: false, message: 'Daily advertisement reduction limit (5/day) reached.', updatedState: state };
  }

  const proj = empire.activeConstructions.find((p) => p.projectId === projectId);
  if (!proj) return { success: false, message: 'Construction project not found.', updatedState: state };

  const remainingMs = Math.max(0, proj.expectedCompletionMs - nowMs);
  // 10% of remaining time, capped at 30 minutes (1,800,000 ms)
  const MAX_AD_REDUCTION_MS = 30 * 60 * 1000;
  const reductionMs = Math.min(MAX_AD_REDUCTION_MS, Math.round(remainingMs * 0.1));

  const nextProjects = empire.activeConstructions.map((p) =>
    p.projectId === projectId
      ? {
          ...p,
          expectedCompletionMs: Math.max(nowMs, p.expectedCompletionMs - reductionMs),
          appliedReductionMs: p.appliedReductionMs + reductionMs,
          adReductionsAppliedToday: p.adReductionsAppliedToday + 1,
        }
      : p
  );

  const nextState: GameState = {
    ...state,
    clubEmpire: {
      ...empire,
      activeConstructions: nextProjects,
      adReductionDateKey: todayKey,
      adReductionsUsedToday: usedToday + 1,
    },
  };

  return {
    success: true,
    message: `Ad verified: reduced remaining construction time by ${Math.round(reductionMs / 60000)} minutes.`,
    updatedState: syncAndCompleteConstructions(nextState, nowMs),
  };
}

export function syncAndCompleteConstructions(state: GameState, nowMs = Date.now()): GameState {
  const empire = ensureClubEmpireState(state);
  if (!empire) return state;

  const completed = empire.activeConstructions.filter((p) => p.expectedCompletionMs <= nowMs);
  if (completed.length === 0) return state;

  const stillActive = empire.activeConstructions.filter((p) => p.expectedCompletionMs > nowMs);
  const nextBuildings = { ...empire.buildings };
  let nextClubs = [...state.clubs];
  let nextMaxSimultaneous = empire.maxSimultaneousConstructions;
  let nextHospital = { ...empire.hospitalProduction };

  for (const proj of completed) {
    const prev = nextBuildings[proj.buildingId];
    const newLevel = Math.max(prev.level, proj.targetLevel);
    nextBuildings[proj.buildingId] = {
      ...prev,
      level: newLevel,
      operationalStatus: 'operational',
      visualStage: getVisualStageForLevel(newLevel),
      totalInvested: prev.totalInvested + proj.costPaid,
    };

    if (proj.buildingId === 'stadium_stands') {
      const newCap = STADIUM_CAPACITY_BY_LEVEL[newLevel] ?? 2000;
      nextClubs = nextClubs.map((c) =>
        c.id === state.manager.clubId ? { ...c, stadiumCapacity: newCap } : c
      );
    } else if (proj.buildingId === 'club_headquarters') {
      nextMaxSimultaneous = newLevel >= 7 ? 4 : newLevel >= 4 ? 3 : 2;
    } else if (proj.buildingId === 'club_hospital') {
      const sch = getHospitalScheduleForLevel(newLevel);
      nextHospital = {
        ...nextHospital,
        individualIntervalMs: sch.individualIntervalHours * 3600 * 1000,
        individualStorageCap: sch.individualStorageCap,
        teamIntervalMs: (sch.teamIntervalHours ?? 48) * 3600 * 1000,
        teamStorageCap: sch.teamStorageCap,
      };
    }
  }

  let nextEmpire: ClubEmpireState = {
    ...empire,
    buildings: nextBuildings,
    activeConstructions: stillActive,
    maxSimultaneousConstructions: nextMaxSimultaneous,
    hospitalProduction: nextHospital,
  };

  // Update mission progress
  nextEmpire.missions = nextEmpire.missions.map((m) => {
    if (m.missionId === 'mis-tut-pitch') {
      const pitchLvl = nextBuildings.football_pitch.level;
      return { ...m, currentValue: pitchLvl, completed: pitchLvl >= m.targetValue };
    }
    if (m.missionId === 'mis-weekly-upgrades') {
      const nextVal = m.currentValue + completed.length;
      return { ...m, currentValue: nextVal, completed: nextVal >= m.targetValue };
    }
    return m;
  });

  const tierInfo = calculateClubDevelopmentTier({ ...state, clubs: nextClubs, clubEmpire: nextEmpire });
  nextEmpire.developmentTier = tierInfo.tier;
  nextEmpire.infrastructureScore = tierInfo.infrastructureScore;

  return {
    ...state,
    clubs: nextClubs,
    clubEmpire: nextEmpire,
  };
}

export function syncHospitalProduction(state: GameState, nowMs = Date.now()): GameState {
  const empire = ensureClubEmpireState(state);
  if (!empire) return state;

  const hp = { ...empire.hospitalProduction };
  if (hp.individualBoostersStored < hp.individualStorageCap) {
    const elapsedInd = Math.max(0, nowMs - hp.individualLastTickMs);
    const producedInd = Math.floor(elapsedInd / hp.individualIntervalMs);
    if (producedInd > 0) {
      hp.individualBoostersStored = Math.min(
        hp.individualStorageCap,
        hp.individualBoostersStored + producedInd
      );
      hp.individualLastTickMs = nowMs - (elapsedInd % hp.individualIntervalMs);
    }
  } else {
    hp.individualLastTickMs = nowMs;
  }

  if (hp.teamStorageCap > 0 && hp.teamBoostersStored < hp.teamStorageCap) {
    const elapsedTeam = Math.max(0, nowMs - hp.teamLastTickMs);
    const producedTeam = Math.floor(elapsedTeam / hp.teamIntervalMs);
    if (producedTeam > 0) {
      hp.teamBoostersStored = Math.min(hp.teamStorageCap, hp.teamBoostersStored + producedTeam);
      hp.teamLastTickMs = nowMs - (elapsedTeam % hp.teamIntervalMs);
    }
  } else {
    hp.teamLastTickMs = nowMs;
  }

  return {
    ...state,
    clubEmpire: { ...empire, hospitalProduction: hp },
  };
}

export function claimHospitalBooster(
  state: GameState,
  type: 'individual' | 'team',
  nowMs = Date.now()
): { success: boolean; message: string; updatedState: GameState } {
  const synced = syncHospitalProduction(state, nowMs);
  const empire = ensureClubEmpireState(synced);
  if (!empire) return { success: false, message: 'Club Empire is disabled.', updatedState: state };

  const hp = { ...empire.hospitalProduction };
  if (type === 'individual') {
    if (hp.individualBoostersStored <= 0) {
      return { success: false, message: 'No Individual Recovery Boosters ready to claim.', updatedState: synced };
    }
    hp.individualBoostersStored -= 1;
    hp.totalIndividualClaimed += 1;
  } else {
    if (hp.teamStorageCap === 0) {
      return { success: false, message: 'Upgrade Club Hospital to Level 3 to unlock Team Recovery Boosters.', updatedState: synced };
    }
    if (hp.teamBoostersStored <= 0) {
      return { success: false, message: 'No Team Recovery Boosters ready to claim.', updatedState: synced };
    }
    hp.teamBoostersStored -= 1;
    hp.totalTeamClaimed += 1;
  }

  const itemId = type === 'individual' ? 'bst-recovery-ind-rare' : 'bst-recovery-team-epic';
  const economy = ensureEconomyState(synced);
  const nextEconomy = grantInventoryItems(
    economy,
    [{ itemId, quantity: 1 }],
    'daily_objective',
    synced.currentSeason,
    synced.currentWeek
  );

  const nextMissions = empire.missions.map((m) =>
    m.missionId === 'mis-tut-hospital'
      ? { ...m, currentValue: 1, completed: true }
      : m
  );

  return {
    success: true,
    message: `Claimed 1x ${type === 'individual' ? 'Individual' : 'Team'} Recovery Booster into Club Inventory.`,
    updatedState: {
      ...synced,
      economy: nextEconomy,
      clubEmpire: {
        ...empire,
        hospitalProduction: hp,
        missions: nextMissions,
      },
    },
  };
}

export function calculateSuperstarCommercialInfluence(players: Player[]): {
  totalCommercialInfluence: number; // 0..100
  merchandiseMultiplier: number; // 1.0..1.45
  attendanceBoostPct: number; // 0..12
} {
  const senior = players
    .filter((p) => !p.isYouth)
    .map((p) => {
      const base =
        (p as Player & { commercialInfluence?: number }).commercialInfluence ??
        clamp(Math.round((p.overall - 55) * 1.8), 10, 95);
      const availFactor = p.injuryWeeks > 0 ? 0.55 : 1.0;
      return base * availFactor;
    })
    .sort((a, b) => b - a);

  // Diminishing returns across top 5 stars
  const weights = [1.0, 0.55, 0.3, 0.15, 0.08];
  let weightedSum = 0;
  for (let i = 0; i < Math.min(5, senior.length); i++) {
    weightedSum += senior[i] * weights[i];
  }

  const totalCommercialInfluence = clamp(Math.round(weightedSum / 1.8), 10, 100);
  const merchandiseMultiplier = Number((1 + (totalCommercialInfluence / 100) * 0.45).toFixed(2));
  const attendanceBoostPct = Number(((totalCommercialInfluence / 100) * 12).toFixed(1));

  return { totalCommercialInfluence, merchandiseMultiplier, attendanceBoostPct };
}

export function calculateHomeMatchAttendanceAndRevenue(
  state: GameState,
  fixtureId: string,
  opponentName: string,
  opponentReputation: number
): MatchAttendanceRecord | null {
  const empire = ensureClubEmpireState(state);
  const club = state.clubs.find((c) => c.id === state.manager.clubId);
  if (!empire || !club) return null;

  const capacity = club.stadiumCapacity;
  const pricing = empire.ticketPricing;
  const clubPlayers = state.players.filter((p) => p.clubId === club.id);
  const comm = calculateSuperstarCommercialInfluence(clubPlayers);

  const avgPrice = (pricing.generalPrice + pricing.premiumPrice * 0.4 + pricing.vipPrice * 0.15) / 1.55;
  const fairPrice = 25 + (club.reputation - 50) * 0.6;
  const priceRatio = avgPrice / Math.max(15, fairPrice);

  const parkingBonus = (empire.buildings.parking_transport?.level ?? 0) * 0.02;
  const roofBonus = (empire.buildings.stadium_roof?.level ?? 0) * 0.015;
  const baseDemand =
    0.58 +
    (club.reputation + opponentReputation) / 400 +
    comm.attendanceBoostPct / 100 +
    parkingBonus +
    roofBonus;

  const demandFactor = clamp(baseDemand / Math.pow(Math.max(0.65, priceRatio), 0.75), 0.25, 1.0);
  const totalAttendance = clamp(Math.round(capacity * demandFactor), 0, capacity);

  const vipLvl = empire.buildings.vip_hospitality?.level ?? 0;
  const vipCap = vipLvl * 120;
  const vipAttendance = Math.min(vipCap, Math.round(totalAttendance * 0.05));
  const premiumAttendance = Math.round((totalAttendance - vipAttendance) * 0.18);
  const generalAttendance = Math.max(0, totalAttendance - vipAttendance - premiumAttendance);

  const grossTicketRevenue =
    generalAttendance * pricing.generalPrice +
    premiumAttendance * pricing.premiumPrice +
    vipAttendance * pricing.vipPrice;

  const operatingExpenses = Math.round(totalAttendance * 4.5 + 8_000);
  const netMatchdayRevenue = grossTicketRevenue - operatingExpenses;

  const pricingFeedback: MatchAttendanceRecord['pricingFeedback'] =
    priceRatio > 1.28 ? 'Overpriced' : priceRatio < 0.78 ? 'Underpriced' : 'Optimal';
  const revenueEfficiencyScore = clamp(
    Math.round(100 - Math.abs(1 - priceRatio) * 55),
    25,
    100
  );

  return {
    fixtureId,
    opponentName,
    week: state.currentWeek,
    season: state.currentSeason,
    stadiumCapacity: capacity,
    generalAttendance,
    premiumAttendance,
    vipAttendance,
    totalAttendance,
    demandFactor: Number(demandFactor.toFixed(2)),
    grossTicketRevenue,
    operatingExpenses,
    netMatchdayRevenue,
    revenueEfficiencyScore,
    pricingFeedback,
  };
}

export function calculateMuseumTourismIncome(state: GameState): {
  unlocked: boolean;
  weeklyTourismIncome: number;
  trophyPrestigeScore: number;
} {
  const empire = ensureClubEmpireState(state);
  if (!empire) return { unlocked: false, weeklyTourismIncome: 0, trophyPrestigeScore: 0 };

  const museumLvl = empire.buildings.club_museum?.level ?? 0;
  const unlocked = state.trophies.length >= 2 && museumLvl > 0;
  if (!unlocked) return { unlocked: state.trophies.length >= 2, weeklyTourismIncome: 0, trophyPrestigeScore: 0 };

  let rawPrestige = 0;
  for (const t of state.trophies) {
    if (t.competition === 'championsCup') rawPrestige += 45;
    else if (t.competition === 'league') rawPrestige += 25;
    else rawPrestige += 15;
  }

  // Diminishing returns on trophy count
  const trophyPrestigeScore = Math.round(Math.sqrt(rawPrestige) * 14);
  const weeklyTourismIncome = Math.round(museumLvl * 6_500 + trophyPrestigeScore * 380);
  return { unlocked: true, weeklyTourismIncome, trophyPrestigeScore };
}

export function calculatePitchInjuryRiskMultiplier(state: GameState): number {
  const empire = ensureClubEmpireState(state);
  if (!empire) return 1.0;
  const pitchLvl = empire.buildings.football_pitch?.level ?? 1;
  const reductionPct = PITCH_INJURY_REDUCTION_BY_LEVEL[clamp(pitchLvl, 0, 10)] ?? 0;
  // Never reduce below 0.10 (engine minimum floor)
  return clamp(1 - reductionPct / 100, 0.1, 1.0);
}

export function calculatePitchMoraleBonus(state: GameState): number {
  const empire = ensureClubEmpireState(state);
  if (!empire) return 0;
  const pitchLvl = empire.buildings.football_pitch?.level ?? 1;
  return clamp(Math.ceil(pitchLvl / 2), 0, 5);
}

export function setTicketPricing(
  state: GameState,
  pricing: TicketPricingConfig
): { success: boolean; updatedState: GameState } {
  const empire = ensureClubEmpireState(state);
  if (!empire) return { success: false, updatedState: state };
  return {
    success: true,
    updatedState: {
      ...state,
      clubEmpire: {
        ...empire,
        ticketPricing: {
          generalPrice: clamp(Math.round(pricing.generalPrice), 5, 250),
          premiumPrice: clamp(Math.round(pricing.premiumPrice), 15, 600),
          vipPrice: clamp(Math.round(pricing.vipPrice), 40, 2000),
        },
      },
    },
  };
}
