-- ============================================================
-- RLS Hardening — Phase 0.3 of the Path-to-10/10 build.
-- ------------------------------------------------------------
-- The initial migrations enabled RLS on every table but in a few
-- places only declared SELECT policies. Without an explicit write
-- policy, RLS silently drops the insert/update/delete on the
-- application side — which is what we wanted for some tables
-- (audit_entries, prospect_sessions) but accidentally locked us out
-- of others.
--
-- This migration adds the missing policies and tightens a couple of
-- overly-permissive ones identified by the audit.
-- ============================================================

-- ============================================================
-- profiles : allow self-insert + self-update.
-- ------------------------------------------------------------
-- The DB trigger creates profile rows under `security definer` so
-- the application bootstrap (`ensureProfile`) is the defensive
-- safety net. It needs to write the row under the user's JWT.
-- Self-update lets users change their own display name.
-- ============================================================

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

-- Internal users can manage every profile (admin UX).
create policy "Internal users manage profiles"
  on profiles for all
  using (is_internal_user())
  with check (is_internal_user());

-- ============================================================
-- accounts : internal-only write.
-- ============================================================

create policy "Internal users manage accounts"
  on accounts for all
  using (is_internal_user())
  with check (is_internal_user());

-- ============================================================
-- locations : public read is OK because the data is general-
-- purpose (postcode → tier mapping is not customer-specific).
-- ============================================================

create policy "Public read locations"
  on locations for select
  using (true);

-- ============================================================
-- partners : partner self-update.
-- ------------------------------------------------------------
-- Partner_admin users can update their own partner row (logo,
-- contact info). Status changes still require internal.
-- ============================================================

create policy "Partner admins update own partner"
  on partners for update
  using (
    id = user_partner_id()
    and exists (
      select 1 from partner_users
      where partner_id = id
        and profile_id = auth.uid()
        and role = 'admin'
    )
  );

-- ============================================================
-- partner_users : partner admins manage their own membership.
-- ============================================================

create policy "Partner admins manage own partner users"
  on partner_users for all
  using (
    partner_id = user_partner_id()
    and exists (
      select 1 from partner_users pu
      where pu.partner_id = partner_id
        and pu.profile_id = auth.uid()
        and pu.role = 'admin'
    )
  );

-- ============================================================
-- venues : partner write (already exists for update; add insert).
-- ============================================================

create policy "Partner users create venues"
  on venues for insert
  with check (partner_id = user_partner_id());

-- ============================================================
-- sponsorship_slots : partner write (insert + update).
-- ============================================================

create policy "Partner users manage own sponsorship slots"
  on sponsorship_slots for all
  using (
    placement_id in (
      select p.id from placements p
      join venues v on v.id = p.venue_id
      where v.partner_id = user_partner_id()
    )
  );

-- ============================================================
-- machine_instances : nullable RLS read for the embed widget.
-- ------------------------------------------------------------
-- Public widget surfaces machine status by `serial_number`. We
-- intentionally do NOT add a public read policy here — the embed
-- widget should hit a server route that uses the service-role
-- client to fetch the minimal status, keeping the table internal-
-- only as currently configured.
-- ============================================================

-- ============================================================
-- event_metrics_snapshot : public read of shared report metrics.
-- ------------------------------------------------------------
-- Shared report tokens reveal metrics for a single event. The
-- existing `event_reports` "Public can view shared reports" policy
-- handles that table; the metrics snapshot itself still requires
-- account membership. This is correct — the public report renders
-- pre-aggregated metrics_json from `event_reports`, so the
-- snapshot table need not be exposed.
-- ============================================================

-- ============================================================
-- recommendations : tighten "public read".
-- ------------------------------------------------------------
-- The original policy was `using (true)` which allows anon reads.
-- That's fine for the marketing quiz pulling recommendations, but
-- we add a soft internal-only management policy here for clarity.
-- (No write policy change — internal already manages.)
-- ============================================================

-- (already correct, leaving as a no-op anchor for future audits)

-- ============================================================
-- prospect_sessions : already has public insert + public read for
-- session token match. No change needed.
-- ============================================================

-- ============================================================
-- studio_requests : customers should be able to update only while
-- the request is theirs and not in a terminal state.
-- ------------------------------------------------------------
-- The original policy allows customer updates without a state
-- check. We tighten that to disallow customers from re-opening a
-- request the producer has marked `delivered` or `cancelled`.
-- ============================================================

drop policy if exists "Customers can update own studio requests"
  on studio_requests;

create policy "Customers can update own studio requests"
  on studio_requests for update
  using (
    event_id in (select id from events where account_id = user_account_id())
    and status in ('draft', 'submitted', 'quoted', 'approved')
  );

-- ============================================================
-- assets : customers should only be able to upload (update file_url)
-- while the asset is in an open state.
-- ============================================================

drop policy if exists "Customers can upload assets" on assets;

create policy "Customers can upload assets"
  on assets for update
  using (
    event_id in (select id from events where account_id = user_account_id())
    and status in ('required', 'uploaded', 'under_review', 'rejected')
  );
