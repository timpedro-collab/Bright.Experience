-- Allow internal users to temporarily hide tasks from their focus queues.
-- Snoozed tasks reappear automatically once snoozed_until passes.
alter table tasks
  add column if not exists snoozed_until timestamptz;

comment on column tasks.snoozed_until is
  'When set and in the future, the task is hidden from internal focus/inbox queues until this timestamp.';

-- Undo: alter table tasks drop column if exists snoozed_until;
