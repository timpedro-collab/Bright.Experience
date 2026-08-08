-- Report reveal moment: a personal note from the delivery lead attached at
-- publish time, rendered on the portal and public report pages.
alter table public.event_reports
  add column if not exists personal_note text,
  add column if not exists personal_note_author text;

comment on column public.event_reports.personal_note is
  'Optional hand-written note from the publishing internal user, shown on the report reveal.';
comment on column public.event_reports.personal_note_author is
  'Display name of the internal user who wrote personal_note, captured at publish time.';
