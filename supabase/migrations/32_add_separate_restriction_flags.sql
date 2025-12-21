-- Add separate activation flags for COD and online payment restrictions
ALTER TABLE public.cod_restrictions 
ADD COLUMN IF NOT EXISTS cod_restrictions_enabled BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS online_restrictions_enabled BOOLEAN DEFAULT true NOT NULL;

-- Update existing records to set the new flags based on the old is_active flag
UPDATE public.cod_restrictions 
SET cod_restrictions_enabled = is_active, 
    online_restrictions_enabled = is_active;

-- Add a comment to explain the purpose of the new columns
COMMENT ON COLUMN public.cod_restrictions.cod_restrictions_enabled IS 'Enable/disable COD order restrictions';
COMMENT ON COLUMN public.cod_restrictions.online_restrictions_enabled IS 'Enable/disable online payment order restrictions';