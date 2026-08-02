-- ============================================================
-- Indexes for the hot read paths, and removal of the redundant singles
-- ============================================================
--
-- Every index below comes from an actual query in the app, not from a guess.
-- The pattern the schema was missing is the composite: almost every list in
-- this product filters by a parent (event, user, account) and then orders by
-- a date or a sort column. A single-column index on the parent gets the
-- planner to the right rows but still forces a sort of all of them, which is
-- the difference between a 5ms page and a 2s page once an event has tens of
-- thousands of telemetry rows or leads.
--
-- Where a composite starts with the same column as an existing single-column
-- index, the single is dropped: Postgres can use any leftmost prefix, so
-- keeping both only costs write throughput and buffer cache.
--
-- On a production database with real row counts, create these with
-- `create index concurrently` from a session outside a migration transaction.
-- Here they are plain statements because the tables are small at the time
-- this migration lands and Supabase runs migrations in a transaction.

-- ── events ───────────────────────────────────────────────────────────
-- The portfolio list, the "upcoming events" cron windows and the deadline
-- queries all filter or sort on the start date; nothing indexed it.
create index if not exists idx_events_date_start
  on events (event_date_start);

-- ── telemetry_events (the highest-volume table in the system) ────────
-- `refreshEventMetrics` and the Cloud webhook both run four counts per
-- ingest, filtered by event + type + a day window. Without the composite,
-- each count re-scans every row the event has ever produced.
create index if not exists idx_telemetry_event_type_time
  on telemetry_events (event_id, event_type, "timestamp");

-- The live feed and report range queries filter event + window across all
-- types, which the three-column index above can't serve efficiently.
create index if not exists idx_telemetry_event_time
  on telemetry_events (event_id, "timestamp" desc);

drop index if exists idx_telemetry_event; -- prefix of both composites

-- ── leads ────────────────────────────────────────────────────────────
-- Lead table pagination, the aggregate scan, the daily count and the
-- retention purge all filter event_id and then work on captured_at.
create index if not exists idx_leads_event_captured
  on leads (event_id, captured_at desc);

drop index if exists idx_leads_event;

-- ── tasks ────────────────────────────────────────────────────────────
create index if not exists idx_tasks_event_status
  on tasks (event_id, status);

-- "My tasks" filters by assignee and orders by due date.
create index if not exists idx_tasks_assigned_due
  on tasks (assigned_to, due_date);

drop index if exists idx_tasks_event;
drop index if exists idx_tasks_assigned;

-- ── notifications ────────────────────────────────────────────────────
-- The bell list is per-user, newest first, and is fetched on every page.
create index if not exists idx_notifications_user_created
  on notifications (user_id, created_at desc);

drop index if exists idx_notifications_user; -- prefix of user_created / user_is_read

-- ── messages ─────────────────────────────────────────────────────────
create index if not exists idx_messages_event_created
  on messages (event_id, created_at);

drop index if exists idx_messages_event;

-- ── assets ───────────────────────────────────────────────────────────
-- The asset review queue is cross-event: it filters on review_status and
-- orders oldest-first, so the existing (event_id, review_status) index
-- cannot help it.
create index if not exists idx_assets_review_queue
  on assets (review_status, created_at);

-- ── quotes ───────────────────────────────────────────────────────────
create index if not exists idx_quotes_status_created
  on quotes (status, created_at desc);

drop index if exists idx_quotes_status;

-- ── audit_entries ────────────────────────────────────────────────────
-- The activity page is paginated per event, newest first.
create index if not exists idx_audit_event_created
  on audit_entries (event_id, created_at desc);

drop index if exists idx_audit_event;

-- ── sponsorship_slots ────────────────────────────────────────────────
-- Organizer views ask for a show's slots by status (available / held / sold).
create index if not exists idx_sponsorship_slots_event_status
  on sponsorship_slots (event_id, status);

drop index if exists idx_sponsorship_slots_event;

-- ── milestones / logistics ───────────────────────────────────────────
create index if not exists idx_milestones_event_sort
  on milestones (event_id, sort_order);

drop index if exists idx_milestones_event;

create index if not exists idx_logistics_event_date
  on logistics_entries (event_id, scheduled_date);

drop index if exists idx_logistics_event;

-- ── admin SLA queues ─────────────────────────────────────────────────
-- "Approvals overdue" is a cross-event count: status plus an age cutoff.
create index if not exists idx_approvals_status_requested
  on approvals (status, requested_at);

drop index if exists idx_approvals_status;

-- "Briefings overdue" only ever looks at the unsubmitted ones, so the
-- partial index stays small no matter how many briefings are completed.
create index if not exists idx_briefing_pending_updated
  on briefing_responses (updated_at)
  where is_submitted = false;

-- ── housekeeping ─────────────────────────────────────────────────────
-- idx_profiles_account and idx_profiles_account_id are the same index under
-- two names (added by two different migrations).
drop index if exists idx_profiles_account_id;
