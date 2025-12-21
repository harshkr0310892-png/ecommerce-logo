-- Add online payment limit columns to cod_restrictions table
ALTER TABLE public.cod_restrictions 
ADD COLUMN IF NOT EXISTS online_phone_order_limit INTEGER DEFAULT 10 NOT NULL,
ADD COLUMN IF NOT EXISTS online_ip_daily_order_limit INTEGER DEFAULT 5 NOT NULL;

-- Create table for tracking online payment phone order counts
CREATE TABLE IF NOT EXISTS public.online_phone_order_counts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    order_count INTEGER DEFAULT 0 NOT NULL,
    last_order_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for tracking online payment IP order counts
CREATE TABLE IF NOT EXISTS public.online_ip_order_counts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT UNIQUE NOT NULL,
    order_count INTEGER DEFAULT 0 NOT NULL,
    last_order_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_online_phone_order_counts_phone ON public.online_phone_order_counts(phone);
CREATE INDEX IF NOT EXISTS idx_online_phone_order_counts_date ON public.online_phone_order_counts(last_order_date);
CREATE INDEX IF NOT EXISTS idx_online_ip_order_counts_ip ON public.online_ip_order_counts(ip_address);
CREATE INDEX IF NOT EXISTS idx_online_ip_order_counts_date ON public.online_ip_order_counts(last_order_date);

-- Enable RLS on all tables
ALTER TABLE public.online_phone_order_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_ip_order_counts ENABLE ROW LEVEL SECURITY;

-- Create policies for online_phone_order_counts
CREATE POLICY "Allow all operations on online_phone_order_counts"
ON public.online_phone_order_counts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for online_ip_order_counts
CREATE POLICY "Allow all operations on online_ip_order_counts"
ON public.online_ip_order_counts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create triggers to update updated_at columns
CREATE TRIGGER update_online_phone_order_counts_updated_at
BEFORE UPDATE ON public.online_phone_order_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_online_ip_order_counts_updated_at
BEFORE UPDATE ON public.online_ip_order_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();