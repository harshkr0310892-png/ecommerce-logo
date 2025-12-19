-- Create banned_users table
CREATE TABLE IF NOT EXISTS public.banned_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    reason TEXT,
    banned_by uuid REFERENCES auth.users(id) NULL,  -- Make it nullable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_banned_users_phone ON public.banned_users(phone);
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON public.banned_users(email);
CREATE INDEX IF NOT EXISTS idx_banned_users_active ON public.banned_users(is_active);

-- Enable RLS on banned_users
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies for initial testing
CREATE POLICY "Allow all operations for initial testing"
ON public.banned_users
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read for checking"
ON public.banned_users
FOR SELECT
USING (true);

-- Create trigger to update updated_at column
CREATE TRIGGER update_banned_users_updated_at
BEFORE UPDATE ON public.banned_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();