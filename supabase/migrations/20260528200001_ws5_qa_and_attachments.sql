-- Workstream 5: Fix QA schema mismatches and add missing columns
--
-- qa_items: add created_by column that addQAItem tries to write
-- messages: attachments column already exists (jsonb), no change needed

alter table qa_items
  add column if not exists created_by uuid references profiles(id);
