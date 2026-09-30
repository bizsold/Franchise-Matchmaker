-- Run this entire script once in the Supabase SQL Editor.
-- The query at the bottom returns the 100 most recent broker admin changes.

create table if not exists public.broker_audit_log (
  id bigint generated always as identity primary key,
  changed_at timestamptz not null default now(),
  admin_name text not null,
  action text not null,
  broker_name text,
  summary text not null,
  before_data jsonb,
  after_data jsonb
);

create index if not exists broker_audit_log_changed_at_idx
  on public.broker_audit_log (changed_at desc);

alter table public.broker_audit_log enable row level security;

drop policy if exists "Allow broker audit reads" on public.broker_audit_log;
create policy "Allow broker audit reads"
  on public.broker_audit_log
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow broker audit inserts" on public.broker_audit_log;
create policy "Allow broker audit inserts"
  on public.broker_audit_log
  for insert
  to anon, authenticated
  with check (
    length(trim(admin_name)) > 0
    and length(trim(action)) > 0
    and length(trim(summary)) > 0
  );

grant select, insert on public.broker_audit_log to anon, authenticated;
grant usage, select on sequence public.broker_audit_log_id_seq to anon, authenticated;

-- Most recent 100 changes:
select
  changed_at,
  admin_name,
  action,
  broker_name,
  summary,
  before_data,
  after_data
from public.broker_audit_log
order by changed_at desc
limit 100;
