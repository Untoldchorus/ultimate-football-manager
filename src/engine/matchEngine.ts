import {
  computeNonlinearMatchModifiers,
  DEFAULT_BALANCE_CONFIG,
} from './balanceConfig';
import { formatCommentary } from './commentary';
import { FORMATION_SLOTS } from './ratings';
import { createRng, SeededRng } from './rng';
import {
  evaluateDetailedPositionalSuitability,
  evaluatePlayerInMatchPhysicalState,
  evaluateTacticalMatchup,
  resolveExtendedPlayerAttributes,
  resolveManagerAttributes,
  resolveTacticalPlayingStyle,
  TACTICAL_STYLES_CATALOG,
} from './tacticalMatrixEngine';
import {
  ActiveBoosterInstance,
  ActivePositionBooster,
  BalanceConfiguration,
  Club,
  MatchEvent,
  MatchResult,
  MatchSimulationInput,
  MatchTeamStats,
  Player,
  PlayerAnimationAction,
  PlayerPositionSnapshot,
  TacticsConfig,
  Vector2D,
} from './types';

interface TeamSimContext {
  club: Club;
  tactics: TacticsConfig;
  starters: Player[]; // 11 active on pitch (or fewer if red carded)
  bench: Player[];
  sentOffIds: Set<string>;
  subsMade: number;
  attackRating: number;
  midfieldRating: number;
  defenseRating: number;
  gkPlayer: Player;
  aggressionFactor: number;
  chemistryScore: number; // 0..100
  synergyScore: number; // 0..100
  chemistryModPct: number; // -3%..+3%
  synergyModPct: number; // -4%..+4%
  combinedModPct: number; // -7%..+7%
}

function computeTeamRatings(
  starters: Player[],
  tactics: TacticsConfig,
  sentOffIds: Set<string>,
  chemistryScore = 58,
  synergyScore = 58,
  activeBoosters: ActiveBoosterInstance[] = [],
  balanceConfig: BalanceConfiguration = DEFAULT_BALANCE_CONFIG,
  tacticalSituationalModPct = 0,
  positionBoosters: ActivePositionBooster[] = [],
  currentSeason = 2026
): {
  attack: number;
  midfield: number;
  defense: number;
  gk: Player;
  aggression: number;
  chemistryModPct: number;
  synergyModPct: number;
  combinedModPct: number;
} {
  const slots = FORMATION_SLOTS[tactics.formation] ?? FORMATION_SLOTS['4-3-3'];
  const active = starters.filter((p) => !sentOffIds.has(p.id));
  const gk = active.find((p) => p.primaryPosition === 'GK') ?? active[0] ?? starters[0];

  const attackers = active.filter((p) => ['ST', 'LW', 'RW', 'CAM'].includes(p.primaryPosition));
  const midfielders = active.filter((p) => ['CM', 'CDM', 'CAM', 'LW', 'RW'].includes(p.primaryPosition));
  const defenders = active.filter((p) => ['CB', 'LB', 'RB', 'CDM'].includes(p.primaryPosition));

  const effOvr = (p: Player) => {
    const slotIdx = starters.findIndex((s) => s.id === p.id);
    const slotPos = slotIdx >= 0 ? slots[slotIdx]?.position ?? p.primaryPosition : p.primaryPosition;
    const posSuit = evaluateDetailedPositionalSuitability(p, slotPos, positionBoosters, currentSeason);
    const effectiveFitness = p.stamina !== undefined ? Math.min(100, (p.fitness + p.stamina) / 2) : p.fitness;
    const fatiguePen = p.fatigue !== undefined && p.fatigue > 30 ? (p.fatigue - 30) * 0.0018 : 0;
    const fitMod = Math.max(0.72, 0.85 + (effectiveFitness / 100) * 0.15 - fatiguePen);
    const moraleMod = 0.94 + (p.morale / 100) * 0.08;
    const formMod = 0.94 + (p.form / 10) * 0.08;
    // Apply off-position penalty when positionalFamiliarity or positionBoosters are explicitly tracked
    const hasExplicitPositionTracking =
      positionBoosters.length > 0 || (p.positionalFamiliarity && Object.keys(p.positionalFamiliarity).length > 0);
    const posMod =
      !hasExplicitPositionTracking || posSuit.isNatural || posSuit.isSecondary || posSuit.isBoosterUnlocked
        ? 1.0
        : posSuit.tacticalExecutionMultiplier;
    return p.overall * fitMod * moraleMod * formMod * posMod;
  };

  const avg = (list: Player[]) =>
    list.length > 0 ? list.reduce((s, p) => s + effOvr(p), 0) / list.length : 68;

  let attack = avg(attackers.length ? attackers : active);
  let midfield = avg(midfielders.length ? midfielders : active);
  let defense = (avg(defenders.length ? defenders : active) * 0.72) + (effOvr(gk) * 0.28);

  // Tactical modifiers
  if (tactics.mentality === 'attacking') {
    attack += 2.2;
    defense -= 1.5;
  } else if (tactics.mentality === 'allOutAttack') {
    attack += 4.0;
    defense -= 3.5;
  } else if (tactics.mentality === 'defensive') {
    defense += 2.2;
    attack -= 1.5;
  } else if (tactics.mentality === 'ultraDefensive') {
    defense += 3.8;
    attack -= 3.2;
  }

  const style = resolveTacticalPlayingStyle(tactics);
  if (style === 'possession' || style === 'tikiTaka' || style === 'totalFootball') {
    midfield += 2.0;
  } else if (style === 'directCounter' || style === 'wingPlay' || style === 'longBall') {
    attack += 1.5;
  } else if (style === 'parkTheBus' || style === 'catenaccio' || style === 'midBlock') {
    defense += 1.8;
  }

  let aggression = 1.0;
  if (tactics.pressing === 'high' || style === 'highPress') {
    midfield += 1.0;
    aggression = 1.12;
  } else if (tactics.pressing === 'gegenpress' || style === 'gegenpress') {
    midfield += 1.8;
    aggression = 1.24;
  } else if (tactics.pressing === 'low' || style === 'parkTheBus' || style === 'catenaccio') {
    aggression = 0.85;
  }

  // Red card penalty
  const redPenalty = sentOffIds.size * 5.5;
  attack -= redPenalty;
  midfield -= redPenalty;
  defense -= redPenalty;

  // Controlled Nonlinear Chemistry (<= 3%) and Synergy (<= 4%) Match Integration (Combined <= 7%)
  // Plus 12x12 Tactical Counter Matrix situational modifier (+5% Strong, 0% Neutral, -5% Weak)
  let effectiveChem = chemistryScore;
  let effectiveSyn = synergyScore;
  for (const b of activeBoosters) {
    if (b.category === 'chemistry') {
      effectiveChem += b.effectStrength * 0.5 * balanceConfig.boosterGlobalStrengthMultiplier;
    } else if (b.category === 'synergy') {
      effectiveSyn += b.effectStrength * 0.5 * balanceConfig.boosterGlobalStrengthMultiplier;
    }
  }

  const nlMods = computeNonlinearMatchModifiers(effectiveChem, effectiveSyn, balanceConfig);
  const mult = 1 + (nlMods.combinedModPct + tacticalSituationalModPct) / 100;

  attack *= mult;
  midfield *= mult;
  defense *= mult;

  return {
    attack,
    midfield,
    defense,
    gk,
    aggression,
    chemistryModPct: nlMods.chemistryModPct,
    synergyModPct: nlMods.synergyModPct,
    combinedModPct: nlMods.combinedModPct,
  };
}

