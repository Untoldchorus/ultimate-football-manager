'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Play,
  Plus,
  Trash2,
  Edit3,
  Clock,
  Trophy,
  Building2,
  LogOut,
  UserPlus,
  Check,
  X,
  Shield,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { SaveEnvelope } from '@/engine/types';
import { AuthSession } from '@/services/authService';
import { SaveSlotId } from '@/services/saveRepository';

interface CareerHubScreenProps {
  session: AuthSession;
  saveSlots: SaveEnvelope[];
  onContinueCareer: (slotId: SaveSlotId) => Promise<void>;
  onCreateNewCareer: (careerType: 'real_club' | 'original_team') => void;
  onDeleteCareer: (slotId: SaveSlotId) => Promise<void>;
  onRenameCareer?: (slotId: SaveSlotId, newName: string) => void;
  onUpgradeGuest: () => void;
  onLogout: () => Promise<void>;
}

export function CareerHubScreen({
  session,
  saveSlots,
  onContinueCareer,
  onCreateNewCareer,
  onDeleteCareer,
  onRenameCareer,
  onUpgradeGuest,
  onLogout,
}: CareerHubScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'real_club' | 'original_team'>('all');
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<SaveSlotId | null>(null);
  const [editingSlot, setEditingSlot] = useState<SaveSlotId | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  const sortedSlots = [...saveSlots].sort(
    (a, b) => new Date(b.savedAtIso).getTime() - new Date(a.savedAtIso).getTime()
  );
  const latestSlot = sortedSlots[0] ?? null;

  const filteredSlots = sortedSlots.filter((slot) => {
    const type = slot.state.careerType ?? 'real_club';
    if (activeTab === 'all') return true;
    return type === activeTab;
  });

  const handleSaveRename = (slotId: SaveSlotId) => {
    const trimmed = renameValue.trim();
    if (trimmed) {
      setCustomNames((prev) => ({ ...prev, [slotId]: trimmed }));
      onRenameCareer?.(slotId, trimmed);
    }
    setEditingSlot(null);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 relative p-4 sm:p-8 select-none">
      {/* Stadium Night Atmosphere Backdrop */}
      <Image
        src="/branding/stadium_night.jpg"
        alt="Atmospheric Stadium"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-20 filter contrast-125"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/80 to-navy-950/50 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-9">
              <Image
                src="/branding/untold_creations_logo.png"
                alt="Untold Creations"
                fill
                sizes="120px"
                className="object-contain"
              />
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                <span>Career Hub</span>
                <span className="text-lime-400 text-xs font-bold px-2 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/20">
                  Manager HQ
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Signed in as <strong className="text-white">{session.user.displayName}</strong>
                {session.user.isGuest ? ' (Guest Mode)' : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {session.user.isGuest && (
              <button
                type="button"
                onClick={onUpgradeGuest}
                className="px-4 py-2 rounded-xl bg-gold-400/15 hover:bg-gold-400/25 border border-gold-400/40 text-gold-300 text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Save Cloud Progress</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => void onLogout()}
              className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{session.user.isGuest ? 'Sign In' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        {/* Continue Last Career Hero Banner */}
        {latestSlot && (
          <div className="relative rounded-3xl overflow-hidden border border-lime-400/40 bg-gradient-to-r from-slate-900 via-slate-900 to-lime-950/40 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_0_35px_rgba(132,204,22,0.15)]">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-lime-400">
                <Clock className="w-3.5 h-3.5" />
                Continue Active Save
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
                {customNames[latestSlot.slotId] ?? latestSlot.clubName}
              </h2>
              <p className="text-xs text-slate-300">
                Manager: <strong className="text-white">{latestSlot.managerName}</strong> &bull; Season{' '}
                {latestSlot.seasonYear} &bull; Matchday Week {latestSlot.currentWeek} &bull;{' '}
                <span className="text-lime-300 font-semibold">
                  {latestSlot.state.careerType === 'original_team'
                    ? 'Original Team (Club Empire)'
                    : 'Real Club Career'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onContinueCareer(latestSlot.slotId as SaveSlotId)}
              className="px-8 py-4 rounded-2xl bg-lime-400 hover:bg-lime-300 text-navy-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(132,204,22,0.4)] transition-all hover:scale-105 shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Career</span>
            </button>
          </div>
        )}

        {/* Create New Career Dual Cards (Image 2 Inspired) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card: Original Team (Build Your Football Club) */}
          <div
            onClick={() => onCreateNewCareer('original_team')}
            className="group cursor-pointer rounded-3xl overflow-hidden border border-slate-800 hover:border-lime-400 bg-slate-900/80 transition-all duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="relative h-40 w-full overflow-hidden bg-slate-950">
              <Image
                src="/branding/stadium_build_split.jpg"
                alt="Build Your Football Club"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
              <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-emerald-500 text-navy-950 font-black text-[10px] uppercase tracking-wider shadow">
                Build From Scratch
              </div>
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-lime-400">Exclusive 3D Campus</span>
                  <h3 className="text-lg font-black uppercase text-white">Original Team Career</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-lime-400 text-navy-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-300">
                Design custom badge &amp; kits, choose a stadium, enter Tier 2, and build facilities in Club Empire.
              </p>
            </div>
          </div>

          {/* Card: Real Club Career */}
          <div
            onClick={() => onCreateNewCareer('real_club')}
            className="group cursor-pointer rounded-3xl overflow-hidden border border-slate-800 hover:border-lime-400 bg-slate-900/80 transition-all duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="relative h-40 w-full overflow-hidden bg-slate-950">
              <Image
                src="/branding/stadium_night.jpg"
                alt="Real Club Career"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
              <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-white font-black text-[10px] uppercase tracking-wider shadow">
                Authentic World
              </div>
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-lime-400">732 Clubs &bull; 40 Leagues</span>
                  <h3 className="text-lg font-black uppercase text-white">Real Club Career</h3>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white group-hover:bg-lime-400 group-hover:text-navy-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-300">
                Manage any club across 20 countries. Compete for promotion, domestic championships, and continental cups.
              </p>
            </div>
          </div>
        </div>

        {/* Saved Careers List */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Saved Careers</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-lime-400">
                {filteredSlots.length}
              </span>
            </h3>
            <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['all', 'real_club', 'original_team'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                    activeTab === tab
                      ? 'bg-lime-400 text-navy-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'all'
                    ? 'All'
                    : tab === 'real_club'
                      ? 'Real Club'
                      : 'Original Team'}
                </button>
              ))}
            </div>
          </div>

          {filteredSlots.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center text-xs text-slate-400 space-y-2">
              <p className="text-white font-bold text-sm">No saved careers found.</p>
              <p>Choose &ldquo;Original Team Career&rdquo; or &ldquo;Real Club Career&rdquo; above to start your journey.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSlots.map((slot) => {
                const slotId = slot.slotId as SaveSlotId;
                const isOriginal = slot.state.careerType === 'original_team';
                const displayName = customNames[slotId] ?? slot.clubName;

                return (
                  <div
                    key={slotId}
                    className="rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between gap-4 shadow-lg transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isOriginal
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                          }`}
                        >
                          {isOriginal ? 'Original Team' : 'Real Club'}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          SLOT {slotId.toUpperCase()}
                        </span>
                      </div>

                      {editingSlot === slotId ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-lime-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(slotId)}
                            className="p-2 rounded-xl bg-lime-400 text-navy-950"
                            aria-label="Save rename"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSlot(null)}
                            className="p-2 rounded-xl bg-slate-800 text-slate-300"
                            aria-label="Cancel rename"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h4 className="text-lg font-black uppercase text-white">{displayName}</h4>
                      )}

                      <p className="text-xs text-slate-300">
                        Manager: <strong className="text-white">{slot.managerName}</strong> &bull; Season{' '}
                        {slot.seasonYear} &bull; Week {slot.currentWeek}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Saved: {new Date(slot.savedAtIso).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => void onContinueCareer(slotId)}
                        className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-navy-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-lime-400/20 transition-all hover:scale-105"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Load Career</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSlot(slotId);
                            setRenameValue(displayName);
                          }}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          aria-label="Rename career"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {confirmDeleteSlot === slotId ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                void onDeleteCareer(slotId);
                                setConfirmDeleteSlot(null);
                              }}
                              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black uppercase"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSlot(null)}
                              className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteSlot(slotId)}
                            className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                            aria-label="Delete career"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
