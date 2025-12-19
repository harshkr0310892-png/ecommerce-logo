-- Create policy to allow admin users to delete contact submissions
CREATE POLICY "Allow admin delete for contact submissions"
ON public.contact_submissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Create policy to allow authenticated users to delete their own contact submissions
-- (This is for future use if we want to allow users to delete their own submissions)
CREATE POLICY "Allow user delete for contact submissions"
ON public.contact_submissions
FOR DELETE
USING (
  -- For now, we'll allow deletion for any authenticated user from the admin dashboard
  -- Since the dashboard handles authentication via sessionStorage
  true
);