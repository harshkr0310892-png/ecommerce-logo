-- Allow admins to delete orders (e.g., delivered or cancelled cleanup)
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

