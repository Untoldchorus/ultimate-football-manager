import {
  computeNonlinearMatchModifiers,
  DEFAULT_BALANCE_CONFIG,
  getChemistryLevelLabel,
} from './balanceConfig';
import { FORMATION_SLOTS } from './ratings';
import { hashStringToSeed } from './rng';
import { evaluateDetailedPositionalSuitability } from './tacticalMatrixEngine';
import {
  ActiveBoosterInstance,
  ActivePositionBooster,
  BalanceConfiguration,
  ChemistryFactorBreakdown,
  Club,
  FormationCode,
  IndividualPlayerChemistryEvaluation,
  PartnershipChemistryEvaluation,
  Player,
  PlayerPairChemistryRecord,
  PlayerPersonality,
  PositionCode,
  TeamChemistryReport,
} from './types';

/**
 * Canonical sorted pair key (`playerA__playerB`) so `pairKey(A,B) === pairKey(B,A)`.
 */
export function makePlayerPairKey(playerAId: string, playerBId: string): string {
  return playerAId < playerBId ? `${playerAId}__${playerBId}` : `${playerBId}__${playerAId}`;
}

/**
 * Maps a player's nationality to their spoken footballing languages.
 */
export function deriveSpokenLanguagesForNationality(nationality: string): string[] {
  if (Array.isArray((nationality as unknown as Player)?.spokenLanguages)) {
    return (nationality as unknown as Player).spokenLanguages!;
  }
  const nat = (nationality || 'England').trim().toLowerCase();
  const map: Record<string, string[]> = {
    england: ['English'],
    scotland: ['English'],
    wales: ['English'],
    ireland: ['English'],
    usa: ['English', 'Spanish'],
    canada: ['English', 'French'],
    australia: ['English'],
    nigeria: ['English'],
    ghana: ['English'],
    southafrica: ['English'],
    spain: ['Spanish'],
    argentina: ['Spanish', 'Italian'],
    colombia: ['Spanish'],
    uruguay: ['Spanish'],
    mexico: ['Spanish', 'English'],
    chile: ['Spanish'],
    france: ['French', 'English'],
    belgium: ['French', 'Dutch', 'English'],
    senegal: ['French'],
    ivorycoast: ['French'],
    morocco: ['Arabic', 'French'],
    egypt: ['Arabic', 'English'],
    germany: ['German', 'English'],
    austria: ['German', 'English'],
    switzerland: ['German', 'French', 'Italian'],
    netherlands: ['Dutch', 'English', 'German'],
    denmark: ['Danish', 'English'],
    sweden: ['Swedish', 'English'],
    norway: ['Norwegian', 'English'],
    brazil: ['Portuguese', 'Spanish'],
    portugal: ['Portuguese', 'Spanish', 'English'],
    italy: ['Italian', 'Spanish'],
    croatia: ['Croatian', 'English', 'Italian'],
    serbia: ['Serbian', 'English'],
    poland: ['Polish', 'English', 'German'],
    turkey: ['Turkish', 'German'],
    japan: ['Japanese', 'English'],
    southkorea: ['Korean', 'English'],
    korea: ['Korean', 'English'],
  };

  const key = nat.replace(/\s+/g, '');
  return map[key] ?? ['English'];
}

/**
 * Deterministically derives a player's interpersonal personality from their attributes and ID if not explicitly set.
 */
export function resolvePlayerPersonality(player: Player): PlayerPersonality {
  if (player.personality) return player.personality;
  const ldr = player.attributes.leadership ?? 65;
  const wrk = player.attributes.workRate ?? 68;
  const agg = player.attributes.aggression ?? 60;
  const dec = player.attributes.decisions ?? 65;
  const drb = player.attributes.dribbling ?? 65;

  if (ldr >= 82 && dec >= 72) return 'Leader';
  if (wrk >= 80 && dec >= 74 && agg <= 72) return 'ModelProfessional';
  if (wrk >= 74 && ldr >= 68) return 'TeamPlayer';
  if (agg >= 82 && dec < 66) return 'Temperamental';
  if (drb >= 82 && wrk < 68) return 'Maverick';
  const h = hashStringToSeed(player.id) % 5;
  const pool: PlayerPersonality[] = [
    'TeamPlayer',
    'Ambitious',
    'ModelProfessional',
    'Leader',
    'Maverick',
  ];
  return pool[h];
}

