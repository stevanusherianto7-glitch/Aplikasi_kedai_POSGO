-- 1. Create a fresh table for Assets with a specific name to avoid conflicts
CREATE TABLE IF NOT EXISTS public.kedai_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    condition TEXT NOT NULL DEFAULT 'Bagus',
    location TEXT NOT NULL DEFAULT 'Dapur Utama',
    user_id UUID DEFAULT 'e57a0505-1234-5678-90ab-c0de57f17ac1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. FRESH Maintenance Logs table linked to the new assets table
CREATE TABLE IF NOT EXISTS public.kedai_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.kedai_assets(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS (Security)
ALTER TABLE public.kedai_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kedai_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- 4. Simple Permissive Policy for internal operations
CREATE POLICY "Enable all for all" ON public.kedai_assets FOR ALL USING (true);
CREATE POLICY "Enable all for logs" ON public.kedai_maintenance_logs FOR ALL USING (true);

-- 5. MANDATORY: Enable Realtime for the new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.kedai_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kedai_maintenance_logs;

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kedai_assets_updated_at
    BEFORE UPDATE ON public.kedai_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
