-- Create table for individual phone number restrictions
CREATE TABLE IF NOT EXISTS public.individual_phone_restrictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    cod_daily_limit INTEGER DEFAULT 2 NOT NULL,
    online_daily_limit INTEGER DEFAULT 10 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create table for tracking individual phone order counts by payment method
CREATE TABLE IF NOT EXISTS public.individual_phone_order_counts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    payment_method TEXT NOT NULL, -- 'cod' or 'online'
    order_count INTEGER DEFAULT 0 NOT NULL,
    last_order_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(phone, payment_method, last_order_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_individual_phone_restrictions_phone ON public.individual_phone_restrictions(phone);
CREATE INDEX IF NOT EXISTS idx_individual_phone_order_counts_phone ON public.individual_phone_order_counts(phone);
CREATE INDEX IF NOT EXISTS idx_individual_phone_order_counts_payment_method ON public.individual_phone_order_counts(payment_method);
CREATE INDEX IF NOT EXISTS idx_individual_phone_order_counts_date ON public.individual_phone_order_counts(last_order_date);

-- Enable RLS on all tables
ALTER TABLE public.individual_phone_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_phone_order_counts ENABLE ROW LEVEL SECURITY;

-- Create policies for individual_phone_restrictions
CREATE POLICY "Allow all operations on individual_phone_restrictions"
ON public.individual_phone_restrictions
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policies for individual_phone_order_counts
CREATE POLICY "Allow all operations on individual_phone_order_counts"
ON public.individual_phone_order_counts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create triggers to update updated_at columns
CREATE TRIGGER update_individual_phone_restrictions_updated_at
BEFORE UPDATE ON public.individual_phone_restrictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_individual_phone_order_counts_updated_at
BEFORE UPDATE ON public.individual_phone_order_counts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();