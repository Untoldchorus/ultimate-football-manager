-- Optional Seed Data for Supabase Competitions
insert into public.competitions (id, name, competition_type) values
  ('division1', 'Premier Division 1', 'league'),
  ('division2', 'Championship Division 2', 'league'),
  ('domesticCup', 'National Challenge Cup', 'knockout'),
  ('championsCup', 'Continental Champions Cup', 'knockout'),
  ('superCup', 'Continental Super Cup', 'single')
on conflict (id) do nothing;
