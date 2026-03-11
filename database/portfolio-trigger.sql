-- Equinox PSX Portfolio Tracker - Portfolio Holdings Trigger
-- This trigger automatically recalculates portfolio_holdings whenever
-- transactions are inserted, updated, or deleted.
-- Run this in Supabase SQL Editor after schema.sql

-- ==========================================
-- FUNCTION: Recalculate portfolio holding for a specific user + stock
-- Implements FIFO (First In First Out) cost basis tracking
-- When a position is completely liquidated (quantity = 0), the next buy
-- starts fresh with new cost basis, preserving only realized P&L history
-- ==========================================
CREATE OR REPLACE FUNCTION recalc_portfolio_holding(
  p_user_id UUID,
  p_stock_symbol VARCHAR(10)
) RETURNS void AS $$
DECLARE
  v_total_quantity INTEGER := 0;
  v_cost_basis DECIMAL(15, 2) := 0;
  v_avg_price DECIMAL(12, 2) := 0;
  v_running_qty INTEGER := 0;
  v_running_cost DECIMAL(15, 2) := 0;
  v_existing_id UUID;
  tx_record RECORD;
BEGIN
  -- Process transactions in chronological order using FIFO
  -- This correctly handles cost basis reset when position goes to zero
  FOR tx_record IN
    SELECT 
      transaction_type,
      quantity,
      price_per_share,
      total_amount
    FROM transactions
    WHERE user_id = p_user_id 
      AND stock_symbol = p_stock_symbol
    ORDER BY transaction_date ASC, id ASC
  LOOP
    IF tx_record.transaction_type = 'BUY' THEN
      -- Add shares at the given price
      v_running_cost := v_running_cost + tx_record.total_amount;
      v_running_qty := v_running_qty + tx_record.quantity;
    ELSE
      -- SELL: reduce quantity, maintain FIFO cost basis
      v_running_qty := v_running_qty - tx_record.quantity;
      -- Proportionally reduce cost basis
      IF v_running_qty < 0 THEN
        v_running_qty := 0;
      END IF;
      -- When position is liquidated, also reset cost basis for clean slate
      IF v_running_qty = 0 THEN
        v_running_cost := 0;
      ELSIF v_running_qty > 0 THEN
        -- Only update cost basis for remaining shares (FIFO principle)
        -- Cost basis is adjusted via: cost per share remains same for remaining qty
        v_running_cost := (v_running_cost / (v_running_qty + tx_record.quantity)) * v_running_qty;
      END IF;
    END IF;
  END LOOP;

  v_total_quantity := v_running_qty;
  v_cost_basis := v_running_cost;

  -- Calculate average price based on current holdings
  IF v_total_quantity > 0 THEN
    v_avg_price := v_cost_basis / v_total_quantity;
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
    -- Note: Realized P&L history is preserved in transactions table
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
