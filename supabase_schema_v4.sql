-- POSGO 57 SYSTEM - SUPABASE SQL SCHEMA (SAVE POINT 4 EDITION)
-- This schema reflects the decoupled HPP/Cashier logic and professional reporting.

-- 1. SALES CATALOG (Katalog Menu Kasir)
-- Separated from HPP recipes for independent management
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price BIGINT NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'MAKANAN', -- MAKANAN, MINUMAN, DLL
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HPP RESEARCH (Riset HPP & Resep)
-- Standalone tool for cost calculation
CREATE TABLE IF NOT EXISTS hpp_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_price BIGINT DEFAULT 0,
    total_cost BIGINT DEFAULT 0,
    ingredients JSONB DEFAULT '[]'::jsonb, -- Store list of ingredients and individual costs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TRANSACTIONS (Riwayat Penjualan)
-- Optimized for 'Order #001' logic and right-aligned accounting
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL, -- Format: 26040001
    sequence_number INT, -- Sequential number for the day (e.g., 1, 2, 3 for #001, #002)
    total_price BIGINT NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'Tunai', -- Tunai, QRIS, Debet
    items JSONB DEFAULT '[]'::jsonb, -- Denormalized items for fast mobile reporting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. EXPENSES (Catat Pengeluaran)
-- Optimized for Daily/Monthly filtering
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'OPERASIONAL',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INCOMES (Catat Pemasukan)
-- Unified naming as requested in UI logic
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount BIGINT NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'UMUM',
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ASSETS (Inventaris Kedai)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    quantity INT DEFAULT 0,
    unit TEXT DEFAULT 'PCS',
    price BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date DESC);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ENABLE REALTIME FOR ALL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE assets;
