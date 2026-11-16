'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  Clock,
  CheckCircle2,
  Lock,
  Gift,
  Coins,
  HeartPulse,
  Hammer,
  GraduationCap,
  Compass,
  Zap,
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import {
  evaluateLoginStreakStatus,
  formatCountdownTime,
  SEVEN_DAY_STREAK_SCHEDULE,
} from '@/engine/loginStreakEngine';
import { soundManager } from '@/lib/audio';

export function LoginStreakModal({ onClose }: { onClose: () => void }) {
  const { gameState, claimDailyLoginStreakReward } = useGameStore();
  const [msUntilReset, setMsUntilReset] = useState(0);
  const [justClaimedMessage, setJustClaimedMessage] = useState<string | null>(null);

  const streakState = gameState?.loginStreak;
  const status = evaluateLoginStreakStatus(streakState);

  useEffect(() => {
    setMsUntilReset(status.msUntilNextReset);
    const timer = setInterval(() => {
      setMsUntilReset((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [status.msUntilNextReset]);

  const handleClaim = async () => {
    soundManager.playCoinCollect();
    const res = await claimDailyLoginStreakReward();
    if (res.success) {
      soundManager.playBoosterCollect();
      setJustClaimedMessage(res.message);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coins':
        return <Coins className="w-5 h-5 text-gold-400" />;
      case 'Hammer':
        return <Hammer className="w-5 h-5 text-amber-400" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-blue-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-teal-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-emerald-400" />;
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
              <Sparkles className="w-3 h-3" />
              <span>Real-World Daily Check-In</span>
            </div>
            <h2 className="text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
              <span>7-Day Login Streak Rewards</span>
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

        {/* Success Alert Banner */}
        {justClaimedMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{justClaimedMessage}</span>
          </div>
        )}

        {/* Status Strip: Streak Count & Countdown */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 font-black text-sm">
              {status.currentStreak}
            </div>
            <div>
              <p className="font-bold text-white">Current Streak: {status.currentStreak} Days</p>
              <p className="text-[11px] text-slate-400">
                Best Career Streak: {streakState?.bestStreak ?? status.currentStreak} Days
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-gold-400" />
              <span>Next UTC Reset in</span>
            </span>
            <span className="text-xs font-mono font-bold text-gold-300">
              {formatCountdownTime(msUntilReset)}
            </span>
          </div>
        </div>

        {/* 7-Day Rewards Track Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {SEVEN_DAY_STREAK_SCHEDULE.map((item) => {
            const isClaimed =
              streakState?.lastClaimUtcDate &&
              item.day <= status.currentStreak &&
              !status.canClaimToday;
            const isAvailable = item.day === status.nextDayToClaim && status.canClaimToday;
            const isLocked = item.day > status.nextDayToClaim || (!status.canClaimToday && item.day > status.currentStreak);

            return (
              <div
                key={item.day}
                className={`rounded-2xl p-3 flex flex-col justify-between border text-center transition-all ${
                  isAvailable
                    ? 'bg-gradient-to-b from-gold-500/20 to-slate-950 border-gold-400 ring-2 ring-gold-400/40 shadow-lg scale-105'
                    : isClaimed
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-70'
                      : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <span
                    className={`text-[9px] font-black uppercase ${
                      isAvailable ? 'text-gold-400' : isClaimed ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    Day {item.day}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mx-auto">
                    {renderIcon(item.icon)}
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <h4 className="text-[11px] font-black text-white leading-tight">{item.title}</h4>
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isClaimed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isAvailable
                          ? 'bg-gold-400 text-navy-950 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isClaimed ? 'Claimed' : isAvailable ? 'Ready' : 'Locked'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Claim Action Button */}
        <div className="pt-2">
          {status.canClaimToday ? (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-500 to-gold-500 text-navy-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-gold-500/20 transition-transform hover:scale-[1.01] active:scale-95"
            >
              <Gift className="w-4 h-4" />
              <span>Claim Day {status.nextDayToClaim} Reward</span>
            </button>
          ) : (
            <div className="w-full py-3 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs font-bold text-slate-400">
              Today&apos;s streak reward is claimed! Return after 00:00 UTC midnight to claim Day {(status.currentStreak % 7) + 1}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
