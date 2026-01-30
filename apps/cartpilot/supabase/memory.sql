-- Olive memory tables for MVP

create table if not exists public.olive_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null,
  term text not null,
  upc text,
  description text,
  price numeric,
  store_location_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.olive_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  term text not null,
  preferred_upc text,
  preferred_brand text,
  preferred_size text,
  notes text,
  times_used integer not null default 0,
  last_used_at timestamptz
);

create unique index if not exists olive_preferences_user_term_idx
  on public.olive_preferences (user_id, term);

alter table public.olive_events enable row level security;
alter table public.olive_preferences enable row level security;

-- Allow users to view their own history/preferences
create policy "olive_events_select_own"
  on public.olive_events
  for select
  using (auth.uid() = user_id);

create policy "olive_preferences_select_own"
  on public.olive_preferences
  for select
  using (auth.uid() = user_id);

-- Server-side writes use service role (bypass RLS)
