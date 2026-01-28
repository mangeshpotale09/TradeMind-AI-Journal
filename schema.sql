
-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_id VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER',
    status VARCHAR(20) DEFAULT 'APPROVED',
    is_paid BOOLEAN DEFAULT FALSE,
    selected_plan VARCHAR(20),
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    expiry_date VARCHAR(50),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    own_referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50), 
    has_referral_discount BOOLEAN DEFAULT FALSE
);

-- 3. TRADES TABLE (The Core Journal)
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    trade_type VARCHAR(20) NOT NULL, -- STOCK, OPTION
    side VARCHAR(10) NOT NULL,      -- LONG, SHORT
    status VARCHAR(10) NOT NULL,    -- OPEN, CLOSED
    entry_price DECIMAL(18, 4) NOT NULL,
    exit_price DECIMAL(18, 4),
    quantity DECIMAL(18, 4) NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_date TIMESTAMP WITH TIME ZONE,
    fees DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    strategies TEXT[] DEFAULT '{}',
    emotions TEXT[] DEFAULT '{}',
    mistakes TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of screenshots/base64
    ai_review JSONB,                      -- Gemini Audit Results
    option_details JSONB,                 -- Strike, Expiry, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS TABLE (Merchant Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
    id VARCHAR(255) PRIMARY KEY, -- Razorpay Payment ID
    order_id VARCHAR(255),
    signature TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    plan_type VARCHAR(20),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(20), -- SUCCESS, FAILED, PENDING
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR TRADES
-- Users can only view their own trades
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert trades for themselves
CREATE POLICY "Users can insert own trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own trades
CREATE POLICY "Users can update own trades" ON public.trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own trades
CREATE POLICY "Users can delete own trades" ON public.trades
    FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS POLICIES FOR PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 8. AUTOMATION: CREATE PROFILE ON AUTH SIGNUP
-- This function runs whenever a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, display_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Trader'),
    'TM-' || UPPER(SUBSTRING(new.id::text, 1, 5))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON public.trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON public.trades(symbol);
