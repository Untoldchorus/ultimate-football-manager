import { advanceGameWeek } from '@/engine/season';
import { simulateMatch } from '@/engine/matchEngine';
import { GameState, MatchResult, MatchSimulationInput } from '@/engine/types';
import { WorkerRequest, WorkerResponse } from '@/workers/simWorker';

let workerInstance: Worker | null = null;
let reqCounter = 1;
const pendingMap = new Map<string, { resolve: (val: unknown) => void; reject: (err: Error) => void; timeoutId: ReturnType<typeof setTimeout> }>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('../workers/simWorker.ts', import.meta.url));
      workerInstance.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        const entry = pendingMap.get(msg.id);
        if (!entry) return;
        clearTimeout(entry.timeoutId);
        pendingMap.delete(msg.id);
        if (msg.type === 'ERROR') {
          entry.reject(new Error(msg.error));
        } else if (msg.type === 'SIMULATE_MATCH_DONE') {
          entry.resolve(msg.result);
        } else if (msg.type === 'ADVANCE_WEEK_DONE' || msg.type === 'SIMULATE_SEASONS_DONE') {
          entry.resolve(msg.state);
        }
      };
      workerInstance.onerror = (err) => {
        console.warn('[SimWorker] Worker error encountered, falling back to main-thread engine:', err);
        // Clear all pending requests and fallback to main thread
        for (const [id, entry] of pendingMap.entries()) {
          clearTimeout(entry.timeoutId);
          entry.reject(new Error('Worker crashed'));
        }
        pendingMap.clear();
        try {
          workerInstance?.terminate();
        } catch {
          // ignore
        }
        workerInstance = null;
      };
    } catch (err) {
      console.warn('[SimWorker] Unable to initialize Web Worker, using main-thread fallback:', err);
      workerInstance = null;
    }
  }
  return workerInstance;
}

export async function runMatchInWorker(
  input: MatchSimulationInput,
  seed: number
): Promise<MatchResult> {
  const w = getWorker();
  if (!w) {
    return simulateMatch(input, seed);
  }
  const id = `w-req-${reqCounter++}`;
  return new Promise<MatchResult>((resolve) => {
    const timeoutId = setTimeout(() => {
      pendingMap.delete(id);
      console.warn(`[SimWorker] Match simulation worker timeout (400ms) for ${id}, resolving on main thread.`);
      resolve(simulateMatch(input, seed));
    }, 400);

    pendingMap.set(id, {
      resolve: resolve as (val: unknown) => void,
      reject: () => {
        resolve(simulateMatch(input, seed));
      },
      timeoutId,
    });

    try {
      const req: WorkerRequest = { id, type: 'SIMULATE_MATCH', payload: { input, seed } };
      w.postMessage(req);
    } catch (err) {
      clearTimeout(timeoutId);
      pendingMap.delete(id);
      console.warn('[SimWorker] postMessage failed, falling back to main-thread:', err);
      resolve(simulateMatch(input, seed));
    }
  });
}

export async function runAdvanceWeekInWorker(state: GameState): Promise<GameState> {
  const w = getWorker();
  if (!w) {
    return advanceGameWeek(state);
  }
  const id = `w-req-${reqCounter++}`;
  return new Promise<GameState>((resolve) => {
    const timeoutId = setTimeout(() => {
      pendingMap.delete(id);
      console.warn(`[SimWorker] Advance week worker timeout (400ms) for ${id}, resolving on main thread.`);
      resolve(advanceGameWeek(state));
    }, 400);

    pendingMap.set(id, {
      resolve: resolve as (val: unknown) => void,
      reject: () => {
        resolve(advanceGameWeek(state));
      },
      timeoutId,
    });

    try {
      const req: WorkerRequest = { id, type: 'ADVANCE_WEEK', payload: { state } };
      w.postMessage(req);
    } catch (err) {
      clearTimeout(timeoutId);
      pendingMap.delete(id);
      console.warn('[SimWorker] postMessage failed, falling back to main-thread:', err);
      resolve(advanceGameWeek(state));
    }
  });
}
