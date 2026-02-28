-- Equinox PSX Portfolio Tracker - Portfolio Holdings Trigger
-- This trigger automatically recalculates portfolio_holdings whenever
-- transactions are inserted, updated, or deleted.
-- Run this in Supabase SQL Editor after schema.sql

-- ==========================================
-- FUNCTION: Recalculate portfolio holding for a specific user + stock
-- ==========================================
CREATE OR REPLACE FUNCTION recalc_portfolio_holding(
  p_user_id UUID,
  p_stock_symbol VARCHAR(10)
) RETURNS void AS $$
DECLARE
  v_total_quantity INTEGER := 0;
  v_total_invested DECIMAL(15, 2) := 0;
  v_avg_price DECIMAL(12, 2) := 0;
  v_existing_id UUID;
BEGIN
  -- Calculate totals from all transactions for this user + stock
  SELECT 
    COALESCE(SUM(
      CASE 
        WHEN transaction_type = 'BUY' THEN quantity
        ELSE -quantity
      END
    ), 0),
    COALESCE(SUM(
      CASE 
        WHEN transaction_type = 'BUY' THEN total_amount
        ELSE -total_amount
      END
    ), 0)
  INTO v_total_quantity, v_total_invested
  FROM transactions
  WHERE user_id = p_user_id 
    AND stock_symbol = p_stock_symbol;

  -- Calculate average price
  IF v_total_quantity > 0 THEN
    v_avg_price := v_total_invested / v_total_quantity;
  ELSE
    v_avg_price := 0;
  END IF;

  -- Check if a holding already exists
  SELECT id INTO v_existing_id
  FROM portfolio_holdings
  WHERE user_id = p_user_id 
    AND stock_symbol = p_stock_symbol;

  IF v_total_quantity > 0 THEN
    -- Insert or update the holding
    IF v_existing_id IS NOT NULL THEN
      UPDATE portfolio_holdings
      SET 
        quantity = v_total_quantity,
        average_buy_price = v_avg_price,
        updated_at = NOW()
      WHERE id = v_existing_id;
    ELSE
      INSERT INTO portfolio_holdings (user_id, stock_symbol, quantity, average_buy_price)
      VALUES (p_user_id, p_stock_symbol, v_total_quantity, v_avg_price);
    END IF;
  ELSE
    -- Delete the holding if quantity is 0 or negative
    IF v_existing_id IS NOT NULL THEN
      DELETE FROM portfolio_holdings WHERE id = v_existing_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGER FUNCTION: Called on transaction changes
-- ==========================================
CREATE OR REPLACE FUNCTION trigger_recalc_portfolio_holding()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_stock_symbol VARCHAR(10);
BEGIN
  -- Determine which user/stock to recalculate based on operation
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_stock_symbol := OLD.stock_symbol;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle both old and new stock symbols in case of symbol change
    v_user_id := NEW.user_id;
    v_stock_symbol := NEW.stock_symbol;
    
    -- Also recalculate old symbol if it changed
    IF OLD.stock_symbol != NEW.stock_symbol THEN
      PERFORM recalc_portfolio_holding(OLD.user_id, OLD.stock_symbol);
    END IF;
  ELSE
    -- INSERT
    v_user_id := NEW.user_id;
    v_stock_symbol := NEW.stock_symbol;
  END IF;

  -- Recalculate the portfolio holding
  PERFORM recalc_portfolio_holding(v_user_id, v_stock_symbol);

  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- CREATE TRIGGER on transactions table
-- ==========================================
DROP TRIGGER IF EXISTS trg_recalc_portfolio_holding ON transactions;
CREATE TRIGGER trg_recalc_portfolio_holding
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION trigger_recalc_portfolio_holding();

-- ==========================================
-- GRANT execute permission on the function
-- ==========================================
GRANT EXECUTE ON FUNCTION recalc_portfolio_holding(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION recalc_portfolio_holding(UUID, VARCHAR) TO anon;

-- ==========================================
-- Initial sync: Recalculate all existing holdings
-- Run this once after creating the trigger to sync existing data
-- ==========================================
-- Uncomment and run this to sync existing data:
/*
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT DISTINCT user_id, stock_symbol 
    FROM transactions 
  LOOP
    PERFORM recalc_portfolio_holding(rec.user_id, rec.stock_symbol);
  END LOOP;
END $$;
*/
