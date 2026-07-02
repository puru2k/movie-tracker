-- Movie Tracker — Supabase schema for the web (cloud, multi-user) build.
--
-- How to apply:
--   1. Create a project at https://supabase.com
--   2. Open the SQL Editor and paste/run this whole file.
--   3. Copy the Project URL and the anon public key (Settings → API) into your
--      web build's .env as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
--
-- Every row is owned by a user (auth.users). Row-Level Security ensures each
-- account can only read and write its own library.

create table if not exists public.movies (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  tmdb_id        bigint not null,
  title          text not null,
  poster_path    text,
  backdrop_path  text,
  release_date   text,
  overview       text,
  runtime        integer,
  genres         jsonb not null default '[]'::jsonb,
  cast_members   jsonb not null default '[]'::jsonb,
  director       text,
  status         text not null default 'to_watch',
  rating         integer,
  watch_date     text,
  watch_dates    jsonb not null default '[]'::jsonb,
  notes          text,
  review         text,
  spoiler        integer not null default 0,
  rewatch_count  integer not null default 0,
  platform       text,
  tags           jsonb not null default '[]'::jsonb,
  favorite       integer not null default 0,
  poster_cache   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, tmdb_id)
);

create index if not exists movies_user_id_idx on public.movies (user_id);
create index if not exists movies_user_status_idx on public.movies (user_id, status);

-- Row-Level Security: users only ever touch their own rows.
alter table public.movies enable row level security;

drop policy if exists "movies_select_own" on public.movies;
create policy "movies_select_own"
  on public.movies for select
  using (auth.uid() = user_id);

drop policy if exists "movies_insert_own" on public.movies;
create policy "movies_insert_own"
  on public.movies for insert
  with check (auth.uid() = user_id);

drop policy if exists "movies_update_own" on public.movies;
create policy "movies_update_own"
  on public.movies for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "movies_delete_own" on public.movies;
create policy "movies_delete_own"
  on public.movies for delete
  using (auth.uid() = user_id);
