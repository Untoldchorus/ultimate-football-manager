import React from 'react';
import {
  Play,
  Trophy,
  Newspaper,
  TrendingUp,
  Users,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import { calculateStandings } from '@/engine/standings';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

export function HomeDashboard() {
  const { gameState, setActiveTab } = useGameStore();
  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const clubMap = new Map(gameState.clubs.map((c) => [c.id, c]));
  const comp = userClub.division === 1 ? 'division1' : 'division2';
  const standings = calculateStandings(gameState.clubs, gameState.fixtures, comp);
  const userRank = standings.findIndex((r) => r.clubId === userClub.id) + 1;

  const nextFixture = gameState.fixtures.find(
    (f) =>
      f.week === gameState.currentWeek &&
      (f.homeClubId === userClub.id || f.awayClubId === userClub.id)
  );
  const opponentClub = nextFixture
    ? clubMap.get(
        nextFixture.homeClubId === userClub.id
          ? nextFixture.awayClubId
          : nextFixture.homeClubId
      )
    : null;

  return (
    <div className="space-y-6" data-testid="home-dashboard">
      {/* Hero Next Matchday Card */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 border border-pitch-500/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pitch-500/20 text-pitch-400 text-xs font-extrabold uppercase tracking-wider">
            <span>Season {gameState.currentSeason} &bull; Week {gameState.currentWeek} of {gameState.maxWeeksPerSeason}</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            {nextFixture && opponentClub
              ? `Next Fixture: ${userClub.name} vs ${opponentClub.name}`
              : `Week ${gameState.currentWeek} Management Hub`}
          </h2>
          <p className="text-xs text-slate-300">
            {nextFixture
              ? `${nextFixture.competition.toUpperCase()} (${nextFixture.roundName}) • Venue: ${
                  nextFixture.homeClubId === userClub.id
                    ? userClub.stadiumName
                    : opponentClub?.stadiumName
                }`
              : 'Prepare your squad, tactics, and training for the upcoming round.'}
          </p>
        </div>

        <button
          type="button"
          data-testid="go-to-matchday-btn"
          onClick={() => {
            soundManager.playUiClick();
            setActiveTab('matchday');
          }}
          className="px-6 py-3.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white font-extrabold uppercase tracking-wider text-sm shadow-lg shadow-pitch-600/30 flex items-center gap-2.5 shrink-0 transition"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Play Matchday</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('competitions')}
          className="cursor-pointer bg-navy-900 hover:bg-navy-800/80 border border-slate-800 rounded-2xl p-4 space-y-1 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>League Position</span>
            <Trophy className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl font-black text-white">
            #{userRank} <span className="text-xs font-semibold text-pitch-400">Div {userClub.division}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Target: Top {gameState.board.targetLeaguePosition}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('squad')}
          className="cursor-pointer bg-navy-900 hover:bg-navy-800/80 border border-slate-800 rounded-2xl p-4 space-y-1 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Active Tactics</span>
            <Users className="w-4 h-4 text-pitch-400" />
          </div>
          <div className="text-2xl font-black text-white">{userClub.tactics.formation}</div>
          <div className="text-[11px] text-slate-400 capitalize">
            {userClub.tactics.attackingStyle} &bull; {userClub.tactics.mentality}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('finances')}
          className="cursor-pointer bg-navy-900 hover:bg-navy-800/80 border border-slate-800 rounded-2xl p-4 space-y-1 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Transfer Budget</span>
            <Landmark className="w-4 h-4 text-pitch-400" />
          </div>
          <div className="text-2xl font-black text-pitch-400">
            £{(userClub.finances.transferBudget / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400">
            Cash: £{(userClub.finances.cashBalance / 1000000).toFixed(2)}M
          </div>
        </div>

        <div
          onClick={() => setActiveTab('myClub')}
          className="cursor-pointer bg-navy-900 hover:bg-navy-800/80 border border-slate-800 rounded-2xl p-4 space-y-1 transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Board Confidence</span>
            <ShieldCheck className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl font-black text-gold-400">{gameState.board.confidence}%</div>
          <div className="text-[11px] text-slate-400">Job Status: Secure</div>
        </div>
      </div>

      {/* Mini Standings & Latest News */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Division {userClub.division} Standings Snapshot</span>
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('competitions')}
              className="text-xs text-pitch-400 hover:underline font-bold"
            >
              Full Table &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Club</th>
                  <th className="py-2 px-2">P</th>
                  <th className="py-2 px-2">GD</th>
                  <th className="py-2 px-2 font-black text-white">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {standings.map((row, idx) => (
                  <tr
                    key={row.clubId}
                    className={
                      row.clubId === userClub.id ? 'bg-pitch-600/20 font-bold text-white' : 'text-slate-300'
                    }
                  >
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2 font-bold text-white">{row.clubName}</td>
                    <td className="py-2 px-2">{row.played}</td>
                    <td className="py-2 px-2">{row.goalDifference}</td>
                    <td className="py-2 px-2 font-black text-gold-400">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-pitch-400 flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            <span>Club &amp; League News Feed</span>
          </h3>
          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {gameState.news.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-navy-950 border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-gold-400 font-bold uppercase">
                  <span>{item.category}</span>
                  <span>
                    S{item.season} &bull; W{item.week}
                  </span>
                </div>
                <div className="text-xs font-bold text-white">{item.title}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
