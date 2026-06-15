-- Server-persisted onboarding flag so the tour only fires for new users.
-- Existing users are backfilled as complete to avoid forcing them through it.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;
UPDATE profiles SET has_completed_onboarding = true WHERE has_completed_onboarding IS NULL OR has_completed_onboarding = false;
