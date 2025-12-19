-- Allow customers (anon/auth) to cancel their own orders before shipment
-- Restrict to transitioning status to 'cancelled' only when current status is not shipped/delivered
CREATE POLICY "Customers can cancel their order with order id"
ON public.orders
FOR UPDATE
TO public
USING (status IN ('pending', 'confirmed', 'packed'))
WITH CHECK (status = 'cancelled');

