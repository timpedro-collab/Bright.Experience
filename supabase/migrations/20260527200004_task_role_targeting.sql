-- Add role-based ownership and deep-linking to tasks.
-- assigned_role: which internal role type owns this task (e.g. creative_lead, operations_lead)
-- target_path: the event sub-page suffix where the work lives (e.g. 'assets', 'briefing')

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_role user_role;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS target_path text;

-- Backfill existing template-created tasks based on category mapping
UPDATE tasks SET assigned_role = 'events_lead', target_path = 'briefing'
  WHERE category = 'admin' AND assigned_role IS NULL;
UPDATE tasks SET assigned_role = 'creative_lead', target_path = 'assets'
  WHERE category = 'creative' AND assigned_role IS NULL;
UPDATE tasks SET assigned_role = 'operations_lead', target_path = 'logistics'
  WHERE category = 'logistics' AND assigned_role IS NULL;
UPDATE tasks SET assigned_role = 'operations_lead', target_path = 'logistics'
  WHERE category = 'operations' AND assigned_role IS NULL;
UPDATE tasks SET assigned_role = 'qa_lead', target_path = 'qa'
  WHERE category = 'qa' AND assigned_role IS NULL;
UPDATE tasks SET assigned_role = 'events_lead', target_path = 'reports'
  WHERE category = 'reporting' AND assigned_role IS NULL;
