import { createRng } from './rng';
import {
  calculateMarketValue,
  calculateOverallRating,
  calculateWeeklyWage,
} from './ratings';
import {
  Club,
  GameState,
  Player,
  PlayerAttributes,
  PositionCode,
  Scout,
  ScoutingReport,
  TrainingFocus,
  TransferRecord,
} from './types';

const FOCUS_ATTR_MAP: Record<TrainingFocus, (keyof PlayerAttributes)[]> = {
  attacking: ['finishing', 'shooting', 'dribbling', 'positioning', 'composure'],
  defending: ['tackling', 'positioning', 'heading', 'strength', 'aggression'],
  passing: ['passing', 'vision', 'firstTouch', 'crossing', 'decisions'],
  shooting: ['shooting', 'finishing', 'composure', 'firstTouch'],
  fitness: ['stamina', 'pace', 'acceleration', 'strength', 'agility'],
  goalkeeping: ['reflexes', 'handling', 'distribution', 'positioning', 'jumping'],
  tactical: ['decisions', 'positioning', 'vision', 'workRate', 'leadership'],
};

export const MAX_SEASON_ATTRIBUTE_GROWTH = 5;

/**
 * Applies weekly training across all clubs.
 * - Young players below potential develop gradually.
 * - Growth per player per season is strictly capped at MAX_SEASON_ATTRIBUTE_GROWTH (+5 OVR/attr points).
 * - Intensity affects growth probability, fitness drain, and minor training injury risk.
 */
export function processWeeklyTraining(state: GameState, weekSeed: number): GameState {
  const rng = createRng(weekSeed ^ 0x4444);
  const clubMap = new Map(state.clubs.map((c) => [c.id, c]));
  const updatedNews = [...state.news];

  const updatedPlayers = state.players.map((p) => {
    const club = clubMap.get(p.clubId);
    if (!club) return p;

    let injuryWeeks = Math.max(0, p.injuryWeeks - 1);
    let fitness = Math.min(100, p.fitness + (injuryWeeks === 0 ? 12 : 6));

    if (injuryWeeks > 0) {
      return { ...p, injuryWeeks, fitness };
    }

    const sched = club.training;
    const focuses: TrainingFocus[] = [
      sched.monday,
      sched.tuesday,
      sched.wednesday,
      sched.thursday,
      sched.friday,
    ];

    const intensityMult =
      sched.intensity === 'heavy' ? 1.35 : sched.intensity === 'light' ? 0.65 : 1.0;
    const fatigueCost =
      sched.intensity === 'heavy' ? 7 : sched.intensity === 'light' ? 2 : 4;
    fitness = Math.max(55, fitness - fatigueCost);

    // Small training injury risk if heavy intensity or low fitness
    const injuryProb =
      sched.intensity === 'heavy' ? 0.008 : sched.intensity === 'balanced' ? 0.003 : 0.001;
    if (rng.chance(injuryProb)) {
      injuryWeeks = rng.nextInt(1, 3);
      if (p.clubId === state.manager.clubId) {
        updatedNews.unshift({
          id: `news-tr-inj-${state.currentSeason}-${state.currentWeek}-${p.id}`,
          week: state.currentWeek,
          season: state.currentSeason,
          title: `${p.firstName} ${p.lastName} picks up training knock`,
          body: `${p.firstName} ${p.lastName} suffered a minor strain during training and will be sidelined for ${injuryWeeks} week(s).`,
          category: 'injury',
        });
      }
      return { ...p, injuryWeeks, fitness };
    }

    // Check attribute growth eligibility
    if (p.overall >= p.potential || p.seasonGrowth >= MAX_SEASON_ATTRIBUTE_GROWTH || p.age >= 31) {
      return { ...p, fitness, injuryWeeks };
    }

    const ageDevFactor = p.age <= 20 ? 0.24 : p.age <= 24 ? 0.16 : p.age <= 27 ? 0.09 : 0.04;
    if (rng.chance(ageDevFactor * intensityMult)) {
      const chosenFocus =
        p.primaryPosition === 'GK' ? 'goalkeeping' : rng.pick(focuses);
      const targetAttrs = FOCUS_ATTR_MAP[chosenFocus];
      const attrToGrow = rng.pick(targetAttrs);
      const newAttrs: PlayerAttributes = {
        ...p.attributes,
        [attrToGrow]: Math.min(99, p.attributes[attrToGrow] + 1),
      };
      const newOverall = Math.min(
        p.potential,
        p.overall + (calculateOverallRating(newAttrs, p.primaryPosition) > p.overall ? 1 : 0)
      );
      const seasonGrowth = Math.min(
        MAX_SEASON_ATTRIBUTE_GROWTH,
        p.seasonGrowth + (newOverall > p.overall ? 1 : 0.5)
      );

      return {
        ...p,
        attributes: newAttrs,
        overall: newOverall,
        marketValue: calculateMarketValue(newOverall, p.age, p.potential),
        seasonGrowth,
        fitness,
        injuryWeeks,
      };
    }

    return { ...p, fitness, injuryWeeks };
  });

  return {
    ...state,
    players: updatedPlayers,
    news: updatedNews.slice(0, 60),
  };
}

