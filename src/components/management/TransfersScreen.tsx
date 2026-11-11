import React, { useMemo, useState } from 'react';
import { Search, Star, HandCoins, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { evaluateTransferOffer } from '@/engine/transfers';
import { Player, PositionCode } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

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
  const [offeredFee, setOfferedFee] = useState<number>(0);
  const [offeredWage, setOfferedWage] = useState<number>(0);
  const [isLoanOffer, setIsLoanOffer] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ accepted: boolean; text: string } | null>(null);

  const userClub = gameState?.clubs.find((c) => c.id === gameState.manager.clubId);
  const clubMap = useMemo(
    () => new Map((gameState?.clubs ?? []).map((c) => [c.id, c])),
    [gameState?.clubs]
  );

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

  const openNegotiation = (p: Player, loan = false) => {
    soundManager.playUiClick();
    setNegotiatingPlayer(p);
    setIsLoanOffer(loan);
    setOfferedFee(loan ? 0 : p.marketValue);
    setOfferedWage(Math.round(p.weeklyWage * 1.1));
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
      {/* Header & Budget Bar */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white">Global Transfer Market &amp; Shortlist</h2>
          <p className="text-xs text-slate-400">
            Search {filteredPlayers.length} players across Division 1 &amp; Division 2.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
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

      {/* Negotiation Modal / Drawer */}
      {negotiatingPlayer && (
        <div className="bg-navy-900 border-2 border-pitch-500 rounded-2xl p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-pitch-400">
                {isLoanOffer ? 'Loan Approach' : 'Transfer & Contract Negotiation'}
              </span>
              <h3 className="text-base font-extrabold text-white">
                {negotiatingPlayer.firstName} {negotiatingPlayer.lastName} ({negotiatingPlayer.overall} OVR{' '}
                {negotiatingPlayer.primaryPosition}) &bull; {clubMap.get(negotiatingPlayer.clubId)?.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setNegotiatingPlayer(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!isLoanOffer && (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Transfer Fee Offer (£) — Valuation: £{negotiatingPlayer.marketValue.toLocaleString()}
                </label>
                <input
                  type="number"
                  step={50000}
                  value={offeredFee}
                  onChange={(e) => setOfferedFee(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-700 text-sm font-bold text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Weekly Wage Offer (£/wk) — Current: £{negotiatingPlayer.weeklyWage.toLocaleString()}/wk
              </label>
              <input
                type="number"
                step={250}
                value={offeredWage}
                onChange={(e) => setOfferedWage(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-700 text-sm font-bold text-white"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                feedback.accepted
                  ? 'bg-pitch-500/20 text-pitch-400 border border-pitch-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {feedback.accepted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="submit-transfer-offer-btn"
              onClick={handleSubmitOffer}
              className="px-5 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-extrabold flex items-center gap-2"
            >
              <HandCoins className="w-4 h-4" />
              <span>Submit Formal Offer</span>
            </button>
          </div>
        </div>
      )}

      {/* Player Table */}
      <div className="bg-navy-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-navy-950 text-slate-400 uppercase border-b border-slate-800">
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-3">Pos</th>
                <th className="py-3 px-3">Age</th>
                <th className="py-3 px-3">Club</th>
                <th className="py-3 px-3">OVR</th>
                <th className="py-3 px-3">POT</th>
                <th className="py-3 px-3">Value</th>
                <th className="py-3 px-3">Wage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {pageItems.map((p) => {
                const club = clubMap.get(p.clubId);
                const shortlisted = gameState.shortlistPlayerIds.includes(p.id);
                return (
                  <tr key={p.id} className="hover:bg-navy-800/60 transition">
                    <td className="py-3 px-4 font-bold text-white">
                      {p.firstName} {p.lastName}
                      <div className="text-[10px] text-slate-400 font-normal">{p.nationality}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-pitch-400 font-bold">
                        {p.primaryPosition}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{p.age}</td>
                    <td className="py-3 px-3 text-slate-300">{club?.name ?? 'Free Agent'}</td>
                    <td className="py-3 px-3 font-black text-gold-400 text-sm">{p.overall}</td>
                    <td className="py-3 px-3 font-bold text-pitch-400">{p.potential}</td>
                    <td className="py-3 px-3 text-white font-semibold">
                      £{(p.marketValue / 1000000).toFixed(2)}M
                    </td>
                    <td className="py-3 px-3 text-slate-300">£{p.weeklyWage.toLocaleString()}/wk</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
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
    </div>
  );
}
