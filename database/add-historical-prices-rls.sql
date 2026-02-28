-- Add RLS policies for stock_prices_history table
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE stock_prices_history ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT SELECT, INSERT ON TABLE public.stock_prices_history TO anon;
GRANT SELECT, INSERT ON TABLE public.stock_prices_history TO authenticated;

-- Public read access (anyone can view historical prices)
DROP POLICY IF EXISTS "Anyone can view historical prices" ON stock_prices_history;
CREATE POLICY "Anyone can view historical prices" ON stock_prices_history 
  FOR SELECT USING (true);

-- Public insert access (allow storing daily snapshots)
DROP POLICY IF EXISTS "Anyone can insert historical prices" ON stock_prices_history;
CREATE POLICY "Anyone can insert historical prices" ON stock_prices_history 
  FOR INSERT WITH CHECK (true);
