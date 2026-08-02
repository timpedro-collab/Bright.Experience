-- ============================================================
-- Organizer machine detail — configuration reads
-- ============================================================
--
-- The organizer machine page answers "what is this unit doing?", which means
-- showing the configuration running on it: game, prize mode, capture method,
-- prize list, capture rules, retention window. None of that carries contact
-- details, so an organizer may read it for their own shows.
--
-- Deliberately SELECT only. Configuration is a delivery artefact that ops,
-- creative and the brand iterate on together; an organizer reads what is set
-- rather than editing it behind the delivery team's back.
--
-- Also deliberately NOT added: any write policy on `machine_instances`.
-- Organizers set a unit's zone and mission through `updateMachineDeployment`,
-- which authorizes the caller against the show and then writes exactly those
-- two columns with the service-role client. RLS cannot restrict an UPDATE to
-- named columns, so a policy here would hand organizers the whole row —
-- including `current_event_id` and `status` on our hardware. The server
-- action is the narrower door. `supabase/tests/rls_organizers.test.sql`
-- asserts the table stays read-only for them.

create policy "Organizer users see own show game config"
  on game_configurations for select using (
    event_id in (
      select id from events where organizer_partner_id = user_partner_id()
    )
  );

create policy "Organizer users see own show product config"
  on product_configurations for select using (
    event_id in (
      select id from events where organizer_partner_id = user_partner_id()
    )
  );
