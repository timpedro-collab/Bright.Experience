-- ============================================================
-- Evergreen demo dates: in-database date-shift engine
-- ============================================================
-- The demo dataset is authored around a fixed "today" (2026-06-18, the same
-- anchor as the mock dataset's shift-dates engine). Without maintenance the
-- live demo rots: "live" events end, deadlines blow through, dashboards show
-- a museum. This migration installs:
--
--   1. `demo_meta`  — one row recording the authored anchor and how many days
--      the data has already been shifted (scripts/shift-live-dates.mjs uses
--      the same bookkeeping for manual runs).
--   2. `shift_demo_dates()` — shifts every date/timestamp/timestamptz column
--      in the public schema forward to keep the anchor aligned with today,
--      preserving all relative spacing. Columns that cannot legitimately be
--      in the future (activity, audit stamps) are clamped back if the shift
--      would push them past now() — those rows were authored relative to
--      real time (seed rows using now() - interval) and must keep their
--      recency.
--   3. A pg_cron schedule (04:10 UTC daily) so the demo maintains itself.
--      Guarded: environments without pg_cron (local Docker) skip scheduling.
--
-- NOT for production-with-real-customers: this rewrites history wholesale.
-- It exists for the demo phase and is disarmed by deleting the demo_meta row.

create table if not exists public.demo_meta (
  id int primary key check (id = 1),
  anchor_date date not null,
  shifted_days int not null default 0,
  last_shifted_at timestamptz
);

insert into public.demo_meta (id, anchor_date, shifted_days)
values (1, '2026-06-18', 0)
on conflict (id) do nothing;

-- Bookkeeping table is internal-only.
alter table public.demo_meta enable row level security;

create or replace function public.shift_demo_dates()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anchor date;
  v_shifted int;
  v_target int;
  v_delta int;
  rec record;
  v_sets text;
  v_col text;
begin
  select anchor_date, shifted_days into v_anchor, v_shifted
  from demo_meta where id = 1;
  if not found then
    return; -- disarmed
  end if;

  v_target := current_date - v_anchor;
  v_delta := v_target - v_shifted;
  if v_delta <= 0 then
    return;
  end if;

  -- Bulk bookkeeping move: keep updated_at stamps as data, not as "edited now".
  set local session_replication_role = replica;

  for rec in
    select c.table_name,
           array_agg(c.column_name::text order by c.ordinal_position) as cols
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.table_name <> 'demo_meta'
      and c.is_generated = 'NEVER'
      and c.is_updatable = 'YES'
      and c.data_type in ('date', 'timestamp with time zone', 'timestamp without time zone')
    group by c.table_name
  loop
    select string_agg(
             format('%I = %I + interval ''%s days''', col, col, v_delta), ', ')
      into v_sets
      from unnest(rec.cols) as col;
    execute format('update public.%I set %s', rec.table_name, v_sets);

    -- Clamp already-happened columns back out of the future. Deadline-like
    -- columns (event dates, due dates, expiries) may legitimately be future
    -- and keep the shift.
    foreach v_col in array rec.cols loop
      if v_col not in (
           'event_date_start', 'event_date_end', 'setup_date', 'collection_date',
           'start_date', 'end_date', 'due_date', 'due_at', 'target_date',
           'scheduled_date', 'snoozed_until', 'next_send_at'
         )
         and v_col not like '%expires_at'
      then
        execute format(
          'update public.%I set %I = %I - interval ''%s days'' where %I > now()',
          rec.table_name, v_col, v_col, v_delta, v_col);
      end if;
    end loop;
  end loop;

  update demo_meta
     set shifted_days = v_target, last_shifted_at = now()
   where id = 1;
end;
$$;

-- Internal maintenance only — never callable from clients.
revoke execute on function public.shift_demo_dates() from public, anon, authenticated;

-- Schedule daily at 04:10 UTC where pg_cron is available (Supabase hosted).
do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron unavailable — skipping demo date-shift schedule';
    return;
  end;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'shift-demo-dates',
      '10 4 * * *',
      'select public.shift_demo_dates()'
    );
  end if;
end;
$$;