function buildPlayerPositionsSnapshot(
  rng: SeededRng,
  homeCtx: TeamSimContext,
  awayCtx: TeamSimContext,
  ballPos: Vector2D,
  possessingClubId: string,
  activePlayerId?: string,
  activeAction: PlayerAnimationAction = 'run'
): PlayerPositionSnapshot[] {
  const snapshots: PlayerPositionSnapshot[] = [];
  const homeSlots = FORMATION_SLOTS[homeCtx.tactics.formation] ?? FORMATION_SLOTS['4-3-3'];
  const awaySlots = FORMATION_SLOTS[awayCtx.tactics.formation] ?? FORMATION_SLOTS['4-3-3'];

  const ballShiftX = (ballPos.x - 50) * 0.32;
  const ballShiftY = (ballPos.y - 50) * 0.18;

  // Home plays left-to-right (0 -> 100)
  homeCtx.starters.forEach((p, idx) => {
    if (homeCtx.sentOffIds.has(p.id)) return;
    const slot = homeSlots[idx] ?? homeSlots[0];
    const isGK = idx === 0 || p.primaryPosition === 'GK';
    let x = isGK ? Math.max(4, Math.min(14, slot.x + ballShiftX * 0.15)) : slot.x + ballShiftX + rng.nextFloat(-2.5, 2.5);
    let y = isGK ? 50 + ballShiftY * 0.25 : slot.y + ballShiftY + rng.nextFloat(-3, 3);

    if (p.id === activePlayerId) {
      x = ballPos.x;
      y = ballPos.y;
    }

    snapshots.push({
      playerId: p.id,
      teamId: homeCtx.club.id,
      x: Math.max(2, Math.min(98, Math.round(x * 10) / 10)),
      y: Math.max(4, Math.min(96, Math.round(y * 10) / 10)),
      action: p.id === activePlayerId ? activeAction : possessingClubId === homeCtx.club.id ? 'run' : 'walk',
    });
  });

  // Away plays right-to-left (100 -> 0)
  awayCtx.starters.forEach((p, idx) => {
    if (awayCtx.sentOffIds.has(p.id)) return;
    const slot = awaySlots[idx] ?? awaySlots[0];
    const mirroredSlotX = 100 - slot.x;
    const mirroredSlotY = 100 - slot.y;
    const isGK = idx === 0 || p.primaryPosition === 'GK';
    let x = isGK
      ? Math.max(86, Math.min(96, mirroredSlotX + ballShiftX * 0.15))
      : mirroredSlotX + ballShiftX + rng.nextFloat(-2.5, 2.5);
    let y = isGK ? 50 + ballShiftY * 0.25 : mirroredSlotY + ballShiftY + rng.nextFloat(-3, 3);

    if (p.id === activePlayerId) {
      x = ballPos.x;
      y = ballPos.y;
    }

    snapshots.push({
      playerId: p.id,
      teamId: awayCtx.club.id,
      x: Math.max(2, Math.min(98, Math.round(x * 10) / 10)),
      y: Math.max(4, Math.min(96, Math.round(y * 10) / 10)),
      action: p.id === activePlayerId ? activeAction : possessingClubId === awayCtx.club.id ? 'run' : 'walk',
    });
  });

  return snapshots;
}

function pickWeightedPlayer(rng: SeededRng, players: Player[], preferredPositions: string[]): Player {
  const candidates = players.filter((p) => p.primaryPosition !== 'GK');
  if (candidates.length === 0) return players[0];
  const preferred = candidates.filter((p) => preferredPositions.includes(p.primaryPosition));
  if (preferred.length > 0 && rng.chance(0.76)) {
    return rng.pick(preferred);
  }
  return rng.pick(candidates);
}

/**
 * Pure, deterministic match simulation engine (`simulateMatch(input, seed)`).
 * Produces calibrated football statistics matching the realism targets:
 * - Goals per match: ~2.65 - 2.85
 * - Home win: ~44-46%, Draw: ~25-27%, Away win: ~28-30%
 * - Shots per team: ~11-13 with ~35% on target
 * - Yellow cards: ~3.5 - 4.3 per match, Red cards: < 0.12 per match
 * - +10 OVR team wins clearly more often with ~10-15% upset rate
 */