/**
 * Generates weekly scouting reports for assigned scouts.
 */
export function processWeeklyScouting(state: GameState, weekSeed: number): GameState {
  const rng = createRng(weekSeed ^ 0x5555);
  const existingPlayerIds = new Set(state.scoutingReports.map((r) => r.playerId));
  const candidates = state.players.filter(
    (p) => p.clubId !== state.manager.clubId && !existingPlayerIds.has(p.id) && !p.isYouth
  );

  if (candidates.length === 0) return state;

  const newReports: ScoutingReport[] = [];

  for (const scout of state.scouts) {
    const posFiltered =
      scout.assignedPosition === 'ALL'
        ? candidates
        : candidates.filter((p) => p.primaryPosition === scout.assignedPosition);

    const pool = posFiltered.length > 0 ? posFiltered : candidates;
    if (pool.length === 0) continue;

    const target = rng.pick(pool);
    const margin = Math.max(1, Math.round((100 - scout.rating) / 6));

    const estimatedOverallMin = Math.max(40, target.overall - margin);
    const estimatedOverallMax = Math.min(99, target.overall + margin);
    const estimatedPotentialMin = Math.max(estimatedOverallMin, target.potential - margin - 1);
    const estimatedPotentialMax = Math.min(99, target.potential + margin + 1);

    const recommendation: ScoutingReport['recommendation'] =
      target.overall >= 78 || target.potential >= 85
        ? 'signImmediately'
        : target.overall >= 70 || target.potential >= 78
          ? 'monitor'
          : 'pass';

    newReports.push({
      id: `rep-${state.currentSeason}-w${state.currentWeek}-${scout.id}-${target.id}`,
      playerId: target.id,
      scoutId: scout.id,
      weekGenerated: state.currentWeek,
      estimatedOverallMin,
      estimatedOverallMax,
      estimatedPotentialMin,
      estimatedPotentialMax,
      estimatedValue: target.marketValue,
      recommendation,
      notes: `${scout.name} observed ${target.firstName} ${target.lastName} (${target.primaryPosition}, ${target.age}yo). Shows strong ${target.overall >= 75 ? 'first-team quality' : 'squad depth potential'}.`,
    });
  }

  return {
    ...state,
    scoutingReports: [...newReports, ...state.scoutingReports].slice(0, 80),
  };
}

export interface TransferNegotiationResponse {
  accepted: boolean;
  counterFee?: number;
  requiredWage: number;
  agentFee: number;
  releaseClauseTriggered?: boolean;
  willingnessScore: number; // 0..100
  reason: string;
}

