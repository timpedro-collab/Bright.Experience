-- =====================================================================
-- RLS hardening: qa_items + event_reports (STUBS-TO-REPLACE open item).
--
-- Before this migration, app-layer guards were the only thing keeping
-- customers out of two surfaces the product never shows them:
--
--   1. qa_items — the QA checklist is an internal readiness tool. The
--      event page section is internal-only (see src/lib/event-access.ts),
--      but the DB still allowed customers to SELECT items for their own
--      events. Drop that policy: SELECT is now internal-only.
--
--   2. event_reports — customers could SELECT unpublished (draft) reports
--      for their events; the reports page hid drafts in the UI only.
--      Replace the customer SELECT policy with one that also requires
--      is_published = true, matching the app behaviour.
--
-- Internal access is unchanged ("Internal … " policies already cover
-- select/manage). Anon shared-report access is unchanged (still requires
-- is_published = true AND share_token).
--
-- pgTAP coverage: supabase/tests/rls_qa_items.test.sql and the updated
-- supabase/tests/rls_reports.sql.
-- =====================================================================

-- 1) qa_items: internal-only SELECT
drop policy if exists "Customers see own event QA items" on qa_items;

-- 2) event_reports: customers read only published reports for their events
drop policy if exists "Customers see own event reports" on event_reports;

create policy "Customers see own published event reports"
  on event_reports for select using (
    is_published = true
    and event_id in (
      select id from events where account_id = user_account_id()
    )
  );
