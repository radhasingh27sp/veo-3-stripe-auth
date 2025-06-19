-- Add Paddle-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe';

-- Update existing profiles to have stripe as default provider
UPDATE public.profiles 
SET payment_provider = 'stripe' 
WHERE payment_provider IS NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_paddle_customer_id ON public.profiles(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_provider ON public.profiles(payment_provider);
