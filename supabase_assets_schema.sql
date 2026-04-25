-- 1. Create ENUM for Asset Condition
CREATE TYPE asset_condition AS ENUM ('Bagus', 'Rusak', 'Servis');

-- 2. Create Restaurant Assets Table
CREATE TABLE IF NOT EXISTS public.restaurant_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Dapur', 'Elektronik', etc.
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(15,2) NOT NULL DEFAULT 0,
    condition asset_condition DEFAULT 'Bagus',
    location TEXT NOT NULL DEFAULT 'Gudang',
    last_maintenance TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Maintenance Logs Table (Historical tracking)
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.restaurant_assets(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (Optional but Recommended)
ALTER TABLE public.restaurant_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create Simple Policies (Allow all for local development, restrict as needed for production)
CREATE POLICY "Allow all access to restaurant_assets" ON public.restaurant_assets FOR ALL USING (true);
CREATE POLICY "Allow all access to maintenance_logs" ON public.maintenance_logs FOR ALL USING (true);

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurant_assets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_logs;

-- 7. Add Update Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_restaurant_assets_updated_at
    BEFORE UPDATE ON public.restaurant_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
