'use client';

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  AuthSession,
  convertGuestToAccount,
  createGuestSession,
  isOAuthConfigured,
  loginWithEmail,
  loginWithOAuth,
  registerWithEmail,
  requestPasswordReset,
} from '@/services/authService';

interface AuthModalProps {
  initialMode?: 'login' | 'register' | 'reset' | 'convert_guest';
  onAuthenticated: (session: AuthSession) => void;
  onClose?: () => void;
}

export function AuthModal({
  initialMode = 'login',
  onAuthenticated,
  onClose,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'convert_guest'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const oauthEnabled = isOAuthConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (!res.ok || !res.session) {
          setError(res.message ?? 'Login failed.');
        } else {
          onAuthenticated(res.session);
        }
      } else if (mode === 'register') {
        const res = await registerWithEmail(email, password, displayName);
        if (!res.ok) {
          setError(res.message ?? 'Registration failed.');
        } else if (res.requiresEmailVerification) {
          setSuccessMsg(res.message ?? 'Verification email sent.');
        } else if (res.session) {
          onAuthenticated(res.session);
        }
      } else if (mode === 'convert_guest') {
        const res = await convertGuestToAccount(email, password, displayName);
        if (!res.ok) {
          setError(res.message ?? 'Account conversion failed.');
        } else if (res.session) {
          onAuthenticated(res.session);
        }
      } else if (mode === 'reset') {
        const res = await requestPasswordReset(email);
        if (!res.ok) {
          setError(res.message ?? 'Password reset failed.');
        } else {
          setSuccessMsg(res.message ?? 'Reset link sent.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    const guestSession = createGuestSession();
    onAuthenticated(guestSession);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-navy-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication"
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="space-y-1 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pitch-500/15 border border-pitch-500/30 text-pitch-400 text-[11px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {mode === 'convert_guest'
                ? 'Upgrade Guest Account'
                : mode === 'register'
                  ? 'Create Manager Account'
                  : mode === 'reset'
                    ? 'Account Recovery'
                    : 'Manager Sign In'}
            </span>
          </div>
          <h2 className="text-xl font-black text-white">
            {mode === 'convert_guest'
              ? 'Save Your Progress Forever'
              : mode === 'register'
                ? 'Join Ultimate Football Manager'
                : mode === 'reset'
                  ? 'Reset Your Password'
                  : 'Welcome Back, Boss'}
          </h2>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {(mode === 'register' || mode === 'convert_guest') && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Manager Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-pitch-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@club.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-pitch-500"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-pitch-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-pitch-600 hover:bg-pitch-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign In'
                  : mode === 'register'
                    ? 'Create Account'
                    : mode === 'convert_guest'
                      ? 'Convert & Save Account'
                      : 'Send Reset Link'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {oauthEnabled && mode !== 'reset' && (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void loginWithOAuth('google')}
              className="py-2.5 px-3 rounded-xl bg-navy-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => void loginWithOAuth('apple')}
              className="py-2.5 px-3 rounded-xl bg-navy-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              Continue with Apple
            </button>
          </div>
        )}

        {mode !== 'convert_guest' && (
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <button
              type="button"
              onClick={handleGuest}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Continue as Guest (Explore &amp; Demo)</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400">
              {mode === 'login' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('register');
                    }}
                    className="hover:text-white underline"
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('reset');
                    }}
                    className="hover:text-white underline"
                  >
                    Forgot password?
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="hover:text-white underline mx-auto"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
