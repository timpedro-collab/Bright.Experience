-- ============================================================
-- Organizer creative reads — artwork status on their own shows
-- ============================================================
--
-- Organizers already attach creative to a sponsor slot (`attachSlotCreatives`)
-- and the machine readiness checklist reports whether a sold unit has artwork
-- approved yet. Both read `assets`, which until now only customers of the
-- owning account and internal staff could see — so for a real organizer the
-- creative picker came back empty and readiness always read "no artwork".
--
-- Scoped the same way as every other organizer policy (their own shows) and
-- narrowed to `customer_visible`, matching what the brand's own team sees.
-- Internal working files stay internal.
--
-- SELECT only. Uploading and approving artwork stays with the brand supplying
-- it and the creative team reviewing it; an organizer chases it, they don't
-- sign it off.

create policy "Organizer users see own show creative"
  on assets for select using (
    customer_visible = true
    and event_id in (
      select id from events where organizer_partner_id = user_partner_id()
    )
  );
