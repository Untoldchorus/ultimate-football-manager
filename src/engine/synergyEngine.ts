import {
  computeNonlinearMatchModifiers,
  DEFAULT_BALANCE_CONFIG,
  getSynergyLevelLabel,
} from './balanceConfig';
import { evaluatePositionalFamiliarity } from './chemistryEngine';
import { FORMATION_SLOTS } from './ratings';
import {
  evaluateFormationStyleCompatibility,
  resolveTacticalPlayingStyle,
} from './tacticalMatrixEngine';
import {
  ActiveBoosterInstance,
  ActivePositionBooster,
  BalanceConfiguration,
  Club,
  PartnershipSynergyEvaluation,
  Player,
  PositionCode,
  SynergyFactorBreakdown,
  TacticalPlayerRole,
  TacticsConfig,
  TeamSynergyReport,
} from './types';

/**
 * Resolves a player's tactical role from their explicit role or best-fitting attribute profile
 * for their assigned pitch position.
 */
export function resolvePlayerTacticalRole(
  player: Player,
  assignedSlotPosition: PositionCode = player.primaryPosition
): TacticalPlayerRole {
  if (player.tacticalRole) return player.tacticalRole;
  const a = player.attributes;

  switch (assignedSlotPosition) {
    case 'GK':
      return a.distribution >= 68 && a.passing >= 55 ? 'SweeperKeeper' : 'ShotStopper';
    case 'CB':
      return a.passing >= 68 && a.ballControl >= 64 ? 'BallPlayingDefender' : 'CentralDefender';
    case 'LB':
    case 'RB':
      if (a.crossing >= 72 && a.pace >= 74) return 'Wingback';
      if (a.passing >= 72 && a.decisions >= 70) return 'InvertedFullback';
      return 'Fullback';
    case 'CDM':
      if (a.passing >= 75 && a.vision >= 73) return 'DeepLyingPlaymaker';
      if (a.tackling >= 74 && a.aggression >= 72) return 'BallWinningMidfielder';
      return 'DefensiveMidfielder';
    case 'CM':
      if (a.vision >= 76 && a.passing >= 76) return 'DeepLyingPlaymaker';
      if (a.tackling >= 75 && a.workRate >= 76) return 'BallWinningMidfielder';
      return 'BoxToBox';
    case 'CAM':
      return 'AdvancedPlaymaker';
    case 'LW':
    case 'RW':
      if (a.finishing >= 72 && a.shooting >= 70) return 'InsideForward';
      if (a.passing >= 72 && a.vision >= 70) return 'InvertedWinger';
      return 'Winger';
    case 'ST':
      if (a.passing >= 74 && a.vision >= 72) return 'FalseNine';
      if (a.strength >= 78 && a.heading >= 75) return 'TargetForward';
      if (a.strength >= 75 && a.dribbling >= 72) return 'CompleteForward';
      if (a.pace >= 76 && a.finishing >= 72) return 'AdvancedForward';
      return 'Poacher';
    default:
      return 'BoxToBox';
  }
}

export const TACTICAL_ROLE_LABELS: Record<TacticalPlayerRole, string> = {
  AdvancedForward: 'Advanced Forward',
  CompleteForward: 'Complete Forward',
  Poacher: 'Poacher',
  FalseNine: 'False Nine',
  TargetForward: 'Target Forward',
  InsideForward: 'Inside Forward',
  Winger: 'Winger',
  InvertedWinger: 'Inverted Winger',
  DeepLyingPlaymaker: 'Deep-Lying Playmaker',
  BoxToBox: 'Box-to-Box Midfielder',
  BallWinningMidfielder: 'Ball-Winning Midfielder',
  AdvancedPlaymaker: 'Advanced Playmaker',
  DefensiveMidfielder: 'Defensive Midfielder',
  BallPlayingDefender: 'Ball-Playing Defender',
  CentralDefender: 'Central Defender',
  Fullback: 'Fullback',
  Wingback: 'Wingback',
  InvertedFullback: 'Inverted Fullback',
  SweeperKeeper: 'Sweeper Keeper',
  // Legacy aliases
  ShotStopper: 'Shot-Stopping GK',
  StopperCB: 'Central Defender',
  AttackingFullback: 'Wingback',
  DefensiveFullback: 'Fullback',
  AnchorMan: 'Defensive Midfielder',
  TraditionalWinger: 'Winger',
};

