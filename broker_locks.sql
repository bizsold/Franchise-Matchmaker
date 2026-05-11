-- Run in Supabase SQL Editor (once). Mirrors broker_focus RLS pattern.

create table if not exists public.broker_locks (
  broker_name text primary key,
  hard_locked boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.broker_locks enable row level security;

drop policy if exists "anon read broker_locks" on public.broker_locks;
drop policy if exists "anon write broker_locks" on public.broker_locks;
drop policy if exists "anon update broker_locks" on public.broker_locks;

create policy "anon read broker_locks"
  on public.broker_locks for select to anon using (true);

create policy "anon write broker_locks"
  on public.broker_locks for insert to anon with check (true);

create policy "anon update broker_locks"
  on public.broker_locks for update to anon using (true) with check (true);
