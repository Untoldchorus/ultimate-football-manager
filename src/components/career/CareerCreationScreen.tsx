import React, { useState } from 'react';
import { Shield, Trophy, Sparkles, UserCheck, Flame } from 'lucide-react';
import { CLUB_PRESETS } from '@/engine/generator';
import { AttackingStyle, ManagerProfile } from '@/engine/types';
import { soundManager } from '@/lib/audio';
import { useGameStore } from '@/store/useGameStore';

export function CareerCreationScreen() {
  const { startNewCareer, saveSlots, loadFromSlot } = useGameStore();
  const [name, setName] = useState('Alex Mercer');
  const [nationality, setNationality] = useState('England');
  const [tacticalStyle, setTacticalStyle] = useState<AttackingStyle>('possession');
  const [difficulty, setDifficulty] = useState<ManagerProfile['difficulty']>('standard');
  const [startingChallenge, setStartingChallenge] = useState<ManagerProfile['startingChallenge']>('none');
  const [selectedDivision, setSelectedDivision] = useState<1 | 2>(1);
  const [selectedClubId, setSelectedClubId] = useState<string>(CLUB_PRESETS[0].id);

  const divisionClubs = CLUB_PRESETS.filter((c) => c.division === selectedDivision);
  const activeClub = CLUB_PRESETS.find((c) => c.id === selectedClubId) ?? CLUB_PRESETS[0];

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
      <div className="max-w-6xl w-full mx-auto space-y-6">
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
                Tactical Football Simulation &bull; Career Edition
              </p>
            </div>
          </div>

          {saveSlots.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
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
          )}
        </header>

        <form onSubmit={handleStart} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Manager Profile */}
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
                  {['England', 'Spain', 'France', 'Germany', 'Brazil', 'Argentina', 'Netherlands', 'Italy', 'Portugal', 'Nigeria', 'Japan'].map(
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

            {/* Selected Club Summary Box */}
            <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shadow"
                    style={{
                      backgroundColor: activeClub.primaryColor,
                      color: activeClub.secondaryColor,
                    }}
                  >
                    {activeClub.shortName}
                  </div>
                  <div>
                    <div className="font-bold text-white">{activeClub.name}</div>
                    <div className="text-xs text-slate-400">
                      {activeClub.stadiumName} ({activeClub.stadiumCapacity.toLocaleString()} cap)
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold">
                  Rep {activeClub.reputation}
                </span>
              </div>
            </div>

            <button
              type="submit"
              data-testid="start-career-btn"
              className="w-full py-3.5 px-6 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white font-extrabold uppercase tracking-wider text-sm shadow-lg shadow-pitch-600/30 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sign Contract &amp; Launch Career</span>
            </button>
          </div>

          {/* Right column: Club Picker */}
          <div className="lg:col-span-7 bg-navy-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-gold-400 font-bold uppercase tracking-wider text-xs">
                <Shield className="w-4 h-4" />
                <span>Step 2 &bull; Select Club ({CLUB_PRESETS.length} Fictional Clubs)</span>
              </div>

              <div className="flex rounded-xl bg-navy-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDivision(1);
                    setSelectedClubId(CLUB_PRESETS.find((c) => c.division === 1)!.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedDivision === 1
                      ? 'bg-pitch-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Premier Division 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDivision(2);
                    setSelectedClubId(CLUB_PRESETS.find((c) => c.division === 2)!.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedDivision === 2
                      ? 'bg-pitch-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Championship Division 2
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {divisionClubs.map((club) => {
                const isSelected = club.id === activeClub.id;
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
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border border-white/10"
                        style={{
                          backgroundColor: club.primaryColor,
                          color: club.secondaryColor,
                        }}
                      >
                        {club.shortName}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{club.name}</div>
                        <div className="text-xs text-slate-400">{club.stadiumName}</div>
                        <div className="text-[11px] text-pitch-400 font-medium mt-0.5">
                          Formation: {club.defaultFormation} &bull; Cap: {(club.stadiumCapacity / 1000).toFixed(1)}k
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-gold-400 font-bold text-xs">
                        <Flame className="w-3 h-3" />
                        {club.reputation}
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
