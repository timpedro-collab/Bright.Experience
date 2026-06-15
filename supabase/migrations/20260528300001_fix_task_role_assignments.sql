-- Fix task role assignments for customer-facing briefing tasks.
-- "Complete creative briefing form" and similar customer_action tasks with
-- category 'creative' were backfilled to creative_lead, but the events_lead
-- owns the client relationship and should chase these deliverables.

-- Briefing-related customer actions -> events_lead
UPDATE tasks
  SET assigned_role = 'events_lead',
      target_path = 'briefing',
      category = 'admin'
  WHERE task_type = 'customer_action'
    AND title ILIKE '%briefing%'
    AND assigned_role = 'creative_lead';

-- "Provide webform questions" is a briefing-stage client deliverable -> events_lead
UPDATE tasks
  SET assigned_role = 'events_lead',
      target_path = 'briefing'
  WHERE task_type = 'customer_action'
    AND title ILIKE '%webform question%'
    AND assigned_role = 'creative_lead';

-- "Confirm prize details" is an ops-owned client deliverable -> operations_lead
UPDATE tasks
  SET assigned_role = 'operations_lead',
      target_path = 'configuration'
  WHERE task_type = 'customer_action'
    AND title ILIKE '%prize detail%'
    AND assigned_role IS DISTINCT FROM 'operations_lead';

-- "Provide onsite contact" is ops-owned -> operations_lead
UPDATE tasks
  SET assigned_role = 'operations_lead',
      target_path = 'logistics'
  WHERE task_type = 'customer_action'
    AND title ILIKE '%onsite contact%'
    AND assigned_role IS DISTINCT FROM 'operations_lead';

-- "Configure game logic" is developer work
UPDATE tasks
  SET assigned_role = 'developer',
      target_path = 'configuration'
  WHERE task_type = 'internal_action'
    AND title ILIKE '%game logic%'
    AND category = 'development'
    AND assigned_role IS NULL;
