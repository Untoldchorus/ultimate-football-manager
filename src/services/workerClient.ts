import { advanceGameWeek } from '@/engine/season';
import { simulateMatch } from '@/engine/matchEngine';
import { GameState, MatchResult, MatchSimulationInput } from '@/engine/types';
import { WorkerRequest, WorkerResponse } from '@/workers/simWorker';

let workerInstance: Worker | null = null;
let reqCounter = 1;
const pendingMap = new Map<string, { resolve: (val: unknown) => void; reject: (err: Error) => void }>();

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
        pendingMap.delete(msg.id);
        if (msg.type === 'ERROR') {
          entry.reject(new Error(msg.error));
        } else if (msg.type === 'SIMULATE_MATCH_DONE') {
          entry.resolve(msg.result);
        } else if (msg.type === 'ADVANCE_WEEK_DONE' || msg.type === 'SIMULATE_SEASONS_DONE') {
          entry.resolve(msg.state);
        }
      };
    } catch {
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
  return new Promise<MatchResult>((resolve, reject) => {
    pendingMap.set(id, { resolve: resolve as (val: unknown) => void, reject });
    const req: WorkerRequest = { id, type: 'SIMULATE_MATCH', payload: { input, seed } };
    w.postMessage(req);
  });
}

export async function runAdvanceWeekInWorker(state: GameState): Promise<GameState> {
  const w = getWorker();
  if (!w) {
    return advanceGameWeek(state);
  }
  const id = `w-req-${reqCounter++}`;
  return new Promise<GameState>((resolve, reject) => {
    pendingMap.set(id, { resolve: resolve as (val: unknown) => void, reject });
    const req: WorkerRequest = { id, type: 'ADVANCE_WEEK', payload: { state } };
    w.postMessage(req);
  });
}
