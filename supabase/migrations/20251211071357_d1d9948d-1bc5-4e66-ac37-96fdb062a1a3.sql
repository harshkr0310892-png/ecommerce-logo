-- Allow admins to upload files to product-images bucket
CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update files in product-images bucket
CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete files from product-images bucket
CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow public read access to product images
CREATE POLICY "Product images are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow admins to upload files to cms-images bucket
CREATE POLICY "Admins can upload cms images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cms-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update files in cms-images bucket
CREATE POLICY "Admins can update cms images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cms-images' AND
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'cms-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete files from cms-images bucket
CREATE POLICY "Admins can delete cms images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cms-images' AND
  public.has_role(auth.uid(), 'admin')
);

-- Allow public read access to cms images
CREATE POLICY "CMS images are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'cms-images');