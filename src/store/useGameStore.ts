import { create } from 'zustand';
import {
  DEFAULT_BALANCE_CONFIG,
  validateAndApplyBalanceConfigUpdate,
} from '@/engine/balanceConfig';
import {
  activateBoosterItem,
  applyVerifiedRewardedAdGrant,
  applyVerifiedStarterPackTransaction,
  applyVerifiedStorePurchase,
  claimDailyLoginReward,
  claimObjectiveReward,
  ensureEconomyState,
} from '@/engine/boosterEconomy';
import {
  autoPickLineupForClub,
  generateInitialGameState,
} from '@/engine/generator';
import { applyMatchResultToState } from '@/engine/season';
import { executePlayerTransfer } from '@/engine/transfers';
import {
  ActiveCutscene,
  BalanceConfiguration,
  FormationCode,
  GameState,
  ManagerProfile,
  MatchResult,
  PositionCode,
  SaveEnvelope,
  TacticalPlayerRole,
  TacticsConfig,
  WeeklyTrainingSchedule,
} from '@/engine/types';
import { defaultSaveRepository, SaveSlotId } from '@/services/saveRepository';
import { runAdvanceWeekInWorker } from '@/services/workerClient';

export type NavTab =
  | 'home'
  | 'myClub'
  | 'squad'
  | 'tactics'
  | 'chemistry'
  | 'inventory'
  | 'store'
  | 'transfers'
  | 'scouting'
  | 'training'
  | 'fixtures'
  | 'competitions'
  | 'finances'
  | 'youth'
  | 'history'
  | 'admin'
  | 'settings'
  | 'matchday';

interface GameStore {
  gameState: GameState | null;
  activeTab: NavTab;
  isHydrated: boolean;
  hydrationStep: string;
  hydrationError: string | null;
  isSaving: boolean;
  saveSlots: SaveEnvelope[];
  activeCutscene: ActiveCutscene | null;

  // Actions
  hydrateFromStorage: () => Promise<void>;
  recoverWithFreshCareerScreen: () => void;
  updatePlayerRole: (playerId: string, role: 'star' | 'starter' | 'rotation' | 'prospect') => Promise<void>;
  setActiveTab: (tab: NavTab) => void;
  triggerCutscene: (cutscene: ActiveCutscene | null) => void;
  startNewCareer: (manager: ManagerProfile, seed?: number) => Promise<void>;
  saveToSlot: (slotId: SaveSlotId) => Promise<void>;
  loadFromSlot: (slotId: SaveSlotId) => Promise<boolean>;
  deleteSaveSlot: (slotId: SaveSlotId) => Promise<void>;
  importSaveJson: (jsonStr: string) => Promise<void>;

  // Squad & Tactics actions
  swapPlayersInSquad: (playerIdA: string, playerIdB: string) => Promise<void>;
  autoPickUserLineup: () => Promise<void>;
  updateUserTactics: (partial: Partial<TacticsConfig>) => Promise<void>;
  setUserFormation: (formation: FormationCode) => Promise<void>;
  updateClubCaptains: (captainId: string, viceCaptainId?: string) => Promise<void>;
  importCustomDatabaseEntities: (payload: {
    clubs?: Partial<GameState['clubs'][number]>[];
    players?: Partial<GameState['players'][number]>[];
  }) => Promise<{ addedPlayers: number; updatedPlayers: number; duplicatesSkipped: number; updatedClubs: number }>;

  // Training, Scouting, Youth, Transfers
  updateTrainingSchedule: (schedule: WeeklyTrainingSchedule) => Promise<void>;
  updateScoutAssignment: (
    scoutId: string,
    region: string,
    position: PositionCode | 'ALL'
  ) => Promise<void>;
  toggleShortlist: (playerId: string) => Promise<void>;
  completeTransfer: (
    playerId: string,
    toClubId: string,
    fee: number,
    weeklyWage: number,
    isLoan: boolean
  ) => Promise<void>;
  promoteYouthPlayer: (playerId: string) => Promise<void>;
  releaseYouthPlayer: (playerId: string) => Promise<void>;
  renewPlayerContract: (playerId: string, newWage: number, extraYears: number) => Promise<void>;

