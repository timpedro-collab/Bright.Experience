-- Streak tracking columns for the Dopamine-Driven Celebration System.
-- current_streak counts consecutive active days; last_active_date gates the update.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date date;
