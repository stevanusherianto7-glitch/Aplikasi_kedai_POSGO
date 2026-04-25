-- POSGO 57 SYSTEM - SUPABASE SQL SCHEMA (v1.2.2 - ASSET REFINEMENT EDITION)
-- ARCHITECTURE: DECOUPLED HPP, SALES CATALOG, & STREAMLINED ASSETS

-- 1. SALES CATALOG (Menu Kasir)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price BIGINT NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'MAKANAN',
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HPP RESEARCH (Riset Resep)
CREATE TABLE IF NOT EXISTS hpp_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_price BIGINT DEFAULT 0,
    total_cost BIGINT DEFAULT 0,
    ingredients JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TRANSACTIONS (Riwayat Order #001)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL,
    sequence_number INT,        -- Untuk ORDER #001, #002, dst
    total_price BIGINT NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'Tunai',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. EXPENSES (Pengeluaran)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'OPERASIONAL',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INCOMES (Pemasukan)
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'UMUM',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ASSETS (Inventaris Kedai - STREAMLINED)
-- Menghilangkan 'location' dan 'condition' sesuai UI terbaru
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity INT DEFAULT 0, -- Representasi dari 'JUMLAH' di UI
    category TEXT DEFAULT 'Dapur',
    price BIGINT DEFAULT 0, -- Harga Satuan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. MAINTENANCE LOGS (Log Servis Aset)
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost BIGINT DEFAULT 0,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXING
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date DESC);
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);

-- REALTIME ENABLER
-- ALTER PUBLICATION supabase_realtime ADD TABLE products, transactions, expenses, incomes, assets, maintenance_logs;
