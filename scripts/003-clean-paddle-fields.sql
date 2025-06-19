-- Remove Paddle-specific fields from profiles table if they exist
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS paddle_subscription_id,
DROP COLUMN IF EXISTS paddle_customer_id,
DROP COLUMN IF EXISTS payment_provider;

-- Drop any Paddle-related indexes
DROP INDEX IF EXISTS idx_profiles_paddle_customer_id;
DROP INDEX IF EXISTS idx_profiles_payment_provider;
