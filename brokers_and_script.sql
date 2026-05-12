-- ============================================================
-- Brokers master roster + script config (run once in Supabase)
-- Safe to re-run: uses "if not exists" / "drop policy if exists".
-- ============================================================

-- ---------- brokers (master roster) ----------
create table if not exists public.brokers (
  broker_name text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.brokers enable row level security;

drop policy if exists "anon read brokers"   on public.brokers;
drop policy if exists "anon insert brokers" on public.brokers;
drop policy if exists "anon update brokers" on public.brokers;
drop policy if exists "anon delete brokers" on public.brokers;

create policy "anon read brokers"
  on public.brokers for select to anon using (true);

create policy "anon insert brokers"
  on public.brokers for insert to anon with check (true);

create policy "anon update brokers"
  on public.brokers for update to anon using (true) with check (true);

create policy "anon delete brokers"
  on public.brokers for delete to anon using (true);


-- ---------- app_script (single-row script config) ----------
create table if not exists public.app_script (
  id int primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_script enable row level security;

drop policy if exists "anon read app_script"   on public.app_script;
drop policy if exists "anon insert app_script" on public.app_script;
drop policy if exists "anon update app_script" on public.app_script;

create policy "anon read app_script"
  on public.app_script for select to anon using (true);

create policy "anon insert app_script"
  on public.app_script for insert to anon with check (true);

create policy "anon update app_script"
  on public.app_script for update to anon using (true) with check (true);
