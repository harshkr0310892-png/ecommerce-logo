-- Create table for COD restrictions settings
CREATE TABLE IF NOT EXISTS public.cod_restrictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_order_limit INTEGER DEFAULT 10 NOT NULL,
    ip_daily_order_limit INTEGER DEFAULT 5 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for tracking phone number order counts
CREATE TABLE IF NOT EXISTS public.phone_order_counts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    order_count INTEGER DEFAULT 0 NOT NULL,
    last_order_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for tracking IP address order counts
CREATE TABLE IF NOT EXISTS public.ip_order_counts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT UNIQUE NOT NULL,
    order_count INTEGER DEFAULT 0 NOT NULL,
    last_order_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_phone_order_counts_phone ON public.phone_order_counts(phone);
CREATE INDEX IF NOT EXISTS idx_phone_order_counts_date ON public.phone_order_counts(last_order_date);
CREATE INDEX IF NOT EXISTS idx_ip_order_counts_ip ON public.ip_order_counts(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_order_counts_date ON public.ip_order_counts(last_order_date);

-- Enable RLS on all tables
ALTER TABLE public.cod_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_order_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_order_counts ENABLE ROW LEVEL SECURITY;

-- Create policies for cod_restrictions
CREATE POLICY "Allow all operations on cod_restrictions"
ON public.cod_restrictions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for phone_order_counts
CREATE POLICY "Allow all operations on phone_order_counts"
ON public.phone_order_counts
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read for phone_order_counts checking"
ON public.phone_order_counts
FOR SELECT
USING (true);

-- Create policies for ip_order_counts
CREATE POLICY "Allow all operations on ip_order_counts"
ON public.ip_order_counts
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read for ip_order_counts checking"
ON public.ip_order_counts
FOR SELECT
USING (true);

-- Create triggers to update updated_at columns
CREATE TRIGGER update_cod_restrictions_updated_at
BEFORE UPDATE ON public.cod_restrictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phone_order_counts_updated_at
BEFORE UPDATE ON public.phone_order_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ip_order_counts_updated_at
BEFORE UPDATE ON public.ip_order_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default COD restrictions settings
INSERT INTO public.cod_restrictions (phone_order_limit, ip_daily_order_limit)
SELECT 10, 5
WHERE NOT EXISTS (
    SELECT 1 FROM public.cod_restrictions
);