/**
 * Personality compatibility matrix (0..100).
 * Leaders & ModelProfessionals elevate everyone, especially Ambitious/Maverick/Temperamental teammates.
 * Two Temperamental or Maverick players without leadership clash slightly.
 */
export function evaluatePersonalityCompatibility(
  pA: PlayerPersonality,
  pB: PlayerPersonality
): number {
  if (pA === 'Leader' || pB === 'Leader') {
    if (pA === 'Temperamental' || pB === 'Temperamental') return 82;
    return 94;
  }
  if (pA === 'ModelProfessional' || pB === 'ModelProfessional') {
    if (pA === 'Temperamental' || pB === 'Temperamental') return 76;
    return 90;
  }
  if (pA === 'TeamPlayer' && pB === 'TeamPlayer') return 92;
  if (pA === 'TeamPlayer' || pB === 'TeamPlayer') return 84;
  if (pA === 'Ambitious' && pB === 'Ambitious') return 78;
  if (pA === 'Maverick' && pB === 'Maverick') return 62;
  if (pA === 'Temperamental' && pB === 'Temperamental') return 46;
  if (
    (pA === 'Temperamental' && pB === 'Maverick') ||
    (pA === 'Maverick' && pB === 'Temperamental')
  ) {
    return 52;
  }
  return 75;
}

/**
 * Evaluates how familiar a player is with the assigned tactical slot position (0..100),
 * factoring in natural position, secondary positions, learned positional familiarity,
 * and active Season (1-season) or Temporary (3-match) Position Boosters.
 */
export function evaluatePositionalFamiliarity(
  player: Player,
  assignedSlot: PositionCode,
  activePositionBoosters: ActivePositionBooster[] = [],
  currentSeason?: number
): number {
  const suit = evaluateDetailedPositionalSuitability(
    player,
    assignedSlot,
    activePositionBoosters,
    currentSeason
  );
  return suit.familiarityScore;
}

/**
 * Determines whether two formation slot indices (0..10) have a direct on-pitch tactical link
 * based on spatial proximity on the formation pitch (< 36 pitch distance units).
 */
export function areSlotsTacticallyLinked(
  formation: FormationCode,
  slotIdxA: number,
  slotIdxB: number
): boolean {
  if (slotIdxA === slotIdxB) return false;
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];
  const sA = slots[slotIdxA];
  const sB = slots[slotIdxB];
  if (!sA || !sB) return false;

  // GK links with Center Backs / Fullbacks
  if (sA.position === 'GK' || sB.position === 'GK') {
    const other = sA.position === 'GK' ? sB.position : sA.position;
    return other === 'CB' || other === 'LB' || other === 'RB';
  }

  const dx = sA.x - sB.x;
  const dy = sA.y - sB.y;
  const dist = Math.hypot(dx, dy);
  return dist <= 36;
}

/**
 * Evaluates all 10 Chemistry Factors between two players:
 * 1. Matches played together
 * 2. Minutes played together
 * 3. Shared nationality
 * 4. Shared language
 * 5. Previous club connections
 * 6. Previous international teammates
 * 7. Positional familiarity
 * 8. Playing relationships (pitch proximity & dynamic familiarity)
 * 9. Player personality compatibility
 * 10. Communication and leadership
 */
