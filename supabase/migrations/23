-- Add product details fields to products table
-- Adding features as JSONB for flexibility, description as TEXT, and dimensions as TEXT
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS detailed_description TEXT,
ADD COLUMN IF NOT EXISTS dimensions TEXT,
-- Add separate columns for height, width, and weight
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS width TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_features ON public.products USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_products_detailed_description ON public.products (detailed_description);
CREATE INDEX IF NOT EXISTS idx_products_height ON public.products (height);
CREATE INDEX IF NOT EXISTS idx_products_width ON public.products (width);
CREATE INDEX IF NOT EXISTS idx_products_weight ON public.products (weight);