  // Match & Season progression
  recordUserMatchResult: (fixtureId: string, result: MatchResult) => Promise<void>;
  advanceWeek: () => Promise<void>;

  // Chemistry, Synergy, Booster Economy, Monetization & Admin Balancing
  updatePlayerTacticalRole: (playerId: string, role: TacticalPlayerRole) => Promise<void>;
  saveTacticalPreset: (presetName: string) => Promise<void>;
  loadTacticalPreset: (presetId: string) => Promise<void>;
  deleteTacticalPreset: (presetId: string) => Promise<void>;
  activateBooster: (
    itemId: string,
    targetPlayerId?: string,
    secondaryPlayerId?: string,
    unlockedPosition?: PositionCode
  ) => Promise<{ success: boolean; message: string }>;
  claimDailyLogin: () => Promise<{ success: boolean; message: string }>;
  claimObjective: (objectiveId: string) => Promise<{ success: boolean; message: string }>;
  watchRewardedAd: (
    rewardChoice: 'recovery' | 'training' | 'soft_coins'
  ) => Promise<{ success: boolean; message: string }>;
  purchaseStarterPack: (
    simulateOutcome?: 'verified' | 'failed' | 'cancelled' | 'restored'
  ) => Promise<{ success: boolean; message: string }>;
  purchaseStoreOffer: (payload: {
    offerId: string;
    currencyType?: 'soft' | 'premium' | 'real_money';
  }) => Promise<{ success: boolean; message: string }>;
  updateAdminBalanceConfig: (
    patch: Partial<BalanceConfiguration>,
    adminPasscode: string
  ) => Promise<{ success: boolean; message: string; warnings?: string[] }>;
}

