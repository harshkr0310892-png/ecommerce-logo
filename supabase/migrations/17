-- Update policy to allow deletion of both delivered and cancelled orders
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can delete delivered orders" ON public.orders;

-- Create new policy that allows deletion of both delivered and cancelled orders
CREATE POLICY "Public can delete delivered or cancelled orders"
ON public.orders
FOR DELETE
TO public
USING (status = 'delivered' OR status = 'cancelled');

-- Add a comment to explain the policy
COMMENT ON POLICY "Public can delete delivered or cancelled orders" ON public.orders IS 
'Allow public users (admin UI) to delete both delivered and cancelled orders';