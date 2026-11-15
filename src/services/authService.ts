import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type AuthProviderType = 'email' | 'google' | 'apple' | 'guest';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string;
  isGuest: boolean;
  emailVerified: boolean;
  provider: AuthProviderType;
  createdAtIso: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAtIso: string;
}

export interface AuthResult {
  ok: boolean;
  session?: AuthSession;
  message?: string;
  requiresEmailVerification?: boolean;
}

const SESSION_KEY = 'ufm_auth_session_v1';
const LOCAL_USERS_KEY = 'ufm_local_users_v1';
const INTRO_PREF_KEY = 'ufm_intro_skip_pref_v1';
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function checkRateLimit(actionKey: string, maxAttempts = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(actionKey);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(actionKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count += 1;
  return true;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 100_000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    return Array.from(new Uint8Array(bits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for environments without SubtleCrypto
  let hash = 0;
  const input = `${salt}:${password}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `fb_${Math.abs(hash).toString(16)}`;
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

interface StoredLocalUser {
  id: string;
  email: string;
  displayName: string;
  salt: string;
  passwordHash: string;
  emailVerified: boolean;
  createdAtIso: string;
}

function readLocalUsers(): Record<string, StoredLocalUser> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredLocalUser>) : {};
  } catch {
    return {};
  }
}

function writeLocalUsers(users: Record<string, StoredLocalUser>): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function saveSession(session: AuthSession | null): void {
  if (typeof localStorage === 'undefined') return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getStoredSession(): AuthSession | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (new Date(parsed.expiresAtIso).getTime() < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getIntroSkipPreference(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(INTRO_PREF_KEY) === 'true';
}

export function setIntroSkipPreference(skip: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(INTRO_PREF_KEY, skip ? 'true' : 'false');
}

export function isOAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { ok: false, message: 'Please enter a valid email address.' };
  }
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!checkRateLimit(`register:${normalizedEmail}`)) {
    return { ok: false, message: 'Too many registration attempts. Please wait a minute.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { display_name: displayName.trim() || 'Manager' } },
    });
    if (error) return { ok: false, message: error.message };
    if (!data.session && data.user) {
      return {
        ok: true,
        requiresEmailVerification: true,
        message: 'Verification email sent. Please check your inbox to activate your account.',
      };
    }
    if (data.session && data.user) {
      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email ?? normalizedEmail,
          displayName: displayName.trim() || 'Manager',
          isGuest: false,
          emailVerified: Boolean(data.user.email_confirmed_at),
          provider: 'email',
          createdAtIso: data.user.created_at,
        },
        accessToken: data.session.access_token,
        expiresAtIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      saveSession(session);
      return { ok: true, session };
    }
  }

  // Local secure fallback
  const users = readLocalUsers();
  if (users[normalizedEmail]) {
    return { ok: false, message: 'An account with this email already exists.' };
  }
  const salt = generateId('salt');
  const passwordHash = await hashPassword(password, salt);
  const userId = generateId('usr');
  const nowIso = new Date().toISOString();
  users[normalizedEmail] = {
    id: userId,
    email: normalizedEmail,
    displayName: displayName.trim() || 'Manager',
    salt,
    passwordHash,
    emailVerified: true,
    createdAtIso: nowIso,
  };
  writeLocalUsers(users);

  const session: AuthSession = {
    user: {
      id: userId,
      email: normalizedEmail,
      displayName: users[normalizedEmail].displayName,
      isGuest: false,
      emailVerified: true,
      provider: 'email',
      createdAtIso: nowIso,
    },
    accessToken: generateId('tok'),
    expiresAtIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  saveSession(session);
  return { ok: true, session };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!checkRateLimit(`login:${normalizedEmail}`)) {
    return { ok: false, message: 'Too many login attempts. Please wait a minute.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) return { ok: false, message: error.message };
    if (data.session && data.user) {
      const session: AuthSession = {
        user: {
          id: data.user.id,
          email: data.user.email ?? normalizedEmail,
          displayName: (data.user.user_metadata?.display_name as string) || 'Manager',
          isGuest: false,
          emailVerified: Boolean(data.user.email_confirmed_at),
          provider: 'email',
          createdAtIso: data.user.created_at,
        },
        accessToken: data.session.access_token,
        expiresAtIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      saveSession(session);
      return { ok: true, session };
    }
  }

  const users = readLocalUsers();
  const record = users[normalizedEmail];
  if (!record) {
    return { ok: false, message: 'Invalid email or password.' };
  }
  const candidateHash = await hashPassword(password, record.salt);
  if (candidateHash !== record.passwordHash) {
    return { ok: false, message: 'Invalid email or password.' };
  }
  const session: AuthSession = {
    user: {
      id: record.id,
      email: record.email,
      displayName: record.displayName,
      isGuest: false,
      emailVerified: record.emailVerified,
      provider: 'email',
      createdAtIso: record.createdAtIso,
    },
    accessToken: generateId('tok'),
    expiresAtIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  saveSession(session);
  return { ok: true, session };
}

export async function loginWithOAuth(provider: 'google' | 'apple'): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      ok: false,
      message: `${provider === 'google' ? 'Google' : 'Apple'} sign-in requires Supabase OAuth configuration.`,
    };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Redirecting to provider...' };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { ok: false, message: 'Enter a valid email address.' };
  }
  if (!checkRateLimit(`reset:${normalizedEmail}`, 4, 60_000)) {
    return { ok: false, message: 'Too many reset requests. Please wait a minute.' };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/?reset=1` : undefined,
    });
    if (error) return { ok: false, message: error.message };
  }
  return {
    ok: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  };
}

export function createGuestSession(): AuthSession {
  const existing = getStoredSession();
  if (existing?.user.isGuest) return existing;

  const session: AuthSession = {
    user: {
      id: generateId('guest'),
      email: null,
      displayName: 'Guest Manager',
      isGuest: true,
      emailVerified: false,
      provider: 'guest',
      createdAtIso: new Date().toISOString(),
    },
    accessToken: generateId('guest_tok'),
    expiresAtIso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  saveSession(session);
  return session;
}

export async function convertGuestToAccount(
  email: string,
  password: string,
  displayName: string
): Promise<AuthResult> {
  const current = getStoredSession();
  if (!current || !current.user.isGuest) {
    return { ok: false, message: 'No active guest session to convert.' };
  }
  const regResult = await registerWithEmail(email, password, displayName);
  return regResult;
}

export async function logoutSession(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  saveSession(null);
}
