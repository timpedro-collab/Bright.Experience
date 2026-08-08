-- Campaign naming + planning month (experience audit 2.F / 2.H).
--
-- `campaign_name`: the customer's own name for their campaign, captured at
-- intake. Flows into the provisioned event's `name` (and from there into the
-- report headline, which derives from the event name).
--
-- `planning_month`: 'YYYY-MM' — when the customer plans next year's
-- budget/events. Drives the `report.planning_resend` lifecycle nudge that
-- re-sends their published report when that month arrives.

alter table public.quotes add column if not exists campaign_name text;
alter table public.quotes add column if not exists planning_month text;

comment on column public.quotes.campaign_name is
  'Customer-chosen campaign name from intake; preferred over the generated name when provisioning the event.';
comment on column public.quotes.planning_month is
  'YYYY-MM month the customer plans next year''s events; triggers the planning-season report re-send nudge.';
