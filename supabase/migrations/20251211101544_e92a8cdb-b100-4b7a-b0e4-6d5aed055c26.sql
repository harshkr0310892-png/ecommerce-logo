-- Drop existing restrictive admin policies for CMS tables
DROP POLICY IF EXISTS "Admins can manage banners" ON public.home_banners;
DROP POLICY IF EXISTS "Admins can manage popup offers" ON public.popup_offers;
DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can manage home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage product attributes" ON public.product_attributes;
DROP POLICY IF EXISTS "Admins can manage attribute values" ON public.product_attribute_values;
DROP POLICY IF EXISTS "Admins can manage product variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- Create permissive policies allowing all operations for CMS tables
CREATE POLICY "Anyone can manage banners" ON public.home_banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage popup offers" ON public.popup_offers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage faqs" ON public.faqs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage home sections" ON public.home_sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage product attributes" ON public.product_attributes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage attribute values" ON public.product_attribute_values FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage product variants" ON public.product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);