export function evaluatePartnershipChemistry(
  playerA: Player,
  playerB: Player,
  slotIdxA: number,
  slotIdxB: number,
  formation: FormationCode,
  pairRecord?: PlayerPairChemistryRecord,
  currentSeason = 2026,
  currentWeek = 1,
  captainId?: string,
  viceCaptainId?: string,
  activeBoosters: ActiveBoosterInstance[] = [],
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG,
  activePositionBoosters: ActivePositionBooster[] = []
): PartnershipChemistryEvaluation {
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];
  const slotPosA = slots[slotIdxA]?.position ?? playerA.primaryPosition;
  const slotPosB = slots[slotIdxB]?.position ?? playerB.primaryPosition;

  const matchesTogether = pairRecord?.matchesTogether ?? 4;
  const minutesTogether = pairRecord?.minutesTogether ?? matchesTogether * 75;
  const dynamicBonus = pairRecord?.dynamicFamiliarityBonus ?? 0;

  // 1. Matches played together (0..100, saturates smoothly around ~28 matches)
  const matchesPlayedScore = Math.min(100, Math.round((1 - Math.exp(-matchesTogether / 14)) * 100));

  // 2. Minutes played together (0..100, saturates around ~2200 mins)
  const minutesPlayedScore = Math.min(
    100,
    Math.round((1 - Math.exp(-minutesTogether / 1250)) * 100)
  );

  // 3. Shared nationality (0..100)
  const sameNationality =
    playerA.nationality.trim().toLowerCase() === playerB.nationality.trim().toLowerCase();
  const sharedNationalityScore = sameNationality ? 100 : 42;

  // 4. Shared language (0..100)
  const langsA = playerA.spokenLanguages ?? deriveSpokenLanguagesForNationality(playerA.nationality);
  const langsB = playerB.spokenLanguages ?? deriveSpokenLanguagesForNationality(playerB.nationality);
  const sharedLangs = langsA.filter((l) => langsB.includes(l));
  const sharedLanguageScore = sharedLangs.length >= 2 ? 100 : sharedLangs.length === 1 ? 85 : 35;

  // 5. Previous club connections (0..100)
  const clubsA = new Set((playerA.careerHistory ?? []).map((h) => h.clubId));
  const clubsB = new Set((playerB.careerHistory ?? []).map((h) => h.clubId));
  let sharedPrevClub = playerA.clubId === playerB.clubId;
  for (const cId of clubsA) {
    if (clubsB.has(cId)) sharedPrevClub = true;
  }
  const previousClubScore = sharedPrevClub ? 86 : 45;

  // 6. Previous international teammates (0..100)
  const bothCappedSameNation =
    sameNationality && (playerA.internationalApps ?? 0) > 0 && (playerB.internationalApps ?? 0) > 0;
  const internationalTeammateScore = bothCappedSameNation
    ? Math.min(100, 75 + Math.min(25, ((playerA.internationalApps ?? 0) + (playerB.internationalApps ?? 0)) / 4))
    : sameNationality
      ? 65
      : 40;

  // 7. Positional familiarity (0..100) + off-position chemistry penalty
  const suitA = evaluateDetailedPositionalSuitability(
    playerA,
    slotPosA,
    activePositionBoosters,
    currentSeason
  );
  const suitB = evaluateDetailedPositionalSuitability(
    playerB,
    slotPosB,
    activePositionBoosters,
    currentSeason
  );
  const posFamA = suitA.familiarityScore;
  const posFamB = suitB.familiarityScore;
  const positionalFamiliarityScore = Math.round((posFamA + posFamB) / 2);
  const offPositionPairPenalty = Math.round(
    (suitA.chemistryPenaltyPoints + suitB.chemistryPenaltyPoints) * 0.45
  );

  // 8. Playing relationships (pitch link + dynamic familiarity gained from training/matches)
  const isLinked = areSlotsTacticallyLinked(formation, slotIdxA, slotIdxB);
  const playingRelationshipScore = Math.max(
    15,
    Math.min(100, Math.round(58 + dynamicBonus + (isLinked ? 12 : 4)))
  );

  // 9. Player personality compatibility (0..100)
  const persA = resolvePlayerPersonality(playerA);
  const persB = resolvePlayerPersonality(playerB);
  const personalityCompatibilityScore = evaluatePersonalityCompatibility(persA, persB);

  // 10. Communication & leadership (0..100)
  const isPairLeader =
    playerA.id === captainId ||
    playerB.id === captainId ||
    playerA.id === viceCaptainId ||
    playerB.id === viceCaptainId;
  const avgLeadership = Math.round(
    ((playerA.attributes.leadership ?? 65) + (playerB.attributes.leadership ?? 65)) / 2
  );
  const communicationLeadershipScore = Math.min(
    100,
    Math.round(avgLeadership * 0.78 + (sharedLanguageScore * 0.22) + (isPairLeader ? 10 : 0))
  );

  // Check transfer adaptation period penalty for newly signed players
  const calcAdaptPenalty = (p: Player): number => {
    if (p.joinedClubSeason === undefined || p.joinedClubWeek === undefined) return 0;
    const weeksAtClub =
      (currentSeason - p.joinedClubSeason) * 22 + (currentWeek - p.joinedClubWeek);
    if (weeksAtClub >= config.transferAdaptationWeeks) return 0;
    const remainingRatio =
      Math.max(0, config.transferAdaptationWeeks - weeksAtClub) /
      Math.max(1, config.transferAdaptationWeeks);
    return Math.round(remainingRatio * 14);
  };
  const transferAdaptationPenalty = calcAdaptPenalty(playerA) + calcAdaptPenalty(playerB);

  // Active chemistry booster bonus if applicable
  let boosterBonus = 0;
  for (const b of activeBoosters) {
    if (b.category !== 'chemistry') continue;
    if (
      b.subType === 'team_bonding' ||
      b.targetPlayerId === playerA.id ||
      b.targetPlayerId === playerB.id ||
      (b.targetPlayerId === playerA.id && b.secondaryPlayerId === playerB.id) ||
      (b.targetPlayerId === playerB.id && b.secondaryPlayerId === playerA.id)
    ) {
      boosterBonus += b.effectStrength * config.boosterGlobalStrengthMultiplier;
    }
  }
  boosterBonus = Math.min(12, boosterBonus);

  // Weighted composite across all 10 factors
  const weightedRaw =
    matchesPlayedScore * 0.16 +
    minutesPlayedScore * 0.12 +
    sharedNationalityScore * 0.08 +
    sharedLanguageScore * 0.10 +
    previousClubScore * 0.07 +
    internationalTeammateScore * 0.07 +
    positionalFamiliarityScore * 0.14 +
    playingRelationshipScore * 0.10 +
    personalityCompatibilityScore * 0.08 +
    communicationLeadershipScore * 0.08 +
    dynamicBonus * 0.45 +
    boosterBonus -
    transferAdaptationPenalty -
    offPositionPairPenalty;

  const score = Math.max(5, Math.min(100, Math.round(weightedRaw)));
  const level = getChemistryLevelLabel(score);

  const reasons: string[] = [];
  if (matchesTogether >= 12) reasons.push(`${matchesTogether} matches together`);
  if (sameNationality) reasons.push(`shared ${playerA.nationality} heritage`);
  else if (sharedLangs.length > 0) reasons.push(`shared ${sharedLangs[0]} communication`);
  if (bothCappedSameNation) reasons.push('international teammates');
  if (positionalFamiliarityScore >= 95) reasons.push('natural positions');
  else if (positionalFamiliarityScore < 65) reasons.push('out-of-position adjustment needed');
  if (transferAdaptationPenalty > 0) reasons.push('recent transfer adapting');

  return {
    pairKey: makePlayerPairKey(playerA.id, playerB.id),
    playerAId: playerA.id,
    playerBId: playerB.id,
    playerAName: `${playerA.firstName} ${playerA.lastName}`,
    playerBName: `${playerB.firstName} ${playerB.lastName}`,
    slotIndexA: slotIdxA,
    slotIndexB: slotIdxB,
    isTacticallyLinked: isLinked,
    score,
    level,
    matchesTogether,
    minutesTogether,
    factors: {
      matchesPlayedScore,
      minutesPlayedScore,
      sharedNationalityScore,
      sharedLanguageScore,
      previousClubScore,
      internationalTeammateScore,
      positionalFamiliarityScore,
      playingRelationshipScore,
      personalityCompatibilityScore,
      communicationLeadershipScore,
      transferAdaptationPenalty,
    },
    summaryReason:
      reasons.length > 0 ? reasons.slice(0, 3).join(' • ') : 'Developing squad familiarity',
  };
}

