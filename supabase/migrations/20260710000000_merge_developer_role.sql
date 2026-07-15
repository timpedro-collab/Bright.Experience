-- Merge the `developer` role into `admin`.
--
-- The application role model no longer includes `developer` — it duplicated
-- `admin` everywhere it appeared (full access, break-glass). The enum value
-- stays in the database type (dropping enum values requires a type rebuild
-- for no operational gain); this migration remaps any data still using it so
-- no profile or task points at a role the application can't represent.

UPDATE profiles SET role = 'admin' WHERE role = 'developer';

UPDATE tasks SET assigned_role = 'admin' WHERE assigned_role = 'developer';
