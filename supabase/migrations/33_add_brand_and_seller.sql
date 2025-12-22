-- Add brand and seller fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS brand VARCHAR(255),
ADD COLUMN IF NOT EXISTS brand_logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS seller_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS seller_description TEXT;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.products.brand IS 'Product brand name';
COMMENT ON COLUMN public.products.brand_logo_url IS 'Brand logo image URL';
COMMENT ON COLUMN public.products.seller_name IS 'Name of the seller/vendor';
COMMENT ON COLUMN public.products.seller_description IS 'Detailed description about the seller';
