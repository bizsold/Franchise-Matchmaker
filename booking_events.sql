-- ============================================================
-- Append-only booking audit log (run once in Supabase SQL Editor)
-- Safe to re-run: uses "if not exists" / "drop policy if exists".
-- ============================================================

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('booked', 'unbooked')),
  broker_name text not null,
  setter_name text not null,
  date_est text not null,
  lead_city text,
  lead_state text,
  booking_created_at timestamptz,
  event_at timestamptz not null default now(),
  success boolean not null default true,
  error_message text,
  source text
);

create index if not exists booking_events_date_est_idx
  on public.booking_events (date_est, event_at desc);

create index if not exists booking_events_broker_name_idx
  on public.booking_events (broker_name, event_at desc);

alter table public.booking_events enable row level security;

grant select, insert on table public.booking_events to anon, authenticated;

drop policy if exists "anon read booking_events" on public.booking_events;
drop policy if exists "anon insert booking_events" on public.booking_events;

create policy "anon read booking_events"
  on public.booking_events for select to anon using (true);

create policy "anon insert booking_events"
  on public.booking_events for insert to anon with check (true);