/**
 * Evaluates full Team Chemistry for a club's starting XI, including individual player chemistry,
 * all tactically linked partnerships, strongest/weakest links, and actionable improvement opportunities.
 */
export function evaluateTeamChemistry(
  club: Club,
  clubPlayers: Player[],
  pairRecords: Record<string, PlayerPairChemistryRecord> = {},
  currentSeason = 2026,
  currentWeek = 1,
  activeBoosters: ActiveBoosterInstance[] = [],
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG,
  activePositionBoosters: ActivePositionBooster[] = []
): TeamChemistryReport {
  const playerMap = new Map(clubPlayers.map((p) => [p.id, p]));
  const formation = club.tactics.formation;
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];

  const starters: { player: Player; slotIdx: number; slotPos: PositionCode }[] = [];
  club.startingXI.slice(0, 11).forEach((pid, idx) => {
    const p = playerMap.get(pid);
    if (p) {
      starters.push({
        player: p,
        slotIdx: idx,
        slotPos: slots[idx]?.position ?? p.primaryPosition,
      });
    }
  });

  const partnerships: PartnershipChemistryEvaluation[] = [];
  for (let i = 0; i < starters.length; i++) {
    for (let j = i + 1; j < starters.length; j++) {
      const sA = starters[i];
      const sB = starters[j];
      const pKey = makePlayerPairKey(sA.player.id, sB.player.id);
      const evalPair = evaluatePartnershipChemistry(
        sA.player,
        sB.player,
        sA.slotIdx,
        sB.slotIdx,
        formation,
        pairRecords[pKey],
        currentSeason,
        currentWeek,
        club.captainId,
        club.viceCaptainId,
        activeBoosters,
        config,
        activePositionBoosters
      );
      partnerships.push(evalPair);
    }
  }

  const linkedPartnerships = partnerships.filter((p) => p.isTacticallyLinked);
  const relevantPartnerships = linkedPartnerships.length > 0 ? linkedPartnerships : partnerships;

  const individualPlayers: IndividualPlayerChemistryEvaluation[] = starters.map((s) => {
    const suit = evaluateDetailedPositionalSuitability(
      s.player,
      s.slotPos,
      activePositionBoosters,
      currentSeason
    );
    const posFam = suit.familiarityScore;
    const myLinks = relevantPartnerships.filter(
      (p) => p.playerAId === s.player.id || p.playerBId === s.player.id
    );
    const avgTeammate =
      myLinks.length > 0
        ? Math.round(myLinks.reduce((sum, l) => sum + l.score, 0) / myLinks.length)
        : 60;

    let adaptationWeeksRemaining = 0;
    if (s.player.joinedClubSeason !== undefined && s.player.joinedClubWeek !== undefined) {
      const elapsed =
        (currentSeason - s.player.joinedClubSeason) * 22 +
        (currentWeek - s.player.joinedClubWeek);
      adaptationWeeksRemaining = Math.max(0, config.transferAdaptationWeeks - elapsed);
    }

    const individualChemistry = Math.max(
      5,
      Math.min(
        100,
        Math.round(posFam * 0.35 + avgTeammate * 0.65 - suit.chemistryPenaltyPoints * 0.5)
      )
    );

    return {
      playerId: s.player.id,
      playerName: `${s.player.firstName} ${s.player.lastName}`,
      positionSlot: s.slotPos,
      primaryPosition: s.player.primaryPosition,
      positionalFamiliarity: posFam,
      averageTeammateChemistry: avgTeammate,
      individualChemistry,
      level: getChemistryLevelLabel(individualChemistry),
      adaptationWeeksRemaining,
    };
  });

  const overallChemistry =
    individualPlayers.length > 0
      ? Math.round(
          individualPlayers.reduce((sum, p) => sum + p.individualChemistry, 0) /
            individualPlayers.length
        )
      : 60;

  const sortedLinks = [...relevantPartnerships].sort((a, b) => b.score - a.score);
  const strongestPartnerships = sortedLinks.slice(0, 4);
  const weakestPartnerships = [...sortedLinks].reverse().slice(0, 4);

  const improvementOpportunities: string[] = [];
  for (const ind of individualPlayers) {
    if (ind.positionalFamiliarity < 75) {
      improvementOpportunities.push(
        `Move ${ind.playerName} from ${ind.positionSlot} to their natural ${ind.primaryPosition} role (+${100 - ind.positionalFamiliarity}% positional familiarity).`
      );
    }
    if (ind.adaptationWeeksRemaining > 0) {
      improvementOpportunities.push(
        `New signing ${ind.playerName} has ${ind.adaptationWeeksRemaining} week(s) of club adaptation remaining; use a Chemistry or Team Bonding booster to accelerate integration.`
      );
    }
  }
  for (const weak of weakestPartnerships.slice(0, 2)) {
    if (weak.score < 58) {
      improvementOpportunities.push(
        `Pair ${weak.playerAName} & ${weak.playerBName} (${weak.score}/100 - ${weak.level}) need more minutes together or a Partnership Training session.`
      );
    }
  }
  if (improvementOpportunities.length === 0) {
    improvementOpportunities.push(
      'Starting XI has high interpersonal cohesion. Keep a consistent core lineup to reach Exceptional Understanding (95+).'
    );
  }

  const mods = computeNonlinearMatchModifiers(overallChemistry, 60, config);

  return {
    clubId: club.id,
    overallChemistry,
    level: getChemistryLevelLabel(overallChemistry),
    individualPlayers,
    partnerships: relevantPartnerships,
    strongestPartnerships,
    weakestPartnerships,
    improvementOpportunities: improvementOpportunities.slice(0, 5),
    matchPerformanceModifierPct: mods.chemistryModPct,
  };
}

