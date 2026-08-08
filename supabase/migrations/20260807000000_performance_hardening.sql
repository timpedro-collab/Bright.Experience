-- Performance & security hardening (from Supabase advisor findings, Aug 2026).
--
-- 1. Covering indexes for all 50 foreign keys the performance advisor flagged
--    as unindexed (joins and cascading deletes on these columns were doing
--    sequential scans).
-- 2. Rewrite 13 RLS policies that called auth.uid() per row so the value is
--    computed once per statement via a scalar subquery (the "Auth RLS
--    Initialization Plan" advisor finding).
-- 3. Pin search_path on update_updated_at (mutable search_path warning) and
--    revoke client EXECUTE on internal SECURITY DEFINER functions that only
--    triggers/migrations call.

-- ---------------------------------------------------------------------------
-- 1. Foreign-key covering indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_api_keys_account_id ON public.api_keys (account_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_partner_id ON public.api_keys (partner_id);
CREATE INDEX IF NOT EXISTS idx_approvals_decided_by ON public.approvals (decided_by);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON public.approvals (requested_by);
CREATE INDEX IF NOT EXISTS idx_asset_annotations_asset_version_id ON public.asset_annotations (asset_version_id);
CREATE INDEX IF NOT EXISTS idx_asset_annotations_author_id ON public.asset_annotations (author_id);
CREATE INDEX IF NOT EXISTS idx_asset_versions_review_decided_by ON public.asset_versions (review_decided_by);
CREATE INDEX IF NOT EXISTS idx_asset_versions_uploaded_by ON public.asset_versions (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_assets_review_decided_by ON public.assets (review_decided_by);
CREATE INDEX IF NOT EXISTS idx_assets_reviewed_by ON public.assets (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_assets_task_id ON public.assets (task_id);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON public.assets (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_audit_entries_actor_id ON public.audit_entries (actor_id);
CREATE INDEX IF NOT EXISTS idx_briefing_responses_submitted_by ON public.briefing_responses (submitted_by);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments (author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_reviewed_by ON public.compliance_documents (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_uploaded_by ON public.compliance_documents (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_deal_registrations_event_id ON public.deal_registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_deal_registrations_quote_id ON public.deal_registrations (quote_id);
CREATE INDEX IF NOT EXISTS idx_event_team_members_approved_by ON public.event_team_members (approved_by);
CREATE INDEX IF NOT EXISTS idx_event_team_members_profile_id ON public.event_team_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_event_team_members_requested_by ON public.event_team_members (requested_by);
CREATE INDEX IF NOT EXISTS idx_event_templates_created_by ON public.event_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events (created_by);
CREATE INDEX IF NOT EXISTS idx_events_template_id ON public.events (template_id);
CREATE INDEX IF NOT EXISTS idx_game_configurations_game_id ON public.game_configurations (game_id);
CREATE INDEX IF NOT EXISTS idx_game_configurations_submitted_by ON public.game_configurations (submitted_by);
CREATE INDEX IF NOT EXISTS idx_handoff_notes_author_id ON public.handoff_notes (author_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices (created_by);
CREATE INDEX IF NOT EXISTS idx_journey_touches_lead_id ON public.journey_touches (lead_id);
CREATE INDEX IF NOT EXISTS idx_logistics_entries_completed_by ON public.logistics_entries (completed_by);
CREATE INDEX IF NOT EXISTS idx_machine_instances_machine_type_id ON public.machine_instances (machine_type_id);
CREATE INDEX IF NOT EXISTS idx_milestones_completed_by ON public.milestones (completed_by);
CREATE INDEX IF NOT EXISTS idx_partner_attributions_event_id ON public.partner_attributions (event_id);
CREATE INDEX IF NOT EXISTS idx_partner_attributions_quote_id ON public.partner_attributions (quote_id);
CREATE INDEX IF NOT EXISTS idx_qa_items_created_by ON public.qa_items (created_by);
CREATE INDEX IF NOT EXISTS idx_qa_items_fixed_by ON public.qa_items (fixed_by);
CREATE INDEX IF NOT EXISTS idx_qa_items_tested_by ON public.qa_items (tested_by);
CREATE INDEX IF NOT EXISTS idx_quotes_partner_id ON public.quotes (partner_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_exports_created_by ON public.scheduled_exports (created_by);
CREATE INDEX IF NOT EXISTS idx_sponsorship_slots_sponsor_account_id ON public.sponsorship_slots (sponsor_account_id);
CREATE INDEX IF NOT EXISTS idx_studio_requests_approved_by ON public.studio_requests (approved_by);
CREATE INDEX IF NOT EXISTS idx_studio_requests_created_by ON public.studio_requests (created_by);
CREATE INDEX IF NOT EXISTS idx_studio_requests_source_asset_id ON public.studio_requests (source_asset_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_by ON public.tasks (completed_by);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id ON public.tasks (milestone_id);
CREATE INDEX IF NOT EXISTS idx_venue_packages_bright_blue_package_id ON public.venue_packages (bright_blue_package_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_account_id ON public.webhook_subscriptions (account_id);
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_partner_id ON public.webhook_subscriptions (partner_id);

-- ---------------------------------------------------------------------------
-- 2. RLS: evaluate auth.uid() once per statement, not per row
-- ---------------------------------------------------------------------------
ALTER POLICY "Users can insert own profile" ON public.profiles
  WITH CHECK (id = (SELECT auth.uid()));
ALTER POLICY "Users can update own profile" ON public.profiles
  USING (id = (SELECT auth.uid()));
ALTER POLICY "Users can view own profile" ON public.profiles
  USING (id = (SELECT auth.uid()));

ALTER POLICY "Customers can update own tasks" ON public.tasks
  USING (
    customer_visible = true
    AND assigned_to = (SELECT auth.uid())
    AND event_id IN (
      SELECT events.id FROM events WHERE events.account_id = user_account_id()
    )
  );

ALTER POLICY "Any authenticated user can create audit" ON public.audit_entries
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

ALTER POLICY "System can insert notifications" ON public.notifications
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
ALTER POLICY "Users can mark own notifications read" ON public.notifications
  USING (user_id = (SELECT auth.uid()));
ALTER POLICY "Users see own notifications" ON public.notifications
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users see own partner membership" ON public.partner_users
  USING (profile_id = (SELECT auth.uid()));

ALTER POLICY "Users manage own notification preferences" ON public.notification_preferences
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
ALTER POLICY "Users see own notification preferences" ON public.notification_preferences
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY "Users manage own notification timing" ON public.notification_user_settings
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
ALTER POLICY "Users see own notification timing" ON public.notification_user_settings
  USING (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Function hardening
-- ---------------------------------------------------------------------------
-- Trigger only touches NEW + now(); pin search_path so it cannot be hijacked.
ALTER FUNCTION public.update_updated_at() SET search_path = '';

-- Only the auth-schema trigger invokes this; clients never should.
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;

-- Migration bookkeeping helper; not for clients.
REVOKE EXECUTE ON FUNCTION public.schema_migration_version() FROM PUBLIC, anon, authenticated;
