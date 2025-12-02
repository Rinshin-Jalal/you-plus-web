-- Add onboarding_completed column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users to have onboarding_completed = true (optional, if you want to grandfather them in)
-- UPDATE users SET onboarding_completed = true WHERE onboarding_completed IS NULL;
