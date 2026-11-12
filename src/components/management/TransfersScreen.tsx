import React, { useMemo, useState } from 'react';
import {
  Search,
  Star,
  HandCoins,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileSignature,
  Sparkles,
  Newspaper,
  Eye,
} from 'lucide-react';
import { hashStringToSeed } from '@/engine/rng';
import { evaluateTransferOffer } from '@/engine/transfers';
import { Player, PositionCode } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest, getPlayerShirtNumber, PlayerAvatar } from '../ui/FootballVisuals';
import { PlayerProfileModal } from '../ui/PlayerProfileModal';

const POSITIONS: (PositionCode | 'ALL')[] = ['ALL', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

export function TransfersScreen() {
  const { gameState, toggleShortlist, completeTransfer } = useGameStore();
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<PositionCode | 'ALL'>('ALL');
  const [maxAge, setMaxAge] = useState<number>(36);
  const [minOvr, setMinOvr] = useState<number>(50);
  const [maxValueMillions, setMaxValueMillions] = useState<number>(80);
  const [nationalityFilter, setNationalityFilter] = useState<string>('ALL');
  const [onlyShortlist, setOnlyShortlist] = useState(false);
  const [page, setPage] = useState(1);

  const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [offeredFee, setOfferedFee] = useState<number>(0);
  const [offeredWage, setOfferedWage] = useState<number>(0);
  const [contractDurationYears, setContractDurationYears] = useState<number>(3);
  const [isLoanOffer, setIsLoanOffer] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ accepted: boolean; text: string } | null>(null);

  const userClub = gameState?.clubs.find((c) => c.id === gameState.manager.clubId);
  const clubMap = useMemo(
    () => new Map((gameState?.clubs ?? []).map((c) => [c.id, c])),
    [gameState?.clubs]
  );

  const scoutingMap = useMemo(() => {
    const map = new Map<string, { estimatedOverall: number; estimatedPotential: number; note: string }>();
    for (const r of gameState?.scoutingReports ?? []) {
      map.set(r.playerId, {
        estimatedOverall: r.estimatedOverallMax,
        estimatedPotential: r.estimatedPotentialMax,
        note: r.notes,
      });
    }
    return map;
  }, [gameState?.scoutingReports]);

  const filteredPlayers = useMemo(() => {
    if (!gameState || !userClub) return [];
    return gameState.players
      .filter((p) => !p.isYouth && p.clubId !== userClub.id)
      .filter((p) => {
        if (onlyShortlist && !gameState.shortlistPlayerIds.includes(p.id)) return false;
        if (posFilter !== 'ALL' && p.primaryPosition !== posFilter) return false;
        if (p.age > maxAge) return false;
        if (p.overall < minOvr) return false;
        if (p.marketValue > maxValueMillions * 1000000) return false;
        if (nationalityFilter !== 'ALL' && p.nationality !== nationalityFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const full = `${p.firstName} ${p.lastName}`.toLowerCase();
          if (!full.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [gameState, userClub, onlyShortlist, posFilter, maxAge, minOvr, maxValueMillions, nationalityFilter, search]);

  if (!gameState || !userClub) return null;

  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / pageSize));
  const pageItems = filteredPlayers.slice((page - 1) * pageSize, page * pageSize);

  const getInterestedClubs = (player: Player) => {
    const seed = hashStringToSeed(`${player.id}_${gameState.currentSeason}`);
    const count = player.overall >= 80 ? 2 : player.overall >= 73 ? 1 : seed % 3 === 0 ? 1 : 0;
    if (count === 0) return [];
    const candidates = gameState.clubs.filter(
      (c) => c.id !== player.clubId && c.id !== userClub.id
    );
    const result = [];
    for (let i = 0; i < count && i < candidates.length; i++) {
      const idx = (seed + i * 7) % candidates.length;
      result.push(candidates[idx]);
    }
    return result;
  };

  const openNegotiation = (p: Player, loan = false) => {
    soundManager.playUiClick();
    setNegotiatingPlayer(p);
    setIsLoanOffer(loan);
    setOfferedFee(loan ? 0 : p.marketValue);
    setOfferedWage(Math.round(p.weeklyWage * 1.1));
    setContractDurationYears(loan ? 1 : 3);
    setFeedback(null);
  };

  const handleSubmitOffer = async () => {
    if (!negotiatingPlayer) return;
    soundManager.playUiClick();
    const sellingClub = clubMap.get(negotiatingPlayer.clubId)!;

    if (!isLoanOffer && offeredFee > userClub.finances.transferBudget) {
      setFeedback({
        accepted: false,
        text: `Insufficient transfer budget (£${userClub.finances.transferBudget.toLocaleString()} available).`,
      });
      return;
    }

    const res = evaluateTransferOffer(
      negotiatingPlayer,
      sellingClub,
      userClub,
      offeredFee,
      offeredWage,
      isLoanOffer
    );

    if (res.accepted) {
      await completeTransfer(
        negotiatingPlayer.id,
        userClub.id,
        isLoanOffer ? 0 : offeredFee,
        offeredWage,
        isLoanOffer
      );
      setFeedback({ accepted: true, text: res.reason });
      setNegotiatingPlayer(null);
    } else {
      if (res.counterFee) setOfferedFee(res.counterFee);
      setOfferedWage(res.requiredWage);
      setFeedback({ accepted: false, text: res.reason });
    }
  };

  return (
    <div className="space-y-6" data-testid="transfers-screen">
      {inspectedPlayer && (
        <PlayerProfileModal
          player={inspectedPlayer}
          club={clubMap.get(inspectedPlayer.clubId)}
          allPlayers={gameState.players}
          currentSeason={gameState.currentSeason}
          onClose={() => setInspectedPlayer(null)}
        />
      )}

      {/* Header & Budget Bar */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <h2 className="text-lg font-extrabold text-white">Global Transfer Market &amp; Scouting Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Search {filteredPlayers.length} senior professionals across Premier Division 1 &amp; Championship Division 2.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-800">
            <span className="text-slate-400 mr-2">Transfer Budget:</span>
            <strong className="text-pitch-400 text-sm">
              £{userClub.finances.transferBudget.toLocaleString()}
            </strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-800">
            <span className="text-slate-400 mr-2">Wage Budget:</span>
            <strong className="text-gold-400 text-sm">
              £{userClub.finances.currentWageBillWeekly.toLocaleString()} / £
              {userClub.finances.wageBudgetWeekly.toLocaleString()} wk
            </strong>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search player name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white"
          />
        </div>

        <select
          value={posFilter}
          onChange={(e) => {
            setPosFilter(e.target.value as PositionCode | 'ALL');
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white font-bold"
        >
          {POSITIONS.map((pos) => (
            <option key={pos} value={pos}>
              Position: {pos}
            </option>
          ))}
        </select>

        <select
          value={minOvr}
          onChange={(e) => {
            setMinOvr(Number(e.target.value));
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white"
        >
          <option value={50}>Min OVR: 50+</option>
          <option value={65}>Min OVR: 65+</option>
          <option value={72}>Min OVR: 72+</option>
          <option value={78}>Min OVR: 78+</option>
          <option value={82}>Min OVR: 82+</option>
        </select>

        <select
          value={maxAge}
          onChange={(e) => {
            setMaxAge(Number(e.target.value));
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white"
        >
          <option value={36}>Max Age: All</option>
          <option value={21}>U-21 Wonderkids</option>
          <option value={25}>Max Age: 25</option>
          <option value={29}>Max Age: 29</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setOnlyShortlist(!onlyShortlist);
            setPage(1);
          }}
          className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
            onlyShortlist
              ? 'bg-gold-500/20 border-gold-400 text-gold-400'
              : 'bg-navy-950 border-slate-700 text-slate-300'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Shortlist ({gameState.shortlistPlayerIds.length})</span>
        </button>
      </div>

      {/* Immersive Negotiation Room Modal / Drawer */}
      {negotiatingPlayer && (
        <div className="bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 border-2 border-pitch-500 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <PlayerAvatar
                player={negotiatingPlayer}
                club={clubMap.get(negotiatingPlayer.clubId)}
                size={64}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-pitch-500/20 border border-pitch-500/40 text-[10px] font-black uppercase text-pitch-400">
                    {isLoanOffer ? 'Season-Long Loan Approach' : 'Formal Transfer & Contract Negotiation'}
                  </span>
                  <span className="text-xs text-gold-400 font-bold">
                    #{getPlayerShirtNumber(negotiatingPlayer)} &bull; {negotiatingPlayer.primaryPosition}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  {negotiatingPlayer.firstName} {negotiatingPlayer.lastName}{' '}
                  <span className="text-gold-400">({negotiatingPlayer.overall} OVR)</span>
                </h3>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                  <span>Current Club: {clubMap.get(negotiatingPlayer.clubId)?.name}</span>
                  <span>&bull;</span>
                  <span>Contract Until: {negotiatingPlayer.contractEndSeason}</span>
                  <span>&bull;</span>
                  <span>Potential: {negotiatingPlayer.potential} POT</span>
                  {negotiatingPlayer.releaseClause && (
                    <>
                      <span>&bull;</span>
                      <span className="text-pitch-400 font-bold">
                        Release Clause: £{(negotiatingPlayer.releaseClause / 1000000).toFixed(2)}M
                      </span>
                    </>
                  )}
                  <span>&bull;</span>
                  <span className="text-gold-400 font-bold">
                    Agent Fee: {negotiatingPlayer.agentFeePct ?? 8}%
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNegotiatingPlayer(null)}
              className="px-3 py-1.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-xs font-bold text-slate-300"
            >
              Exit Negotiation Room
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!isLoanOffer && (
              <div className="p-3.5 rounded-xl bg-navy-950/90 border border-slate-800">
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Transfer Fee Offer (£) — Est. Value: £{negotiatingPlayer.marketValue.toLocaleString()}
                </label>
                <input
                  type="number"
                  step={50000}
                  value={offeredFee}
                  onChange={(e) => setOfferedFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-navy-900 border border-slate-700 text-sm font-black text-pitch-400"
                />
              </div>
            )}
            <div className="p-3.5 rounded-xl bg-navy-950/90 border border-slate-800">
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                Weekly Wage Offer (£/wk) — Current: £{negotiatingPlayer.weeklyWage.toLocaleString()}/wk
              </label>
              <input
                type="number"
                step={250}
                value={offeredWage}
                onChange={(e) => setOfferedWage(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-navy-900 border border-slate-700 text-sm font-black text-gold-400"
              />
            </div>
            <div className="p-3.5 rounded-xl bg-navy-950/90 border border-slate-800">
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                Proposed Contract Length
              </label>
              <select
                value={contractDurationYears}
                onChange={(e) => setContractDurationYears(Number(e.target.value))}
                disabled={isLoanOffer}
                className="w-full px-3.5 py-2 rounded-xl bg-navy-900 border border-slate-700 text-sm font-bold text-white"
              >
                {isLoanOffer ? (
                  <option value={1}>1 Season Loan Deal</option>
                ) : (
                  <>
                    <option value={2}>2 Years (Until {gameState.currentSeason + 2})</option>
                    <option value={3}>3 Years (Until {gameState.currentSeason + 3})</option>
                    <option value={4}>4 Years (Until {gameState.currentSeason + 4})</option>
                    <option value={5}>5 Years (Until {gameState.currentSeason + 5})</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                feedback.accepted
                  ? 'bg-pitch-500/20 text-pitch-400 border border-pitch-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {feedback.accepted ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-pitch-400" />
              <span>
                Agent expects ~£{Math.round(negotiatingPlayer.weeklyWage * 1.12).toLocaleString()}/wk and squad role{' '}
                <strong className="text-white uppercase">{negotiatingPlayer.roleExpectation}</strong>.
              </span>
            </div>
            <button
              type="button"
              data-testid="submit-transfer-offer-btn"
              onClick={handleSubmitOffer}
              className="px-6 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pitch-600/30"
            >
              <HandCoins className="w-4 h-4" />
              <span>Submit Formal Offer</span>
            </button>
          </div>
        </div>
      )}

      {/* Player Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy-950 text-slate-400 uppercase border-b border-slate-800 text-[11px]">
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-3">Pos</th>
                <th className="py-3.5 px-3">Age</th>
                <th className="py-3.5 px-3">Club</th>
                <th className="py-3.5 px-3">OVR / Scout</th>
                <th className="py-3.5 px-3">POT</th>
                <th className="py-3.5 px-3">Value &amp; Wage</th>
                <th className="py-3.5 px-3">Contract</th>
                <th className="py-3.5 px-3">Interest</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {pageItems.map((p, idx) => {
                const club = clubMap.get(p.clubId);
                const shortlisted = gameState.shortlistPlayerIds.includes(p.id);
                const scoutReport = scoutingMap.get(p.id);
                const interested = getInterestedClubs(p);
                const shirtNo = getPlayerShirtNumber(p, idx);

                return (
                  <tr key={p.id} className="hover:bg-navy-800/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar player={p} club={club} size={38} />
                        <div>
                          <button
                            type="button"
                            onClick={() => setInspectedPlayer(p)}
                            className="font-extrabold text-white hover:text-pitch-400 text-left flex items-center gap-1.5"
                          >
                            <span>
                              {p.firstName} {p.lastName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">#{shirtNo}</span>
                          </button>
                          <div className="text-[10px] text-slate-400">
                            {p.nationality} &bull; Morale {p.morale}%
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-pitch-400 font-bold">
                        {p.primaryPosition}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">{p.age}</td>
                    <td className="py-3 px-3">
                      {club ? (
                        <div className="flex items-center gap-2">
                          <ClubCrest club={club} size={24} />
                          <span className="text-slate-200 font-semibold">{club.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Free Agent</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-gold-400 text-sm">{p.overall}</span>
                        {scoutReport && (
                          <span
                            title={scoutReport.note}
                            className="px-1.5 py-0.5 rounded bg-pitch-500/20 border border-pitch-500/40 text-[9px] font-bold text-pitch-400 flex items-center gap-0.5"
                          >
                            <Compass className="w-2.5 h-2.5" />
                            Scouted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-pitch-400">{p.potential}</td>
                    <td className="py-3 px-3">
                      <div className="text-white font-bold">
                        £{(p.marketValue / 1000000).toFixed(2)}M
                      </div>
                      <div className="text-[10px] text-slate-400">
                        £{p.weeklyWage.toLocaleString()}/wk
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-navy-950 border border-slate-800 text-[10px] font-semibold">
                        Until {p.contractEndSeason}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {interested.length === 0 ? (
                        <span className="text-[10px] text-slate-500">None</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          {interested.map((ic) => (
                            <span
                              key={ic.id}
                              title={`Interested: ${ic.name}`}
                              className="px-1.5 py-0.5 rounded text-[9px] font-black border border-white/10"
                              style={{
                                backgroundColor: ic.primaryColor,
                                color: ic.secondaryColor,
                              }}
                            >
                              {ic.shortName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectedPlayer(p)}
                        title="Player Profile & Radar"
                        className="px-2 py-1 rounded bg-navy-950 hover:bg-navy-800 border border-slate-700 text-slate-300 text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-pitch-400" />
                        <span>Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleShortlist(p.id)}
                        className={`px-2 py-1 rounded border text-[11px] font-bold ${
                          shortlisted
                            ? 'bg-gold-500/20 border-gold-400 text-gold-400'
                            : 'bg-navy-950 border-slate-700 text-slate-400'
                        }`}
                      >
                        ★
                      </button>
                      <button
                        type="button"
                        onClick={() => openNegotiation(p, false)}
                        className="px-2.5 py-1 rounded bg-pitch-600 hover:bg-pitch-500 text-white text-[11px] font-bold"
                      >
                        Buy
                      </button>
                      {p.age <= 22 && (
                        <button
                          type="button"
                          onClick={() => openNegotiation(p, true)}
                          className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 border border-slate-600 text-slate-200 text-[11px] font-bold"
                        >
                          Loan
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-navy-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Page {page} of {totalPages} ({filteredPlayers.length} results)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded bg-navy-800 disabled:opacity-40 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded bg-navy-800 disabled:opacity-40 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Completed Transfer History & Market News */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-gold-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Completed Transfer Deals &amp; Offer History ({gameState.transfers.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Season {gameState.currentSeason} Window</span>
        </div>

        {gameState.transfers.length === 0 ? (
          <p className="text-xs text-slate-400">
            No completed transfers recorded yet this season. Submit a formal offer above or advance weeks to see AI club activity.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
            {gameState.transfers.slice(0, 12).map((deal) => {
              const fromClub = clubMap.get(deal.fromClubId);
              const toClub = clubMap.get(deal.toClubId);
              return (
                <div
                  key={deal.id}
                  className="p-3 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-extrabold text-white">{deal.playerName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {fromClub?.shortName ?? 'CLB'} &rarr; {toClub?.shortName ?? 'CLB'} &bull; S{deal.season} W{deal.week}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-pitch-500/20 text-pitch-400 font-black text-[11px]">
                      {deal.isLoan ? 'LOAN' : `£${(deal.fee / 1000000).toFixed(2)}M`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
