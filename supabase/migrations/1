CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_value numeric DEFAULT 0 NOT NULL,
    min_order_amount numeric DEFAULT 0,
    max_uses integer,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])))
);


--
-- Name: faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    category text DEFAULT 'general'::text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: home_banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.home_banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    image_url text NOT NULL,
    title text,
    subtitle text,
    link_url text,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: home_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.home_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section_type text NOT NULL,
    title text,
    subtitle text,
    content jsonb DEFAULT '{}'::jsonb,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    product_name text NOT NULL,
    product_price numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    message text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id text NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_address text NOT NULL,
    customer_email text,
    status text DEFAULT 'pending'::text NOT NULL,
    total numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'packed'::text, 'shipped'::text, 'delivered'::text])))
);


--
-- Name: popup_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.popup_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    button_text text DEFAULT 'Shop Now'::text,
    button_link text DEFAULT '/products'::text,
    is_active boolean DEFAULT true,
    show_once_per_session boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    discount_percentage integer DEFAULT 0,
    image_url text,
    stock_status text DEFAULT 'in_stock'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stock_quantity integer DEFAULT 0,
    images text[] DEFAULT '{}'::text[],
    CONSTRAINT products_stock_status_check CHECK ((stock_status = ANY (ARRAY['in_stock'::text, 'sold_out'::text])))
);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_username_key UNIQUE (username);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: faqs faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faqs
    ADD CONSTRAINT faqs_pkey PRIMARY KEY (id);


--
-- Name: home_banners home_banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_banners
    ADD CONSTRAINT home_banners_pkey PRIMARY KEY (id);


--
-- Name: home_sections home_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.home_sections
    ADD CONSTRAINT home_sections_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_messages order_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_messages
    ADD CONSTRAINT order_messages_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_id_key UNIQUE (order_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: popup_offers popup_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.popup_offers
    ADD CONSTRAINT popup_offers_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: home_sections update_home_sections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_home_sections_updated_at BEFORE UPDATE ON public.home_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: order_messages order_messages_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_messages
    ADD CONSTRAINT order_messages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: admin_users Admin users readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users readable" ON public.admin_users FOR SELECT USING (true);


--
-- Name: home_banners Banners are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Banners are publicly readable" ON public.home_banners FOR SELECT USING (true);


--
-- Name: home_banners Banners can be managed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Banners can be managed" ON public.home_banners USING (true) WITH CHECK (true);


--
-- Name: coupons Coupons are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coupons are publicly readable" ON public.coupons FOR SELECT USING (true);


--
-- Name: coupons Coupons can be managed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Coupons can be managed" ON public.coupons USING (true) WITH CHECK (true);


--
-- Name: faqs FAQs are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "FAQs are publicly readable" ON public.faqs FOR SELECT USING (true);


--
-- Name: faqs FAQs can be managed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "FAQs can be managed" ON public.faqs USING (true) WITH CHECK (true);


--
-- Name: home_sections Home sections are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Home sections are publicly readable" ON public.home_sections FOR SELECT USING (true);


--
-- Name: home_sections Home sections can be managed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Home sections can be managed" ON public.home_sections USING (true) WITH CHECK (true);


--
-- Name: order_items Order items are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order items are publicly readable" ON public.order_items FOR SELECT USING (true);


--
-- Name: order_items Order items can be created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order items can be created" ON public.order_items FOR INSERT WITH CHECK (true);


--
-- Name: order_messages Order messages are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order messages are publicly readable" ON public.order_messages FOR SELECT USING (true);


--
-- Name: order_messages Order messages can be created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order messages can be created" ON public.order_messages FOR INSERT WITH CHECK (true);


--
-- Name: orders Orders are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Orders are publicly readable" ON public.orders FOR SELECT USING (true);


--
-- Name: orders Orders can be created by anyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Orders can be created by anyone" ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: orders Orders can be updated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Orders can be updated" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: popup_offers Popup offers are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Popup offers are publicly readable" ON public.popup_offers FOR SELECT USING (true);


--
-- Name: popup_offers Popup offers can be managed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Popup offers can be managed" ON public.popup_offers USING (true) WITH CHECK (true);


--
-- Name: products Products are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);


--
-- Name: products Products can be managed; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Products can be managed" ON public.products USING (true) WITH CHECK (true);


--
-- Name: admin_users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: faqs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

--
-- Name: home_banners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

--
-- Name: home_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: order_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: popup_offers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.popup_offers ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