/**
 * Seeds initial realistic pair chemistry records for a club's squad at career creation or save migration.
 * Players who have been at the club together start with Familiar/Strong baseline (~6-14 matches together).
 */
export function generateInitialPairChemistryForClub(
  club: Club,
  clubPlayers: Player[],
  season = 2026,
  week = 1
): Record<string, PlayerPairChemistryRecord> {
  const records: Record<string, PlayerPairChemistryRecord> = {};
  const starterSet = new Set(club.startingXI);

  for (let i = 0; i < clubPlayers.length; i++) {
    for (let j = i + 1; j < clubPlayers.length; j++) {
      const pA = clubPlayers[i];
      const pB = clubPlayers[j];
      if (pA.isYouth || pB.isYouth) continue;

      const bothStarters = starterSet.has(pA.id) && starterSet.has(pB.id);
      const seedVal = hashStringToSeed(`${pA.id}_${pB.id}`) % 9;
      const matchesTogether = bothStarters ? 8 + seedVal : 2 + (seedVal % 4);
      const minutesTogether = matchesTogether * (bothStarters ? 82 : 45);
      const pairKey = makePlayerPairKey(pA.id, pB.id);

      records[pairKey] = {
        pairKey,
        playerAId: pA.id < pB.id ? pA.id : pB.id,
        playerBId: pA.id < pB.id ? pB.id : pA.id,
        clubId: club.id,
        matchesTogether,
        minutesTogether,
        trainingSessionsTogether: matchesTogether * 2,
        weeksSinceLastPlayedTogether: 0,
        dynamicFamiliarityBonus: bothStarters ? 4 : 1,
        lastUpdatedSeason: season,
        lastUpdatedWeek: week,
      };
    }
  }

  return records;
}

