-- Drop existing policies if they exist (from migration 25 or previous attempts)
DROP POLICY IF EXISTS "Admins can manage variant values" ON public.product_variant_values;
DROP POLICY IF EXISTS "Authenticated users can manage variant values" ON public.product_variant_values;

-- Create a permissive policy that allows ANYONE to manage variant values
-- This matches the "Products can be managed" policy on the products table
-- and allows the client-side admin (who is technically 'anon') to work.
CREATE POLICY "Variant values can be managed by anyone" 
ON public.product_variant_values 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Ensure RLS is enabled (it should be, but just in case)
ALTER TABLE public.product_variant_values ENABLE ROW LEVEL SECURITY;
