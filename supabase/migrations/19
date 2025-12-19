-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin read for contact submissions" ON public.contact_submissions;

-- Create new policy that allows SELECT for all users (application handles auth)
CREATE POLICY "Allow read for contact submissions"
ON public.contact_submissions
FOR SELECT
USING (true);