export const CANONICAL_19_TACTICAL_ROLES: TacticalPlayerRole[] = [
  'AdvancedForward',
  'CompleteForward',
  'Poacher',
  'FalseNine',
  'TargetForward',
  'InsideForward',
  'Winger',
  'InvertedWinger',
  'DeepLyingPlaymaker',
  'BoxToBox',
  'BallWinningMidfielder',
  'AdvancedPlaymaker',
  'DefensiveMidfielder',
  'BallPlayingDefender',
  'CentralDefender',
  'Fullback',
  'Wingback',
  'InvertedFullback',
  'SweeperKeeper',
];

/**
 * Evaluates tactical complementarity between two players' roles, positions, attributes, and club tactics.
 * Specifically models the 5 canonical football synergy archetypes required by directive:
 * 1. Defensive midfielder (AnchorMan) protecting attacking fullbacks.
 * 2. Creative midfielder (AdvancedPlaymaker / DeepLyingPlaymaker) supplying a striker with excellent movement.
 * 3. Fast winger benefiting from an overlapping/inverted fullback on the same flank.
 * 4. Ball-playing centre-back supporting possession/tiki-taka football.
 * 5. Defensive midfielder covering for an advanced playmaker.
 */
export function evaluatePartnershipSynergy(
  playerA: Player,
  playerB: Player,
  slotPosA: PositionCode,
  slotPosB: PositionCode,
  tactics: TacticsConfig,
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG
): PartnershipSynergyEvaluation {
  const roleA = resolvePlayerTacticalRole(playerA, slotPosA);
  const roleB = resolvePlayerTacticalRole(playerB, slotPosB);
  const roles = new Set([roleA, roleB]);
  const positions = new Set([slotPosA, slotPosB]);

  let roleComplementScore = 62;
  let archetypeLabel = 'Balanced Tactical Link';
  let explanation = `${TACTICAL_ROLE_LABELS[roleA]} and ${TACTICAL_ROLE_LABELS[roleB]} share standard positional coverage.`;

  const isDmRole = (r: TacticalPlayerRole) =>
    r === 'AnchorMan' || r === 'DefensiveMidfielder' || r === 'BallWinningMidfielder';
  const isOverlappingFb = (r: TacticalPlayerRole) =>
    r === 'AttackingFullback' || r === 'Wingback';

  // Archetype 1: Defensive Midfielder protecting Attacking Fullbacks / Wingbacks
  if ((isDmRole(roleA) && isOverlappingFb(roleB)) || (isDmRole(roleB) && isOverlappingFb(roleA))) {
    const dm = isDmRole(roleA) ? playerA : playerB;
    const fb = isDmRole(roleA) ? playerB : playerA;
    const attrFit =
      (dm.attributes.positioning + dm.attributes.tackling + fb.attributes.pace + fb.attributes.crossing) /
      4;
    roleComplementScore = Math.min(99, Math.round(74 + (attrFit - 65) * 0.85));
    archetypeLabel = 'CDM Protecting Overlapping Fullback';
    explanation = `${dm.lastName} (Holding CDM) drops into the half-space to cover ${fb.lastName}'s overlapping runs down the flank.`;
  }
  // Archetype 2: Creative Midfielder supplying a Striker with excellent movement
  else if (
    (roles.has('AdvancedPlaymaker') || roles.has('DeepLyingPlaymaker')) &&
    (positions.has('ST') ||
      roles.has('Poacher') ||
      roles.has('CompleteForward') ||
      roles.has('AdvancedForward') ||
      roles.has('TargetForward'))
  ) {
    const creator =
      roleA === 'AdvancedPlaymaker' || roleA === 'DeepLyingPlaymaker' ? playerA : playerB;
    const striker = creator.id === playerA.id ? playerB : playerA;
    const attrFit =
      (creator.attributes.vision +
        creator.attributes.passing +
        striker.attributes.positioning +
        striker.attributes.finishing +
        striker.attributes.anticipation) /
      5;
    roleComplementScore = Math.min(99, Math.round(76 + (attrFit - 65) * 0.85));
    archetypeLabel = 'Playmaker Supplying Movement Striker';
    explanation = `${creator.lastName}'s vision (${creator.attributes.vision}) and through-balls unlock ${striker.lastName}'s off-the-ball movement (${striker.attributes.positioning}).`;
  }
  // Archetype 3: Fast Winger benefiting from an Overlapping or Inverted Fullback on same flank
  else if (
    (slotPosA === 'LW' && slotPosB === 'LB') ||
    (slotPosA === 'LB' && slotPosB === 'LW') ||
    (slotPosA === 'RW' && slotPosB === 'RB') ||
    (slotPosA === 'RB' && slotPosB === 'RW')
  ) {
    const winger = slotPosA === 'LW' || slotPosA === 'RW' ? playerA : playerB;
    const fullback = winger.id === playerA.id ? playerB : playerA;
    const wingerRole = resolvePlayerTacticalRole(winger, slotPosA === 'LW' || slotPosA === 'RW' ? slotPosA : slotPosB);
    const fbRole = resolvePlayerTacticalRole(fullback, slotPosA === 'LB' || slotPosA === 'RB' ? slotPosA : slotPosB);

    const dualCorridorBonus =
      ((wingerRole === 'InsideForward' || wingerRole === 'InvertedWinger') && isOverlappingFb(fbRole)) ||
      ((wingerRole === 'TraditionalWinger' || wingerRole === 'Winger') && fbRole === 'InvertedFullback')
        ? 14
        : 6;
    const attrFit =
      (winger.attributes.pace +
        winger.attributes.dribbling +
        fullback.attributes.stamina +
        fullback.attributes.crossing) /
      4;
    roleComplementScore = Math.min(
      99,
      Math.round(68 + dualCorridorBonus + (attrFit - 65) * 0.7)
    );
    archetypeLabel = 'Flank Overload & Corridor Synergy';
    explanation = `${winger.lastName} (${TACTICAL_ROLE_LABELS[wingerRole]}) and ${fullback.lastName} (${TACTICAL_ROLE_LABELS[fbRole]}) occupy complementary wide and half-space lanes.`;
  }
  // Archetype 4: Ball-Playing Centre-Back supporting Possession / Tiki-Taka or Sweeper Keeper / Stopper partner
  else if (roles.has('BallPlayingDefender')) {
    const bpd = roleA === 'BallPlayingDefender' ? playerA : playerB;
    const partner = bpd.id === playerA.id ? playerB : playerA;
    const partnerRole = bpd.id === playerA.id ? roleB : roleA;
    const style = resolveTacticalPlayingStyle(tactics);
    const possessionFit =
      style === 'possession' || style === 'tikiTaka' || style === 'totalFootball' ? 12 : 4;
    const stopperBalance =
      partnerRole === 'StopperCB' ||
      partnerRole === 'CentralDefender' ||
      partnerRole === 'SweeperKeeper' ||
      isDmRole(partnerRole) ||
      partnerRole === 'DeepLyingPlaymaker'
        ? 10
        : 3;
    const attrFit =
      (bpd.attributes.passing + bpd.attributes.composure + partner.attributes.positioning) / 3;
    roleComplementScore = Math.min(
      99,
      Math.round(66 + possessionFit + stopperBalance + (attrFit - 65) * 0.65)
    );
    archetypeLabel = 'Ball-Playing Build-Up Foundation';
    explanation = `${bpd.lastName} progresses possession from the backline into ${partner.lastName} (${TACTICAL_ROLE_LABELS[partnerRole]}).`;
  }
  // Archetype 5: Defensive Midfielder covering for an Advanced Playmaker / Box-to-Box
  else if (
    (isDmRole(roleA) || isDmRole(roleB)) &&
    (roles.has('AdvancedPlaymaker') || roles.has('BoxToBox') || roles.has('DeepLyingPlaymaker'))
  ) {
    const anchor = isDmRole(roleA) ? playerA : playerB;
    const mid = anchor.id === playerA.id ? playerB : playerA;
    const attrFit =
      (anchor.attributes.tackling +
        anchor.attributes.positioning +
        mid.attributes.passing +
        mid.attributes.vision) /
      4;
    roleComplementScore = Math.min(99, Math.round(75 + (attrFit - 65) * 0.8));
    archetypeLabel = 'Midfield Destroyer & Creator Pivot';
    explanation = `${anchor.lastName} shields the back four, granting ${mid.lastName} creative freedom in advanced midfield zones.`;
  }
  // Penalty if two players have clashing ultra-passive or ultra-risky roles in the same unit
  else if (roleA === 'Poacher' && roleB === 'Poacher') {
    roleComplementScore = 44;
    archetypeLabel = 'Redundant Dual Poachers';
    explanation = `Both ${playerA.lastName} and ${playerB.lastName} operate as static box poachers with limited link-up play.`;
  } else if (roleA === 'AdvancedPlaymaker' && roleB === 'AdvancedPlaymaker') {
    roleComplementScore = 48;
    archetypeLabel = 'Lack of Midfield Ball-Winning';
    explanation = `Two Advanced Playmakers occupy the same creative pockets while leaving defensive transitions exposed.`;
  }

  // Factor in positional familiarity of both players in their current slots
  const posFam =
    (evaluatePositionalFamiliarity(playerA, slotPosA) +
      evaluatePositionalFamiliarity(playerB, slotPosB)) /
    2;

  const weighted =
    roleComplementScore * 0.72 * config.synergyRoleWeight + posFam * 0.28;
  const finalScore = Math.max(10, Math.min(100, Math.round(weighted)));

  return {
    playerAId: playerA.id,
    playerBId: playerB.id,
    playerAName: `${playerA.firstName} ${playerA.lastName}`,
    playerBName: `${playerB.firstName} ${playerB.lastName}`,
    roleA,
    roleB,
    positionA: slotPosA,
    positionB: slotPosB,
    score: finalScore,
    level: getSynergyLevelLabel(finalScore),
    archetypeLabel,
    explanation,
  };
}

