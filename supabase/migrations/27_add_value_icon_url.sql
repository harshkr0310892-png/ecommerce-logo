-- Adds value_icon_url column to product_attribute_values for per-value logos
alter table if exists public.product_attribute_values
add column if not exists value_icon_url text;

-- Optional: set default null and keep existing RLS policies intact.
