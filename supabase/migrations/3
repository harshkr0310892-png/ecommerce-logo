-- Allow authenticated users to insert their own role (for first admin setup)
CREATE POLICY "Users can insert their own admin role if no admins exist"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
);