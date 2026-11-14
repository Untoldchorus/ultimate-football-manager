import React, { useMemo, useState } from 'react';
import {
  Shield,
  Trophy,
  Sparkles,
  UserCheck,
  Flame,
  Globe,
  MapPin,
  Info,
  CheckCircle2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { CLUB_PRESETS, GLOBAL_CLUB_PRESETS } from '@/engine/generator';
import { verifyGlobalDatabaseCompleteness } from '@/engine/completenessVerifier';
import { AttackingStyle, FinancialStatus, ManagerProfile } from '@/engine/types';
import { COMPETITIONS_REGISTRY, COUNTRIES_REGISTRY, getCountryById } from '@/data/competitionsRegistry';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest } from '../ui/FootballVisuals';

const PAGE_SIZE = 24;
const FLAGSHIP_IDS = new Set(CLUB_PRESETS.map((c) => c.id));

export function CareerCreationScreen() {
  const { startNewCareer, saveSlots, loadFromSlot } = useGameStore();
  const [name, setName] = useState('Alex Mercer');
  const [nationality, setNationality] = useState('England');
  const [tacticalStyle, setTacticalStyle] = useState<AttackingStyle>('possession');
  const [difficulty, setDifficulty] = useState<ManagerProfile['difficulty']>('standard');
  const [startingChallenge, setStartingChallenge] = useState<ManagerProfile['startingChallenge']>('none');
  const [careerType, setCareerType] = useState<'real_club' | 'original_team'>('real_club');
  const [originalClubName, setOriginalClubName] = useState('FC Nova');
  const [originalShortName, setOriginalShortName] = useState('NOV');
  const [originalStadiumName, setOriginalStadiumName] = useState('Nova Arena');
  const [originalPrimaryColor, setOriginalPrimaryColor] = useState('#10b981');
  const [originalSecondaryColor, setOriginalSecondaryColor] = useState('#0f172a');

  // Multi-Dimensional Real Club Filters across all 20 Nations & 40 Divisions
  const [selectedTier, setSelectedTier] = useState<'ALL' | 1 | 2>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [leagueFilter, setLeagueFilter] = useState<string>('ALL');
  const [financeFilter, setFinanceFilter] = useState<FinancialStatus | 'ALL'>('ALL');
  const [minRepFilter, setMinRepFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [showCompetitionsRegistry, setShowCompetitionsRegistry] = useState<boolean>(false);

  const [selectedClubId, setSelectedClubId] = useState<string>(CLUB_PRESETS[0].id);

  const completenessReport = useMemo(() => verifyGlobalDatabaseCompleteness(), []);

  // Order flagship 20 clubs first so Page 1 shows Arsenal, Chelsea (club-harbour), Man City, Real Madrid, etc. immediately,
  // followed by all remaining 713 clubs sorted by reputation descending.
  const orderedGlobalPresets = useMemo(() => {
    const flagships = GLOBAL_CLUB_PRESETS.filter((c) => FLAGSHIP_IDS.has(c.id));
    const others = GLOBAL_CLUB_PRESETS.filter((c) => !FLAGSHIP_IDS.has(c.id)).sort(
      (a, b) => b.reputation - a.reputation
    );
    return [...flagships, ...others];
  }, []);

  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orderedGlobalPresets.filter((c) => {
      if (selectedTier !== 'ALL' && c.division !== selectedTier) return false;
      if (countryFilter !== 'ALL' && c.countryId !== countryFilter) return false;
      if (leagueFilter !== 'ALL' && c.leagueId !== leagueFilter) return false;
      if (financeFilter !== 'ALL' && c.financialStatus !== financeFilter) return false;
      if (c.reputation < minRepFilter) return false;
      if (q) {
        const matchName = c.name.toLowerCase().includes(q);
        const matchShort = c.shortName.toLowerCase().includes(q);
        const matchCity = c.city.toLowerCase().includes(q);
        const matchStadium = c.stadiumName.toLowerCase().includes(q);
        const matchManager = c.managerName.toLowerCase().includes(q);
        if (!matchName && !matchShort && !matchCity && !matchStadium && !matchManager) return false;
      }
      return true;
    });
  }, [orderedGlobalPresets, selectedTier, countryFilter, leagueFilter, financeFilter, minRepFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredClubs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedClubs = useMemo(
    () => filteredClubs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filteredClubs, safePage]
  );

  const activeClub =
    GLOBAL_CLUB_PRESETS.find((c) => c.id === selectedClubId) ??
    filteredClubs[0] ??
    GLOBAL_CLUB_PRESETS[0];

  const activeCountry = getCountryById(activeClub.countryId);
  const rivalNames = activeClub.rivalClubIds
    .map((id) => GLOBAL_CLUB_PRESETS.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playWhistle(false);
    await startNewCareer({
      name: name.trim() || 'Alex Mercer',
      nationality,
      tacticalStyle,
      difficulty,
      startingChallenge,
      clubId: activeClub.id,
      careerType,
      originalClubConfig:
        careerType === 'original_team'
          ? {
              name: originalClubName.trim() || 'FC Nova',
              shortName: (originalShortName.trim() || 'NOV').slice(0, 4).toUpperCase(),
              stadiumName: originalStadiumName.trim() || 'Nova Arena',
              primaryColor: originalPrimaryColor,
              secondaryColor: originalSecondaryColor,
            }
          : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-pitch-600 flex items-center justify-center shadow-lg shadow-pitch-600/30">
              <Trophy className="w-7 h-7 text-gold-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                ULTIMATE FOOTBALL MANAGER
              </h1>
              <p className="text-xs md:text-sm text-pitch-400 font-medium uppercase tracking-widest">
                20-Nation &bull; 40-Division Global Database ({completenessReport.totalImportedClubs} Clubs &bull;{' '}
                {completenessReport.totalImportedPlayers.toLocaleString()} Players)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="toggle-completeness-audit-btn"
              onClick={() => setShowCompetitionsRegistry((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-700 text-xs font-bold text-gold-400 flex items-center gap-1.5 transition"
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {showCompetitionsRegistry
                  ? 'Hide 20-Nation / 40-Division Completeness Report'
                  : `Global 40-Division Audit (${completenessReport.completedDivisionsCount}/${completenessReport.totalDivisions} COMPLETE)`}
              </span>
            </button>

            {saveSlots.map((slot) => (
              <button
                key={slot.slotId}
                type="button"
                onClick={() => {
                  soundManager.playUiClick();
                  loadFromSlot(slot.slotId);
                }}
                className="px-3.5 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 border border-pitch-500/40 text-xs font-semibold text-pitch-400 transition"
              >
                Resume {slot.slotId.toUpperCase()}: {slot.clubName} (S{slot.seasonYear} W{slot.currentWeek})
              </button>
            ))}
          </div>
        </header>

        {/* Live 20-Nation / 40-Division Completeness Verification Table */}
        {showCompetitionsRegistry && (
          <div
            data-testid="global-completeness-drawer"
            className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-pitch-400" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  20-Nation / 40-Division Global Football Database Completeness Report (Ref:{' '}
                  {completenessReport.referenceDate})
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-pitch-500/20 text-pitch-400 font-black">
                  Countries: {completenessReport.totalCountries}/20
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-pitch-500/20 text-pitch-400 font-black">
                  Divisions: {completenessReport.completedDivisionsCount}/{completenessReport.totalDivisions} COMPLETE
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-gold-500/20 text-gold-400 font-black">
                  Clubs: {completenessReport.totalImportedClubs}/{completenessReport.totalExpectedClubs}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 font-black">
                  Senior Players: {completenessReport.totalImportedPlayers.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950 text-slate-400 uppercase sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Rank &amp; Country</th>
                    <th className="py-2.5 px-3">Tier</th>
                    <th className="py-2.5 px-3">Division Name</th>
                    <th className="py-2.5 px-3">Expected Clubs</th>
                    <th className="py-2.5 px-3">Imported Clubs</th>
                    <th className="py-2.5 px-3">Imported Players</th>
                    <th className="py-2.5 px-3">Badges</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {completenessReport.divisions.map((div) => (
                    <tr key={div.leagueId} className="hover:bg-navy-800/40">
                      <td className="py-2 px-3 font-bold text-white">
                        #{div.worldRank} {div.flagEmoji} {div.countryName}
                      </td>
                      <td className="py-2 px-3 text-slate-300">Tier {div.divisionTier}</td>
                      <td className="py-2 px-3 font-bold text-pitch-400">{div.leagueName}</td>
                      <td className="py-2 px-3 text-slate-300">{div.expectedClubs}</td>
                      <td className="py-2 px-3 font-bold text-white">{div.importedClubs}</td>
                      <td className="py-2 px-3 text-gold-400 font-bold">{div.importedPlayers}</td>
                      <td className="py-2 px-3 text-sky-400">{div.clubsWithBadgesCount}/{div.expectedClubs}</td>
                      <td className="py-2 px-3">
                        {div.status === 'COMPLETE' ? (
                          <span className="px-2 py-0.5 rounded bg-pitch-500/20 text-pitch-400 font-black text-[10px] uppercase inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> COMPLETE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> INCOMPLETE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <form onSubmit={handleStart} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Career Mode Selection: Real Club vs Original Team (Club Empire) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Career Mode</h2>
                <p className="text-xs text-slate-400">
                  Permanently bound to this save. Club Empire is exclusive to Original Team Career.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCareerType('real_club')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    careerType === 'real_club'
                      ? 'bg-pitch-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Real Club Career
                </button>
                <button
                  type="button"
                  onClick={() => setCareerType('original_team')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    careerType === 'original_team'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Original Team Career (Club Empire)
                </button>
              </div>
            </div>

            {careerType === 'original_team' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={originalClubName}
                  onChange={(e) => setOriginalClubName(e.target.value)}
                  placeholder="Club Name"
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={originalShortName}
                  maxLength={4}
                  onChange={(e) => setOriginalShortName(e.target.value)}
                  placeholder="Short (e.g. NOV)"
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white uppercase"
                />
                <input
                  type="text"
                  value={originalStadiumName}
                  onChange={(e) => setOriginalStadiumName(e.target.value)}
                  placeholder="Stadium Name"
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white"
                />
                <label className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
                  Primary
                  <input
                    type="color"
                    value={originalPrimaryColor}
                    onChange={(e) => setOriginalPrimaryColor(e.target.value)}
                    className="h-6 w-8 bg-transparent border-0 cursor-pointer"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-300">
                  Secondary
                  <input
                    type="color"
                    value={originalSecondaryColor}
                    onChange={(e) => setOriginalSecondaryColor(e.target.value)}
                    className="h-6 w-8 bg-transparent border-0 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Left column: Manager Profile & Detailed Selected Club Dossier */}
          <div className="lg:col-span-5 bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 text-pitch-400 font-bold uppercase tracking-wider text-xs">
              <UserCheck className="w-4 h-4" />
              <span>Step 1 &bull; Manager Credentials</span>
            </div>

            <div>
              <label htmlFor="manager-name-input" className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                Manager Full Name
              </label>
              <input
                id="manager-name-input"
                data-testid="manager-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-white font-semibold focus:outline-none focus:border-pitch-500"
                placeholder="Enter manager name..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="manager-nationality" className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Nationality
                </label>
                <select
                  id="manager-nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-pitch-500"
                >
                  {[
                    'England',
                    'Spain',
                    'Germany',
                    'Italy',
                    'France',
                    'Portugal',
                    'Netherlands',
                    'Brazil',
                    'Argentina',
                    'Mexico',
                    'USA',
                    'Saudi Arabia',
                    'Turkey',
                    'Belgium',
                    'Scotland',
                    'Austria',
                    'Switzerland',
                    'Denmark',
                    'Japan',
                    'South Korea',
                    'Nigeria',
                  ].map((nat) => (
                    <option key={nat} value={nat}>
                      {nat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tactical-style" className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Coaching Philosophy
                </label>
                <select
                  id="tactical-style"
                  value={tacticalStyle}
                  onChange={(e) => setTacticalStyle(e.target.value as AttackingStyle)}
                  className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-pitch-500"
                >
                  <option value="possession">Control Possession</option>
                  <option value="tikiTaka">Tiki-Taka Fluid</option>
                  <option value="wingPlay">High-Octane Wing Play</option>
                  <option value="directCounter">Direct Counter-Attack</option>
                  <option value="balanced">Pragmatic Balanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="difficulty-select" className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Difficulty
                </label>
                <select
                  id="difficulty-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as ManagerProfile['difficulty'])}
                  className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-pitch-500"
                >
                  <option value="relaxed">Relaxed (+35% Budget)</option>
                  <option value="standard">Standard (Authentic)</option>
                  <option value="hardcore">Hardcore (Strict Board)</option>
                </select>
              </div>

              <div>
                <label htmlFor="challenge-select" className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Starting Challenge
                </label>
                <select
                  id="challenge-select"
                  value={startingChallenge}
                  onChange={(e) =>
                    setStartingChallenge(e.target.value as ManagerProfile['startingChallenge'])
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-pitch-500"
                >
                  <option value="none">Standard Career</option>
                  <option value="financialCrisis">Financial Crisis (-75% Budget)</option>
                  <option value="youthOnly">Youth Development Focus</option>
                  <option value="titleOrBust">Title or Bust (1st Required)</option>
                </select>
              </div>
            </div>

            {/* Selected Real Club Dossier Box */}
            <div className="p-4 rounded-2xl bg-navy-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClubCrest club={activeClub} size={52} />
                  <div>
                    <div className="font-black text-base text-white flex items-center gap-1.5">
                      <span>{activeClub.name}</span>
                      <span className="text-xs text-slate-400 font-bold">({activeClub.foundedYear})</span>
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-pitch-400" />
                      <span>
                        {activeClub.city}, {activeCountry.name} &bull; {activeClub.stadiumName} (
                        {activeClub.stadiumCapacity.toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs font-black">
                  Rep {activeClub.reputation}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                {activeClub.clubHistory}
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Finances</span>
                  <strong className="text-pitch-400">{activeClub.financialStatus}</strong>
                </div>
                <div className="p-2 rounded-lg bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Incumbent</span>
                  <strong className="text-white truncate block">{activeClub.managerName}</strong>
                </div>
                <div className="p-2 rounded-lg bg-navy-900 border border-slate-800">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Rivals</span>
                  <strong className="text-gold-400 truncate block">{rivalNames || 'Regional Derby'}</strong>
                </div>
              </div>
            </div>

            <button
              type="submit"
              data-testid="start-career-btn"
              className="w-full py-3.5 px-6 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white font-extrabold uppercase tracking-wider text-sm shadow-lg shadow-pitch-600/30 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sign Contract with {activeClub.shortName} &amp; Launch Career</span>
            </button>
          </div>

          {/* Right column: Real Club Picker with Country, League, Reputation, Search & Pagination */}
          <div className="lg:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-gold-400 font-bold uppercase tracking-wider text-xs">
                <Shield className="w-4 h-4" />
                <span>
                  Step 2 &bull; Select Real Club ({filteredClubs.length} of {GLOBAL_CLUB_PRESETS.length} Global Clubs)
                </span>
              </div>

              <div className="flex rounded-xl bg-navy-950 p-1 border border-slate-800">
                {(
                  [
                    ['ALL', 'All Tiers'],
                    [1, '1st Division (T1)'],
                    [2, '2nd Division (T2)'],
                  ] as const
                ).map(([tierVal, label]) => (
                  <button
                    key={String(tierVal)}
                    type="button"
                    onClick={() => {
                      setSelectedTier(tierVal);
                      setPage(0);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      selectedTier === tierVal
                        ? 'bg-pitch-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search + Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              <div className="relative sm:col-span-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  aria-label="Search clubs"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search club/city..."
                  className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold focus:outline-none focus:border-pitch-500"
                />
              </div>

              <select
                aria-label="Filter by Country"
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setLeagueFilter('ALL');
                  setPage(0);
                }}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold"
              >
                <option value="ALL">All 20 Nations</option>
                {COUNTRIES_REGISTRY.filter((c) => c.id !== 'EUR').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by League"
                value={leagueFilter}
                onChange={(e) => {
                  setLeagueFilter(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold"
              >
                <option value="ALL">All 40 Divisions</option>
                {COMPETITIONS_REGISTRY.filter(
                  (l) =>
                    l.type === 'league' &&
                    l.populatedStatus === 'populated' &&
                    (countryFilter === 'ALL' || l.countryId === countryFilter)
                ).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.shortName} (T{l.tier})
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by Financial Strength"
                value={financeFilter}
                onChange={(e) => {
                  setFinanceFilter(e.target.value as FinancialStatus | 'ALL');
                  setPage(0);
                }}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold"
              >
                <option value="ALL">Any Finances</option>
                <option value="Rich">Rich Club</option>
                <option value="Secure">Secure Finances</option>
                <option value="Stable">Stable Finances</option>
                <option value="Tight">Tight Budget</option>
              </select>

              <select
                aria-label="Filter by Reputation"
                value={minRepFilter}
                onChange={(e) => {
                  setMinRepFilter(Number(e.target.value));
                  setPage(0);
                }}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold"
              >
                <option value={0}>Any Reputation</option>
                <option value={90}>World Elite (90+)</option>
                <option value={80}>Continental (80+)</option>
                <option value={70}>Challenger (70+)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {paginatedClubs.map((club) => {
                const isSelected = club.id === activeClub.id;
                const country = getCountryById(club.countryId);
                return (
                  <button
                    key={club.id}
                    type="button"
                    data-testid={`club-card-${club.id}`}
                    onClick={() => {
                      soundManager.playUiClick();
                      setSelectedClubId(club.id);
                    }}
                    className={`text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-navy-800 border-pitch-500 ring-2 ring-pitch-500/30'
                        : 'bg-navy-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ClubCrest club={club} size={46} />
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-white truncate flex items-center gap-1.5">
                          <span>{club.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {country.flagEmoji} {club.city} &bull; {club.stadiumName}
                        </div>
                        <div className="text-[11px] text-pitch-400 font-semibold mt-0.5 flex items-center gap-2">
                          <span>T{club.division}</span>
                          <span>&bull;</span>
                          <span>{club.defaultFormation}</span>
                          <span>&bull;</span>
                          <span>{(club.stadiumCapacity / 1000).toFixed(1)}k cap</span>
                          <span>&bull;</span>
                          <span className="text-sky-400">{club.financialStatus}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-gold-400 font-bold text-xs">
                        <Flame className="w-3 h-3" />
                        {club.reputation}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold mt-1">
                        Est. {club.foundedYear}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Showing {filteredClubs.length === 0 ? 0 : safePage * PAGE_SIZE + 1}&ndash;
                {Math.min(filteredClubs.length, (safePage + 1) * PAGE_SIZE)} of {filteredClubs.length} clubs
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-2.5 py-1 rounded-lg bg-navy-950 border border-slate-800 disabled:opacity-40 text-white font-bold flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="font-bold text-white">
                  Page {safePage + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="px-2.5 py-1 rounded-lg bg-navy-950 border border-slate-800 disabled:opacity-40 text-white font-bold flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
