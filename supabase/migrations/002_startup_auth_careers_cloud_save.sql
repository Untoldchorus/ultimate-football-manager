-- Ultimate Football Manager — Startup, Auth, Career Management & Cloud Save Migration (002)

-- 1. Extend public.users with profile, guest, and intro preference fields
alter table public.users
  add column if not exists display_name text,
  add column if not exists is_guest boolean not null default false,
  add column if not exists guest_converted_at timestamptz,
  add column if not exists intro_skip_preference boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- 2. Extend public.careers with career_type, career_name, versioning, idempotency & soft-delete
alter table public.careers
  add column if not exists career_type text not null default 'real_club' check (career_type in ('real_club', 'original_team')),
  add column if not exists career_name text,
  add column if not exists difficulty text not null default 'standard',
  add column if not exists version_etag integer not null default 1,
  add column if not exists idempotency_key text,
  add column if not exists last_device_id text,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz;

create unique index if not exists idx_careers_idempotency
  on public.careers (user_id, idempotency_key)
  where idempotency_key is not null;

-- 3. Versioned career backups for conflict resolution & restoration
create table if not exists public.career_backups (
  id uuid primary key default uuid_generate_v4(),
  career_id uuid not null references public.careers(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  version_etag integer not null,
  saved_at timestamptz not null default now(),
  state_json jsonb not null
);

alter table public.career_backups enable row level security;

create policy "Users can manage their own career backups"
  on public.career_backups
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
