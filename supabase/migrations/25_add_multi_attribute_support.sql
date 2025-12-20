-- Create a junction table for product variants and attribute values
CREATE TABLE IF NOT EXISTS public.product_variant_values (
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  attribute_value_id UUID NOT NULL REFERENCES public.product_attribute_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, attribute_value_id)
);

-- Enable RLS
ALTER TABLE public.product_variant_values ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Variant values are publicly readable" ON public.product_variant_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage variant values" ON public.product_variant_values FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate existing data
INSERT INTO public.product_variant_values (variant_id, attribute_value_id)
SELECT id, attribute_value_id FROM public.product_variants
WHERE attribute_value_id IS NOT NULL;

-- Make attribute_value_id nullable in product_variants (we will stop using it)
ALTER TABLE public.product_variants ALTER COLUMN attribute_value_id DROP NOT NULL;

-- Remove the unique constraint on product_id + attribute_value_id
-- Note: The constraint name might vary, but usually it is table_col1_col2_key
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_attribute_value_id_key;
