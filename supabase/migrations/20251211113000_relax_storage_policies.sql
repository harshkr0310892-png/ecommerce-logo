-- Allow public uploads to product-images bucket (so client-side anon key can store files)
CREATE POLICY "Anyone can upload product images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

-- Allow public uploads to cms-images bucket (used by home banners/CMS content)
CREATE POLICY "Anyone can upload cms images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'cms-images');

-- Allow public read already exists; keep admin manage policies.