export function evaluateTransferOffer(
  player: Player,
  sellingClub: Club,
  buyingClub: Club,
  offeredFee: number,
  offeredWage: number,
  isLoan = false
): TransferNegotiationResponse {
  const agentFeePct = player.agentFeePct ?? 8;
  const agentFee = isLoan ? 0 : Math.round((offeredFee * agentFeePct) / 100);
  const repDiff = buyingClub.reputation - sellingClub.reputation;
  const willingnessScore = Math.max(
    15,
    Math.min(99, 68 + repDiff * 2 + (player.transferRequested ? 20 : 0))
  );

  if (isLoan) {
    const canLoan =
      player.age <= 22 ||
      player.roleExpectation === 'prospect' ||
      player.roleExpectation === 'rotation';
    const requiredWage = Math.round(player.weeklyWage * 0.8);
    if (!canLoan) {
      return {
        accepted: false,
        requiredWage,
        agentFee: 0,
        willingnessScore,
        reason: `${sellingClub.name} consider ${player.firstName} ${player.lastName} a core first-team starter and will not loan him out.`,
      };
    }
    if (offeredWage < requiredWage) {
      return {
        accepted: false,
        requiredWage,
        agentFee: 0,
        willingnessScore,
        reason: `Player wants at least £${requiredWage.toLocaleString()}/wk wage contribution during the loan.`,
      };
    }
    return {
      accepted: true,
      requiredWage,
      agentFee: 0,
      willingnessScore,
      reason: `${sellingClub.name} and ${player.firstName} ${player.lastName} have accepted the season-long loan deal!`,
    };
  }

  const releaseClause = player.releaseClause ?? Math.round(player.marketValue * 1.45);
  const releaseClauseTriggered = offeredFee >= releaseClause;

  const askingMultiplier = player.transferListed
    ? 0.85
    : player.roleExpectation === 'star'
      ? 1.35
      : 1.1;
  const minAcceptableFee = releaseClauseTriggered
    ? releaseClause
    : Math.round((player.marketValue * askingMultiplier) / 10000) * 10000;

  const repWageFactor = repDiff < -10 ? 1.18 : 1.05;
  const requiredWage = Math.round(
    calculateWeeklyWage(player.overall, player.age) * repWageFactor
  );

  if (!releaseClauseTriggered && offeredFee < minAcceptableFee * 0.78) {
    return {
      accepted: false,
      counterFee: minAcceptableFee,
      requiredWage,
      agentFee,
      willingnessScore,
      reason: `${sellingClub.name} rejected the offer outright. They value ${player.lastName} at £${minAcceptableFee.toLocaleString()} (Release Clause: £${releaseClause.toLocaleString()}).`,
    };
  }

  if (!releaseClauseTriggered && offeredFee < minAcceptableFee) {
    return {
      accepted: false,
      counterFee: minAcceptableFee,
      requiredWage,
      agentFee,
      willingnessScore,
      reason: `${sellingClub.name} submitted a counter-offer of £${minAcceptableFee.toLocaleString()}.`,
    };
  }

  if (offeredWage < requiredWage * 0.92) {
    return {
      accepted: false,
      counterFee: offeredFee,
      requiredWage,
      agentFee,
      releaseClauseTriggered,
      willingnessScore,
      reason: `${
        releaseClauseTriggered
          ? `Release clause (£${releaseClause.toLocaleString()}) triggered!`
          : `${sellingClub.name} accepted the fee,`
      } However, ${player.lastName}'s agent demands £${requiredWage.toLocaleString()}/wk (plus ${agentFeePct}% agent fee).`,
    };
  }

  return {
    accepted: true,
    requiredWage: offeredWage,
    agentFee,
    releaseClauseTriggered,
    willingnessScore,
    reason: `${
      releaseClauseTriggered ? 'Release clause triggered! ' : 'Deal agreed! '
    }${player.firstName} ${player.lastName} has signed for ${buyingClub.name}.`,
  };
}

export const MIN_SQUAD_SIZE = 18;

/**
 * Executes a completed transfer or loan between two clubs, updating budgets, rosters, and ledger.
 */