export function simulateMatch(
  input: MatchSimulationInput,
  seed: number,
  options?: {
    startFromMinute?: number;
    existingEvents?: MatchEvent[];
    initialHomeScore?: number;
    initialAwayScore?: number;
  }
): MatchResult {
  const rng = createRng(seed);
  const startMin = options?.startFromMinute ?? 1;

  const resolveSquad = (club: Club, pool: Player[]) => {
    const map = new Map(pool.map((p) => [p.id, p]));
    const starters = club.startingXI.map((id) => map.get(id)).filter((p): p is Player => !!p);
    while (starters.length < 11 && pool.length > starters.length) {
      const nextP = pool.find((p) => !starters.some((s) => s.id === p.id));
      if (nextP) starters.push(nextP);
      else break;
    }
    const bench = club.substitutes.map((id) => map.get(id)).filter((p): p is Player => !!p);
    return { starters: [...starters], bench: [...bench] };
  };

  const homeSquad = resolveSquad(input.homeClub, input.homePlayers);
  const awaySquad = resolveSquad(input.awayClub, input.awayPlayers);

  const homeSentOff = new Set<string>();
  const awaySentOff = new Set<string>();

  const balCfg = input.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
  const homeChem = input.homeChemistryScore ?? 58;
  const awayChem = input.awayChemistryScore ?? 58;
  const homeSyn = input.homeSynergyScore ?? 58;
  const awaySyn = input.awaySynergyScore ?? 58;
  const homeBoosters = input.homeActiveBoosters ?? [];
  const awayBoosters = input.awayActiveBoosters ?? [];
  const homePosBoosters = input.homePositionBoosters ?? [];
  const awayPosBoosters = input.awayPositionBoosters ?? [];
  const currentSeason = input.currentSeason ?? 2026;

  // Evaluate 12 x 12 Tactical Counter Matrix matchup
  const matchup = evaluateTacticalMatchup({
    homeClub: input.homeClub,
    awayClub: input.awayClub,
    homePlayers: homeSquad.starters,
    awayPlayers: awaySquad.starters,
    homeSynergyScore: homeSyn,
    awaySynergyScore: awaySyn,
    homeChemistryScore: homeChem,
    awayChemistryScore: awayChem,
    homeManager: input.homeManagerAttributes,
    awayManager: input.awayManagerAttributes,
    config: balCfg,
  });

  const homeRatings = computeTeamRatings(
    homeSquad.starters,
    input.homeClub.tactics,
    homeSentOff,
    homeChem,
    homeSyn,
    homeBoosters,
    balCfg,
    matchup.teamASituationalModifierPct,
    homePosBoosters,
    currentSeason
  );
  const awayRatings = computeTeamRatings(
    awaySquad.starters,
    input.awayClub.tactics,
    awaySentOff,
    awayChem,
    awaySyn,
    awayBoosters,
    balCfg,
    matchup.teamBSituationalModifierPct,
    awayPosBoosters,
    currentSeason
  );

  const homeCtx: TeamSimContext = {
    club: input.homeClub,
    tactics: input.homeClub.tactics,
    starters: homeSquad.starters,
    bench: homeSquad.bench,
    sentOffIds: homeSentOff,
    subsMade: 0,
    attackRating: homeRatings.attack,
    midfieldRating: homeRatings.midfield,
    defenseRating: homeRatings.defense,
    gkPlayer: homeRatings.gk,
    aggressionFactor: homeRatings.aggression,
    chemistryScore: homeChem,
    synergyScore: homeSyn,
    chemistryModPct: homeRatings.chemistryModPct,
    synergyModPct: homeRatings.synergyModPct,
    combinedModPct: homeRatings.combinedModPct,
  };

  const awayCtx: TeamSimContext = {
    club: input.awayClub,
    tactics: input.awayClub.tactics,
    starters: awaySquad.starters,
    bench: awaySquad.bench,
    sentOffIds: awaySentOff,
    subsMade: 0,
    attackRating: awayRatings.attack,
    midfieldRating: awayRatings.midfield,
    defenseRating: awayRatings.defense,
    gkPlayer: awayRatings.gk,
    aggressionFactor: awayRatings.aggression,
    chemistryScore: awayChem,
    synergyScore: awaySyn,
    chemistryModPct: awayRatings.chemistryModPct,
    synergyModPct: awayRatings.synergyModPct,
    combinedModPct: awayRatings.combinedModPct,
  };

  const events: MatchEvent[] = options?.existingEvents ? [...options.existingEvents] : [];
  let homeScore = options?.initialHomeScore ?? 0;
  let awayScore = options?.initialAwayScore ?? 0;

  const homeStyle = resolveTacticalPlayingStyle(input.homeClub.tactics);
  const awayStyle = resolveTacticalPlayingStyle(input.awayClub.tactics);

  const homePassAcc = Math.max(
    68,
    Math.min(
      95,
      Math.round(
        82 +
          homeRatings.chemistryModPct * 1.5 +
          homeRatings.synergyModPct * 0.8 +
          matchup.teamAPassAccuracyBonus * 0.5
      )
    )
  );
  const awayPassAcc = Math.max(
    68,
    Math.min(
      95,
      Math.round(
        80 +
          awayRatings.chemistryModPct * 1.5 +
          awayRatings.synergyModPct * 0.8 +
          matchup.teamBPassAccuracyBonus * 0.5
      )
    )
  );

  const homeStats: MatchTeamStats = {
    possession: 50,
    shots: 0,
    shotsOnTarget: 0,
    xg: 0,
    passes: 0,
    passAccuracy: homePassAcc,
    tackles: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
    corners: 0,
    playingStyle: homeStyle,
    tacticalMatchupOutcome: matchup.teamAOutcome,
    tacticalAdvantagePct: matchup.teamASituationalModifierPct,
    tacticalAdaptationScore: matchup.teamAAdaptationScore,
    pressingSuccessPct: Math.max(35, Math.min(92, Math.round(58 + matchup.teamAPressingSuccessBonus))),
    runningDistanceKm: Number((108.5 * TACTICAL_STYLES_CATALOG[homeStyle].staminaDrainFactor).toFixed(1)),
    sprintDistanceKm: Number((11.4 * TACTICAL_STYLES_CATALOG[homeStyle].staminaDrainFactor).toFixed(1)),
  };

  const awayStats: MatchTeamStats = {
    possession: 50,
    shots: 0,
    shotsOnTarget: 0,
    xg: 0,
    passes: 0,
    passAccuracy: awayPassAcc,
    tackles: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
    corners: 0,
    playingStyle: awayStyle,
    tacticalMatchupOutcome: matchup.teamBOutcome,
    tacticalAdvantagePct: matchup.teamBSituationalModifierPct,
    tacticalAdaptationScore: matchup.teamBAdaptationScore,
    pressingSuccessPct: Math.max(35, Math.min(92, Math.round(56 + matchup.teamBPressingSuccessBonus))),
    runningDistanceKm: Number((107.2 * TACTICAL_STYLES_CATALOG[awayStyle].staminaDrainFactor).toFixed(1)),
    sprintDistanceKm: Number((11.1 * TACTICAL_STYLES_CATALOG[awayStyle].staminaDrainFactor).toFixed(1)),
  };

  const playerRatings: Record<string, number> = {};
  for (const p of [...homeCtx.starters, ...homeCtx.bench, ...awayCtx.starters, ...awayCtx.bench]) {
    playerRatings[p.id] = 6.5;
  }

  // Re-tally stats if resuming mid-match
  if (options?.existingEvents && options.existingEvents.length > 0) {
    for (const ev of options.existingEvents) {
      const isH = ev.teamId === homeCtx.club.id;
      const st = isH ? homeStats : awayStats;
      if (ev.type === 'shot' || ev.type === 'save' || ev.type === 'goal') {
        st.shots++;
        if (ev.type === 'save' || ev.type === 'goal' || ev.metadata?.onTarget) {
          st.shotsOnTarget++;
        }
        st.xg = Math.round((st.xg + (ev.metadata?.xg ?? 0.1)) * 100) / 100;
      } else if (ev.type === 'pass' || ev.type === 'throughBall') {
        st.passes += 5;
      } else if (ev.type === 'tackle' || ev.type === 'interception') {
        st.tackles++;
      } else if (ev.type === 'foul') {
        st.fouls++;
      } else if (ev.type === 'yellowCard') {
        st.yellowCards++;
      } else if (ev.type === 'redCard') {
        st.redCards++;
        if (ev.playerId) {
          (isH ? homeSentOff : awaySentOff).add(ev.playerId);
        }
      } else if (ev.type === 'corner') {
        st.corners++;
      }
    }
  }

  let eventSeq = events.length + 1;
  const homeAdvBonus = input.isNeutralVenue ? 0 : 4.85;

  // Kickoff event
  if (startMin === 1) {
    const centerPos = { x: 50, y: 50 };
    const starterSt = pickWeightedPlayer(rng, homeCtx.starters, ['ST', 'CAM', 'CM']);
    events.push({
      id: `ev-${eventSeq++}`,
      minute: 1,
      second: 0,
      type: 'kickoff',
      teamId: homeCtx.club.id,
      playerId: starterSt.id,
      ballPosition: centerPos,
      playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, centerPos, homeCtx.club.id, starterSt.id, 'pass'),
      outcome: 'neutral',
      metadata: {
        homeScore: 0,
        awayScore: 0,
        commentary: formatCommentary(rng, 'kickoff', homeCtx.club.name, `${starterSt.firstName} ${starterSt.lastName}`),
      },
    });
  }

  const yellowBookedIds = new Set<string>();

  for (let minute = startMin; minute <= 90; minute++) {
    // Refresh ratings periodically
    const hR = computeTeamRatings(
      homeCtx.starters,
      homeCtx.tactics,
      homeCtx.sentOffIds,
      homeChem,
      homeSyn,
      homeBoosters,
      balCfg,
      matchup.teamASituationalModifierPct,
      homePosBoosters,
      currentSeason
    );
    const aR = computeTeamRatings(
      awayCtx.starters,
      awayCtx.tactics,
      awayCtx.sentOffIds,
      awayChem,
      awaySyn,
      awayBoosters,
      balCfg,
      matchup.teamBSituationalModifierPct,
      awayPosBoosters,
      currentSeason
    );
    homeCtx.attackRating = hR.attack + homeAdvBonus;
    homeCtx.midfieldRating = hR.midfield + homeAdvBonus * 0.85;
    homeCtx.defenseRating = hR.defense + homeAdvBonus * 0.65;
    homeCtx.gkPlayer = hR.gk;

    awayCtx.attackRating = aR.attack;
    awayCtx.midfieldRating = aR.midfield;
    awayCtx.defenseRating = aR.defense;
    awayCtx.gkPlayer = aR.gk;

    // Possession share probability
    const midDiff = homeCtx.midfieldRating - awayCtx.midfieldRating;
    const homePossProb = Math.max(0.36, Math.min(0.64, 0.5 + midDiff * 0.008));

    const isHomeTurn = rng.chance(homePossProb);
    const att = isHomeTurn ? homeCtx : awayCtx;
    const def = isHomeTurn ? awayCtx : homeCtx;
    const attStats = isHomeTurn ? homeStats : awayStats;
    const defStats = isHomeTurn ? awayStats : homeStats;

    attStats.passes += rng.nextInt(4, 7);
    defStats.passes += rng.nextInt(2, 5);

    const second = rng.nextInt(4, 55);
    const attDir = isHomeTurn ? 1 : -1; // 1 = left->right (target x=96), -1 = right->left (target x=4)

    // Substitution check around minutes 62, 73, 81
    if ((minute === 62 || minute === 74) && att.subsMade < 3 && att.bench.length > 0 && rng.chance(0.55)) {
      const outfieldStarters = att.starters.filter((p) => p.primaryPosition !== 'GK' && !att.sentOffIds.has(p.id));
      const subOut = outfieldStarters[outfieldStarters.length - 1 - att.subsMade] ?? outfieldStarters[0];
      const subInIdx = att.bench.findIndex((p) => p.primaryPosition !== 'GK');
      if (subOut && subInIdx >= 0) {
        const subIn = att.bench.splice(subInIdx, 1)[0];
        const starterIdx = att.starters.findIndex((p) => p.id === subOut.id);
        if (starterIdx >= 0) {
          att.starters[starterIdx] = subIn;
          att.subsMade++;
          const subBall = { x: 50, y: 95 };
          events.push({
            id: `ev-${eventSeq++}`,
            minute,
            second: 2,
            type: 'substitution',
            teamId: att.club.id,
            playerId: subIn.id,
            secondaryPlayerId: subOut.id,
            ballPosition: subBall,
            playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, subBall, att.club.id, subIn.id, 'walk'),
            outcome: 'neutral',
            metadata: {
              subInId: subIn.id,
              subOutId: subOut.id,
              homeScore,
              awayScore,
              commentary: formatCommentary(
                rng,
                'substitution',
                att.club.name,
                `${subIn.firstName} ${subIn.lastName}`,
                `${subOut.firstName} ${subOut.lastName}`
              ),
            },
          });
        }
      }
    }

    // Rare minor injury (~0.0025 per minute -> ~22% per match)
    if (rng.chance(0.0022)) {
      const victim = pickWeightedPlayer(rng, att.starters, ['LW', 'RW', 'ST', 'CM']);
      const injBall = { x: 50 + attDir * 15, y: rng.nextInt(20, 80) };
      events.push({
        id: `ev-${eventSeq++}`,
        minute,
        second,
        type: 'injury',
        teamId: att.club.id,
        playerId: victim.id,
        ballPosition: injBall,
        playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, injBall, att.club.id, victim.id, 'idle'),
        outcome: 'neutral',
        metadata: {
          injuryWeeks: rng.nextInt(1, 3),
          homeScore,
          awayScore,
          commentary: formatCommentary(rng, 'injury', att.club.name, `${victim.firstName} ${victim.lastName}`),
        },
      });
    }

    // Disciplinary / Foul check: calibrated for ~3.8 yellow cards/match and ~0.07 red cards/match
    const foulProb = 0.22 * ((att.aggressionFactor + def.aggressionFactor) * 0.5);
    if (rng.chance(foulProb)) {
      defStats.fouls++;
      const fouler = pickWeightedPlayer(rng, def.starters, ['CB', 'CDM', 'LB', 'RB', 'CM']);
      const fouled = pickWeightedPlayer(rng, att.starters, ['LW', 'RW', 'CAM', 'ST', 'CM']);
      const foulPos = {
        x: isHomeTurn ? rng.nextInt(45, 78) : rng.nextInt(22, 55),
        y: rng.nextInt(15, 85),
      };

      // Yellow card probability given a foul (~19.5% of fouls -> ~3.85 yellows per 90 mins)
      if (rng.chance(0.195)) {
        if (yellowBookedIds.has(fouler.id)) {
          // Second yellow -> Red card
          if (rng.chance(0.15) && !def.sentOffIds.has(fouler.id)) {
            defStats.redCards++;
            def.sentOffIds.add(fouler.id);
            playerRatings[fouler.id] = Math.max(3.5, (playerRatings[fouler.id] ?? 6.5) - 2.5);
            events.push({
              id: `ev-${eventSeq++}`,
              minute,
              second,
              type: 'redCard',
              teamId: def.club.id,
              playerId: fouler.id,
              secondaryPlayerId: fouled.id,
              ballPosition: foulPos,
              playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, foulPos, att.club.id, fouler.id, 'idle'),
              outcome: 'fail',
              metadata: {
                cardReason: 'Second bookable offence',
                homeScore,
                awayScore,
                commentary: formatCommentary(rng, 'redCard', def.club.name, `${fouler.firstName} ${fouler.lastName}`),
              },
            });
          }
        } else {
          yellowBookedIds.add(fouler.id);
          defStats.yellowCards++;
          playerRatings[fouler.id] = Math.max(4.5, (playerRatings[fouler.id] ?? 6.5) - 0.5);
          events.push({
            id: `ev-${eventSeq++}`,
            minute,
            second,
            type: 'yellowCard',
            teamId: def.club.id,
            playerId: fouler.id,
            secondaryPlayerId: fouled.id,
            ballPosition: foulPos,
            playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, foulPos, att.club.id, fouler.id, 'tackle'),
            outcome: 'neutral',
            metadata: {
              cardReason: 'Reckless tackle',
              homeScore,
              awayScore,
              commentary: formatCommentary(
                rng,
                'yellowCard',
                def.club.name,
                `${fouler.firstName} ${fouler.lastName}`,
                `${fouled.firstName} ${fouled.lastName}`
              ),
            },
          });
        }
      } else if (rng.chance(0.0018) && !def.sentOffIds.has(fouler.id)) {
        // Straight red card (very rare -> keeps total red cards ~0.06 - 0.08 per match)
        defStats.redCards++;
        def.sentOffIds.add(fouler.id);
        playerRatings[fouler.id] = Math.max(3.0, (playerRatings[fouler.id] ?? 6.5) - 3.0);
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second,
          type: 'redCard',
          teamId: def.club.id,
          playerId: fouler.id,
          secondaryPlayerId: fouled.id,
          ballPosition: foulPos,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, foulPos, att.club.id, fouler.id, 'tackle'),
          outcome: 'fail',
          metadata: {
            cardReason: 'Serious foul play',
            homeScore,
            awayScore,
            commentary: formatCommentary(rng, 'redCard', def.club.name, `${fouler.firstName} ${fouler.lastName}`),
          },
        });
      } else if (rng.chance(0.25)) {
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second,
          type: 'foul',
          teamId: def.club.id,
          playerId: fouler.id,
          secondaryPlayerId: fouled.id,
          ballPosition: foulPos,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, foulPos, att.club.id, fouler.id, 'tackle'),
          outcome: 'neutral',
          metadata: {
            homeScore,
            awayScore,
            commentary: formatCommentary(
              rng,
              'foul',
              def.club.name,
              `${fouler.firstName} ${fouler.lastName}`,
              `${fouled.firstName} ${fouled.lastName}`
            ),
          },
        });
      }
    }

    // Shot creation check:
    // Calibrated so average team generates ~11.8 shots per match (~23.6 total shots per match across 90 mins -> ~0.262 shot prob per min)
    const skillEdge = att.attackRating - def.defenseRating;
    const shotProb = Math.max(0.14, Math.min(0.40, 0.262 + skillEdge * 0.005));

    if (rng.chance(shotProb)) {
      const creator = pickWeightedPlayer(rng, att.starters, ['CAM', 'CM', 'LW', 'RW']);
      const shooter = pickWeightedPlayer(rng, att.starters, ['ST', 'LW', 'RW', 'CAM']);
      const isPenalty = rng.chance(0.025);
      const isCornerBuild = !isPenalty && rng.chance(0.16);
      const isCross = !isPenalty && !isCornerBuild && rng.chance(0.28);

      if (isCornerBuild) {
        attStats.corners++;
        const cornerPos = { x: isHomeTurn ? 98 : 2, y: rng.chance(0.5) ? 4 : 96 };
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second: Math.max(1, second - 3),
          type: 'corner',
          teamId: att.club.id,
          playerId: creator.id,
          ballPosition: cornerPos,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, cornerPos, att.club.id, creator.id, 'pass'),
          outcome: 'neutral',
          metadata: {
            homeScore,
            awayScore,
            commentary: formatCommentary(rng, 'corner', att.club.name, `${creator.firstName} ${creator.lastName}`),
          },
        });
      } else if (isCross) {
        const crossPos = { x: isHomeTurn ? rng.nextInt(78, 92) : rng.nextInt(8, 22), y: rng.chance(0.5) ? rng.nextInt(8, 24) : rng.nextInt(76, 92) };
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second: Math.max(1, second - 3),
          type: 'cross',
          teamId: att.club.id,
          playerId: creator.id,
          secondaryPlayerId: shooter.id,
          ballPosition: crossPos,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, crossPos, att.club.id, creator.id, 'pass'),
          outcome: 'success',
          metadata: {
            homeScore,
            awayScore,
            commentary: formatCommentary(
              rng,
              'cross',
              att.club.name,
              `${creator.firstName} ${creator.lastName}`,
              `${shooter.firstName} ${shooter.lastName}`
            ),
          },
        });
      } else if ( isPenalty ) {
        const penSpot = { x: isHomeTurn ? 88 : 12, y: 50 };
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second: Math.max(1, second - 2),
          type: 'penalty',
          teamId: att.club.id,
          playerId: shooter.id,
          ballPosition: penSpot,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, penSpot, att.club.id, shooter.id, 'idle'),
          outcome: 'neutral',
          metadata: {
            homeScore,
            awayScore,
            commentary: formatCommentary(rng, 'penalty', att.club.name, `${shooter.firstName} ${shooter.lastName}`),
          },
        });
      } else if (rng.chance(0.45)) {
        const buildPos = { x: isHomeTurn ? rng.nextInt(62, 76) : rng.nextInt(24, 38), y: rng.nextInt(25, 75) };
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second: Math.max(1, second - 3),
          type: 'throughBall',
          teamId: att.club.id,
          playerId: creator.id,
          secondaryPlayerId: shooter.id,
          ballPosition: buildPos,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, buildPos, att.club.id, creator.id, 'pass'),
          outcome: 'success',
          metadata: {
            homeScore,
            awayScore,
            commentary: formatCommentary(
              rng,
              'throughBall',
              att.club.name,
              `${creator.firstName} ${creator.lastName}`,
              `${shooter.firstName} ${shooter.lastName}`
            ),
          },
        });
      }

      // Evaluate the shot
      attStats.shots++;
      const shotPos = {
        x: isHomeTurn ? rng.nextInt(81, 93) : rng.nextInt(7, 19),
        y: rng.nextInt(32, 68),
      };

      const shooterSkill = (shooter.attributes.finishing * 0.55 + shooter.attributes.shooting * 0.3 + shooter.attributes.composure * 0.15);
      const gkSkill = (def.gkPlayer.attributes.reflexes * 0.5 + def.gkPlayer.attributes.handling * 0.3 + def.gkPlayer.attributes.positioning * 0.2);

      // Calibrated on-target rate ~35.5% (penalties 88% on target)
      const onTargetProb = isPenalty
        ? 0.88
        : Math.max(0.27, Math.min(0.45, 0.348 + (shooterSkill - 70) * 0.002));
      const isOnTarget = rng.chance(onTargetProb);

      const shotXg = isPenalty
        ? 0.76
        : Math.max(0.04, Math.min(0.45, 0.115 + (att.attackRating - def.defenseRating) * 0.004));
      attStats.xg = Math.round((attStats.xg + shotXg) * 100) / 100;

      if (isOnTarget) {
        attStats.shotsOnTarget++;
        // Goal conversion given shot on target:
        // Total shots per match ~23.6 * 0.355 on target = ~8.38 SOT/match.
        // For ~2.72 goals/match, conversion on SOT = ~0.324.
        const scoreDiff = isHomeTurn ? homeScore - awayScore : awayScore - homeScore;
        const gameStateMod = scoreDiff > 0 ? -0.042 * scoreDiff : scoreDiff < 0 ? 0.032 : 0;
        const goalGivenSotProb = isPenalty
          ? 0.84
          : Math.max(
              0.16,
              Math.min(
                0.50,
                0.295 + (shooterSkill - gkSkill) * 0.0028 + skillEdge * 0.0028 + gameStateMod
              )
            );

        if (rng.chance(goalGivenSotProb)) {
          if (isHomeTurn) homeScore++;
          else awayScore++;

          playerRatings[shooter.id] = Math.min(10, (playerRatings[shooter.id] ?? 6.5) + 1.1);
          if (creator.id !== shooter.id) {
            playerRatings[creator.id] = Math.min(10, (playerRatings[creator.id] ?? 6.5) + 0.6);
          }

          const goalBallPos = { x: isHomeTurn ? 99 : 1, y: 50 };
          events.push({
            id: `ev-${eventSeq++}`,
            minute,
            second,
            type: 'goal',
            teamId: att.club.id,
            playerId: shooter.id,
            secondaryPlayerId: creator.id !== shooter.id ? creator.id : undefined,
            ballPosition: goalBallPos,
            playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, goalBallPos, att.club.id, shooter.id, 'celebrate'),
            outcome: 'success',
            metadata: {
              homeScore,
              awayScore,
              xg: shotXg,
              onTarget: true,
              isHeader: isCross || isCornerBuild,
              commentary: formatCommentary(
                rng,
                'goal',
                att.club.name,
                `${shooter.firstName} ${shooter.lastName}`,
                `${creator.firstName} ${creator.lastName}`
              ),
            },
          });
        } else {
          // Saved by goalkeeper
          playerRatings[def.gkPlayer.id] = Math.min(10, (playerRatings[def.gkPlayer.id] ?? 6.5) + 0.35);
          events.push({
            id: `ev-${eventSeq++}`,
            minute,
            second,
            type: 'save',
            teamId: att.club.id,
            playerId: shooter.id,
            secondaryPlayerId: def.gkPlayer.id,
            ballPosition: shotPos,
            playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, shotPos, def.club.id, def.gkPlayer.id, 'dive'),
            outcome: 'fail',
            metadata: {
              homeScore,
              awayScore,
              xg: shotXg,
              onTarget: true,
              commentary: formatCommentary(
                rng,
                'save',
                att.club.name,
                `${shooter.firstName} ${shooter.lastName}`,
                `${def.gkPlayer.firstName} ${def.gkPlayer.lastName}`
              ),
            },
          });
        }
      } else {
        // Off-target shot
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second,
          type: 'shot',
          teamId: att.club.id,
          playerId: shooter.id,
          ballPosition: shotPos,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, shotPos, att.club.id, shooter.id, 'shoot'),
          outcome: 'fail',
          metadata: {
            homeScore,
            awayScore,
            xg: shotXg,
            onTarget: false,
            commentary: formatCommentary(rng, 'shot', att.club.name, `${shooter.firstName} ${shooter.lastName}`),
          },
        });
      }
    } else if (rng.chance(0.32)) {
      // Midfield tackle, interception, or pass event for dense 2D/3D replay animation
      const evSubType = rng.chance(0.45) ? 'pass' : rng.chance(0.55) ? 'tackle' : 'interception';
      const midPos = {
        x: isHomeTurn ? rng.nextInt(35, 72) : rng.nextInt(28, 65),
        y: rng.nextInt(18, 82),
      };

      if (evSubType === 'pass') {
        const p1 = pickWeightedPlayer(rng, att.starters, ['CM', 'CDM', 'CAM', 'LB', 'RB']);
        const p2 = pickWeightedPlayer(rng, att.starters, ['CM', 'CAM', 'LW', 'RW', 'ST']);
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second,
          type: 'pass',
          teamId: att.club.id,
          playerId: p1.id,
          secondaryPlayerId: p2.id,
          ballPosition: midPos,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, midPos, att.club.id, p1.id, 'pass'),
          outcome: 'success',
          metadata: {
            homeScore,
            awayScore,
            commentary: formatCommentary(
              rng,
              'pass',
              att.club.name,
              `${p1.firstName} ${p1.lastName}`,
              `${p2.firstName} ${p2.lastName}`
            ),
          },
        });
      } else {
        defStats.tackles++;
        const defender = pickWeightedPlayer(rng, def.starters, ['CB', 'CDM', 'LB', 'RB']);
        const attacker = pickWeightedPlayer(rng, att.starters, ['LW', 'RW', 'CAM', 'ST']);
        playerRatings[defender.id] = Math.min(10, (playerRatings[defender.id] ?? 6.5) + 0.12);
        events.push({
          id: `ev-${eventSeq++}`,
          minute,
          second,
          type: evSubType,
          teamId: def.club.id,
          playerId: defender.id,
          secondaryPlayerId: attacker.id,
          ballPosition: midPos,
          playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, midPos, def.club.id, defender.id, 'tackle'),
          outcome: 'success',
          metadata: {
            homeScore,
            awayScore,
            commentary: formatCommentary(
              rng,
              evSubType,
              def.club.name,
              `${defender.firstName} ${defender.lastName}`,
              `${attacker.firstName} ${attacker.lastName}`
            ),
          },
        });
      }
    }

    // Half-time event at minute 45
    if (minute === 45) {
      const centerPos = { x: 50, y: 50 };
      events.push({
        id: `ev-${eventSeq++}`,
        minute: 45,
        second: 59,
        type: 'halfTime',
        teamId: homeCtx.club.id,
        ballPosition: centerPos,
        playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, centerPos, homeCtx.club.id, undefined, 'idle'),
        outcome: 'neutral',
        metadata: {
          homeScore,
          awayScore,
          commentary: formatCommentary(rng, 'halfTime', homeCtx.club.name),
        },
      });
    }
  }

  // Full-time event at minute 90
  const centerPos = { x: 50, y: 50 };
  events.push({
    id: `ev-${eventSeq++}`,
    minute: 90,
    second: 59,
    type: 'fullTime',
    teamId: homeCtx.club.id,
    ballPosition: centerPos,
    playerPositions: buildPlayerPositionsSnapshot(rng, homeCtx, awayCtx, centerPos, homeCtx.club.id, undefined, 'idle'),
    outcome: 'neutral',
    metadata: {
      homeScore,
      awayScore,
      commentary: formatCommentary(rng, 'fullTime', homeCtx.club.name),
    },
  });

  const totalPasses = homeStats.passes + awayStats.passes;
  homeStats.possession = totalPasses > 0 ? Math.round((homeStats.passes / totalPasses) * 100) : 50;
  awayStats.possession = 100 - homeStats.possession;

  // Compute full-time stamina remaining and accumulated fatigue delta for all active players
  const playerStaminaRemaining: Record<string, number> = {};
  const playerFatigueDelta: Record<string, number> = {};

  let homeStaminaSum = 0;
  let homeFatigueSum = 0;
  for (const p of homeCtx.starters) {
    const phys = evaluatePlayerInMatchPhysicalState(p, homeStyle, 90, balCfg);
    playerStaminaRemaining[p.id] = phys.staminaRemaining;
    const fatDelta = Math.max(2, Number((phys.fatigueAccumulated - (p.fatigue ?? 0)).toFixed(1)));
    playerFatigueDelta[p.id] = fatDelta;
    homeStaminaSum += phys.staminaRemaining;
    homeFatigueSum += fatDelta;
  }
  homeStats.avgStaminaEnd =
    homeCtx.starters.length > 0 ? Number((homeStaminaSum / homeCtx.starters.length).toFixed(1)) : 65;
  homeStats.avgFatigueAdded =
    homeCtx.starters.length > 0 ? Number((homeFatigueSum / homeCtx.starters.length).toFixed(1)) : 12;

  let awayStaminaSum = 0;
  let awayFatigueSum = 0;
  for (const p of awayCtx.starters) {
    const phys = evaluatePlayerInMatchPhysicalState(p, awayStyle, 90, balCfg);
    playerStaminaRemaining[p.id] = phys.staminaRemaining;
    const fatDelta = Math.max(2, Number((phys.fatigueAccumulated - (p.fatigue ?? 0)).toFixed(1)));
    playerFatigueDelta[p.id] = fatDelta;
    awayStaminaSum += phys.staminaRemaining;
    awayFatigueSum += fatDelta;
  }
  awayStats.avgStaminaEnd =
    awayCtx.starters.length > 0 ? Number((awayStaminaSum / awayCtx.starters.length).toFixed(1)) : 65;
  awayStats.avgFatigueAdded =
    awayCtx.starters.length > 0 ? Number((awayFatigueSum / awayCtx.starters.length).toFixed(1)) : 12;

  // Normalize player ratings & pick Man of the Match
  let motmId = homeCtx.starters[0]?.id ?? '';
  let bestRating = -1;
  for (const [pId, r] of Object.entries(playerRatings)) {
    const rounded = Math.max(4.0, Math.min(10.0, Math.round(r * 10) / 10));
    playerRatings[pId] = rounded;
    if (rounded > bestRating) {
      bestRating = rounded;
      motmId = pId;
    }
  }

  return {
    fixtureId: input.fixtureId,
    seed,
    homeClubId: input.homeClub.id,
    awayClubId: input.awayClub.id,
    homeScore,
    awayScore,
    homeStats,
    awayStats,
    events,
    playerRatings,
    manOfTheMatchPlayerId: motmId,
    playerStaminaRemaining,
    playerFatigueDelta,
  };
}

