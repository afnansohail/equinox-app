-- ==========================================
-- DIVIDENDS TABLE - Track dividend income
-- ==========================================
-- Note: stock_symbol has NO foreign key constraint so users can record
-- dividends for any historical/delisted symbol, not just current holdings.

CREATE TABLE IF NOT EXISTS dividends (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_symbol       VARCHAR(20) NOT NULL,
  shares             DECIMAL(15, 4) NOT NULL CHECK (shares > 0),
  dividend_per_share DECIMAL(12, 4) NOT NULL CHECK (dividend_per_share >= 0),
  total_amount       DECIMAL(15, 2) GENERATED ALWAYS AS (shares * dividend_per_share) STORED,
  payment_date       DATE NOT NULL,
  notes              TEXT,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dividends"
  ON dividends FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dividends"
  ON dividends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dividends"
  ON dividends FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dividends"
  ON dividends FOR DELETE
  USING (auth.uid() = user_id);

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_dividends_user_date
  ON dividends (user_id, payment_date DESC);