export function executePlayerTransfer(
  state: GameState,
  playerId: string,
  toClubId: string,
  fee: number,
  newWeeklyWage: number,
  isLoan = false
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;

  const fromClubId = player.clubId;
  if (fromClubId === toClubId) return state;

  const fromClub = state.clubs.find((c) => c.id === fromClubId);
  const toClub = state.clubs.find((c) => c.id === toClubId);
  if (!fromClub || !toClub) return state;

  // Protect minimum squad size for selling club
  const fromSeniorPlayers = state.players.filter((p) => p.clubId === fromClubId && !p.isYouth);
  if (fromSeniorPlayers.length <= MIN_SQUAD_SIZE) {
    return state;
  }

  const updatedPlayers = state.players.map((p) => {
    if (p.id !== playerId) return p;
    return {
      ...p,
      clubId: toClubId,
      loanedFromClubId: isLoan ? fromClubId : null,
      weeklyWage: newWeeklyWage,
      contractEndSeason: isLoan ? p.contractEndSeason : state.currentSeason + 3,
      morale: Math.min(100, p.morale + 10),
      transferListed: false,
      transferRequested: false,
    };
  });

  const updatedClubs = state.clubs.map((c) => {
    if (c.id === fromClubId) {
      const remainingIds = new Set(
        updatedPlayers.filter((p) => p.clubId === c.id && !p.isYouth).map((p) => p.id)
      );
      const startingXI = c.startingXI.filter((id) => remainingIds.has(id));
      const substitutes = c.substitutes.filter((id) => remainingIds.has(id));
      const reserves = c.reserves.filter((id) => remainingIds.has(id));

      // Backfill startingXI if needed
      for (const id of [...substitutes, ...reserves]) {
        if (startingXI.length >= 11) break;
        if (!startingXI.includes(id)) startingXI.push(id);
      }

      const newWageBill = updatedPlayers
        .filter((p) => p.clubId === c.id)
        .reduce((s, p) => s + p.weeklyWage, 0);

      return {
        ...c,
        startingXI,
        substitutes: substitutes.filter((id) => !startingXI.includes(id)),
        reserves: reserves.filter((id) => !startingXI.includes(id)),
        finances: {
          ...c.finances,
          transferBudget: c.finances.transferBudget + fee,
          cashBalance: c.finances.cashBalance + fee,
          currentWageBillWeekly: newWageBill,
          ledger: [
            {
              id: `tx-out-${state.currentSeason}-w${state.currentWeek}-${playerId}`,
              week: state.currentWeek,
              season: state.currentSeason,
              category: 'transferOut' as const,
              description: `${isLoan ? 'Loaned' : 'Sold'} ${player.firstName} ${player.lastName} to ${toClub.name}`,
              amount: fee,
            },
            ...c.finances.ledger,
          ],
        },
      };
    }

    if (c.id === toClubId) {
      const newWageBill = updatedPlayers
        .filter((p) => p.clubId === c.id)
        .reduce((s, p) => s + p.weeklyWage, 0);

      return {
        ...c,
        reserves: [...c.reserves, playerId],
        finances: {
          ...c.finances,
          transferBudget: Math.max(0, c.finances.transferBudget - fee),
          cashBalance: c.finances.cashBalance - fee,
          currentWageBillWeekly: newWageBill,
          ledger: [
            {
              id: `tx-in-${state.currentSeason}-w${state.currentWeek}-${playerId}`,
              week: state.currentWeek,
              season: state.currentSeason,
              category: 'transferIn' as const,
              description: `${isLoan ? 'Loaned' : 'Signed'} ${player.firstName} ${player.lastName} from ${fromClub.name}`,
              amount: -fee,
            },
            ...c.finances.ledger,
          ],
        },
      };
    }

    return c;
  });

  const record: TransferRecord = {
    id: `tr-${state.currentSeason}-w${state.currentWeek}-${playerId}`,
    season: state.currentSeason,
    week: state.currentWeek,
    playerId,
    playerName: `${player.firstName} ${player.lastName}`,
    fromClubId,
    fromClubName: fromClub.name,
    toClubId,
    toClubName: toClub.name,
    fee,
    isLoan,
  };

  return {
    ...state,
    players: updatedPlayers,
    clubs: updatedClubs,
    transfers: [record, ...state.transfers],
    news: [
      {
        id: `news-tr-${record.id}`,
        week: state.currentWeek,
        season: state.currentSeason,
        title: `${toClub.name} complete ${isLoan ? 'loan' : 'signing'} of ${player.firstName} ${player.lastName}`,
        body: `${player.firstName} ${player.lastName} (${player.overall} OVR ${player.primaryPosition}) has joined ${toClub.name} from ${fromClub.name} ${isLoan ? 'on loan' : `for £${fee.toLocaleString()}`}.`,
        category: 'transfer' as const,
      },
      ...state.news,
    ].slice(0, 60),
  };
}

/**
 * Simulates weekly AI club transfer activity while strictly enforcing MIN_SQUAD_SIZE (>= 18).
 */
export function processWeeklyAiTransfers(state: GameState, weekSeed: number): GameState {
  const rng = createRng(weekSeed ^ 0x7777);
  let nextState = state;

  const aiClubs = nextState.clubs.filter((c) => c.id !== nextState.manager.clubId);
  if (aiClubs.length < 2 || !rng.chance(0.65)) return nextState;

  const buyer = rng.pick(aiClubs);
  const sellerCandidates = aiClubs.filter((c) => {
    if (c.id === buyer.id) return false;
    const count = nextState.players.filter((p) => p.clubId === c.id && !p.isYouth).length;
    return count > MIN_SQUAD_SIZE + 1;
  });

  if (sellerCandidates.length === 0) return nextState;
  const seller = rng.pick(sellerCandidates);

  const sellerTransferable = nextState.players.filter(
    (p) =>
      p.clubId === seller.id &&
      !p.isYouth &&
      p.primaryPosition !== 'GK' &&
      p.marketValue <= buyer.finances.transferBudget
  );

  if (sellerTransferable.length === 0) return nextState;
  const target = rng.pick(sellerTransferable);
  const fee = target.marketValue;

  if (buyer.finances.transferBudget >= fee && fee > 0) {
    nextState = executePlayerTransfer(nextState, target.id, buyer.id, fee, target.weeklyWage, false);
  }

  return nextState;
}