/**
 * Re-simulates only the remaining minutes from `fromMinute..90` when a live substitution
 * or tactical change occurs in the 2D/3D viewer, preserving all events before `fromMinute`.
 */
export function resimulateFromMinute(
  updatedInput: MatchSimulationInput,
  originalSeed: number,
  previousResult: MatchResult,
  fromMinute: number
): MatchResult {
  const clampedMinute = Math.max(1, Math.min(89, Math.floor(fromMinute)));
  const preservedEvents = previousResult.events.filter((e) => e.minute < clampedMinute);

  let homeScoreAtSplit = 0;
  let awayScoreAtSplit = 0;
  for (const ev of preservedEvents) {
    if (ev.type === 'goal') {
      if (ev.teamId === updatedInput.homeClub.id) homeScoreAtSplit++;
      else if (ev.teamId === updatedInput.awayClub.id) awayScoreAtSplit++;
    }
  }

  const derivedSeed = (originalSeed ^ Math.imul(clampedMinute, 0x9e3779b9)) >>> 0;

  return simulateMatch(updatedInput, derivedSeed, {
    startFromMinute: clampedMinute,
    existingEvents: preservedEvents,
    initialHomeScore: homeScoreAtSplit,
    initialAwayScore: awayScoreAtSplit,
  });
}
