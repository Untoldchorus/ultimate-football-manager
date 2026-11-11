import { create } from 'zustand';
import {
  autoPickLineupForClub,
  generateInitialGameState,
} from '@/engine/generator';
import { applyMatchResultToState } from '@/engine/season';
import { executePlayerTransfer } from '@/engine/transfers';
import {
  ActiveCutscene,
  FormationCode,
  GameState,
  ManagerProfile,
  MatchResult,
  PositionCode,
  SaveEnvelope,
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
  | 'transfers'
  | 'scouting'
  | 'training'
  | 'fixtures'
  | 'competitions'
  | 'finances'
  | 'youth'
  | 'history'
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
              playerName: `${player.firstName} ${player.lastName}`,
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
}));
