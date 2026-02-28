-- Equinox PSX Portfolio Tracker - Complete Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STOCKS TABLE - All PSX listed stocks
-- ==========================================
CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  current_price DECIMAL(12, 2),
  previous_close DECIMAL(12, 2),
  change_percent DECIMAL(8, 4),
  volume BIGINT,
  market_cap BIGINT,
  high_52week DECIMAL(12, 2),
  low_52week DECIMAL(12, 2),
  day_high DECIMAL(12, 2),
  day_low DECIMAL(12, 2),
  logo_url TEXT,
  is_shariah_compliant BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: run this if the table already exists
-- ALTER TABLE stocks ADD COLUMN IF NOT EXISTS day_high DECIMAL(12, 2);
-- ALTER TABLE stocks ADD COLUMN IF NOT EXISTS day_low DECIMAL(12, 2);
-- ALTER TABLE stocks ADD COLUMN IF NOT EXISTS logo_url TEXT;
-- ALTER TABLE stocks ADD COLUMN IF NOT EXISTS is_shariah_compliant BOOLEAN DEFAULT FALSE;

-- ==========================================
-- PORTFOLIO HOLDINGS - User's stock holdings
-- ==========================================
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  average_buy_price DECIMAL(12, 2) NOT NULL CHECK (average_buy_price >= 0),
  total_invested DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * average_buy_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stock_symbol)
);

-- ==========================================
-- TRANSACTIONS - Buy/sell history
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE,
  transaction_type VARCHAR(4) CHECK (transaction_type IN ('BUY', 'SELL')) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_share DECIMAL(12, 2) NOT NULL CHECK (price_per_share >= 0),
  total_amount DECIMAL(15, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- WISHLIST - User's watchlist of stocks
-- ==========================================
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stock_symbol VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stock_symbol)
);

-- ==========================================
-- USER SETTINGS - App preferences
-- ==========================================
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_interval_minutes INTEGER DEFAULT 30,
  theme VARCHAR(10) DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- HISTORICAL PRICES - For charts (optional)
-- ==========================================
CREATE TABLE IF NOT EXISTS stock_prices_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stock_symbol VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE,
  date DATE NOT NULL,
  open DECIMAL(12, 2),
  high DECIMAL(12, 2),
  low DECIMAL(12, 2),
  close DECIMAL(12, 2),
  volume BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stock_symbol, date)
);

-- ==========================================
-- INDEXES for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_symbol ON portfolio_holdings(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_symbol ON wishlist(stock_symbol);
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON stock_prices_history(stock_symbol, date DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ==========================================

-- Enable RLS on all user tables
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- Stocks table - public read/write access
-- GRANTs are required in addition to RLS policies; without them Supabase
-- returns 403 before RLS is even evaluated.
GRANT SELECT, INSERT, UPDATE ON TABLE public.stocks TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.stocks TO authenticated;

DROP POLICY IF EXISTS "Anyone can view stocks" ON stocks;
CREATE POLICY "Anyone can view stocks" ON stocks 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert stocks" ON stocks;
CREATE POLICY "Anyone can insert stocks" ON stocks 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update stocks" ON stocks;
CREATE POLICY "Anyone can update stocks" ON stocks 
  FOR UPDATE USING (true);

-- Portfolio Holdings - users can only access their own data
DROP POLICY IF EXISTS "Users can view own holdings" ON portfolio_holdings;
CREATE POLICY "Users can view own holdings" ON portfolio_holdings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own holdings" ON portfolio_holdings;
CREATE POLICY "Users can insert own holdings" ON portfolio_holdings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own holdings" ON portfolio_holdings;
CREATE POLICY "Users can update own holdings" ON portfolio_holdings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own holdings" ON portfolio_holdings;
CREATE POLICY "Users can delete own holdings" ON portfolio_holdings
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions - users can only access their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Wishlist - users can only access their own wishlist
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert to own wishlist" ON wishlist;
CREATE POLICY "Users can insert to own wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from own wishlist" ON wishlist;
CREATE POLICY "Users can delete from own wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- User Settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- Enable Anonymous Auth in Supabase Dashboard
-- Go to: Authentication > Providers > Anonymous Sign-in
-- ==========================================
