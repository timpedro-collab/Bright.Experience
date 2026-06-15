-- The "Confirm prize details" customer task should deep-link to the
-- Configuration page (game/product setup), not Logistics. An earlier
-- migration (20260527200004) set it to 'logistics' by category match,
-- and the corrective migration (20260528300001) no-op'd because its
-- WHERE clause excluded tasks already assigned to operations_lead.
-- Set it unconditionally here so the customer action summary deep-links
-- to the right place.

UPDATE tasks
  SET target_path = 'configuration'
  WHERE task_type = 'customer_action'
    AND title ILIKE '%prize detail%';