/**
 * Updates interpersonal pair chemistry after a completed match:
 * - Starters who played together gain `matchesTogether + 1`, `minutesTogether + 90`,
 *   and controlled `dynamicFamiliarityBonus` growth (diminishing as familiarity approaches max so a single match never spikes chemistry).
 * - Pairs who scored/assisted together receive a small extra combination understanding boost (+0.45).
 */
export function updatePairChemistryAfterMatch(
  existingRecords: Record<string, PlayerPairChemistryRecord>,
  club: Club,
  starterIds: string[],
  goalAssistPairs: [string, string][],
  season: number,
  week: number,
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG
): Record<string, PlayerPairChemistryRecord> {
  const next = { ...existingRecords };
  const goalPairSet = new Set(goalAssistPairs.map(([a, b]) => makePlayerPairKey(a, b)));

  for (let i = 0; i < starterIds.length; i++) {
    for (let j = i + 1; j < starterIds.length; j++) {
      const idA = starterIds[i];
      const idB = starterIds[j];
      const key = makePlayerPairKey(idA, idB);
      const prev = next[key] ?? {
        pairKey: key,
        playerAId: idA < idB ? idA : idB,
        playerBId: idA < idB ? idB : idA,
        clubId: club.id,
        matchesTogether: 0,
        minutesTogether: 0,
        trainingSessionsTogether: 0,
        weeksSinceLastPlayedTogether: 0,
        dynamicFamiliarityBonus: 0,
        lastUpdatedSeason: season,
        lastUpdatedWeek: week,
      };

      // Diminishing gain per match so chemistry develops steadily over a season, never spiking from 1 match
      const headroom = Math.max(0.15, (32 - prev.dynamicFamiliarityBonus) / 32);
      const comboBonus = goalPairSet.has(key) ? 0.45 : 0;
      const gain = (config.chemistryGainPerMatchTogether + comboBonus) * headroom;

      next[key] = {
        ...prev,
        matchesTogether: prev.matchesTogether + 1,
        minutesTogether: prev.minutesTogether + 90,
        weeksSinceLastPlayedTogether: 0,
        dynamicFamiliarityBonus: Math.min(
          32,
          Math.round((prev.dynamicFamiliarityBonus + gain) * 100) / 100
        ),
        lastUpdatedSeason: season,
        lastUpdatedWeek: week,
      };
    }
  }

  return next;
}

