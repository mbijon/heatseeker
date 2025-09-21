-- Ensure UUID generation helper is available
create extension if not exists "pgcrypto";

-- Create table to store Heatseeker leaderboard sessions
create table if not exists public.game_sessions (
  session_id uuid primary key default gen_random_uuid(),
  ip_address inet,
  user_agent text,
  is_human boolean,
  level_reached integer not null default 0,
  total_moves integer not null default 0,
  player_name varchar(16),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_name_length check (player_name is null or length(btrim(player_name)) <= 16)
);

-- Ensure updated_at stays fresh on mutation
create or replace function public.set_game_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists game_sessions_set_updated_at on public.game_sessions;
create trigger game_sessions_set_updated_at
before update on public.game_sessions
for each row execute function public.set_game_sessions_updated_at();

-- Ordering index for leaderboard queries (higher level first, then fewer moves, newest tiebreaker)
create index if not exists game_sessions_leaderboard_idx
  on public.game_sessions (level_reached desc, total_moves asc, updated_at asc);

-- Enforce row-level security and policies
alter table public.game_sessions enable row level security;

drop policy if exists "public leaderboard access" on public.game_sessions;
create policy "public leaderboard access" on public.game_sessions
for select
using (player_name is not null and length(btrim(player_name)) > 0);

drop policy if exists "service role manage sessions" on public.game_sessions;
create policy "service role manage sessions" on public.game_sessions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Grant insert/update via service role while allowing read-only analytics for named runs
grant select on public.game_sessions to anon;
grant all privileges on public.game_sessions to service_role;
