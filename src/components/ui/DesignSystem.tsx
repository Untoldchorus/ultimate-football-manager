'use client';

import React from 'react';

export function PremiumCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-navy-900/95 border border-slate-800/90 shadow-lg transition-colors hover:border-slate-700/80 ${className}`}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-navy-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-lime-400/15 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-100 font-bold text-xs transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export function StatBadge({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: 'default' | 'lime' | 'gold' | 'emerald' | 'amber' | 'rose';
}) {
  const toneClasses: Record<string, string> = {
    default: 'bg-navy-950 border-slate-800 text-white',
    lime: 'bg-lime-400/10 border-lime-400/30 text-lime-300',
    gold: 'bg-gold-400/10 border-gold-400/30 text-gold-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    rose: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  };

  return (
    <div className={`px-3 py-2 rounded-xl border ${toneClasses[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-sm font-black mt-0.5">{value}</div>
    </div>
  );
}
