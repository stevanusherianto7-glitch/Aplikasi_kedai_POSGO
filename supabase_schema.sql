-- Supabase Schema for RestoCost ERP Engine

-- 1. Ingredients Table (Bahan Baku)
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    purchase_price DECIMAL(15, 2) NOT NULL,
    purchase_unit TEXT NOT NULL, -- e.g., 'kg', 'karung'
    use_unit TEXT NOT NULL,      -- e.g., 'gr', 'pcs'
    conversion_value DECIMAL(15, 2) NOT NULL, -- e.g., 1000 (1kg = 1000gr)
    stock_quantity DECIMAL(15, 2) DEFAULT 0,
    low_stock_threshold DECIMAL(15, 2) DEFAULT 0,
    user_id UUID
);

-- 2. Recipes Table (Resep Menu)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    selling_price DECIMAL(15, 2) DEFAULT 0,
    markup_percent DECIMAL(5, 2) DEFAULT 0,
    labor_cost DECIMAL(15, 2) DEFAULT 0,
    overhead_cost DECIMAL(15, 2) DEFAULT 0,
    shrinkage_percent DECIMAL(5, 2) DEFAULT 0,
    user_id UUID
);

-- 3. Recipe Items Table (BOM - Bill of Materials)
CREATE TABLE IF NOT EXISTS recipe_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_needed DECIMAL(15, 2) NOT NULL, -- in use_unit
    user_id UUID
);

-- 4. Employees Table (Karyawan)
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    salary DECIMAL(15, 2) NOT NULL,
    avatar_color TEXT,
    initials TEXT,
    user_id UUID -- Removed FK to auth.users for demo compatibility
);

-- 5. Transactions Table (Optional, for Dashboard Omzet)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recipe_id UUID REFERENCES recipes(id),
    quantity INTEGER NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    total_hpp DECIMAL(15, 2) NOT NULL,
    items JSONB DEFAULT '[]'::jsonb, -- Store detailed transaction items
    user_id UUID
);

-- Enable Row Level Security (RLS)
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Public manage by tenant id" ON ingredients;
CREATE POLICY "Public manage by tenant id" ON ingredients FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

DROP POLICY IF EXISTS "Public manage by tenant id" ON recipes;
CREATE POLICY "Public manage by tenant id" ON recipes FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

DROP POLICY IF EXISTS "Public manage by tenant id" ON recipe_items;
CREATE POLICY "Public manage by tenant id" ON recipe_items FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

DROP POLICY IF EXISTS "Public manage by tenant id" ON employees;
CREATE POLICY "Public manage by tenant id" ON employees FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

DROP POLICY IF EXISTS "Public manage by tenant id" ON transactions;
CREATE POLICY "Public manage by tenant id" ON transactions FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

-- 6. Shifts Table (Jadwal Shift)
CREATE TABLE IF NOT EXISTS shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_type TEXT NOT NULL,
    user_id UUID,
    UNIQUE(employee_id, date)
);

-- 7. Shift Patterns Table (Pola Shift)
CREATE TABLE IF NOT EXISTS shift_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pattern JSONB NOT NULL, -- Array of 7 ShiftTypes
    user_id UUID,
    UNIQUE(employee_id)
);

-- 8. Attendances Table (Absensi)
CREATE TABLE IF NOT EXISTS attendances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL, -- Hadir, Izin, Sakit, Alpha
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    user_id UUID,
    UNIQUE(employee_id, date)
);

-- 9. Expenses Table (Pengeluaran)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category TEXT NOT NULL, -- Operasional, Bahan Baku, Lainnya
    user_id UUID
);

-- 10. App Config Table (Petty Cash, etc)
CREATE TABLE IF NOT EXISTS app_config (
    id TEXT PRIMARY KEY, -- e.g., 'petty_cash'
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- Enable RLS for new tables
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Create Policies for new tables
DROP POLICY IF EXISTS "Public manage by tenant id" ON shifts;
CREATE POLICY "Public manage by tenant id" ON shifts FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

DROP POLICY IF EXISTS "Public manage by tenant id" ON shift_patterns;
CREATE POLICY "Public manage by tenant id" ON shift_patterns FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

DROP POLICY IF EXISTS "Public manage by tenant id" ON attendances;
CREATE POLICY "Public manage by tenant id" ON attendances FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

DROP POLICY IF EXISTS "Public manage by tenant id" ON expenses;
CREATE POLICY "Public manage by tenant id" ON expenses FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

DROP POLICY IF EXISTS "Public manage by tenant id" ON app_config;
CREATE POLICY "Public manage by tenant id" ON app_config FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

-- 11. Daily Incomes Table (Pemasukan Harian)
CREATE TABLE IF NOT EXISTS daily_incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    user_id UUID
);

ALTER TABLE daily_incomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage by tenant id" ON daily_incomes;
CREATE POLICY "Public manage by tenant id" ON daily_incomes FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

-- 12. Restaurant Assets Table (Aset Restoran)
CREATE TABLE IF NOT EXISTS restaurant_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity DECIMAL(15, 2) DEFAULT 0,
    price DECIMAL(15, 2) DEFAULT 0,
    condition TEXT DEFAULT 'Bagus', -- Bagus, Rusak, Perlu Servis
    location TEXT DEFAULT 'Area Utama', -- Dapur, Area Tamu, Gudang, dll
    user_id UUID
);

ALTER TABLE restaurant_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage by tenant id" ON restaurant_assets;
CREATE POLICY "Public manage by tenant id" ON restaurant_assets FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

-- 13. Payrolls Table (Gaji Karyawan)
CREATE TABLE IF NOT EXISTS payrolls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    period TEXT NOT NULL, -- e.g., 'April 2024'
    status TEXT DEFAULT 'Pending',
    user_id UUID
);

ALTER TABLE payrolls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage by tenant id" ON payrolls;
CREATE POLICY "Public manage by tenant id" ON payrolls FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');

-- 14. Jobdesks Table (SOP/Jobdesk)
CREATE TABLE IF NOT EXISTS jobdesks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    user_id UUID
);

ALTER TABLE jobdesks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public manage by tenant id" ON jobdesks;
CREATE POLICY "Public manage by tenant id" ON jobdesks FOR ALL USING (user_id = 'e57a0505-1234-5678-90ab-c0de57f17ac1');
