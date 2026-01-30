-- Olive user settings: Budget vs Splurge mode
-- Run in Supabase SQL Editor (same project as memory.sql)

create table if not exists public.olive_user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  shopping_mode text not null default 'splurge' check (shopping_mode in ('budget', 'splurge')),
  updated_at timestamptz not null default now()
);

create index if not exists olive_user_settings_user_id_idx
  on public.olive_user_settings (user_id);

alter table public.olive_user_settings enable row level security;

create policy "olive_user_settings_select_own"
  on public.olive_user_settings
  for select
  using (auth.uid() = user_id);

-- Insert/update via API use service role (bypasses RLS)
