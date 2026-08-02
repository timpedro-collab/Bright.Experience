-- Capture quality + retention (client-committed features, see
-- docs/13-dev-handover-priorities.md P2.1 / P2.3 / P2.4).
--
-- game_configurations gains:
--   capture_rules_json  — machine-enforced data-capture rules (business-emails-
--                         only + domain blocklist, duplicate blocking, GDPR
--                         consent checkbox + copy). The portal is the source of
--                         truth; the machine capture flow enforces them via the
--                         config-sync payload (docs/10-integrations.md §1b).
--   retention_days      — how long captured leads are kept before the purge
--                         cron deletes them (default 60 days, per standard
--                         EU-market terms).
--   branded_landing     — whether the QR data-capture landing page is rendered
--                         with the customer's brand kit (paid upsell).
--
-- leads gains:
--   consented_at        — when the person ticked the GDPR consent checkbox at
--                         the machine. Null for legacy rows / non-consent flows.

alter table game_configurations
  add column if not exists capture_rules_json jsonb not null default '{}',
  add column if not exists retention_days integer not null default 60,
  add column if not exists branded_landing boolean not null default false;

alter table leads
  add column if not exists consented_at timestamptz;

comment on column game_configurations.capture_rules_json is
  'Capture-quality rules enforced at the machine: { businessEmailsOnly, blockedDomains[], blockDuplicates, consentRequired, consentText }';
comment on column game_configurations.retention_days is
  'Days captured leads are retained before the purge cron deletes them';
comment on column game_configurations.branded_landing is
  'Paid upsell: render the data-capture landing page with the customer brand kit';
comment on column leads.consented_at is
  'Timestamp the attendee gave GDPR consent at the point of capture (null = not recorded)';
