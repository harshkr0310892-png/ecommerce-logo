-- Add payment_method to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'online';
