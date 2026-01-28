-- TradeMind AI Master Database Schema
-- Compatible with PostgreSQL

-- 1. Profiles & Subscription Management
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- References auth.users(id)
    display_id VARCHAR(20) UNIQUE NOT NULL, -- e.g., TM-12345
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER', -- ADMIN, USER
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    is_paid BOOLEAN DEFAULT FALSE,
    selected_plan VARCHAR(20), -- MONTHLY, SIX_MONTHS, ANNUAL
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    expiry_date VARCHAR(50), -- ISO Date or 'Lifetime'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    own_referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50), 
    has_referral_discount BOOLEAN DEFAULT FALSE
);

-- 2. Trade Execution Data
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    trade_type VARCHAR(20) NOT NULL, -- STOCK, OPTION
    side VARCHAR(10) NOT NULL, -- LONG, SHORT
    status VARCHAR(10) NOT NULL, -- OPEN, CLOSED
    entry_price DECIMAL(18, 4) NOT NULL,
    exit_price DECIMAL(18, 4),
    quantity DECIMAL(18, 4) NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_date TIMESTAMP WITH TIME ZONE,
    fees DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    strategies TEXT[],
    emotions TEXT[],
    mistakes TEXT[],
    attachments JSONB, -- Storing attachment metadata
    ai_review JSONB,   -- Storing AI audit result
    option_details JSONB -- Strike, Expiry, OptionType
);

-- 3. Merchant Transaction Ledger
CREATE TABLE transactions (
    id VARCHAR(255) PRIMARY KEY, -- Razorpay Payment ID
    order_id VARCHAR(255),
    signature TEXT,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    plan_type VARCHAR(20),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(20), -- SUCCESS, FAILED, PENDING
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);