
-- TradeMind AI Master Database Schema
-- Compatible with PostgreSQL / MySQL

-- 1. Users & Subscription Management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id VARCHAR(20) UNIQUE NOT NULL, -- e.g., TM-12345
    email VARCHAR(255) UNIQUE NOT NULL,
    password_mask TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER', -- ADMIN, USER
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, WAITING_APPROVAL, APPROVED, REJECTED
    is_paid BOOLEAN DEFAULT FALSE,
    selected_plan VARCHAR(20), -- MONTHLY, SIX_MONTHS, ANNUAL
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    expiry_date VARCHAR(50), -- ISO Date or 'Lifetime'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    own_referral_code VARCHAR(50) UNIQUE,
    referred_by VARCHAR(50), -- Referral code of the inviter
    has_referral_discount BOOLEAN DEFAULT FALSE
);

-- 2. Trade Execution Data
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
    
    -- Option Specific Details (Nullable for Stock trades)
    option_strike DECIMAL(18, 4),
    option_expiration DATE,
    option_type VARCHAR(10) -- CE, PE
);

-- 3. Normalized Behavioral Metadata (Many-to-Many)
CREATE TABLE trade_strategies (
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    strategy VARCHAR(100) NOT NULL,
    PRIMARY KEY (trade_id, strategy)
);

CREATE TABLE trade_emotions (
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    emotion VARCHAR(50) NOT NULL,
    PRIMARY KEY (trade_id, emotion)
);

CREATE TABLE trade_mistakes (
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    mistake VARCHAR(100) NOT NULL,
    PRIMARY KEY (trade_id, mistake)
);

-- 4. Evidence Vault (Screenshots & Docs)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_data TEXT, -- Base64 encoded or path to S3 bucket
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI Risk Coaching Logs
CREATE TABLE ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID UNIQUE REFERENCES trades(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    well_done TEXT,
    wrong_done TEXT,
    violations BOOLEAN DEFAULT FALSE,
    improvement_directive TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Merchant Transaction Ledger
CREATE TABLE transactions (
    id VARCHAR(255) PRIMARY KEY, -- Razorpay Payment ID
    order_id VARCHAR(255),
    signature TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    plan_type VARCHAR(20),
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(20), -- SUCCESS, FAILED, PENDING
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