async function persistAutosave(state: GameState): Promise<SaveEnvelope[]> {
  try {
    await defaultSaveRepository.save('autosave', state);
    return await defaultSaveRepository.listSlots();
  } catch {
    return [];
  }
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  activeTab: 'home',
  isHydrated: false,
  hydrationStep: 'Connecting to local Career IndexedDB...',
  hydrationError: null,
  isSaving: false,
  saveSlots: [],
  activeCutscene: null,

  hydrateFromStorage: async () => {
    set({
      hydrationStep: 'Opening IndexedDB career storage...',
      hydrationError: null,
    });
    const timeoutPromise = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), 3500)
    );
    try {
      const loadTask = (async () => {
        const slots = await defaultSaveRepository.listSlots();
        set({ hydrationStep: 'Validating save schema & loading autosave...' });
        const auto = await defaultSaveRepository.load('autosave');
        const fallbackSlot = !auto && slots.length > 0 ? slots[0] : null;
        return { slots, loaded: auto ?? fallbackSlot };
      })();

      const outcome = await Promise.race([loadTask, timeoutPromise]);
      if (outcome === 'timeout') {
        set({
          hydrationError:
            'IndexedDB storage took longer than expected to respond. You can retry loading your save or proceed to the career screen.',
          isHydrated: true,
        });
        return;
      }

      set({
        gameState: outcome.loaded ? outcome.loaded.state : null,
        saveSlots: outcome.slots,
        hydrationError: null,
        isHydrated: true,
      });
    } catch (err) {
      set({
        hydrationError:
          err instanceof Error
            ? `Save recovery notice: ${err.message}`
            : 'Unable to read IndexedDB save storage.',
        isHydrated: true,
      });
    }
  },

  recoverWithFreshCareerScreen: () => {
    set({ gameState: null, hydrationError: null, isHydrated: true });
  },

  updatePlayerRole: async (playerId, role) => {
    const state = get().gameState;
    if (!state) return;
    const updatedPlayers = state.players.map((p) =>
      p.id === playerId ? { ...p, roleExpectation: role } : p
    );
    const nextState: GameState = { ...state, players: updatedPlayers };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  triggerCutscene: (cutscene) => set({ activeCutscene: cutscene }),

  startNewCareer: async (manager, seed = 20261108) => {
    set({ isSaving: true });
    const newState = generateInitialGameState(seed, manager);
    const slots = await persistAutosave(newState);
    const userClub = newState.clubs.find((c) => c.id === newState.manager.clubId);
    set({
      gameState: newState,
      saveSlots: slots,
      isSaving: false,
      activeTab: 'home',
      activeCutscene: {
        type: 'managerIntro',
        title: `Welcome to ${userClub?.name ?? 'the Club'}`,
        subtitle: `${manager.name} unveiled at ${userClub?.stadiumName ?? 'the Stadium'}`,
        primaryColor: userClub?.primaryColor,
        secondaryColor: userClub?.secondaryColor,
        clubName: userClub?.name,
        playerName: manager.name,
        nationality: manager.nationality,
        shirtNumber: 1,
      },
    });
  },

  saveToSlot: async (slotId) => {
    const current = get().gameState;
    if (!current) return;
    set({ isSaving: true });
    await defaultSaveRepository.save(slotId, current);
    const slots = await defaultSaveRepository.listSlots();
    set({ saveSlots: slots, isSaving: false });
  },

  loadFromSlot: async (slotId) => {
    set({ isSaving: true });
    const env = await defaultSaveRepository.load(slotId);
    if (!env) {
      set({ isSaving: false });
      return false;
    }
    await defaultSaveRepository.save('autosave', env.state);
    const slots = await defaultSaveRepository.listSlots();
    set({
      gameState: env.state,
      saveSlots: slots,
      isSaving: false,
      activeTab: 'home',
    });
    return true;
  },

  deleteSaveSlot: async (slotId) => {
    await defaultSaveRepository.deleteSlot(slotId);
    const slots = await defaultSaveRepository.listSlots();
    set({ saveSlots: slots });
  },

  importSaveJson: async (jsonStr) => {
    const env = defaultSaveRepository.importJson(jsonStr);
    const slots = await persistAutosave(env.state);
    set({
      gameState: env.state,
      saveSlots: slots,
      activeTab: 'home',
    });
  },

  swapPlayersInSquad: async (playerIdA, playerIdB) => {
    const state = get().gameState;
    if (!state || playerIdA === playerIdB) return;

    const userClubId = state.manager.clubId;
    const updatedClubs = state.clubs.map((club) => {
      if (club.id !== userClubId) return club;

      const replaceInList = (list: string[]) =>
        list.map((id) => (id === playerIdA ? playerIdB : id === playerIdB ? playerIdA : id));

      return {
        ...club,
        startingXI: replaceInList(club.startingXI),
        substitutes: replaceInList(club.substitutes),
        reserves: replaceInList(club.reserves),
      };
    });

    const nextState: GameState = { ...state, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  autoPickUserLineup: async () => {
    const state = get().gameState;
    if (!state) return;
    const userClubId = state.manager.clubId;
    const clubPlayers = state.players.filter((p) => p.clubId === userClubId);

    const updatedClubs = state.clubs.map((club) => {
      if (club.id !== userClubId) return club;
      const picked = autoPickLineupForClub(club.tactics.formation, clubPlayers);
      return {
        ...club,
        startingXI: picked.startingXI,
        substitutes: picked.substitutes,
        reserves: picked.reserves,
      };
    });

    const nextState: GameState = { ...state, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  updateUserTactics: async (partial) => {
    const state = get().gameState;
    if (!state) return;
    const userClubId = state.manager.clubId;

    const updatedClubs = state.clubs.map((club) =>
      club.id === userClubId
        ? { ...club, tactics: { ...club.tactics, ...partial } }
        : club
    );

    const nextState: GameState = { ...state, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  setUserFormation: async (formation) => {
    const state = get().gameState;
    if (!state) return;
    const userClubId = state.manager.clubId;

    const updatedClubs = state.clubs.map((club) =>
      club.id === userClubId
        ? { ...club, tactics: { ...club.tactics, formation } }
        : club
    );

    const nextState: GameState = { ...state, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  updateClubCaptains: async (captainId, viceCaptainId) => {
    const state = get().gameState;
    if (!state) return;
    const userClubId = state.manager.clubId;

    const updatedClubs = state.clubs.map((club) =>
      club.id === userClubId
        ? {
            ...club,
            captainId,
            viceCaptainId: viceCaptainId ?? club.viceCaptainId,
          }
        : club
    );

    const nextState: GameState = { ...state, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  importCustomDatabaseEntities: async (payload) => {
    const state = get().gameState;
    if (!state) {
      return { addedPlayers: 0, updatedPlayers: 0, duplicatesSkipped: 0, updatedClubs: 0 };
    }

    let updatedClubsCount = 0;
    const nextClubs = state.clubs.map((club) => {
      const incoming = payload.clubs?.find(
        (c) => c.id === club.id || (c.name && c.name.toLowerCase() === club.name.toLowerCase())
      );
      if (!incoming) return club;
      updatedClubsCount += 1;
      return {
        ...club,
        name: incoming.name ?? club.name,
        shortName: incoming.shortName ?? club.shortName,
        stadiumName: incoming.stadiumName ?? club.stadiumName,
        stadiumCapacity: incoming.stadiumCapacity ?? club.stadiumCapacity,
        reputation: incoming.reputation ?? club.reputation,
        managerName: incoming.managerName ?? club.managerName,
        clubHistory: incoming.clubHistory ?? club.clubHistory,
      };
    });

    let addedPlayers = 0;
    let updatedPlayers = 0;
    let duplicatesSkipped = 0;

    const nextPlayers = [...state.players];
    const seenKeys = new Set(
      nextPlayers.map(
        (p) => `${p.firstName.toLowerCase()}_${p.lastName.toLowerCase()}_${p.nationality.toLowerCase()}`
      )
    );

    for (const raw of payload.players ?? []) {
      if (!raw.firstName || !raw.lastName) continue;
      const existingIdx = nextPlayers.findIndex(
        (p) =>
          (raw.id && p.id === raw.id) ||
          (p.firstName.toLowerCase() === raw.firstName!.toLowerCase() &&
            p.lastName.toLowerCase() === raw.lastName!.toLowerCase())
      );

      if (existingIdx >= 0) {
        const existing = nextPlayers[existingIdx];
        nextPlayers[existingIdx] = {
          ...existing,
          clubId: raw.clubId ?? existing.clubId,
          overall: raw.overall ?? existing.overall,
          potential: raw.potential ?? existing.potential,
          marketValue: raw.marketValue ?? existing.marketValue,
          weeklyWage: raw.weeklyWage ?? existing.weeklyWage,
          shirtNumber: raw.shirtNumber ?? existing.shirtNumber,
          photoUrl: raw.photoUrl ?? existing.photoUrl,
        };
        updatedPlayers += 1;
      } else {
        const dupKey = `${raw.firstName.toLowerCase()}_${raw.lastName.toLowerCase()}_${(raw.nationality ?? 'england').toLowerCase()}`;
        if (seenKeys.has(dupKey)) {
          duplicatesSkipped += 1;
          continue;
        }
        seenKeys.add(dupKey);
        const template = nextPlayers[0];
        const newId = raw.id ?? `custom-player-${Date.now()}-${addedPlayers}`;
        const targetClubId = raw.clubId ?? state.manager.clubId;
        const ovr = raw.overall ?? 75;
        nextPlayers.push({
          ...template,
          id: newId,
          firstName: raw.firstName,
          lastName: raw.lastName,
          age: raw.age ?? 23,
          nationality: raw.nationality ?? 'England',
          clubId: targetClubId,
          primaryPosition: raw.primaryPosition ?? 'CM',
          secondaryPositions: raw.secondaryPositions ?? [],
          overall: ovr,
          potential: raw.potential ?? Math.min(94, ovr + 5),
          marketValue: raw.marketValue ?? ovr * 450000,
          weeklyWage: raw.weeklyWage ?? ovr * 950,
          shirtNumber: raw.shirtNumber ?? 29,
          photoUrl: raw.photoUrl,
          isYouth: false,
        });
        const clubIdx = nextClubs.findIndex((c) => c.id === targetClubId);
        if (clubIdx >= 0 && !nextClubs[clubIdx].reserves.includes(newId)) {
          nextClubs[clubIdx] = {
            ...nextClubs[clubIdx],
            reserves: [...nextClubs[clubIdx].reserves, newId],
          };
        }
        addedPlayers += 1;
      }
    }

    const nextState: GameState = {
      ...state,
      clubs: nextClubs,
      players: nextPlayers,
    };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
    return { addedPlayers, updatedPlayers, duplicatesSkipped, updatedClubs: updatedClubsCount };
  },

  updateTrainingSchedule: async (schedule) => {
    const state = get().gameState;
    if (!state) return;
    const userClubId = state.manager.clubId;

    const updatedClubs = state.clubs.map((club) =>
      club.id === userClubId ? { ...club, training: schedule } : club
    );

    const nextState: GameState = { ...state, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  updateScoutAssignment: async (scoutId, region, position) => {
    const state = get().gameState;
    if (!state) return;
    const updatedScouts = state.scouts.map((s) =>
      s.id === scoutId ? { ...s, assignedRegion: region, assignedPosition: position } : s
    );
    const nextState: GameState = { ...state, scouts: updatedScouts };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  toggleShortlist: async (playerId) => {
    const state = get().gameState;
    if (!state) return;
    const exists = state.shortlistPlayerIds.includes(playerId);
    const shortlistPlayerIds = exists
      ? state.shortlistPlayerIds.filter((id) => id !== playerId)
      : [...state.shortlistPlayerIds, playerId];

    const nextState: GameState = { ...state, shortlistPlayerIds };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  completeTransfer: async (playerId, toClubId, fee, weeklyWage, isLoan) => {
    const state = get().gameState;
    if (!state) return;
    const player = state.players.find((p) => p.id === playerId);
    const toClub = state.clubs.find((c) => c.id === toClubId);

    const nextState = executePlayerTransfer(state, playerId, toClubId, fee, weeklyWage, isLoan);
    set({
      gameState: nextState,
      activeCutscene:
        toClubId === state.manager.clubId && player && toClub
          ? {
              type: 'playerSigning',
              title: `New Signing: ${player.firstName} ${player.lastName}`,
              subtitle: `Joined ${toClub.name} ${isLoan ? 'on Loan' : `for £${fee.toLocaleString()}`}`,
              primaryColor: toClub.primaryColor,
              secondaryColor: toClub.secondaryColor,
              playerId: player.id,
              playerName: `${player.firstName} ${player.lastName}`,
              shirtNumber: player.shirtNumber,
              position: player.primaryPosition,
              overall: player.overall,
              nationality: player.nationality,
              heightCm: player.heightCm,
              strength: player.attributes.strength,
              photoUrl: player.photoUrl,
              clubName: toClub.name,
            }
          : null,
    });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  promoteYouthPlayer: async (playerId) => {
    const state = get().gameState;
    if (!state) return;
    const userClubId = state.manager.clubId;
    const updatedPlayers = state.players.map((p) =>
      p.id === playerId ? { ...p, isYouth: false, weeklyWage: Math.max(1200, p.weeklyWage) } : p
    );
    const updatedClubs = state.clubs.map((c) =>
      c.id === userClubId && !c.reserves.includes(playerId)
        ? { ...c, reserves: [...c.reserves, playerId] }
        : c
    );
    const nextState: GameState = { ...state, players: updatedPlayers, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  releaseYouthPlayer: async (playerId) => {
    const state = get().gameState;
    if (!state) return;
    const updatedPlayers = state.players.filter((p) => p.id !== playerId);
    const nextState: GameState = { ...state, players: updatedPlayers };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  renewPlayerContract: async (playerId, newWage, extraYears) => {
    const state = get().gameState;
    if (!state) return;
    const updatedPlayers = state.players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            weeklyWage: newWage,
            contractEndSeason: p.contractEndSeason + extraYears,
            morale: Math.min(100, p.morale + 12),
            transferRequested: false,
          }
        : p
    );
    const userClubId = state.manager.clubId;
    const newWageBill = updatedPlayers
      .filter((p) => p.clubId === userClubId)
      .reduce((s, p) => s + p.weeklyWage, 0);

    const updatedClubs = state.clubs.map((c) =>
      c.id === userClubId
        ? { ...c, finances: { ...c.finances, currentWageBillWeekly: newWageBill } }
        : c
    );

    const nextState: GameState = { ...state, players: updatedPlayers, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  recordUserMatchResult: async (fixtureId, result) => {
    const state = get().gameState;
    if (!state) return;
    const nextState = applyMatchResultToState(state, fixtureId, result);
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  advanceWeek: async () => {
    const state = get().gameState;
    if (!state) return;
    set({ isSaving: true });
    const prevTrophiesCount = state.trophies.length;
    const nextState = await runAdvanceWeekInWorker(state);
    const slots = await persistAutosave(nextState);

    let cutscene: ActiveCutscene | null = null;
    if (nextState.trophies.length > prevTrophiesCount) {
      const latestTrophy = nextState.trophies[nextState.trophies.length - 1];
      if (latestTrophy.winnerClubId === nextState.manager.clubId) {
        const userClub = nextState.clubs.find((c) => c.id === nextState.manager.clubId);
        cutscene = {
          type:
            latestTrophy.competition === 'division1' || latestTrophy.competition === 'division2'
              ? 'leagueChampionship'
              : 'trophyPresentation',
          title: `CHAMPIONS! ${latestTrophy.competitionName}`,
          subtitle: `${latestTrophy.winnerClubName} lift the ${latestTrophy.season} trophy!`,
          primaryColor: userClub?.primaryColor,
          secondaryColor: userClub?.secondaryColor,
          clubName: latestTrophy.winnerClubName,
        };
      }
    }

    set({
      gameState: nextState,
      saveSlots: slots,
      isSaving: false,
      activeCutscene: cutscene,
    });
  },

  updatePlayerTacticalRole: async (playerId, role) => {
    const state = get().gameState;
    if (!state) return;
    const updatedPlayers = state.players.map((p) =>
      p.id === playerId ? { ...p, tacticalRole: role } : p
    );
    const nextState: GameState = { ...state, players: updatedPlayers };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  saveTacticalPreset: async (presetName) => {
    const state = get().gameState;
    if (!state || !presetName.trim()) return;
    const userClub = state.clubs.find((c) => c.id === state.manager.clubId) ?? state.clubs[0];
    const existing = state.manager.savedPresets ?? [];
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      createdAtIso: new Date().toISOString(),
      tactics: { ...userClub.tactics },
    };
    const nextState: GameState = {
      ...state,
      manager: {
        ...state.manager,
        savedPresets: [newPreset, ...existing].slice(0, 12),
      },
    };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  loadTacticalPreset: async (presetId) => {
    const state = get().gameState;
    if (!state) return;
    const preset = (state.manager.savedPresets ?? []).find((p) => p.id === presetId);
    if (!preset) return;
    const userClubId = state.manager.clubId;
    const updatedClubs = state.clubs.map((c) =>
      c.id === userClubId ? { ...c, tactics: { ...preset.tactics } } : c
    );
    const nextState: GameState = { ...state, clubs: updatedClubs };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  deleteTacticalPreset: async (presetId) => {
    const state = get().gameState;
    if (!state) return;
    const nextState: GameState = {
      ...state,
      manager: {
        ...state.manager,
        savedPresets: (state.manager.savedPresets ?? []).filter((p) => p.id !== presetId),
      },
    };
    set({ gameState: nextState });
    const slots = await persistAutosave(nextState);
    set({ saveSlots: slots });
  },

  activateBooster: async (itemId, targetPlayerId, secondaryPlayerId, unlockedPosition) => {
    const state = get().gameState;
    if (!state) return { success: false, message: 'No active career loaded.' };
    const result = activateBoosterItem(
      state,
      itemId,
      targetPlayerId,
      secondaryPlayerId,
      new Date().toISOString(),
      unlockedPosition
    );
    if (result.success) {
      set({ gameState: result.updatedState });
      const slots = await persistAutosave(result.updatedState);
      set({ saveSlots: slots });
    }
    return { success: result.success, message: result.message };
  },

  claimDailyLogin: async () => {
    const state = get().gameState;
    if (!state) return { success: false, message: 'No active career loaded.' };
    const result = claimDailyLoginReward(state);
    if (result.success) {
      set({ gameState: result.updatedState });
      const slots = await persistAutosave(result.updatedState);
      set({ saveSlots: slots });
    }
    return { success: result.success, message: result.message };
  },

  claimObjective: async (objectiveId) => {
    const state = get().gameState;
    if (!state) return { success: false, message: 'No active career loaded.' };
    const result = claimObjectiveReward(state, objectiveId);
    if (result.success) {
      set({ gameState: result.updatedState });
      const slots = await persistAutosave(result.updatedState);
      set({ saveSlots: slots });
    }
    return { success: result.success, message: result.message };
  },

  watchRewardedAd: async (rewardChoice) => {
    const state = get().gameState;
    if (!state) return { success: false, message: 'No active career loaded.' };
    if (get().activeTab === 'matchday') {
      return {
        success: false,
        message: 'Rewarded advertisements are never permitted during active matches.',
      };
    }

    const economy = ensureEconomyState(state);
    const config = economy.balanceConfig ?? DEFAULT_BALANCE_CONFIG;
    const todayKey = new Date().toISOString().slice(0, 10);
    const adsToday =
      economy.rewardedAds.dateKey === todayKey ? economy.rewardedAds.adsWatchedToday : 0;

    const adNonce = `ad-${economy.accountId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    try {
      const res = await fetch('/api/economy/reward-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: economy.accountId,
          adNonce,
          rewardChoice,
          isMatchInProgress: get().activeTab === 'matchday',
          adsWatchedToday: adsToday,
          maxAdsPerDay: config.maxRewardedAdsPerDay,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        return {
          success: false,
          message: data.error || 'Rewarded ad provider verification failed.',
        };
      }

      const applied = applyVerifiedRewardedAdGrant(
        state,
        adNonce,
        rewardChoice,
        data.providerSignature
      );
      if (applied.success) {
        set({ gameState: applied.updatedState });
        const slots = await persistAutosave(applied.updatedState);
        set({ saveSlots: slots });
      }
      return { success: applied.success, message: applied.message };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error
            ? `Ad provider network error: ${err.message}`
            : 'Rewarded ad provider unavailable.',
      };
    }
  },

  purchaseStarterPack: async (simulateOutcome = 'verified') => {
    const state = get().gameState;
    if (!state) return { success: false, message: 'No active career loaded.' };
    const economy = ensureEconomyState(state);
    const transactionId = `tx-sp-${economy.accountId}-${Date.now()}`;

    try {
      const res = await fetch('/api/economy/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: economy.accountId,
          offerId: 'offer-starter-pack-onetime',
          transactionId,
          currencyType: 'real_money',
          simulateOutcome,
          alreadyOwnedOnClient: economy.starterPack.owned,
        }),
      });
      const data = await res.json();

      if (simulateOutcome === 'failed' || simulateOutcome === 'cancelled') {
        const appliedFail = applyVerifiedStarterPackTransaction(state, {
          transactionId,
          status: simulateOutcome,
          verificationSignature: data.verificationSignature || 'unverified',
        });
        set({ gameState: appliedFail.updatedState });
        const slots = await persistAutosave(appliedFail.updatedState);
        set({ saveSlots: slots });
        return { success: false, message: appliedFail.message };
      }

      if (!res.ok || !data.verified) {
        return {
          success: false,
          message: data.error || 'Server payment verification declined.',
        };
      }

      const applied = applyVerifiedStarterPackTransaction(state, {
        transactionId,
        status: data.status || 'verified',
        verificationSignature: data.verificationSignature,
      });

      set({ gameState: applied.updatedState });
      const slots = await persistAutosave(applied.updatedState);
      set({ saveSlots: slots });
      return { success: applied.success, message: applied.message };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error
            ? `Payment verification error: ${err.message}`
            : 'Unable to reach payment verification server.',
      };
    }
  },

  purchaseStoreOffer: async ({ offerId, currencyType = 'soft' }) => {
    const state = get().gameState;
    if (!state) return { success: false, message: 'No active career loaded.' };
    const economy = ensureEconomyState(state);
    const transactionId = `tx-store-${economy.accountId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      const res = await fetch('/api/economy/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: economy.accountId,
          offerId,
          transactionId,
          currencyType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified || !data.offer) {
        return {
          success: false,
          message: data.error || 'Store purchase verification failed.',
        };
      }

      const applied = applyVerifiedStorePurchase(state, {
        transactionId,
        offerId: data.offer.offerId,
        offerName: data.offer.offerName,
        currencyType: data.offer.currencyType,
        costAmount: data.offer.costAmount,
        priceDisplay: data.offer.priceDisplay,
        verificationSignature: data.verificationSignature,
        itemsGranted: data.offer.itemsGranted,
        softCoinsGranted: data.offer.softCoinsGranted,
        premiumCoinsGranted: data.offer.premiumCoinsGranted,
      });

      if (applied.success) {
        set({ gameState: applied.updatedState });
        const slots = await persistAutosave(applied.updatedState);
        set({ saveSlots: slots });
      }
      return { success: applied.success, message: applied.message };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error
            ? `Store transaction error: ${err.message}`
            : 'Unable to verify store transaction.',
      };
    }
  },

  updateAdminBalanceConfig: async (patch, adminPasscode) => {
    const state = get().gameState;
    if (!state) return { success: false, message: 'No active career loaded.' };
    const economy = ensureEconomyState(state);

    try {
      const res = await fetch('/api/economy/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPasscode,
          adminId: state.manager.name,
          currentConfig: economy.balanceConfig,
          patch,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        return {
          success: false,
          message: data.error || 'Unauthorized administrator passcode.',
        };
      }

      const nextEconomy = {
        ...economy,
        balanceConfig: data.updatedConfig,
        adminAuditLog: [...(data.auditEntries ?? []), ...economy.adminAuditLog].slice(0, 100),
      };
      const nextState: GameState = { ...state, economy: nextEconomy };
      set({ gameState: nextState });
      const slots = await persistAutosave(nextState);
      set({ saveSlots: slots });

      return {
        success: true,
        message: resultMessage(data.auditEntry),
      };
    } catch {
      // Fallback local validation if offline
      if (adminPasscode !== 'ADMIN-FM27') {
        return { success: false, message: 'Unauthorized administrator passcode.' };
      }
      const localRes = validateAndApplyBalanceConfigUpdate(
        economy.balanceConfig,
        patch,
        state.manager.name
      );
      const nextEconomy = {
        ...economy,
        balanceConfig: localRes.updatedConfig,
        adminAuditLog: [localRes.auditEntry, ...economy.adminAuditLog].slice(0, 100),
      };
      const nextState: GameState = { ...state, economy: nextEconomy };
      set({ gameState: nextState });
      const slots = await persistAutosave(nextState);
      set({ saveSlots: slots });
      return {
        success: true,
        message: localRes.auditEntry.summary,
      };
    }
  },
}));

function resultMessage(entry?: { summary?: string }): string {
  return entry?.summary || 'Updated central balance configuration and recorded in audit log.';
}
