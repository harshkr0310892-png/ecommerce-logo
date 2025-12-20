-- Add a shape selector for attribute value logos
alter table if exists public.product_attribute_values
add column if not exists value_icon_shape text check (value_icon_shape in ('circle','square','rectangle','triangle'));
