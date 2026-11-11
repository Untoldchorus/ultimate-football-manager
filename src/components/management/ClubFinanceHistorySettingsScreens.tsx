import React, { useState } from 'react';
import {
  Landmark,
  Trophy,
  Calendar,
  History,
  Settings,
  Building2,
  Volume2,
  Download,
  Upload,
  Save,
} from 'lucide-react';
import { calculateStandings } from '@/engine/standings';
import { CompetitionType } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { defaultSaveRepository, SaveSlotId } from '@/services/saveRepository';
import { useGameStore } from '@/store/useGameStore';

export function MyClubScreen() {
  const { gameState, renewPlayerContract } = useGameStore();
  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const squad = gameState.players.filter((p) => p.clubId === userClub.id && !p.isYouth);

  return (
    <div className="space-y-6" data-testid="my-club-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-bold uppercase text-pitch-400 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Club Identity</span>
          </div>
          <div className="text-xl font-black text-white">{userClub.name}</div>
          <div className="text-xs text-slate-400">
            Stadium: {userClub.stadiumName} ({userClub.stadiumCapacity.toLocaleString()} seats)
          </div>
          <div className="text-xs text-slate-400">
            Division {userClub.division} &bull; Reputation {userClub.reputation}/100
          </div>
        </div>

        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-bold uppercase text-gold-400">Board Confidence</div>
          <div className="text-2xl font-black text-white">{gameState.board.confidence}%</div>
          <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden">
            <div
              className="h-full bg-pitch-500"
              style={{ width: `${gameState.board.confidence}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{gameState.board.expectationsText}</p>
        </div>

        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-bold uppercase text-slate-400">Squad Harmony &amp; Contracts</div>
          <div className="text-2xl font-black text-white">
            {Math.round(squad.reduce((s, p) => s + p.morale, 0) / Math.max(1, squad.length))}% Avg Morale
          </div>
          <p className="text-xs text-slate-400">
            {squad.filter((p) => p.contractEndSeason <= gameState.currentSeason + 1).length} players entering final contract year.
          </p>
        </div>
      </div>

      {/* Contract Renewals Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
          Senior Squad Contracts &amp; Morale Management
        </h3>
        <div className="overflow-x-auto max-h-[360px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 uppercase">
                <th className="py-2 px-3">Player</th>
                <th className="py-2 px-3">Pos</th>
                <th className="py-2 px-3">OVR</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Morale</th>
                <th className="py-2 px-3">Contract Ends</th>
                <th className="py-2 px-3">Wage</th>
                <th className="py-2 px-3 text-right">Extend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {squad.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="py-2.5 px-3 text-pitch-400 font-bold">{p.primaryPosition}</td>
                  <td className="py-2.5 px-3 font-black text-gold-400">{p.overall}</td>
                  <td className="py-2.5 px-3 uppercase text-slate-300">{p.roleExpectation}</td>
                  <td className="py-2.5 px-3 text-slate-300">{p.morale}%</td>
                  <td className="py-2.5 px-3 text-slate-300">{p.contractEndSeason}</td>
                  <td className="py-2.5 px-3 text-white">£{p.weeklyWage.toLocaleString()}/wk</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playUiClick();
                        renewPlayerContract(p.id, Math.round(p.weeklyWage * 1.1), 2);
                      }}
                      className="px-2.5 py-1 rounded bg-pitch-600 hover:bg-pitch-500 text-white font-bold text-[11px]"
                    >
                      +2 Years
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function FinancesScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const f = userClub.finances;

  return (
    <div className="space-y-6" data-testid="finances-screen">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Cash Balance</div>
          <div className="text-xl font-black text-white mt-1">
            £{f.cashBalance.toLocaleString()}
          </div>
        </div>
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Transfer Budget</div>
          <div className="text-xl font-black text-pitch-400 mt-1">
            £{f.transferBudget.toLocaleString()}
          </div>
        </div>
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Weekly Wage Bill</div>
          <div className="text-xl font-black text-gold-400 mt-1">
            £{f.currentWageBillWeekly.toLocaleString()} / £{f.wageBudgetWeekly.toLocaleString()}
          </div>
        </div>
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5">
          <div className="text-xs font-bold uppercase text-slate-400">Home Gate Revenue</div>
          <div className="text-xl font-black text-white mt-1">
            £{f.matchdayRevenuePerHomeGame.toLocaleString()} / match
          </div>
        </div>
      </div>

      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-pitch-400" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
            Financial Ledger &amp; Transactions
          </h3>
        </div>
        <div className="space-y-2 max-h-[380px] overflow-y-auto">
          {f.ledger.map((tx) => (
            <div
              key={tx.id}
              className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-white">{tx.description}</div>
                <div className="text-[11px] text-slate-400">
                  Season {tx.season} &bull; Week {tx.week} &bull; {tx.category.toUpperCase()}
                </div>
              </div>
              <span
                className={`font-extrabold ${
                  tx.amount >= 0 ? 'text-pitch-400' : 'text-red-400'
                }`}
              >
                {tx.amount >= 0 ? '+' : ''}£{tx.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FixturesScreen() {
  const { gameState } = useGameStore();
  const [onlyMyClub, setOnlyMyClub] = useState(true);
  if (!gameState) return null;

  const clubMap = new Map(gameState.clubs.map((c) => [c.id, c]));
  const list = gameState.fixtures.filter((f) =>
    onlyMyClub
      ? f.homeClubId === gameState.manager.clubId || f.awayClubId === gameState.manager.clubId
      : true
  );

  return (
    <div className="space-y-6" data-testid="fixtures-screen">
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pitch-400" />
          <h2 className="text-lg font-extrabold text-white">
            Season {gameState.currentSeason} Fixtures &amp; Results
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOnlyMyClub(!onlyMyClub)}
          className="px-3.5 py-1.5 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-pitch-400"
        >
          {onlyMyClub ? 'Showing: My Club Only' : 'Showing: All Fixtures'}
        </button>
      </div>

      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-2 max-h-[520px] overflow-y-auto">
        {list.map((f) => {
          const h = clubMap.get(f.homeClubId);
          const a = clubMap.get(f.awayClubId);
          return (
            <div
              key={f.id}
              className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="text-slate-400 w-36">
                <span className="font-bold text-gold-400">W{f.week}</span> &bull; {f.competition.toUpperCase()}
              </div>
              <div className="flex-1 flex items-center justify-center gap-4 font-bold text-white">
                <span className="text-right flex-1">{h?.name}</span>
                <span className="px-3 py-1 rounded bg-navy-800 text-pitch-400 font-black min-w-[64px] text-center">
                  {f.played && f.result
                    ? `${f.result.homeScore} - ${f.result.awayScore}`
                    : 'vs'}
                </span>
                <span className="text-left flex-1">{a?.name}</span>
              </div>
              <div className="w-24 text-right text-slate-400">{f.roundName}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CompetitionsScreen() {
  const { gameState } = useGameStore();
  const [comp, setComp] = useState<CompetitionType>('division1');
  if (!gameState) return null;

  const clubMap = new Map(gameState.clubs.map((c) => [c.id, c]));
  const isLeague = comp === 'division1' || comp === 'division2';
  const standings = isLeague
    ? calculateStandings(gameState.clubs, gameState.fixtures, comp)
    : [];
  const cupFixtures = !isLeague
    ? gameState.fixtures.filter((f) => f.competition === comp)
    : [];

  return (
    <div className="space-y-6" data-testid="competitions-screen">
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-extrabold text-white">Competitions &amp; Standings</h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['division1', 'Premier Division 1'],
              ['division2', 'Championship Division 2'],
              ['domesticCup', 'National Challenge Cup'],
              ['championsCup', 'Continental Champions Cup'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setComp(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                comp === key
                  ? 'bg-pitch-600 text-white'
                  : 'bg-navy-950 border border-slate-800 text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLeague ? (
        <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-navy-950 text-slate-400 uppercase border-b border-slate-800">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Club</th>
                <th className="py-3 px-3">P</th>
                <th className="py-3 px-3">W</th>
                <th className="py-3 px-3">D</th>
                <th className="py-3 px-3">L</th>
                <th className="py-3 px-3">GF</th>
                <th className="py-3 px-3">GA</th>
                <th className="py-3 px-3">GD</th>
                <th className="py-3 px-4 font-black text-white">PTS</th>
                <th className="py-3 px-4">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {standings.map((row, idx) => {
                const isUser = row.clubId === gameState.manager.clubId;
                return (
                  <tr
                    key={row.clubId}
                    className={isUser ? 'bg-pitch-600/15 font-bold' : 'hover:bg-navy-800/40'}
                  >
                    <td className="py-3 px-4 font-bold text-slate-300">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-white">{row.clubName}</td>
                    <td className="py-3 px-3 text-slate-300">{row.played}</td>
                    <td className="py-3 px-3 text-slate-300">{row.won}</td>
                    <td className="py-3 px-3 text-slate-300">{row.drawn}</td>
                    <td className="py-3 px-3 text-slate-300">{row.lost}</td>
                    <td className="py-3 px-3 text-slate-300">{row.goalsFor}</td>
                    <td className="py-3 px-3 text-slate-300">{row.goalsAgainst}</td>
                    <td className="py-3 px-3 text-pitch-400 font-bold">{row.goalDifference}</td>
                    <td className="py-3 px-4 font-black text-gold-400 text-sm">{row.points}</td>
                    <td className="py-3 px-4 space-x-1">
                      {row.form.map((res, i) => (
                        <span
                          key={i}
                          className={`inline-block w-5 text-center py-0.5 rounded text-[10px] font-bold ${
                            res === 'W'
                              ? 'bg-pitch-600 text-white'
                              : res === 'D'
                                ? 'bg-slate-700 text-slate-200'
                                : 'bg-red-600/80 text-white'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          {cupFixtures.map((f) => (
            <div
              key={f.id}
              className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <span className="font-bold text-gold-400">{f.roundName} (Week {f.week})</span>
              <span className="font-bold text-white">
                {clubMap.get(f.homeClubId)?.name}{' '}
                <strong className="text-pitch-400 mx-2">
                  {f.played && f.result
                    ? `${f.result.homeScore} - ${f.result.awayScore}`
                    : 'vs'}
                </strong>{' '}
                {clubMap.get(f.awayClubId)?.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClubHistoryScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="space-y-6" data-testid="history-screen">
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-extrabold text-white">Trophy Cabinet &amp; Club History</h2>
        </div>

        {gameState.trophies.length === 0 ? (
          <p className="text-xs text-slate-400">
            Complete your first season or cup run to populate the Honours Roll.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gameState.trophies.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-navy-950 border border-gold-500/30 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold uppercase text-gold-400">
                    {t.season} &bull; {t.competitionName}
                  </div>
                  <div className="text-sm font-black text-white">Winner: {t.winnerClubName}</div>
                  <div className="text-xs text-slate-400">Runner-up: {t.runnerUpClubName}</div>
                </div>
                <Trophy className="w-8 h-8 text-gold-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-pitch-400">
          Past Season Summaries ({gameState.seasonHistory.length})
        </h3>
        {gameState.seasonHistory.length === 0 ? (
          <p className="text-xs text-slate-400">No completed seasons archived yet.</p>
        ) : (
          <div className="space-y-2">
            {gameState.seasonHistory.map((s) => (
              <div
                key={s.season}
                className="p-4 rounded-xl bg-navy-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="font-black text-white text-sm">
                    Season {s.season} &bull; {s.clubName} (Div {s.division})
                  </div>
                  <div className="text-slate-400">
                    Finished #{s.finalPosition} &bull; {s.won}W-{s.drawn}D-{s.lost}L &bull; {s.points} pts
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gold-400 font-bold">
                    Top Scorer: {s.topScorerName} ({s.topScorerGoals} goals)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsScreen() {
  const { gameState, saveSlots, saveToSlot, loadFromSlot, importSaveJson } = useGameStore();
  const [audio, setAudio] = useState(soundManager.getSettings());
  const [importText, setImportText] = useState('');

  if (!gameState) return null;

  const handleExport = () => {
    const json = defaultSaveRepository.exportJson(gameState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ufm-save-${gameState.currentSeason}-w${gameState.currentWeek}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const manualSlots: SaveSlotId[] = ['slot1', 'slot2', 'slot3'];

  return (
    <div className="space-y-6" data-testid="settings-screen">
      {/* Save Slots */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Save className="w-5 h-5 text-pitch-400" />
          <h2 className="text-lg font-extrabold text-white">
            Save Slots &amp; Backup (IndexedDB + JSON)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {manualSlots.map((slotId) => {
            const existing = saveSlots.find((s) => s.slotId === slotId);
            return (
              <div
                key={slotId}
                className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3"
              >
                <div className="text-xs font-extrabold uppercase text-gold-400">
                  Manual {slotId.toUpperCase()}
                </div>
                {existing ? (
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <div className="font-bold text-white">{existing.clubName}</div>
                    <div>
                      Season {existing.seasonYear} &bull; Week {existing.currentWeek}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Empty Slot</div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    data-testid={`save-${slotId}-btn`}
                    onClick={() => {
                      soundManager.playUiClick();
                      saveToSlot(slotId);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-bold"
                  >
                    Save
                  </button>
                  {existing && (
                    <button
                      type="button"
                      data-testid={`load-${slotId}-btn`}
                      onClick={() => {
                        soundManager.playUiClick();
                        loadFromSlot(slotId);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-bold"
                    >
                      Load
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-pitch-400" />
            <span>Export Career JSON</span>
          </button>
        </div>

        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold text-slate-400">
            Import Career JSON String:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste exported JSON envelope here..."
              className="flex-1 px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white"
            />
            <button
              type="button"
              onClick={() => {
                if (importText.trim()) importSaveJson(importText);
              }}
              className="px-4 py-2 rounded-xl bg-pitch-600 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audio Settings (M5) */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-pitch-400" />
            <h3 className="text-base font-extrabold text-white">Stadium &amp; UI Audio Controls</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              const updated = soundManager.updateSettings({ muted: !audio.muted });
              setAudio(updated);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              audio.muted ? 'bg-red-500/20 text-red-400' : 'bg-pitch-500/20 text-pitch-400'
            }`}
          >
            {audio.muted ? 'Audio Muted' : 'Audio Enabled'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              ['masterVolume', 'Master Volume'],
              ['crowdVolume', 'Crowd Ambience'],
              ['sfxVolume', 'Match Whistle & Kick'],
              ['uiVolume', 'Menu Sounds'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">{label}</span>
                <span className="text-pitch-400">{Math.round(audio[key] * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audio[key]}
                onChange={(e) => {
                  const updated = soundManager.updateSettings({ [key]: Number(e.target.value) });
                  setAudio(updated);
                }}
                className="w-full accent-pitch-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
