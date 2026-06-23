-- Adds spec/dispensing metadata to the machine catalogue so the public
-- machine PDP can render capacity, dispense mechanisms, what each unit
-- dispenses (or its capabilities), and the "where it works well" guidance.
-- These mirror the Bright.Blue events brochure (Europa, Blinx, Hyperion,
-- Callisto and the Kiosk range). Data itself is populated by seed.sql.

alter table machines add column if not exists capacity_label text;
alter table machines add column if not exists mechanisms jsonb not null default '[]';
alter table machines add column if not exists dispenses jsonb not null default '[]';
alter table machines add column if not exists features jsonb not null default '[]';
alter table machines add column if not exists best_for jsonb not null default '[]';
