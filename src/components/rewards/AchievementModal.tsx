'use client';

import React, { useState } from 'react';
import {
  Award,
  Trophy,
  Flame,
  Shield,
  UserPlus,
  GraduationCap,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  Sparkles,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { FootballAchievement } from '@/engine/types';
import { soundManager } from '@/lib/audio';

export function AchievementModal({ onClose }: { onClose: () => void }) {
  const { gameState, claimFootballAchievementReward } = useGameStore();
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null);

  const achievements = gameState?.achievements ?? [];

  const handleClaim = async (id: string) => {
    soundManager.playCoinCollect();
    const res = await claimFootballAchievementReward(id);
    if (res.success) {
      soundManager.playBoosterCollect();
      setJustClaimedId(id);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'UserPlus':
        return <UserPlus className="w-5 h-5 text-purple-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-teal-400" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-emerald-400" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-rose-400" />;
      default:
        return <Trophy className="w-5 h-5 text-gold-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-gold-400/30 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/30 text-gold-300 text-[10px] font-black uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Football Honors &amp; Milestones</span>
            </div>
            <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
              <span>Career Football Achievements</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold"
          >
            &times;
          </button>
        </div>

        {/* Achievement List */}
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {achievements.map((ach) => {
            const isUnlocked = ach.unlocked;
            const isClaimed = ach.claimed;
            const canClaim = isUnlocked && !isClaimed;
            const pct = Math.min(100, Math.round((ach.currentProgress / ach.targetProgress) * 100));

            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  canClaim
                    ? 'bg-gradient-to-r from-gold-500/15 via-slate-900 to-slate-950 border-gold-400 ring-1 ring-gold-400/30 shadow-lg'
                    : isClaimed
                      ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                      : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isUnlocked
                        ? 'bg-gold-400/15 border-gold-400/40'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    {renderIcon(ach.icon)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white uppercase">{ach.title}</h4>
                      {isClaimed && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          Claimed
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2.5 pt-1">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isUnlocked ? 'bg-gold-400' : 'bg-slate-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {ach.currentProgress}/{ach.targetProgress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reward & Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <div className="text-[10px] font-bold text-gold-300 flex items-center gap-1">
                    {ach.reward.coins && <span>+€{(ach.reward.coins / 1000).toFixed(0)}k Coins</span>}
                    {ach.reward.reputation && <span>&bull; +{ach.reward.reputation} Rep</span>}
                    {ach.reward.materials && <span>&bull; +{ach.reward.materials} Mat</span>}
                  </div>

                  {canClaim ? (
                    <button
                      type="button"
                      onClick={() => handleClaim(ach.id)}
                      className="px-4 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-navy-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-gold-400/20 transition-transform hover:scale-105 active:scale-95"
                    >
                      Claim Reward
                    </button>
                  ) : isClaimed ? (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold uppercase">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
