-- ============================================================
-- Machine site requirements — what a venue needs to approve a unit
-- ============================================================
--
-- The catalogue already describes what a machine *does* (capacity, dispense
-- mechanisms, what it hands out). It says nothing about what a machine *needs*
-- to stand somewhere, which is the half a show organizer has to forward to
-- their venue: footprint, weight, the electrical order, connectivity, and the
-- clearance an engineer needs to open it.
--
-- Every exhibition venue asks for these before move-in, on a deadline weeks
-- ahead of the show. Without them here, an organizer has to email us and wait,
-- which is exactly the loop the portal exists to remove.
--
-- Free text rather than structured numbers: these are quoted verbatim into
-- venue paperwork, and "230V, 13A standard socket (dedicated circuit)" carries
-- more than three numeric columns would. `weight_kg` is numeric because floor
-- loading is arithmetic the venue does.

alter table machines add column if not exists footprint_mm text;
alter table machines add column if not exists weight_kg numeric;
alter table machines add column if not exists power_spec text;
alter table machines add column if not exists connectivity text;
alter table machines add column if not exists clearance_notes text;

comment on column machines.footprint_mm is
  'Installed footprint as W x D x H in millimetres, for the venue floor plan.';
comment on column machines.weight_kg is
  'Operating weight in kilograms, for floor-loading and lifting plans.';
comment on column machines.power_spec is
  'Electrical requirement quoted to the show contractor (voltage, current, socket).';
comment on column machines.connectivity is
  'How the unit gets online, including the fallback.';
comment on column machines.clearance_notes is
  'Service access and ventilation clearance an engineer needs on site.';
