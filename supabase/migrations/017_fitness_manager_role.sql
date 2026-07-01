-- Add fitness_manager to the role system
ALTER TABLE admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_role_check;
ALTER TABLE admin_profiles ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('admin', 'fitness_manager', 'trainer', 'staff'));

-- Trainer assignment on leads
ALTER TABLE lead_submissions
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES admin_profiles(user_id) ON DELETE SET NULL;
