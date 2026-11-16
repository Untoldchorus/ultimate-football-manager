'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Play,
  FastForward,
  Pause,
  Filter,
  Clock,
  MapPin,
  Trophy,
  Shield,
  AlertCircle,
  CheckCircle2,
  Settings,
  Sparkles,
  Zap,
  Building2,
  UserCheck,
  Dumbbell,
  Coins,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import {
  DAY_NAMES,
  formatDateDisplay,
  formatMonthYear,
  MONTH_NAMES,
  CalendarEvent,
  CalendarEventCategory,
} from '@/engine/calendarEngine';
import { soundManager } from '@/lib/audio';
import { ClubCrest } from '../ui/FootballVisuals';

type CalendarViewMode = 'month' | 'week' | 'agenda';

export function CentralWorldCalendarScreen() {
  const {
    gameState,
    advanceSimulationDay,
    advanceSimulationToMatch,
    advanceSimulationToDate,
    setActiveTab,
  } = useGameStore();

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = current in-game month
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inspectDateIso, setInspectDateIso] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);

  if (!gameState || !gameState.calendarState) return null;

  const calendar = gameState.calendarState;
  const currentDateIso = gameState.currentDateIso ?? calendar.currentDateIso;
  const userClubId = gameState.manager.clubId;
  const userClub = gameState.clubs.find((c) => c.id === userClubId);
  const clubMap = new Map(gameState.clubs.map((c) => [c.id, c]));

  // Parse current in-game date
  const [curY, curM, curD] = currentDateIso.split('-').map(Number);
  const displayedDate = new Date(curY, curM - 1 + selectedMonthOffset, 1);
  const displayedYear = displayedDate.getFullYear();
  const displayedMonthIndex = displayedDate.getMonth(); // 0..11
  const displayedMonthName = MONTH_NAMES[displayedMonthIndex];

  // Calculate calendar grid days for displayed month
  const firstDayOfWeek = new Date(displayedYear, displayedMonthIndex, 1).getDay(); // 0=Sun, 1=Mon...
  // Convert so Monday = 0, Sunday = 6
  const startOffset = (firstDayOfWeek + 6) % 7;
  const daysInDisplayedMonth = new Date(displayedYear, displayedMonthIndex + 1, 0).getDate();

  // Filter events
  const allEvents = calendar.scheduledEvents ?? [];
  const filteredAgenda = allEvents.filter((ev) => {
    if (selectedCategory === 'all') return true;
    return ev.category === selectedCategory;
  });

  // Handle Day Advance
  const handleAdvanceDay = async () => {
    soundManager.playUiClick();
    await advanceSimulationDay();
  };

  // Handle Advance to Next Match
  const handleAdvanceToMatch = async () => {
    soundManager.playUiClick();
    await advanceSimulationToMatch();
  };

  // Check if today is user matchday
  const userMatchToday = allEvents.find(
    (e) =>
      e.dateIso === currentDateIso &&
      e.category === 'match' &&
      (e.clubId === userClubId || e.opponentClubId === userClubId)
  );

  return (
    <div className="space-y-6 select-none" data-testid="central-world-calendar">
      {/* ===================================================================== */}
      {/* 1. TOP SIMULATION COMMAND BAR & DATE STATUS                           */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 border border-slate-800 p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-pitch-500/10 border border-pitch-500/30 flex items-center justify-center text-pitch-400 shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                In-Game Simulation Clock
              </span>
              <span className="text-xs font-bold text-gold-400">
                Season {gameState.currentSeason} &bull; Matchweek {gameState.currentWeek}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>{formatDateDisplay(currentDateIso)}</span>
            </h1>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAdvanceDay}
            className="px-4 py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pitch-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Advance 1 Day</span>
          </button>

          <button
            type="button"
            onClick={handleAdvanceToMatch}
            className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-slate-700 text-gold-400 hover:text-gold-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <FastForward className="w-4 h-4 fill-current" />
            <span>To Next Match</span>
          </button>

          {/* View Mode Pills */}
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 ml-1">
            {(['month', 'week', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  soundManager.playUiClick();
                  setViewMode(mode);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                  viewMode === mode
                    ? 'bg-slate-800 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MATCHDAY / AUTO-PAUSE ALERT BANNER                                 */}
      {/* ===================================================================== */}
      {userMatchToday && (
        <div className="rounded-2xl bg-gradient-to-r from-pitch-950/80 via-navy-900 to-pitch-950/80 border-2 border-pitch-500/50 p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pitch-500/20 border border-pitch-500/40 flex items-center justify-center text-pitch-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-pitch-400">
                Matchday Alert &bull; Simulation Paused
              </span>
              <h3 className="text-sm font-black text-white">
                {userMatchToday.title} kicks off today ({userMatchToday.time ?? '15:00'})!
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('matchday')}
            className="px-5 py-2.5 rounded-xl bg-pitch-500 hover:bg-pitch-400 text-navy-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-pitch-500/30 flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
          >
            <span>Enter Matchday</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MONTHLY CALENDAR VIEW                                              */}
      {/* ===================================================================== */}
      {viewMode === 'month' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-5">
          {/* Month Header Switcher */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black uppercase text-white tracking-wide">
                {displayedMonthName} {displayedYear}
              </h2>
              {selectedMonthOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMonthOffset(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-pitch-400 hover:text-pitch-300"
                >
                  Return to Today
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMonthOffset((prev) => prev - 1)}
                className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonthOffset((prev) => prev + 1)}
                className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Day Grid Headers (Mon to Sun) */}
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-black uppercase text-slate-400 pb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots before first day of month */}
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[90px] rounded-2xl bg-slate-950/30 border border-slate-800/40 p-2 opacity-30"
              />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInDisplayedMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const cellDateIso = `${displayedYear}-${String(displayedMonthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = cellDateIso === currentDateIso;
              const isPast = cellDateIso < currentDateIso;

              const cellEvents = allEvents.filter((e) => e.dateIso === cellDateIso);
              const userMatchEvent = cellEvents.find(
                (e) =>
                  e.category === 'match' &&
                  (e.clubId === userClubId || e.opponentClubId === userClubId)
              );
              const deadlineEvent = cellEvents.find((e) => e.title.includes('Deadline'));

              return (
                <div
                  key={cellDateIso}
                  onClick={() => setInspectDateIso(cellDateIso)}
                  className={`min-h-[95px] rounded-2xl p-2.5 flex flex-col justify-between border cursor-pointer transition-all ${
                    isToday
                      ? 'bg-pitch-950/40 border-pitch-500 ring-2 ring-pitch-500/30 shadow-lg'
                      : userMatchEvent
                        ? 'bg-blue-950/20 border-blue-500/40 hover:border-blue-500'
                        : isPast
                          ? 'bg-slate-950/50 border-slate-800/60 opacity-70'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        isToday
                          ? 'text-pitch-400'
                          : userMatchEvent
                            ? 'text-blue-400'
                            : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-pitch-500 text-navy-950">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Cell Badges */}
                  <div className="space-y-1 my-1">
                    {userMatchEvent && (
                      <div className="px-1.5 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-[10px] font-black text-blue-300 truncate flex items-center gap-1">
                        <Trophy className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{userMatchEvent.title}</span>
                      </div>
                    )}
                    {deadlineEvent && (
                      <div className="px-1.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-[9px] font-black text-rose-300 truncate">
                        Deadline Day
                      </div>
                    )}
                    {cellEvents.length > (userMatchEvent ? 1 : 0) && (
                      <span className="text-[9px] text-slate-500 font-bold block truncate">
                        +{cellEvents.length - (userMatchEvent ? 1 : 0)} more events
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. WEEKLY CALENDAR VIEW                                               */}
      {/* ===================================================================== */}
      {viewMode === 'week' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-pitch-400" />
              <span>Weekly Training &amp; Match Schedule (Matchweek {gameState.currentWeek})</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Monday through Sunday Itinerary
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayShort, idx) => {
              const dayOffset = idx; // 0=Mon, 5=Sat, 6=Sun
              const dayEvents = allEvents.filter(
                (e) => e.category === 'match' || e.category === 'training'
              );

              const isMatchDay = idx === 5; // Saturday
              const isRecovery = idx === 6; // Sunday post-match

              return (
                <div
                  key={dayShort}
                  className={`rounded-2xl p-4 border space-y-3 flex flex-col justify-between ${
                    isMatchDay
                      ? 'bg-blue-950/20 border-blue-500/40'
                      : isRecovery
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Day {idx + 1}
                    </span>
                    <h4 className="text-sm font-black text-white">{dayShort}</h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    {isMatchDay ? (
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-black text-[10px] uppercase">
                          Competitive Match
                        </span>
                        <p className="text-white font-bold text-xs pt-1">15:00 Kickoff</p>
                        <p className="text-[11px] text-slate-400">Tactical execution &amp; squad selection.</p>
                      </div>
                    ) : isRecovery ? (
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase">
                          Hydro Recovery
                        </span>
                        <p className="text-[11px] text-slate-300 pt-1">
                          Pool relaxation, massage &amp; medical fatigue flushing.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px] uppercase">
                          {idx === 0 ? 'Tactical Drill' : idx === 1 ? 'Strength & Gym' : 'Ball Work'}
                        </span>
                        <p className="text-[11px] text-slate-400 pt-1">
                          First team training session at Campus Pitches.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                    Status: Standard Schedule
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. AGENDA VIEW                                                        */}
      {/* ===================================================================== */}
      {viewMode === 'agenda' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
          {/* Agenda Category Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-pitch-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter by Category:
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['all', 'match', 'transfer', 'training', 'operations', 'competition'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                    selectedCategory === cat
                      ? 'bg-lime-400 text-navy-950 font-black shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Agenda Event Stream */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredAgenda.map((ev) => {
              const isMatch = ev.category === 'match';
              const isCritical = ev.importance === 'critical';

              return (
                <div
                  key={ev.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isCritical
                      ? 'bg-slate-950 border-gold-500/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isMatch
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                          : ev.category === 'transfer'
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {isMatch ? (
                        <Trophy className="w-5 h-5" />
                      ) : ev.category === 'transfer' ? (
                        <Zap className="w-5 h-5" />
                      ) : (
                        <CalendarIcon className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-gold-400">
                          {formatDateDisplay(ev.dateIso, false)}
                        </span>
                        {ev.time && (
                          <span className="text-[10px] text-slate-500">&bull; {ev.time}</span>
                        )}
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {ev.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white">{ev.title}</h4>
                      <p className="text-xs text-slate-400 max-w-xl">{ev.description}</p>
                    </div>
                  </div>

                  {ev.actionRequired && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isMatch) setActiveTab('matchday');
                        else if (ev.category === 'transfer') setActiveTab('transfers');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white font-bold text-xs uppercase self-start sm:self-center shrink-0 shadow-md"
                    >
                      View Details
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. DAY INSPECTOR MODAL / POPUP                                        */}
      {/* ===================================================================== */}
      {inspectDateIso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Selected Date</span>
                <h3 className="text-base font-black text-white">
                  {formatDateDisplay(inspectDateIso)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectDateIso(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold"
              >
                &times;
              </button>
            </div>

            {/* Events on this date */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allEvents.filter((e) => e.dateIso === inspectDateIso).length > 0 ? (
                allEvents
                  .filter((e) => e.dateIso === inspectDateIso)
                  .map((e) => (
                    <div
                      key={e.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                    >
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{e.title}</span>
                        <span className="text-[10px] text-gold-400 uppercase">{e.time ?? 'All Day'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{e.description}</p>
                    </div>
                  ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  Standard club operations &amp; tactical practice scheduled.
                </div>
              )}
            </div>

            {/* Quick Action to Advance to this date */}
            {inspectDateIso > currentDateIso && (
              <button
                type="button"
                onClick={async () => {
                  soundManager.playUiClick();
                  await advanceSimulationToDate(inspectDateIso);
                  setInspectDateIso(null);
                }}
                className="w-full py-2.5 rounded-xl bg-pitch-600 hover:bg-pitch-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-pitch-600/30"
              >
                <FastForward className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Forward to this Date</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
