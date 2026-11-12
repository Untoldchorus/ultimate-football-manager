import React, { useMemo, useState } from 'react';
import {
  Landmark,
  Trophy,
  Calendar,
  History,
  Building2,
  Volume2,
  Download,
  Upload,
  Save,
  Award,
  ShieldCheck,
  Target,
  Sparkles,
  Eye,
} from 'lucide-react';
import { calculateStandings } from '@/engine/standings';
import { CompetitionType, Player } from '@/engine/types';
import { COMPETITIONS_REGISTRY, COUNTRIES_REGISTRY } from '@/data/competitionsRegistry';
import { GLOBAL_CLUBS_REGISTRY } from '@/data/globalClubsRegistry';
import { verifyGlobalDatabaseCompleteness } from '@/engine/completenessVerifier';
import { ASSET_MANIFEST } from '@/data/assetManifest';
import { soundManager } from '@/lib/audio';
import { defaultSaveRepository, SaveSlotId } from '@/services/saveRepository';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest, getPlayerShirtNumber, PlayerAvatar } from '../ui/FootballVisuals';
import { PlayerProfileModal } from '../ui/PlayerProfileModal';

export function MyClubScreen() {
  const { gameState, renewPlayerContract } = useGameStore();
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  if (!gameState) return null;

  const userClub = gameState.clubs.find((c) => c.id === gameState.manager.clubId)!;
  const squad = gameState.players.filter((p) => p.clubId === userClub.id && !p.isYouth);

  return (
    <div className="space-y-6" data-testid="my-club-screen">
      {inspectedPlayer && (
        <PlayerProfileModal
          player={inspectedPlayer}
          club={userClub}
          allPlayers={gameState.players}
          currentSeason={gameState.currentSeason}
          onClose={() => setInspectedPlayer(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <ClubCrest club={userClub} size={64} />
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase text-pitch-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Club Identity &bull; Est. {userClub.foundedYear ?? 1900}</span>
            </div>
            <div className="text-xl font-black text-white">{userClub.name}</div>
            <div className="text-xs text-slate-400">
              {userClub.city ?? 'City'} &bull; {userClub.stadiumName} ({userClub.stadiumCapacity.toLocaleString()} seats)
            </div>
            <div className="text-xs text-gold-400 font-semibold">
              Division {userClub.division} &bull; Reputation {userClub.reputation}/100 &bull; {(userClub.financialStatus ?? 'healthy').toUpperCase()}
            </div>
          </div>
        </div>

        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-bold uppercase text-gold-400">Board Confidence</div>
          <div className="text-2xl font-black text-white">{gameState.board.confidence}%</div>
          <div className="w-full h-2.5 rounded-full bg-navy-950 overflow-hidden">
            <div
              className="h-full bg-pitch-500"
              style={{ width: `${gameState.board.confidence}%` }}
            />
          </div>
          <p className="text-xs text-slate-400">{gameState.board.expectationsText}</p>
        </div>

        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="text-xs font-bold uppercase text-slate-400">Club Heritage &amp; Rivals</div>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {userClub.clubHistory ?? 'Historic professional football club competing at the top level.'}
          </p>
          <div className="text-[11px] text-slate-400 pt-1">
            Real-World Head Coach Reference: <strong className="text-white">{userClub.managerName ?? 'Club Manager'}</strong>
          </div>
        </div>
      </div>

      {/* Contract Renewals Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
          Senior Squad Contracts &amp; Morale Management
        </h3>
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 uppercase">
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3">Pos</th>
                <th className="py-2.5 px-3">OVR</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Morale</th>
                <th className="py-2.5 px-3">Contract Ends</th>
                <th className="py-2.5 px-3">Wage</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {squad.map((p, idx) => (
                <tr key={p.id} className="hover:bg-navy-800/40">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <PlayerAvatar player={p} club={userClub} size={32} />
                      <div>
                        <button
                          type="button"
                          onClick={() => setInspectedPlayer(p)}
                          className="font-bold text-white hover:text-pitch-400"
                        >
                          {p.firstName} {p.lastName}
                        </button>
                        <div className="text-[10px] text-slate-500">
                          #{getPlayerShirtNumber(p, idx)} &bull; {p.nationality}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-pitch-400 font-bold">{p.primaryPosition}</td>
                  <td className="py-2.5 px-3 font-black text-gold-400">{p.overall}</td>
                  <td className="py-2.5 px-3 uppercase text-slate-300">{p.roleExpectation}</td>
                  <td className="py-2.5 px-3 text-slate-300">{p.morale}%</td>
                  <td className="py-2.5 px-3 text-slate-300">{p.contractEndSeason}</td>
                  <td className="py-2.5 px-3 text-white font-semibold">£{p.weeklyWage.toLocaleString()}/wk</td>
                  <td className="py-2.5 px-3 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setInspectedPlayer(p)}
                      className="px-2 py-1 rounded bg-navy-950 border border-slate-700 text-slate-300 text-[11px] font-bold"
                    >
                      Profile
                    </button>
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
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pitch-400" />
          <div>
            <h2 className="text-lg font-extrabold text-white">
              Season {gameState.currentSeason} Fixtures &amp; Results Calendar
            </h2>
            <p className="text-xs text-slate-400">
              Complete schedule of League, Domestic Cup &amp; Continental Champions Cup matches.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOnlyMyClub(!onlyMyClub)}
          className="px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-pitch-400"
        >
          {onlyMyClub ? 'Showing: My Club Only' : 'Showing: All Fixtures'}
        </button>
      </div>

      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 max-h-[540px] overflow-y-auto">
        {list.map((f) => {
          const h = clubMap.get(f.homeClubId);
          const a = clubMap.get(f.awayClubId);
          const isUserMatch =
            f.homeClubId === gameState.manager.clubId || f.awayClubId === gameState.manager.clubId;

          return (
            <div
              key={f.id}
              className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition ${
                isUserMatch
                  ? 'bg-navy-950 border-pitch-500/30 hover:border-pitch-500/60'
                  : 'bg-navy-950/70 border-slate-800'
              }`}
            >
              <div className="text-slate-400 w-40">
                <span className="font-black text-gold-400">WEEK {f.week}</span> &bull;{' '}
                <span className="uppercase font-semibold">{f.competition}</span>
              </div>

              <div className="flex-1 flex items-center justify-center gap-3 font-bold text-white min-w-[260px]">
                <div className="flex-1 flex items-center justify-end gap-2.5 text-right">
                  <span className="truncate">{h?.name}</span>
                  {h && <ClubCrest club={h} size={28} />}
                </div>

                <span
                  className={`px-3.5 py-1.5 rounded-lg font-black min-w-[72px] text-center text-sm ${
                    f.played && f.result
                      ? 'bg-navy-800 text-pitch-400 border border-pitch-500/30'
                      : 'bg-navy-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {f.played && f.result
                    ? `${f.result.homeScore} - ${f.result.awayScore}`
                    : 'VS'}
                </span>

                <div className="flex-1 flex items-center justify-start gap-2.5 text-left">
                  {a && <ClubCrest club={a} size={28} />}
                  <span className="truncate">{a?.name}</span>
                </div>
              </div>

              <div className="w-36 text-right text-slate-400">
                <div className="font-semibold text-slate-300">{f.roundName}</div>
                <div className="text-[10px] text-slate-500 truncate">{h?.stadiumName}</div>
              </div>
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
  const [selectedRegistryCompId, setSelectedRegistryCompId] = useState<string>('ALL');
  const [selectedGlobalClubId, setSelectedGlobalClubId] = useState<string | null>(null);
  const [showCompletenessTable, setShowCompletenessTable] = useState<boolean>(false);
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  const completenessReport = useMemo(() => verifyGlobalDatabaseCompleteness(), []);

  const clubMap = useMemo(
    () => new Map((gameState?.clubs ?? []).map((c) => [c.id, c])),
    [gameState?.clubs]
  );

  if (!gameState) return null;

  const selectedRegistryComp = COMPETITIONS_REGISTRY.find((c) => c.id === selectedRegistryCompId);
  const globalDivisionClubs =
    selectedRegistryComp && selectedRegistryComp.populatedStatus === 'populated'
      ? GLOBAL_CLUBS_REGISTRY.filter((c) => c.leagueId === selectedRegistryComp.id)
      : [];
  const inspectedGlobalClub =
    globalDivisionClubs.find((c) => c.id === selectedGlobalClubId) ?? globalDivisionClubs[0] ?? null;

  const isLeague = comp === 'division1' || comp === 'division2';
  const standings = isLeague
    ? calculateStandings(gameState.clubs, gameState.fixtures, comp)
    : [];
  const cupFixtures = !isLeague
    ? gameState.fixtures.filter((f) => f.competition === comp)
    : [];

  // Competition Player Leaderboards
  const targetDivision = comp === 'division2' ? 2 : 1;
  const divisionClubIds = new Set(
    gameState.clubs
      .filter((c) => (isLeague ? c.division === targetDivision : true))
      .map((c) => c.id)
  );
  const compPlayers = gameState.players.filter(
    (p) => !p.isYouth && divisionClubIds.has(p.clubId)
  );

  const topScorers = [...compPlayers]
    .sort((a, b) => b.stats.goals - a.stats.goals || b.overall - a.overall)
    .slice(0, 5);

  const topAssists = [...compPlayers]
    .sort((a, b) => b.stats.assists - a.stats.assists || b.attributes.passing - a.attributes.passing)
    .slice(0, 5);

  const topCleanSheets = [...compPlayers]
    .filter((p) => p.primaryPosition === 'GK')
    .sort((a, b) => b.stats.cleanSheets - a.stats.cleanSheets || b.overall - a.overall)
    .slice(0, 5);

  const topRated = [...compPlayers]
    .sort((a, b) => b.stats.averageRating - a.stats.averageRating || b.overall - a.overall)
    .slice(0, 5);

  return (
    <div className="space-y-6" data-testid="competitions-screen">
      {inspectedPlayer && (
        <PlayerProfileModal
          player={inspectedPlayer}
          club={clubMap.get(inspectedPlayer.clubId)}
          allPlayers={gameState.players}
          currentSeason={gameState.currentSeason}
          onClose={() => setInspectedPlayer(null)}
        />
      )}

      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold-400" />
          <div>
            <h2 className="text-lg font-extrabold text-white">Competitions, Standings &amp; Awards</h2>
            <p className="text-xs text-slate-400">
              Official league tables, qualification zones, and player statistical leaderboards.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['division1', 'Premier Tier 1'],
              ['division2', 'Championship Tier 2'],
              ['domesticCup', 'Domestic Cup'],
              ['championsCup', 'UEFA Champions League'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setComp(key);
                setSelectedRegistryCompId('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                comp === key && selectedRegistryCompId === 'ALL'
                  ? 'bg-pitch-600 text-white shadow'
                  : 'bg-navy-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}

          <select
            value={selectedRegistryCompId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedRegistryCompId(id);
              if (id === 'division1' || id === 'division2' || id === 'domesticCup' || id === 'championsCup') {
                setComp(id);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-navy-950 border border-slate-700 text-xs font-bold text-gold-400"
          >
            <option value="ALL">Browse All {COMPETITIONS_REGISTRY.length} World Competitions...</option>
            {COMPETITIONS_REGISTRY.map((c) => {
              const country = COUNTRIES_REGISTRY.find((cn) => cn.id === c.countryId);
              return (
                <option key={c.id} value={c.id}>
                  {country?.flagEmoji} {c.name} ({c.populatedStatus === 'populated' ? 'Populated' : 'Unpopulated'})
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={() => setShowCompletenessTable((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-navy-950 border border-pitch-500/40 text-xs font-bold text-pitch-400 hover:bg-navy-800 transition"
          >
            {showCompletenessTable
              ? 'Hide 40-Division Audit'
              : `20-Nation Audit (${completenessReport.completedDivisionsCount}/${completenessReport.totalDivisions} COMPLETE)`}
          </button>
        </div>
      </div>

      {showCompletenessTable && (
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Global 20-Nation / 40-Division Completeness Verification Report
              </h3>
              <p className="text-xs text-slate-400">
                Reference Season: {completenessReport.seasonLabel} ({completenessReport.referenceDate}) &bull;{' '}
                {completenessReport.totalImportedClubs} Real Participating Clubs &bull;{' '}
                {completenessReport.totalImportedPlayers.toLocaleString()} Registered Senior Players
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-pitch-500/20 text-pitch-400 font-black text-xs uppercase">
              Overall Status: {completenessReport.overallStatus}
            </span>
          </div>

          <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950 text-slate-400 uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Division</th>
                  <th className="py-2.5 px-3">Format</th>
                  <th className="py-2.5 px-3">Expected Clubs</th>
                  <th className="py-2.5 px-3">Imported Clubs</th>
                  <th className="py-2.5 px-3">Imported Players</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {completenessReport.divisions.map((d) => (
                  <tr
                    key={d.leagueId}
                    onClick={() => {
                      setSelectedRegistryCompId(d.leagueId);
                      setSelectedGlobalClubId(null);
                    }}
                    className="hover:bg-navy-800/50 cursor-pointer"
                  >
                    <td className="py-2 px-3 font-bold text-white">
                      #{d.worldRank} {d.flagEmoji} {d.countryName}
                    </td>
                    <td className="py-2 px-3 text-slate-300">Tier {d.divisionTier}</td>
                    <td className="py-2 px-3 font-bold text-pitch-400">{d.leagueName}</td>
                    <td className="py-2 px-3 text-slate-400">{d.competitionFormat}</td>
                    <td className="py-2 px-3 text-slate-300">{d.expectedClubs}</td>
                    <td className="py-2 px-3 font-bold text-white">{d.importedClubs}</td>
                    <td className="py-2 px-3 font-bold text-gold-400">{d.importedPlayers}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-pitch-500/20 text-pitch-400 font-black text-[10px] uppercase">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRegistryComp &&
        selectedRegistryComp.populatedStatus === 'populated' &&
        selectedRegistryCompId !== 'ALL' &&
        selectedRegistryCompId !== 'division1' &&
        selectedRegistryCompId !== 'division2' &&
        selectedRegistryCompId !== 'domesticCup' &&
        selectedRegistryCompId !== 'championsCup' && (
          <div className="bg-navy-900 border border-pitch-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-black text-white uppercase">
                  {selectedRegistryComp.name} &mdash; All {globalDivisionClubs.length} Participating Real Clubs &amp; Senior Squads
                </div>
                <p className="text-xs text-slate-400">
                  Tier {selectedRegistryComp.tier} &bull; {selectedRegistryComp.rules.competitionFormat ?? 'Double Round-Robin'} &bull;{' '}
                  {selectedRegistryComp.rules.promotionSpots} Promotion / {selectedRegistryComp.rules.relegationSpots} Relegation Spots &bull;{' '}
                  {(globalDivisionClubs.length * 25).toLocaleString()} Registered Senior Players
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-pitch-500/20 text-pitch-400 font-black uppercase text-[10px]">
                COMPLETE ({globalDivisionClubs.length}/{selectedRegistryComp.rules.expectedClubCount ?? globalDivisionClubs.length} Clubs)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {globalDivisionClubs.map((gc) => {
                  const isSelected = inspectedGlobalClub?.id === gc.id;
                  return (
                    <button
                      key={gc.id}
                      type="button"
                      onClick={() => setSelectedGlobalClubId(gc.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 text-xs transition ${
                        isSelected
                          ? 'bg-navy-800 border-pitch-500'
                          : 'bg-navy-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ClubCrest club={gc} size={28} />
                        <div className="truncate">
                          <div className="font-bold text-white truncate">{gc.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {gc.city} &bull; {gc.stadiumName}
                          </div>
                        </div>
                      </div>
                      <span className="text-gold-400 font-black text-[11px] shrink-0">{gc.reputation}</span>
                    </button>
                  );
                })}
              </div>

              {inspectedGlobalClub && (
                <div className="lg:col-span-7 bg-navy-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-3">
                      <ClubCrest club={inspectedGlobalClub} size={40} />
                      <div>
                        <div className="font-black text-white text-sm">
                          {inspectedGlobalClub.name} ({inspectedGlobalClub.foundedYear})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {inspectedGlobalClub.city} &bull; {inspectedGlobalClub.stadiumName} (
                          {inspectedGlobalClub.stadiumCapacity.toLocaleString()}) &bull; Manager:{' '}
                          <strong className="text-pitch-400">{inspectedGlobalClub.managerName}</strong>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-400 font-black text-xs">
                      {inspectedGlobalClub.squad.length} Senior Players
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-1.5 px-2">#</th>
                          <th className="py-1.5 px-2">Player</th>
                          <th className="py-1.5 px-2">Pos</th>
                          <th className="py-1.5 px-2">Age</th>
                          <th className="py-1.5 px-2">Nationality</th>
                          <th className="py-1.5 px-2">Foot</th>
                          <th className="py-1.5 px-2">OVR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {inspectedGlobalClub.squad.map((tuple, idx) => (
                          <tr key={idx} className="hover:bg-navy-900/60">
                            <td className="py-1 px-2 text-slate-400 font-bold">{tuple[6]}</td>
                            <td className="py-1 px-2 font-bold text-white">
                              {tuple[0]} {tuple[1]}
                            </td>
                            <td className="py-1 px-2 text-pitch-400 font-bold">{tuple[2]}</td>
                            <td className="py-1 px-2 text-slate-300">{tuple[3]}</td>
                            <td className="py-1 px-2 text-slate-300">{tuple[5]}</td>
                            <td className="py-1 px-2 text-slate-400">{tuple[7]}</td>
                            <td className="py-1 px-2 font-black text-gold-400">{tuple[4]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {selectedRegistryComp && selectedRegistryComp.populatedStatus === 'expandable_unpopulated' && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-black text-amber-300 uppercase">
              {selectedRegistryComp.name} — Competition Data Not Yet Populated
            </div>
            <p className="text-slate-300 mt-0.5">
              This real-world competition structure (Tier {selectedRegistryComp.tier},{' '}
              {selectedRegistryComp.rules.promotionSpots} promotion / {selectedRegistryComp.rules.relegationSpots} relegation spots) is registered in the multi-league engine. In accordance with strict database integrity rules, no fictional clubs are invented for unpopulated leagues. You can import real club/player packs via Settings &rarr; Real-World Database Importer.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
            Expandable Schema Ready
          </span>
        </div>
      )}

      {isLeague ? (
        <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
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
                  <th className="py-3 px-4">Recent Form</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {standings.map((row, idx) => {
                  const isUser = row.clubId === gameState.manager.clubId;
                  const club = clubMap.get(row.clubId);
                  const isTopZone = idx < 2;
                  const isBottomZone = idx >= standings.length - 2;

                  return (
                    <tr
                      key={row.clubId}
                      className={
                        isUser
                          ? 'bg-pitch-600/15 font-bold'
                          : 'hover:bg-navy-800/40'
                      }
                    >
                      <td className="py-3 px-4 font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black ${
                            isTopZone
                              ? 'bg-pitch-500/20 text-pitch-400 border border-pitch-500/40'
                              : isBottomZone
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : 'text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          {club && <ClubCrest club={club} size={26} />}
                          <span>{row.clubName}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-400 text-[9px] font-black uppercase">
                              Leader
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{row.played}</td>
                      <td className="py-3 px-3 text-slate-300">{row.won}</td>
                      <td className="py-3 px-3 text-slate-300">{row.drawn}</td>
                      <td className="py-3 px-3 text-slate-300">{row.lost}</td>
                      <td className="py-3 px-3 text-slate-300">{row.goalsFor}</td>
                      <td className="py-3 px-3 text-slate-300">{row.goalsAgainst}</td>
                      <td className="py-3 px-3 text-pitch-400 font-bold">
                        {row.goalDifference >= 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-3 px-4 font-black text-gold-400 text-sm">{row.points}</td>
                      <td className="py-3 px-4 space-x-1">
                        {row.form.length === 0 ? (
                          <span className="text-[10px] text-slate-500">—</span>
                        ) : (
                          row.form.map((res, i) => (
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
                          ))
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-navy-950 border-t border-slate-800 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-pitch-500/30 border border-pitch-500/60 inline-block" />
              <span>
                {comp === 'division1'
                  ? 'Top 2: Continental Champions Cup Qualification'
                  : 'Top 2: Automatic Promotion to Premier Division 1'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/60 inline-block" />
              <span>
                {comp === 'division1'
                  ? 'Bottom 2: Relegation to Championship Division 2'
                  : 'Bottom 2: Division 2 Danger Zone'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          {cupFixtures.map((f) => {
            const h = clubMap.get(f.homeClubId);
            const a = clubMap.get(f.awayClubId);
            return (
              <div
                key={f.id}
                className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <span className="font-bold text-gold-400">{f.roundName} (Week {f.week})</span>
                <div className="flex items-center gap-3 font-bold text-white">
                  {h && <ClubCrest club={h} size={24} />}
                  <span>{h?.name}</span>
                  <strong className="px-2.5 py-1 rounded bg-navy-800 text-pitch-400 mx-1">
                    {f.played && f.result
                      ? `${f.result.homeScore} - ${f.result.awayScore}`
                      : 'VS'}
                  </strong>
                  <span>{a?.name}</span>
                  {a && <ClubCrest club={a} size={24} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Competition Statistics Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Golden Boot / Top Scorers */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gold-400">
            <Target className="w-4 h-4" />
            <span>Top Scorers</span>
          </div>
          <div className="space-y-2">
            {topScorers.map((p, i) => {
              const c = clubMap.get(p.clubId);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setInspectedPlayer(p)}
                  className="w-full p-2 rounded-xl bg-navy-950 border border-slate-800 hover:border-pitch-500/40 flex items-center justify-between text-xs text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black text-slate-500 w-3">{i + 1}</span>
                    <PlayerAvatar player={p} club={c} size={28} />
                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {p.firstName[0]}. {p.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{c?.shortName}</div>
                    </div>
                  </div>
                  <span className="font-black text-gold-400 text-sm">{p.stats.goals}G</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Playmaker / Assist Leaders */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-pitch-400">
            <Sparkles className="w-4 h-4" />
            <span>Assist Leaders</span>
          </div>
          <div className="space-y-2">
            {topAssists.map((p, i) => {
              const c = clubMap.get(p.clubId);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setInspectedPlayer(p)}
                  className="w-full p-2 rounded-xl bg-navy-950 border border-slate-800 hover:border-pitch-500/40 flex items-center justify-between text-xs text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black text-slate-500 w-3">{i + 1}</span>
                    <PlayerAvatar player={p} club={c} size={28} />
                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {p.firstName[0]}. {p.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{c?.shortName}</div>
                    </div>
                  </div>
                  <span className="font-black text-pitch-400 text-sm">{p.stats.assists}A</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Golden Glove / Clean Sheets */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-sky-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Clean Sheets (GK)</span>
          </div>
          <div className="space-y-2">
            {topCleanSheets.map((p, i) => {
              const c = clubMap.get(p.clubId);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setInspectedPlayer(p)}
                  className="w-full p-2 rounded-xl bg-navy-950 border border-slate-800 hover:border-pitch-500/40 flex items-center justify-between text-xs text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black text-slate-500 w-3">{i + 1}</span>
                    <PlayerAvatar player={p} club={c} size={28} />
                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {p.firstName[0]}. {p.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{c?.shortName}</div>
                    </div>
                  </div>
                  <span className="font-black text-sky-400 text-sm">{p.stats.cleanSheets} CS</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Player of the Season / Highest Avg Rating */}
        <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
            <Award className="w-4 h-4" />
            <span>Player Awards (Rating)</span>
          </div>
          <div className="space-y-2">
            {topRated.map((p, i) => {
              const c = clubMap.get(p.clubId);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setInspectedPlayer(p)}
                  className="w-full p-2 rounded-xl bg-navy-950 border border-slate-800 hover:border-pitch-500/40 flex items-center justify-between text-xs text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-black text-slate-500 w-3">{i + 1}</span>
                    <PlayerAvatar player={p} club={c} size={28} />
                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {p.firstName[0]}. {p.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">{c?.shortName} &bull; {p.overall} OVR</div>
                    </div>
                  </div>
                  <span className="font-black text-amber-400 text-sm">
                    {p.stats.averageRating.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
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
  const {
    gameState,
    saveSlots,
    saveToSlot,
    loadFromSlot,
    importSaveJson,
    importCustomDatabaseEntities,
  } = useGameStore();
  const [audio, setAudio] = useState(soundManager.getSettings());
  const [importText, setImportText] = useState('');
  const [dbPackText, setDbPackText] = useState('');
  const [dbImportStatus, setDbImportStatus] = useState<string | null>(null);

  if (!gameState) return null;

  const handleDbPackImport = async () => {
    const raw = dbPackText.trim();
    if (!raw) return;
    try {
      if (raw.startsWith('{') || raw.startsWith('[')) {
        const parsed = JSON.parse(raw);
        const payload = Array.isArray(parsed) ? { players: parsed } : parsed;
        const res = await importCustomDatabaseEntities(payload);
        setDbImportStatus(
          `Database Import Complete: +${res.addedPlayers} added, ${res.updatedPlayers} updated, ${res.duplicatesSkipped} duplicate(s) skipped, ${res.updatedClubs} club(s) updated.`
        );
      } else {
        // Parse CSV format: firstName,lastName,position,age,nationality,overall,clubId
        const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const players = lines
          .filter((l) => !l.toLowerCase().startsWith('firstname,'))
          .map((line) => {
            const [firstName, lastName, primaryPosition, age, nationality, overall, clubId] =
              line.split(',').map((s) => s.trim());
            return {
              firstName,
              lastName,
              primaryPosition: (primaryPosition as Player['primaryPosition']) || 'CM',
              age: Number(age) || 23,
              nationality: nationality || 'England',
              overall: Number(overall) || 75,
              clubId: clubId || gameState.manager.clubId,
            };
          });
        const res = await importCustomDatabaseEntities({ players });
        setDbImportStatus(
          `CSV Import Complete: +${res.addedPlayers} added, ${res.updatedPlayers} updated, ${res.duplicatesSkipped} duplicate(s) skipped.`
        );
      }
      setDbPackText('');
    } catch (err) {
      setDbImportStatus(
        `Validation Error: ${err instanceof Error ? err.message : 'Invalid JSON or CSV syntax'}`
      );
    }
  };

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

      {/* Audio Settings */}
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

      {/* Real-World Database Importer & Validator (JSON / CSV) + Asset Licensing Manifest */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">
              Real-World Database Importer &amp; Validator (JSON / CSV)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Import or update real-world clubs and players with automatic duplicate detection and schema validation.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-pitch-500/20 text-pitch-400 text-[10px] font-bold uppercase">
            {ASSET_MANIFEST.length} Verified Assets in Manifest
          </span>
        </div>

        <textarea
          rows={3}
          value={dbPackText}
          onChange={(e) => setDbPackText(e.target.value)}
          placeholder='Paste JSON ({"players":[{"firstName":"Kylian","lastName":"Mbappé","overall":91}]}) or CSV rows (firstName,lastName,position,age,nationality,overall,clubId)...'
          className="w-full p-3 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white font-mono"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            data-testid="import-db-pack-btn"
            onClick={handleDbPackImport}
            className="px-4 py-2 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Validate &amp; Import Database Pack</span>
          </button>

          {dbImportStatus && (
            <span className="text-xs font-bold text-pitch-400" data-testid="db-import-status">
              {dbImportStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
