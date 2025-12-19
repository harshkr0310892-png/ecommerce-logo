-- Add photos column to contact_submissions table
ALTER TABLE public.contact_submissions
ADD COLUMN IF NOT EXISTS photos TEXT[];

-- Create a new bucket for contact form photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contact-photos', 'contact-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create policies for the contact-photos bucket
CREATE POLICY "Allow public upload for contact photos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'contact-photos');

CREATE POLICY "Allow public read for contact photos"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'contact-photos');

-- Create policy to allow admin full access to contact photos
CREATE POLICY "Allow admin full access to contact photos"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'contact-photos' 
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'contact-photos' 
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);