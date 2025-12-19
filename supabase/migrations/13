-- Allow deletes via anon key only for delivered orders (admin UI uses anon client)
CREATE POLICY "Public can delete delivered orders"
ON public.orders
FOR DELETE
TO public
USING (status = 'delivered');

