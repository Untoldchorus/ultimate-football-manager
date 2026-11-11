-- Ultimate Football Manager — Supabase Schema & Row-Level Security (M6)
-- Includes all 18 required domain tables + RLS policies.

create extension if not exists "uuid-ossp";

-- 1. users
create table if not exists public.users (
  id uuid primary key default auth.uid(),
  email text unique,
  created_at timestamptz not null default now()
);

-- 2. managers
create table if not exists public.managers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  nationality text not null,
  tactical_style text not null,
  difficulty text not null default 'standard',
  starting_challenge text not null default 'none',
  created_at timestamptz not null default now()
);

-- 3. careers
create table if not exists public.careers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid default auth.uid(),
  slot_id text not null,
  save_version integer not null default 1,
  saved_at timestamptz not null default now(),
  manager_name text not null,
  club_name text not null,
  season_year integer not null,
  current_week integer not null,
  state_json jsonb not null,
  unique (user_id, slot_id)
);

-- 4. clubs
create table if not exists public.clubs (
  id text primary key,
  career_id uuid references public.careers(id) on delete cascade,
  name text not null,
  short_name text not null,
  division integer not null,
  primary_color text not null,
  secondary_color text not null,
  stadium_name text not null,
  stadium_capacity integer not null,
  reputation integer not null
);

-- 5. players
create table if not exists public.players (
  id text primary key,
  career_id uuid references public.careers(id) on delete cascade,
  club_id text references public.clubs(id) on delete set null,
  first_name text not null,
  last_name text not null,
  age integer not null,
  nationality text not null,
  primary_position text not null,
  overall integer not null,
  potential integer not null,
  market_value integer not null,
  attributes_json jsonb not null
);

-- 6. contracts
create table if not exists public.contracts (
  id uuid primary key default uuid_generate_v4(),
  career_id uuid references public.careers(id) on delete cascade,
  player_id text references public.players(id) on delete cascade,
  club_id text references public.clubs(id) on delete cascade,
  weekly_wage integer not null,
  contract_end_season integer not null,
  role_expectation text not null
);

-- 7. squads
create table if not exists public.squads (
  id uuid primary key default uuid_generate_v4(),
  career_id uuid references public.careers(id) on delete cascade,
  club_id text references public.clubs(id) on delete cascade,
  starting_xi jsonb not null,
  substitutes jsonb not null,
  reserves jsonb not null
);

-- 8. tactics
create table if not exists public.tactics (
  id uuid primary key default uuid_generate_v4(),
  career_id uuid references public.careers(id) on delete cascade,
  club_id text references public.clubs(id) on delete cascade,
  formation text not null,
  attacking_style text not null,
  pressing text not null,
  defensive_line text not null,
  mentality text not null,
  width integer not null,
  tempo integer not null,
  directness integer not null,
  counter_pressing boolean not null default true,
  offside_trap boolean not null default false
);

-- 9. competitions
create table if not exists public.competitions (
  id text primary key,
  name text not null,
  competition_type text not null
);

-- 10. fixtures
create table if not exists public.fixtures (
  id text primary key,
  career_id uuid references public.careers(id) on delete cascade,
  season integer not null,
  week integer not null,
  competition text not null,
  home_club_id text not null,
  away_club_id text not null,
  played boolean not null default false
);

-- 11. matches
create table if not exists public.matches (
  id uuid primary key default uuid_generate_v4(),
  fixture_id text references public.fixtures(id) on delete cascade,
  seed bigint not null,
  home_score integer not null,
  away_score integer not null,
  home_stats_json jsonb not null,
  away_stats_json jsonb not null,
  motm_player_id text
);

-- 12. match_events
create table if not exists public.match_events (
  id text primary key,
  match_id uuid references public.matches(id) on delete cascade,
  minute integer not null,
  second integer not null,
  event_type text not null,
  team_id text not null,
  player_id text,
  secondary_player_id text,
  ball_position jsonb not null,
  outcome text not null,
  metadata jsonb
);

-- 13. standings
create table if not exists public.standings (
  id uuid primary key default uuid_generate_v4(),
  career_id uuid references public.careers(id) on delete cascade,
  season integer not null,
  competition text not null,
  club_id text not null,
  played integer not null default 0,
  won integer not null default 0,
  drawn integer not null default 0,
  lost integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  points integer not null default 0
);

-- 14. transfers
create table if not exists public.transfers (
  id text primary key,
  career_id uuid references public.careers(id) on delete cascade,
  season integer not null,
  week integer not null,
  player_id text not null,
  from_club_id text not null,
  to_club_id text not null,
  fee integer not null,
  is_loan boolean not null default false
);

-- 15. scouting_reports
create table if not exists public.scouting_reports (
  id text primary key,
  career_id uuid references public.careers(id) on delete cascade,
  player_id text not null,
  scout_id text not null,
  week_generated integer not null,
  estimated_overall_min integer not null,
  estimated_overall_max integer not null,
  estimated_potential_min integer not null,
  estimated_potential_max integer not null,
  recommendation text not null,
  notes text
);

-- 16. training_sessions
create table if not exists public.training_sessions (
  id uuid primary key default uuid_generate_v4(),
  career_id uuid references public.careers(id) on delete cascade,
  club_id text not null,
  week integer not null,
  schedule_json jsonb not null,
  intensity text not null
);

-- 17. finances
create table if not exists public.finances (
  id uuid primary key default uuid_generate_v4(),
  career_id uuid references public.careers(id) on delete cascade,
  club_id text not null,
  transfer_budget bigint not null,
  wage_budget_weekly bigint not null,
  cash_balance bigint not null,
  ledger_json jsonb not null
);

-- 18. achievements
create table if not exists public.achievements (
  id text primary key,
  career_id uuid references public.careers(id) on delete cascade,
  season integer not null,
  competition text not null,
  winner_club_id text not null,
  runner_up_club_id text not null
);

-- Enable Row-Level Security (RLS)
alter table public.users enable row level security;
alter table public.managers enable row level security;
alter table public.careers enable row level security;
alter table public.clubs enable row level security;
alter table public.players enable row level security;
alter table public.contracts enable row level security;
alter table public.squads enable row level security;
alter table public.tactics enable row level security;
alter table public.competitions enable row level security;
alter table public.fixtures enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;
alter table public.standings enable row level security;
alter table public.transfers enable row level security;
alter table public.scouting_reports enable row level security;
alter table public.training_sessions enable row level security;
alter table public.finances enable row level security;
alter table public.achievements enable row level security;

create policy "Users manage own careers" on public.careers
  for all using (auth.uid() = user_id);