/**
 * Evaluates full independent Team Synergy across all 10 Synergy Factors:
 * 1. Player role compatibility
 * 2. Positional relationships
 * 3. Tactical instructions
 * 4. Formation compatibility
 * 5. Complementary attributes
 * 6. Playing style compatibility
 * 7. Defensive and attacking balance
 * 8. Player positioning
 * 9. Tactical familiarity
 * 10. Team structure
 */
export function evaluateTeamSynergy(
  club: Club,
  clubPlayers: Player[],
  activeBoosters: ActiveBoosterInstance[] = [],
  config: BalanceConfiguration = DEFAULT_BALANCE_CONFIG,
  activePositionBoosters: ActivePositionBooster[] = [],
  currentSeason?: number
): TeamSynergyReport {
  const playerMap = new Map(clubPlayers.map((p) => [p.id, p]));
  const tactics = club.tactics;
  const formation = tactics.formation;
  const playingStyle = resolveTacticalPlayingStyle(tactics);
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];

  const lineup: { player: Player; slotPos: PositionCode; role: TacticalPlayerRole; idx: number }[] =
    [];
  club.startingXI.slice(0, 11).forEach((pid, idx) => {
    const p = playerMap.get(pid);
    if (!p) return;
    const slotPos = slots[idx]?.position ?? p.primaryPosition;
    const explicitRole = tactics.roleOverrides?.[idx] ?? p.tacticalRole;
    lineup.push({
      player: explicitRole ? { ...p, tacticalRole: explicitRole } : p,
      slotPos,
      role: explicitRole ?? resolvePlayerTacticalRole(p, slotPos),
      idx,
    });
  });

  // Evaluate key tactical partnerships across units
  const partnerships: PartnershipSynergyEvaluation[] = [];
  for (let i = 0; i < lineup.length; i++) {
    for (let j = i + 1; j < lineup.length; j++) {
      const a = lineup[i];
      const b = lineup[j];
      const dist = Math.hypot(
        (slots[a.idx]?.x ?? 50) - (slots[b.idx]?.x ?? 50),
        (slots[a.idx]?.y ?? 50) - (slots[b.idx]?.y ?? 50)
      );
      if (dist <= 38) {
        partnerships.push(
          evaluatePartnershipSynergy(a.player, b.player, a.slotPos, b.slotPos, tactics, config)
        );
      }
    }
  }

  // Group players by unit
  const defUnit = lineup.filter((l) => ['GK', 'CB', 'LB', 'RB'].includes(l.slotPos));
  const midUnit = lineup.filter((l) => ['CDM', 'CM', 'CAM'].includes(l.slotPos));
  const attUnit = lineup.filter((l) => ['LW', 'RW', 'ST', 'CAM'].includes(l.slotPos));
  const leftFlank = lineup.filter((l) => ['LB', 'LW', 'CM', 'CDM'].includes(l.slotPos));
  const rightFlank = lineup.filter((l) => ['RB', 'RW', 'CM', 'CDM'].includes(l.slotPos));

  // 1. Role compatibility score (0..100)
  const roleCompatibilityScore =
    partnerships.length > 0
      ? Math.round(partnerships.reduce((s, p) => s + p.score, 0) / partnerships.length)
      : 62;

  // 2. Positional relationships (natural vs secondary vs out-of-position across the XI)
  const positionalRelationshipScore =
    lineup.length > 0
      ? Math.round(
          lineup.reduce(
            (s, l) =>
              s +
              evaluatePositionalFamiliarity(
                l.player,
                l.slotPos,
                activePositionBoosters,
                currentSeason
              ),
            0
          ) / lineup.length
        )
      : 65;

  // 3. Tactical instructions coherence (e.g. High Line + Offside Trap + Gegenpress vs contradicting instructions)
  let instructionCoherence = 74;
  const insights: string[] = [];

  if (tactics.pressing === 'gegenpress' || tactics.pressing === 'high' || playingStyle === 'gegenpress' || playingStyle === 'highPress') {
    if (tactics.defensiveLine === 'high') {
      instructionCoherence += 14;
      insights.push('High defensive line compacts the pitch for your high pressing system.');
    } else if (tactics.defensiveLine === 'deep') {
      instructionCoherence -= 18;
      insights.push(
        'Tactical Warning: Combining a Deep Defensive Line with High/Gegenpress stretches midfield distances.'
      );
    }
  } else if (tactics.pressing === 'low' && tactics.defensiveLine === 'deep') {
    instructionCoherence += 12;
    insights.push('Compact Low Block and Deep Line form a cohesive defensive structure.');
  }

  if (
    (playingStyle === 'tikiTaka' || playingStyle === 'possession' || playingStyle === 'totalFootball') &&
    tactics.directness <= 55
  ) {
    instructionCoherence += 10;
  } else if (playingStyle === 'tikiTaka' && tactics.directness > 75) {
    instructionCoherence -= 15;
    insights.push(
      'Tactical Warning: High Passing Directness conflicts with Tiki-Taka short-passing identity.'
    );
  } else if (playingStyle === 'wingPlay' && tactics.width >= 60) {
    instructionCoherence += 10;
  } else if ((playingStyle === 'directCounter' || playingStyle === 'longBall') && tactics.tempo >= 65) {
    instructionCoherence += 10;
  }
  const tacticalInstructionScore = Math.max(20, Math.min(100, instructionCoherence));

  // 4. Formation compatibility with squad positions & playing style
  const matrixFormCompat = evaluateFormationStyleCompatibility(formation, playingStyle);
  const formationFit = positionalRelationshipScore * 0.55 + matrixFormCompat * 0.45;
  const formationCompatibilityScore = Math.max(
    25,
    Math.min(100, Math.round(formationFit * config.synergyFormationWeight))
  );

  // 5. Complementary attributes (e.g. creators' vision/passing + forwards' finishing/pace + defenders' tackling/positioning)
  const avgAttr = (list: typeof lineup, key: keyof Player['attributes']) =>
    list.length > 0
      ? list.reduce((s, l) => s + (l.player.attributes[key] ?? 65), 0) / list.length
      : 65;

  const midCreativity = (avgAttr(midUnit, 'passing') + avgAttr(midUnit, 'vision')) / 2;
  const attThreat = (avgAttr(attUnit, 'finishing') + avgAttr(attUnit, 'pace')) / 2;
  const defSolidity = (avgAttr(defUnit, 'tackling') + avgAttr(defUnit, 'positioning')) / 2;
  const complementaryAttributesScore = Math.max(
    30,
    Math.min(100, Math.round((midCreativity + attThreat + defSolidity) / 3 + 4))
  );

  // 6. Playing style compatibility (do players' attributes match the chosen playingStyle & pressing?)
  let styleFit = 68;
  if (playingStyle === 'tikiTaka' || playingStyle === 'possession' || playingStyle === 'totalFootball') {
    styleFit = Math.round((avgAttr(lineup, 'passing') + avgAttr(lineup, 'firstTouch')) / 2 + 6);
  } else if (playingStyle === 'wingPlay') {
    styleFit = Math.round((avgAttr(attUnit, 'crossing') + avgAttr(attUnit, 'heading')) / 2 + 8);
  } else if (playingStyle === 'directCounter') {
    styleFit = Math.round((avgAttr(attUnit, 'pace') + avgAttr(midUnit, 'passing')) / 2 + 6);
  } else if (playingStyle === 'longBall') {
    styleFit = Math.round((avgAttr(attUnit, 'strength') + avgAttr(attUnit, 'heading')) / 2 + 7);
  } else if (playingStyle === 'parkTheBus' || playingStyle === 'catenaccio' || playingStyle === 'midBlock') {
    styleFit = Math.round((avgAttr(defUnit, 'positioning') + avgAttr(defUnit, 'marking')) / 2 + 7);
  }
  if (tactics.pressing === 'gegenpress' || playingStyle === 'gegenpress' || playingStyle === 'highPress') {
    const staminaAvg = avgAttr(lineup, 'stamina');
    styleFit = Math.round(styleFit * 0.7 + staminaAvg * 0.3);
  }
  const playingStyleCompatibilityScore = Math.max(25, Math.min(100, styleFit));

  // 7. Defensive & attacking balance (checks that the lineup has holding protection as well as attacking outlets)
  const hasHoldingMid = lineup.some(
    (l) =>
      l.role === 'AnchorMan' ||
      l.role === 'DefensiveMidfielder' ||
      l.role === 'BallWinningMidfielder' ||
      l.slotPos === 'CDM' ||
      l.role === 'DefensiveFullback' ||
      l.role === 'Fullback'
  );
  const hasPlaymaker = lineup.some(
    (l) =>
      l.role === 'AdvancedPlaymaker' ||
      l.role === 'DeepLyingPlaymaker' ||
      l.role === 'FalseNine' ||
      l.role === 'InvertedWinger'
  );
  const hasGoalThreat = lineup.some(
    (l) =>
      l.role === 'Poacher' ||
      l.role === 'CompleteForward' ||
      l.role === 'AdvancedForward' ||
      l.role === 'TargetForward' ||
      l.role === 'InsideForward'
  );
  let balanceScore = 60;
  if (hasHoldingMid) balanceScore += 14;
  else insights.push('Midfield lacks a dedicated Defensive Anchor or holding shield.');
  if (hasPlaymaker) balanceScore += 13;
  else insights.push('Lineup lacks a designated Playmaker to link midfield and attack.');
  if (hasGoalThreat) balanceScore += 13;
  const defensiveAttackingBalanceScore = Math.max(25, Math.min(100, balanceScore));

  // 8. Player positioning & spatial coverage
  const playerPositioningScore = Math.max(
    30,
    Math.min(100, Math.round(avgAttr(lineup, 'positioning') * 0.6 + positionalRelationshipScore * 0.4))
  );

  // 9. Tactical familiarity (decisions, vision, workRate + tactical boosters)
  let boosterSynergyBonus = 0;
  for (const b of activeBoosters) {
    if (b.category === 'synergy') {
      boosterSynergyBonus += b.effectStrength * config.boosterGlobalStrengthMultiplier;
    }
  }
  boosterSynergyBonus = Math.min(12, boosterSynergyBonus);

  const tacticalFamiliarityScore = Math.max(
    30,
    Math.min(
      100,
      Math.round(
        (avgAttr(lineup, 'decisions') + avgAttr(lineup, 'workRate')) / 2 +
          6 +
          boosterSynergyBonus
      )
    )
  );

  // 10. Team structure
  const gkCount = lineup.filter((l) => l.player.primaryPosition === 'GK').length;
  const teamStructureScore =
    lineup.length === 11 && gkCount === 1
      ? Math.min(100, Math.round((formationCompatibilityScore + defensiveAttackingBalanceScore) / 2))
      : 35;

  // Compute Unit Synergies
  const defensiveSynergy = Math.max(
    20,
    Math.min(
      100,
      Math.round(
        defSolidity * 0.35 +
          tacticalInstructionScore * 0.25 +
          defensiveAttackingBalanceScore * 0.2 +
          positionalRelationshipScore * 0.2 +
          boosterSynergyBonus * 0.5
      )
    )
  );

  const midfieldSynergy = Math.max(
    20,
    Math.min(
      100,
      Math.round(
        midCreativity * 0.3 +
          roleCompatibilityScore * 0.3 +
          playingStyleCompatibilityScore * 0.2 +
          tacticalFamiliarityScore * 0.2 +
          boosterSynergyBonus * 0.5
      )
    )
  );

  const attackingSynergy = Math.max(
    20,
    Math.min(
      100,
      Math.round(
        attThreat * 0.3 +
          roleCompatibilityScore * 0.3 +
          playingStyleCompatibilityScore * 0.2 +
          complementaryAttributesScore * 0.2 +
          boosterSynergyBonus * 0.5
      )
    )
  );

  const leftFlankSynergy = Math.min(
    100,
    Math.round((avgAttr(leftFlank, 'pace') + avgAttr(leftFlank, 'passing') + roleCompatibilityScore) / 3)
  );
  const rightFlankSynergy = Math.min(
    100,
    Math.round((avgAttr(rightFlank, 'pace') + avgAttr(rightFlank, 'passing') + roleCompatibilityScore) / 3)
  );

  const overallSynergy = Math.max(
    15,
    Math.min(
      100,
      Math.round(
        (roleCompatibilityScore * 0.16 +
          positionalRelationshipScore * 0.12 +
          tacticalInstructionScore * 0.12 +
          formationCompatibilityScore * 0.10 +
          complementaryAttributesScore * 0.10 +
          playingStyleCompatibilityScore * 0.10 +
          defensiveAttackingBalanceScore * 0.10 +
          playerPositioningScore * 0.06 +
          tacticalFamiliarityScore * 0.07 +
          teamStructureScore * 0.07) *
          config.synergyTacticsWeight
      )
    )
  );

  const bestArchetypes = [...partnerships].sort((a, b) => b.score - a.score).slice(0, 2);
  for (const arch of bestArchetypes) {
    if (arch.score >= 72) {
      insights.push(`${arch.archetypeLabel}: ${arch.explanation}`);
    }
  }

  const mods = computeNonlinearMatchModifiers(60, overallSynergy, config);

  return {
    clubId: club.id,
    formation,
    overallSynergy,
    level: getSynergyLevelLabel(overallSynergy),
    defensiveSynergy,
    midfieldSynergy,
    attackingSynergy,
    positionalUnitSynergy: {
      backline: defensiveSynergy,
      engineRoom: midfieldSynergy,
      frontline: attackingSynergy,
      leftFlank: leftFlankSynergy,
      rightFlank: rightFlankSynergy,
    },
    partnerships: partnerships.sort((a, b) => b.score - a.score),
    factors: {
      roleCompatibilityScore,
      positionalRelationshipScore,
      tacticalInstructionScore,
      formationCompatibilityScore,
      complementaryAttributesScore,
      playingStyleCompatibilityScore,
      defensiveAttackingBalanceScore,
      playerPositioningScore,
      tacticalFamiliarityScore,
      teamStructureScore,
    },
    tacticalInsights: insights.slice(0, 5),
    matchPerformanceModifierPct: mods.synergyModPct,
  };
}
