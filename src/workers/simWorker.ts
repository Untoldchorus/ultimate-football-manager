import { advanceGameWeek } from '@/engine/season';
import { simulateMatch } from '@/engine/matchEngine';
import { GameState, MatchResult, MatchSimulationInput } from '@/engine/types';

export type WorkerRequest =
  | { id: string; type: 'SIMULATE_MATCH'; payload: { input: MatchSimulationInput; seed: number } }
  | { id: string; type: 'ADVANCE_WEEK'; payload: { state: GameState } }
  | { id: string; type: 'SIMULATE_SEASONS'; payload: { state: GameState; weeksCount: number } };

export type WorkerResponse =
  | { id: string; type: 'SIMULATE_MATCH_DONE'; result: MatchResult }
  | { id: string; type: 'ADVANCE_WEEK_DONE'; state: GameState }
  | { id: string; type: 'SIMULATE_SEASONS_DONE'; state: GameState }
  | { id: string; type: 'ERROR'; error: string };

if (typeof self !== 'undefined' && typeof (self as unknown as Worker).postMessage === 'function') {
  self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const req = event.data;
    try {
      if (req.type === 'SIMULATE_MATCH') {
        const result = simulateMatch(req.payload.input, req.payload.seed);
        const res: WorkerResponse = { id: req.id, type: 'SIMULATE_MATCH_DONE', result };
        self.postMessage(res);
      } else if (req.type === 'ADVANCE_WEEK') {
        const nextState = advanceGameWeek(req.payload.state);
        const res: WorkerResponse = { id: req.id, type: 'ADVANCE_WEEK_DONE', state: nextState };
        self.postMessage(res);
      } else if (req.type === 'SIMULATE_SEASONS') {
        let curr = req.payload.state;
        for (let i = 0; i < req.payload.weeksCount; i++) {
          curr = advanceGameWeek(curr);
        }
        const res: WorkerResponse = { id: req.id, type: 'SIMULATE_SEASONS_DONE', state: curr };
        self.postMessage(res);
      }
    } catch (err) {
      const res: WorkerResponse = {
        id: req.id,
        type: 'ERROR',
        error: err instanceof Error ? err.message : String(err),
      };
      self.postMessage(res);
    }
  };
}
