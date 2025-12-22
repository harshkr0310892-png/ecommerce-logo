-- Add GST fields to categories and products tables
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5,2) DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5,2);

-- Add comments to explain the new columns
COMMENT ON COLUMN public.categories.gst_percentage IS 'Default GST percentage for the category';
COMMENT ON COLUMN public.products.gst_percentage IS 'Product-specific GST percentage (overrides category GST)';