/**
 * Processes weekly training & inactivity decay on interpersonal chemistry:
 * - Teammates in the active squad gain a small weekly training familiarity increment.
 * - Pairs who haven't played together for >= 4 weeks (and where neither player is injured, preserving injury grace)
 *   gradually lose a small amount of familiarity (`chemistryDecayPerInactiveWeek`), never dropping below established baseline.
 */
export function processWeeklyChemistryDevelopmentAndDecay(
  existingRecords: Record<string, PlayerPairChemistryRecord>,
  club: Club,
  clubPlayers: Player[],
  season: number,
  week: number,
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG
): Record<string, PlayerPairChemistryRecord> {
  const next = { ...existingRecords };
  const starterSet = new Set(club.startingXI);
  const injuredSet = new Set(clubPlayers.filter((p) => p.injuryWeeks > 0).map((p) => p.id));

  for (const [key, rec] of Object.entries(next)) {
    if (rec.clubId !== club.id) continue;

    const bothStarters = starterSet.has(rec.playerAId) && starterSet.has(rec.playerBId);
    const eitherInjured = injuredSet.has(rec.playerAId) || injuredSet.has(rec.playerBId);

    if (bothStarters && !eitherInjured) {
      const headroom = Math.max(0.15, (32 - rec.dynamicFamiliarityBonus) / 32);
      const trainGain = config.chemistryGainPerTrainingWeek * headroom;
      next[key] = {
        ...rec,
        trainingSessionsTogether: rec.trainingSessionsTogether + 1,
        dynamicFamiliarityBonus: Math.min(
          32,
          Math.round((rec.dynamicFamiliarityBonus + trainGain) * 100) / 100
        ),
        lastUpdatedSeason: season,
        lastUpdatedWeek: week,
      };
    } else if (!eitherInjured) {
      // Only increment inactivity counter if neither player is injured (injuries do not destroy established relationships)
      const inactiveWeeks = rec.weeksSinceLastPlayedTogether + 1;
      const shouldDecay = inactiveWeeks >= 4;
      const floor = rec.matchesTogether >= 15 ? 4 : -4;
      const decayedBonus = shouldDecay
        ? Math.max(floor, rec.dynamicFamiliarityBonus - config.chemistryDecayPerInactiveWeek)
        : rec.dynamicFamiliarityBonus;

      next[key] = {
        ...rec,
        weeksSinceLastPlayedTogether: inactiveWeeks,
        dynamicFamiliarityBonus: Math.round(decayedBonus * 100) / 100,
        lastUpdatedSeason: season,
        lastUpdatedWeek: week,
      };
    }
  }

  return next;
}
