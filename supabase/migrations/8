-- Create buckets used by the app storage integrations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, NULL, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('cms-images', 'cms-images', true, NULL, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

