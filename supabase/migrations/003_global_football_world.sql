-- ============================================================================
-- MIGRATION 003: GLOBAL FOOTBALL WORLD SIMULATION ENGINE v1.0
-- ============================================================================

-- 1. Global UEFA Tournaments
CREATE TABLE IF NOT EXISTS public.uefa_tournaments (
  id TEXT PRIMARY KEY,
  career_id TEXT NOT NULL REFERENCES public.career_saves(id) ON DELETE CASCADE,
  tournament_id TEXT NOT NULL CHECK (tournament_id IN ('ucl', 'uel', 'uecl')),
  season_year INTEGER NOT NULL,
  current_match_week INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  winner_club_id TEXT,
  runner_up_club_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. UEFA Swiss League Phase Standings (36 Teams per Tournament)
CREATE TABLE IF NOT EXISTS public.uefa_standings (
  id TEXT PRIMARY KEY,
  tournament_state_id TEXT NOT NULL REFERENCES public.uefa_tournaments(id) ON DELETE CASCADE,
  club_id TEXT NOT NULL,
  club_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  rank INTEGER NOT NULL,
  reputation INTEGER NOT NULL,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  drawn INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  form JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. UEFA Matches & Knockout Ties
CREATE TABLE IF NOT EXISTS public.uefa_matches (
  id TEXT PRIMARY KEY,
  tournament_state_id TEXT NOT NULL REFERENCES public.uefa_tournaments(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('league_phase', 'knockout_playoffs', 'round_of_16', 'quarter_finals', 'semi_finals', 'final')),
  match_week INTEGER NOT NULL,
  home_club_id TEXT NOT NULL,
  away_club_id TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  played BOOLEAN NOT NULL DEFAULT FALSE,
  scorers JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Cross-League Global Player Statistics (Golden Boot, Assists, Clean Sheets)
CREATE TABLE IF NOT EXISTS public.global_player_season_stats (
  id TEXT PRIMARY KEY,
  career_id TEXT NOT NULL REFERENCES public.career_saves(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  club_id TEXT NOT NULL,
  club_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  league_id TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  appearances INTEGER NOT NULL DEFAULT 0,
  minutes INTEGER NOT NULL DEFAULT 0,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  clean_sheets INTEGER NOT NULL DEFAULT 0,
  yellow_cards INTEGER NOT NULL DEFAULT 0,
  red_cards INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(4, 2) NOT NULL DEFAULT 6.50,
  golden_boot_points NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Enable RLS
ALTER TABLE public.uefa_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uefa_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uefa_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_player_season_stats ENABLE ROW LEVEL SECURITY;

-- 6. Access Policies
CREATE POLICY "Public read/write access to uefa_tournaments"
  ON public.uefa_tournaments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read/write access to uefa_standings"
  ON public.uefa_standings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read/write access to uefa_matches"
  ON public.uefa_matches FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read/write access to global_player_season_stats"
  ON public.global_player_season_stats FOR ALL USING (true) WITH CHECK (true);

-- 7. Indexes for Fast Cross-League Leaderboards
CREATE INDEX IF NOT EXISTS idx_uefa_standings_rank ON public.uefa_standings(tournament_state_id, rank);
CREATE INDEX IF NOT EXISTS idx_uefa_matches_week ON public.uefa_matches(tournament_state_id, match_week);
CREATE INDEX IF NOT EXISTS idx_global_player_goals ON public.global_player_season_stats(career_id, golden_boot_points DESC);
CREATE INDEX IF NOT EXISTS idx_global_player_assists ON public.global_player_season_stats(career_id, assists DESC);
