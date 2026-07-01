-- Add front_desk role for shared kiosk/check-in accounts
ALTER TABLE admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_role_check;
ALTER TABLE admin_profiles ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('admin', 'fitness_manager', 'trainer', 'staff', 'front_desk'));
