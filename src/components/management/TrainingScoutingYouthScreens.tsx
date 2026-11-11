import React from 'react';
import { Dumbbell, Compass, GraduationCap, ArrowUpRight, Trash2 } from 'lucide-react';
import { PositionCode, TrainingFocus, WeeklyTrainingSchedule } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

const FOCUSES: TrainingFocus[] = [
  'attacking',
  'defending',
  'passing',
  'shooting',
  'fitness',
  'goalkeeping',
  'tactical',
];

export function TrainingScreen() {
  const { gameState, updateTrainingSchedule } = useGameStore();
  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const sched = userClub.training;

  const days: (keyof Omit<WeeklyTrainingSchedule, 'intensity'>)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ];

  return (
    <div className="space-y-6" data-testid="training-screen">
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-pitch-400" />
            <div>
              <h2 className="text-lg font-extrabold text-white">Weekly Training Calendar</h2>
              <p className="text-xs text-slate-400">
                Develop player attributes weekly. Per-season growth is capped at +5 OVR to preserve realism.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">Intensity:</span>
            {(['light', 'balanced', 'heavy'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  soundManager.playUiClick();
                  updateTrainingSchedule({ ...sched, intensity: level });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
                  sched.intensity === level
                    ? 'bg-pitch-600 text-white'
                    : 'bg-navy-950 border border-slate-800 text-slate-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {days.map((day) => (
            <div
              key={day}
              className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3"
            >
              <div className="text-xs font-extrabold uppercase tracking-wider text-gold-400">
                {day}
              </div>
              <select
                value={sched[day]}
                onChange={(e) => {
                  soundManager.playUiClick();
                  updateTrainingSchedule({
                    ...sched,
                    [day]: e.target.value as TrainingFocus,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-navy-900 border border-slate-700 text-xs font-bold text-white uppercase"
              >
                {FOCUSES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ScoutingScreen() {
  const { gameState, updateScoutAssignment, toggleShortlist } = useGameStore();
  if (!gameState) return null;

  const playerMap = new Map(gameState.players.map((p) => [p.id, p]));
  const regions = ['Western Europe', 'South America', 'Domestic League', 'Eastern Europe', 'West Africa', 'East Asia'];
  const positions: (PositionCode | 'ALL')[] = ['ALL', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

  return (
    <div className="space-y-6" data-testid="scouting-screen">
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-pitch-400" />
          <div>
            <h2 className="text-lg font-extrabold text-white">Scouting Network &amp; Assignments</h2>
            <p className="text-xs text-slate-400">
              Scouts deliver new player evaluations every week based on their assigned region and position.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gameState.scouts.map((scout) => (
            <div
              key={scout.id}
              className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{scout.name}</div>
                  <div className="text-xs text-slate-400">{scout.nationality}</div>
                </div>
                <span className="px-2.5 py-1 rounded bg-pitch-500/20 text-pitch-400 text-xs font-bold">
                  Accuracy {scout.rating}
                </span>
              </div>

              <div className="space-y-2">
                <select
                  value={scout.assignedRegion}
                  onChange={(e) =>
                    updateScoutAssignment(scout.id, e.target.value, scout.assignedPosition)
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-xs text-white"
                >
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      Region: {r}
                    </option>
                  ))}
                </select>

                <select
                  value={scout.assignedPosition}
                  onChange={(e) =>
                    updateScoutAssignment(
                      scout.id,
                      scout.assignedRegion,
                      e.target.value as PositionCode | 'ALL'
                    )
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-700 text-xs text-white"
                >
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      Target Position: {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scouting Reports */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-gold-400">
          Filed Scouting Dossiers ({gameState.scoutingReports.length})
        </h3>
        {gameState.scoutingReports.length === 0 ? (
          <p className="text-xs text-slate-400">
            Advance the week to receive your scouts&apos; first round of player dossiers.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gameState.scoutingReports.slice(0, 16).map((rep) => {
              const p = playerMap.get(rep.playerId);
              if (!p) return null;
              return (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl bg-navy-950 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">
                      {p.firstName} {p.lastName}{' '}
                      <span className="text-pitch-400">({p.primaryPosition})</span>
                    </div>
                    <div className="text-xs text-slate-400">{rep.notes}</div>
                    <div className="text-xs font-semibold text-gold-400 pt-1">
                      Est. OVR: {rep.estimatedOverallMin}–{rep.estimatedOverallMax} &bull; Est. POT:{' '}
                      {rep.estimatedPotentialMin}–{rep.estimatedPotentialMax}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleShortlist(p.id)}
                    className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-xs font-bold text-white shrink-0"
                  >
                    {gameState.shortlistPlayerIds.includes(p.id) ? '★ Shortlisted' : '+ Shortlist'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function YouthAcademyScreen() {
  const { gameState, promoteYouthPlayer, releaseYouthPlayer } = useGameStore();
  if (!gameState) return null;

  const userClubId = gameState.manager.clubId;
  const youthPlayers = gameState.players.filter((p) => p.clubId === userClubId && p.isYouth);

  return (
    <div className="space-y-6" data-testid="youth-screen">
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-pitch-400" />
          <div>
            <h2 className="text-lg font-extrabold text-white">Club Youth Academy</h2>
            <p className="text-xs text-slate-400">
              Develop homegrown U-18 prospects and promote them to your senior squad when ready.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {youthPlayers.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-extrabold text-white">
                    {p.firstName} {p.lastName}
                  </div>
                  <div className="text-xs text-slate-400">
                    Age {p.age} &bull; {p.nationality} &bull; {p.primaryPosition}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-white">OVR {p.overall}</div>
                  <div className="text-xs font-bold text-pitch-400">POT {p.potential}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  data-testid={`promote-youth-${p.id}`}
                  onClick={() => {
                    soundManager.playUiClick();
                    promoteYouthPlayer(p.id);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Promote to Senior</span>
                </button>
                <button
                  type="button"
                  onClick={() => releaseYouthPlayer(p.id)}
                  className="p-2 rounded-xl bg-navy-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
