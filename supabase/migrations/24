-- Add image support for product variants
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_variants_image_urls ON public.product_variants USING GIN (image_urls);