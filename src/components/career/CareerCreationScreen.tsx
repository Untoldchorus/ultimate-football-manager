import React, { useMemo, useState } from 'react';
import {
  Shield,
  Trophy,
  Sparkles,
  UserCheck,
  Flame,
  Globe,
  MapPin,
  Landmark,
  Info,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { CLUB_PRESETS } from '@/engine/generator';
import { AttackingStyle, FinancialStatus, ManagerProfile } from '@/engine/types';
import { COMPETITIONS_REGISTRY, COUNTRIES_REGISTRY, getCountryById } from '@/data/competitionsRegistry';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';
import { ClubCrest } from '../ui/FootballVisuals';

export function CareerCreationScreen() {
  const { startNewCareer, saveSlots, loadFromSlot } = useGameStore();
  const [name, setName] = useState('Alex Mercer');
  const [nationality, setNationality] = useState('England');
  const [tacticalStyle, setTacticalStyle] = useState<AttackingStyle>('possession');
  const [difficulty, setDifficulty] = useState<ManagerProfile['difficulty']>('standard');
  const [startingChallenge, setStartingChallenge] = useState<ManagerProfile['startingChallenge']>('none');

  // Multi-Dimensional Real Club Filters
  const [selectedTier, setSelectedTier] = useState<'ALL' | 1 | 2>('ALL');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [leagueFilter, setLeagueFilter] = useState<string>('ALL');
  const [financeFilter, setFinanceFilter] = useState<FinancialStatus | 'ALL'>('ALL');
  const [minRepFilter, setMinRepFilter] = useState<number>(0);
  const [showCompetitionsRegistry, setShowCompetitionsRegistry] = useState<boolean>(false);

  const [selectedClubId, setSelectedClubId] = useState<string>(CLUB_PRESETS[0].id);

  const filteredClubs = useMemo(() => {
    return CLUB_PRESETS.filter((c) => {
      if (selectedTier !== 'ALL' && c.division !== selectedTier) return false;
      if (countryFilter !== 'ALL' && c.countryId !== countryFilter) return false;
      if (leagueFilter !== 'ALL' && c.leagueId !== leagueFilter) return false;
      if (financeFilter !== 'ALL' && c.financialStatus !== financeFilter) return false;
      if (c.reputation < minRepFilter) return false;
      return true;
    });
  }, [selectedTier, countryFilter, leagueFilter, financeFilter, minRepFilter]);

  const activeClub =
    CLUB_PRESETS.find((c) => c.id === selectedClubId) ??
    filteredClubs[0] ??
    CLUB_PRESETS[0];

  const activeCountry = getCountryById(activeClub.countryId);
  const rivalNames = activeClub.rivalClubIds
    .map((id) => CLUB_PRESETS.find((c) => c.id === id)?.name)
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
                Real-World Football Database &bull; Multi-League Career Edition
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCompetitionsRegistry((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-navy-900 hover:bg-navy-800 border border-slate-700 text-xs font-bold text-gold-400 flex items-center gap-1.5 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>
                {showCompetitionsRegistry
                  ? 'Hide World Competitions Directory'
                  : `World Competitions (${COMPETITIONS_REGISTRY.length} Leagues & Cups)`}
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

        {/* Transparent World Competitions Status Drawer (Clearly identifies populated vs unpopulated leagues) */}
        {showCompetitionsRegistry && (
          <div className="bg-navy-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-pitch-400" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                  Real-World Leagues &amp; Competitions Database Status
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                Populated leagues contain real verified squads; Expandable leagues can be populated via the Settings JSON/CSV Importer.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1 text-xs">
              {COMPETITIONS_REGISTRY.map((comp) => {
                const country = getCountryById(comp.countryId);
                const isPopulated = comp.populatedStatus === 'populated';
                return (
                  <div
                    key={comp.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      isPopulated
                        ? 'bg-navy-950 border-pitch-500/30'
                        : 'bg-navy-950/50 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {country.flagEmoji} {comp.shortName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {country.name} &bull; Rep {comp.reputation}
                      </div>
                    </div>
                    {isPopulated ? (
                      <span className="px-2 py-0.5 rounded bg-pitch-500/20 text-pitch-400 font-black text-[9px] uppercase flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold text-[9px] uppercase flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5" /> Unpopulated
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleStart} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                  {['England', 'Spain', 'France', 'Germany', 'Brazil', 'Argentina', 'Netherlands', 'Italy', 'Portugal', 'Nigeria', 'USA', 'Saudi Arabia', 'Japan'].map(
                    (nat) => (
                      <option key={nat} value={nat}>
                        {nat}
                      </option>
                    )
                  )}
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
                  <strong className="text-gold-400 truncate block">{rivalNames || 'Regional'}</strong>
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

          {/* Right column: Real Club Picker with Country, League, Reputation & Finance Filters */}
          <div className="lg:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-gold-400 font-bold uppercase tracking-wider text-xs">
                <Shield className="w-4 h-4" />
                <span>
                  Step 2 &bull; Select Real Club ({filteredClubs.length} of {CLUB_PRESETS.length} Verified Squads)
                </span>
              </div>

              <div className="flex rounded-xl bg-navy-950 p-1 border border-slate-800">
                {(
                  [
                    ['ALL', 'All Tiers'],
                    [1, 'Tier 1 Elite'],
                    [2, 'Tier 2 & Global'],
                  ] as const
                ).map(([tierVal, label]) => (
                  <button
                    key={String(tierVal)}
                    type="button"
                    onClick={() => setSelectedTier(tierVal)}
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

            {/* Filter Bar: Country, League, Financial Strength, Reputation */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <select
                aria-label="Filter by Country"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold"
              >
                <option value="ALL">All Countries</option>
                {COUNTRIES_REGISTRY.filter((c) => c.id !== 'EUR').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flagEmoji} {c.name}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by League"
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold"
              >
                <option value="ALL">All Leagues</option>
                {COMPETITIONS_REGISTRY.filter(
                  (l) => l.type === 'league' && l.populatedStatus === 'populated'
                ).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.shortName}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by Financial Strength"
                value={financeFilter}
                onChange={(e) => setFinanceFilter(e.target.value as FinancialStatus | 'ALL')}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold"
              >
                <option value="ALL">Any Finances</option>
                <option value="Rich">Rich Club</option>
                <option value="Secure">Secure Finances</option>
                <option value="Stable">Stable Finances</option>
              </select>

              <select
                aria-label="Filter by Reputation"
                value={minRepFilter}
                onChange={(e) => setMinRepFilter(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-white font-semibold"
              >
                <option value={0}>Any Reputation</option>
                <option value={90}>World Elite (90+)</option>
                <option value={80}>Continental (80+)</option>
                <option value={70}>Challenger (70+)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
              {filteredClubs.map((club) => {
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
          </div>
        </form>
      </div>
    </div>
  );
}
