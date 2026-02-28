import axios from "axios";
import Constants from "expo-constants";
import { supabase } from "./supabase";

const vercelApiUrl =
  (Constants.expoConfig?.extra as any)?.vercelApiUrl ||
  process.env.EXPO_PUBLIC_VERCEL_API_URL;

export interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  change?: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  volume: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
  sector?: string;
  peRatio?: number;
  logoUrl?: string;
  isShariahCompliant?: boolean;
  lastUpdated: string;
  source?: string;
}

export interface PortfolioHolding {
  id: string;
  stockSymbol: string;
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  stock?: Stock;
}

export type TransactionType = "BUY" | "SELL";

export interface Transaction {
  id: string;
  stockSymbol: string;
  transactionType: TransactionType;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  transactionDate: string;
  notes?: string | null;
}

type DbStockRow = {
  symbol: string;
  name: string;
  sector?: string | null;
  current_price?: string | number | null;
  previous_close?: string | number | null;
  change_percent?: string | number | null;
  volume?: string | number | null;
  market_cap?: string | number | null;
  high_52week?: string | number | null;
  low_52week?: string | number | null;
  day_high?: string | number | null;
  day_low?: string | number | null;
  logo_url?: string | null;
  is_shariah_compliant?: boolean | null;
  last_updated?: string | null;
};

// Helpers
const toNumber = (value: string | number | null | undefined): number =>
  value === null || value === undefined
    ? 0
    : typeof value === "number"
      ? value
      : Number(value.replace(/,/g, "")) || 0;

const mapDbStock = (row: DbStockRow): Stock => {
  const currentPrice = toNumber(row.current_price);
  const previousClose =
    row.previous_close !== null &&
    row.previous_close !== undefined &&
    toNumber(row.previous_close) > 0
      ? toNumber(row.previous_close)
      : 0;
  return {
    symbol: row.symbol,
    name: row.name,
    currentPrice,
    previousClose,
    change: previousClose > 0 ? currentPrice - previousClose : 0,
    changePercent: toNumber(row.change_percent),
    volume: Math.trunc(toNumber(row.volume)),
    marketCap:
      row.market_cap !== undefined
        ? Math.trunc(toNumber(row.market_cap))
        : undefined,
    high:
      row.day_high !== undefined && row.day_high !== null
        ? toNumber(row.day_high)
        : undefined,
    low:
      row.day_low !== undefined && row.day_low !== null
        ? toNumber(row.day_low)
        : undefined,
    high52Week:
      row.high_52week !== undefined ? toNumber(row.high_52week) : undefined,
    low52Week:
      row.low_52week !== undefined ? toNumber(row.low_52week) : undefined,
    sector: row.sector ?? undefined,
    logoUrl: row.logo_url ?? undefined,
    isShariahCompliant: row.is_shariah_compliant ?? undefined,
    lastUpdated: row.last_updated ?? new Date().toISOString(),
  };
};

const isRecent = (
  timestamp: string | null | undefined,
  maxAgeMinutes = 30,
): boolean => {
  if (!timestamp) return false;
  const lastUpdated = new Date(timestamp);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
  return diffMinutes < maxAgeMinutes;
};

// Stocks
export async function getStock(symbol: string): Promise<Stock | null> {
  const upper = symbol.toUpperCase();

  try {
    const { data: dbStock } = await supabase
      .from("stocks")
      .select("*")
      .eq("symbol", upper)
      .maybeSingle<DbStockRow>();

    // Only serve from cache if recent, has a real price, AND previousClose
    // is not suspiciously equal to currentPrice (sign of a bad old scrape)
    const cpNum = toNumber(dbStock?.current_price);
    const pcNum = toNumber(dbStock?.previous_close);
    const prevCloseSeemsSane = pcNum > 0 && pcNum !== cpNum;
    if (
      dbStock &&
      isRecent(dbStock.last_updated) &&
      cpNum > 0 &&
      prevCloseSeemsSane
    ) {
      return mapDbStock(dbStock);
    }
  } catch (error) {
    console.error("Error reading stock from DB", error);
  }

  if (!vercelApiUrl) return null;

  try {
    const response = await axios.get(`${vercelApiUrl}/api/scrape-stock`, {
      params: { symbol: upper },
    });

    const scraped = response.data as {
      symbol: string;
      name: string;
      currentPrice: number;
      previousClose: number;
      change?: number;
      changePercent: number;
      open?: number;
      high?: number;
      low?: number;
      volume: number;
      marketCap?: number;
      high52Week?: number;
      low52Week?: number;
      sector?: string;
      peRatio?: number;
      logoUrl?: string;
      isShariahCompliant?: boolean;
      lastUpdated: string;
      source?: string;
    };

    await supabase.from("stocks").upsert({
      symbol: scraped.symbol,
      name: scraped.name,
      sector: scraped.sector,
      current_price: scraped.currentPrice,
      previous_close: scraped.previousClose,
      change_percent: scraped.changePercent,
      volume: scraped.volume,
      market_cap: scraped.marketCap,
      high_52week: scraped.high52Week,
      low_52week: scraped.low52Week,
      day_high: scraped.high,
      day_low: scraped.low,
      logo_url: scraped.logoUrl,
      is_shariah_compliant: scraped.isShariahCompliant,
      last_updated: scraped.lastUpdated,
      updated_at: new Date().toISOString(),
    });

    return {
      symbol: scraped.symbol,
      name: scraped.name,
      currentPrice: scraped.currentPrice,
      previousClose: scraped.previousClose,
      change: scraped.change,
      changePercent: scraped.changePercent,
      open: scraped.open,
      high: scraped.high,
      low: scraped.low,
      volume: scraped.volume,
      marketCap: scraped.marketCap,
      high52Week: scraped.high52Week,
      low52Week: scraped.low52Week,
      sector: scraped.sector,
      peRatio: scraped.peRatio,
      logoUrl: scraped.logoUrl,
      isShariahCompliant: scraped.isShariahCompliant,
      lastUpdated: scraped.lastUpdated,
      source: scraped.source,
    };
  } catch (error) {
    console.error("Error scraping stock", error);
    return null;
  }
}

export async function getAllStocks(): Promise<Stock[]> {
  const { data, error } = await supabase
    .from("stocks")
    .select("*")
    .order("symbol");

  if (error) {
    console.error("Error fetching stocks", error);
    return [];
  }

  return (data as DbStockRow[]).map(mapDbStock);
}

export async function searchStocks(query: string): Promise<Stock[]> {
  if (!query) return [];

  const { data, error } = await supabase
    .from("stocks")
    .select("*")
    .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error("Error searching stocks", error);
    return [];
  }

  return (data as DbStockRow[]).map(mapDbStock);
}

// Portfolio
export async function getPortfolioHoldings(
  userId: string,
): Promise<PortfolioHolding[]> {
  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select(
      `
      id,
      stock_symbol,
      quantity,
      average_buy_price,
      total_invested
    `,
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching portfolio", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Fetch fresh stock data for all symbols in portfolio
  const symbols = data.map((row: any) => row.stock_symbol);
  const { data: stocksData } = await supabase
    .from("stocks")
    .select("*")
    .in("symbol", symbols);

  const stocksMap = new Map<string, Stock>();
  if (stocksData) {
    for (const row of stocksData) {
      stocksMap.set(row.symbol, mapDbStock(row as DbStockRow));
    }
  }

  // For any symbol with a zero/missing price, try to scrape fresh data in a single batch
  const staleSymbols = symbols.filter((sym) => {
    const s = stocksMap.get(sym);
    return !s || s.currentPrice <= 0;
  });
  if (staleSymbols.length > 0 && vercelApiUrl) {
    try {
      // Make a SINGLE call to scrape all stale symbols at once
      const response = await axios.post(
        `${vercelApiUrl}/api/scrape-all-stocks`,
        {
          symbols: staleSymbols,
        },
      );
      const payload = response.data as { data: any[] };

      // Upsert all scraped data to the database
      for (const stock of payload.data) {
        await supabase.from("stocks").upsert({
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          current_price: stock.currentPrice,
          previous_close: stock.previousClose,
          change_percent: stock.changePercent,
          volume: stock.volume,
          market_cap: stock.marketCap,
          high_52week: stock.high52Week,
          low_52week: stock.low52Week,
          day_high: stock.high,
          day_low: stock.low,
          logo_url: stock.logoUrl,
          is_shariah_compliant: stock.isShariahCompliant,
          last_updated: stock.lastUpdated,
          updated_at: new Date().toISOString(),
        });
        // Update the local map with fresh data
        stocksMap.set(stock.symbol, {
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: stock.currentPrice,
          previousClose: stock.previousClose,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
          marketCap: stock.marketCap,
          high: stock.high,
          low: stock.low,
          high52Week: stock.high52Week,
          low52Week: stock.low52Week,
          sector: stock.sector,
          logoUrl: stock.logoUrl,
          isShariahCompliant: stock.isShariahCompliant,
          lastUpdated: stock.lastUpdated,
        });
      }
    } catch (error) {
      console.error("Error batch scraping stale symbols:", error);
      // Fallback: fetch remaining stale symbols from DB anyway
      const { data: freshData } = await supabase
        .from("stocks")
        .select("*")
        .in("symbol", staleSymbols);
      if (freshData) {
        for (const row of freshData) {
          stocksMap.set(row.symbol, mapDbStock(row as DbStockRow));
        }
      }
    }
  }

  return data.map((row: any) => ({
    id: row.id,
    stockSymbol: row.stock_symbol,
    quantity: Number(row.quantity),
    averageBuyPrice: Number(row.average_buy_price),
    // Compute from stored fields — total_invested may be a generated column that rejects writes
    totalInvested: Number(row.quantity) * Number(row.average_buy_price),
    stock: stocksMap.get(row.stock_symbol),
  }));
}

export async function addTransaction(
  userId: string,
  tx: Omit<Transaction, "id">,
): Promise<void> {
  // Guarantee a stock row exists with at least the symbol before doing anything
  // else, so FK constraints on transactions/portfolio_holdings never fail even
  // if the scraper is temporarily unavailable.
  const { error: seedError } = await supabase.from("stocks").upsert(
    {
      symbol: tx.stockSymbol.toUpperCase(),
      name: tx.stockSymbol.toUpperCase(),
    },
    { onConflict: "symbol", ignoreDuplicates: true },
  );

  if (seedError) {
    // 403 = missing GRANT on stocks table in Supabase.
    // Run the SQL in /database/schema.sql (GRANT section) in the Supabase SQL editor.
    console.error(
      "Cannot seed stock row — check Supabase GRANT permissions:",
      seedError,
    );
    throw new Error(
      `Cannot write stock '${tx.stockSymbol}' to DB (${seedError.code}): ${seedError.message}`,
    );
  }

  // Now try to enrich with live price data (non-blocking — failure is OK)
  await getStock(tx.stockSymbol).catch(() => null);

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: userId,
    stock_symbol: tx.stockSymbol,
    transaction_type: tx.transactionType,
    quantity: tx.quantity,
    price_per_share: tx.pricePerShare,
    total_amount: tx.totalAmount,
    transaction_date: tx.transactionDate,
    notes: tx.notes,
  });

  if (txError) {
    console.error("Error inserting transaction", txError);
    throw new Error(`Failed to add transaction: ${txError.message}`);
  }

  // Portfolio holdings are now updated via database trigger (recalc_portfolio_holding)
  // No client-side calculation needed
}

export async function updateTransaction(
  userId: string,
  id: string,
  updates: Partial<
    Omit<Transaction, "id" | "stockSymbol" | "transactionType"> & {
      quantity: number;
      pricePerShare: number;
      totalAmount: number;
      transactionDate: string;
      notes: string | null;
    }
  >,
): Promise<void> {
  const { data: existingTx, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single<any>();

  if (fetchError || !existingTx) {
    throw new Error("Transaction not found or unauthorized");
  }

  // Build the update payload for the transaction
  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.quantity !== undefined) updatePayload.quantity = updates.quantity;
  if (updates.pricePerShare !== undefined)
    updatePayload.price_per_share = updates.pricePerShare;
  if (updates.totalAmount !== undefined)
    updatePayload.total_amount = updates.totalAmount;
  if (updates.transactionDate !== undefined)
    updatePayload.transaction_date = updates.transactionDate;
  if ("notes" in updates) updatePayload.notes = updates.notes;

  // Update the transaction record
  const { error: txUpdateError } = await supabase
    .from("transactions")
    .update(updatePayload)
    .eq("id", id);

  if (txUpdateError) {
    console.error("Error updating transaction", txUpdateError);
    throw new Error(`Failed to update transaction: ${txUpdateError.message}`);
  }

  // Portfolio holdings are now updated via database trigger (recalc_portfolio_holding)
  // No client-side calculation needed
}

export async function deleteTransaction(
  userId: string,
  id: string,
): Promise<void> {
  const { data: existingTx, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single<any>();

  if (fetchError || !existingTx) {
    throw new Error("Transaction not found or unauthorized");
  }

  // Delete the transaction
  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting transaction", deleteError);
    throw new Error(`Failed to delete transaction: ${deleteError.message}`);
  }

  // Portfolio holdings are now updated via database trigger (recalc_portfolio_holding)
  // No client-side calculation needed
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions", error);
    return [];
  }

  return (
    data?.map((row: any) => ({
      id: row.id,
      stockSymbol: row.stock_symbol,
      transactionType: row.transaction_type,
      quantity: row.quantity,
      pricePerShare: Number(row.price_per_share),
      totalAmount: Number(row.total_amount),
      transactionDate: row.transaction_date,
      notes: row.notes,
    })) ?? []
  );
}

export async function refreshStockPrices(symbols: string[]): Promise<void> {
  if (!vercelApiUrl || symbols.length === 0) return;

  const response = await axios.post(`${vercelApiUrl}/api/scrape-all-stocks`, {
    symbols,
  });
  const payload = response.data as { data: any[] };

  for (const stock of payload.data) {
    await supabase.from("stocks").upsert({
      symbol: stock.symbol,
      name: stock.name,
      current_price: stock.currentPrice,
      previous_close: stock.previousClose,
      change_percent: stock.changePercent,
      volume: stock.volume,
      high_52week: stock.high52Week,
      low_52week: stock.low52Week,
      logo_url: stock.logoUrl,
      is_shariah_compliant: stock.isShariahCompliant,
      last_updated: stock.lastUpdated,
      updated_at: new Date().toISOString(),
    });
  }
}

// Wishlist
export interface WishlistItem {
  id: string;
  stockSymbol: string;
  stock?: Stock;
}

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from("wishlist")
    .select(
      `
      id,
      stock_symbol,
      stocks (
        symbol,
        name,
        current_price,
        previous_close,
        change_percent,
        volume,
        market_cap,
        high_52week,
        low_52week,
        logo_url,
        is_shariah_compliant,
        last_updated
      )
    `,
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching wishlist", error);
    return [];
  }

  return (
    data?.map((row: any) => ({
      id: row.id,
      stockSymbol: row.stock_symbol,
      stock: row.stocks ? mapDbStock(row.stocks as DbStockRow) : undefined,
    })) ?? []
  );
}

export async function isInWishlist(
  userId: string,
  symbol: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", userId)
    .eq("stock_symbol", symbol.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error("Error checking wishlist", error);
    return false;
  }

  return !!data;
}

export async function addToWishlist(
  userId: string,
  symbol: string,
): Promise<boolean> {
  const { error } = await supabase.from("wishlist").insert({
    user_id: userId,
    stock_symbol: symbol.toUpperCase(),
  });

  if (error) {
    console.error("Error adding to wishlist", error);
    return false;
  }

  return true;
}

export async function removeFromWishlist(
  userId: string,
  symbol: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("stock_symbol", symbol.toUpperCase());

  if (error) {
    console.error("Error removing from wishlist", error);
    return false;
  }

  return true;
}

/**
 * Deletes all user-owned data: portfolio holdings, transactions, and wishlist.
 * Runs the three deletes in parallel for minimum latency.
 */
export async function deleteAllUserData(
  userId: string,
): Promise<{ error: string | null }> {
  const [holdingsRes, txRes, wishlistRes] = await Promise.all([
    supabase.from("portfolio_holdings").delete().eq("user_id", userId),
    supabase.from("transactions").delete().eq("user_id", userId),
    supabase.from("wishlist").delete().eq("user_id", userId),
  ]);

  const err = holdingsRes.error ?? txRes.error ?? wishlistRes.error;
  if (err) {
    console.error("Error deleting user data", err);
    return { error: err.message };
  }

  return { error: null };
}

/**
 * Stores a price snapshot only if the price has changed from last stored.
 * Returns true if price was stored, false if unchanged.
 */
export async function storePriceIfChanged(
  symbol: string,
  newPrice: number,
): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    // Check if we already have a snapshot for today
    const { data: existing } = await supabase
      .from("stock_prices_history")
      .select("close")
      .eq("stock_symbol", symbol)
      .eq("date", today)
      .single();

    // If same price, don't store
    if (existing && existing.close === newPrice) {
      return false;
    }

    // Store the new price
    await supabase.from("stock_prices_history").upsert(
      {
        stock_symbol: symbol,
        date: today,
        close: newPrice,
      },
      { onConflict: "stock_symbol,date" },
    );
    return true;
  } catch (error) {
    console.error("Error storing price snapshot", error);
    return false;
  }
}

export interface HistoricalPrice {
  date: string;
  close: number;
}

/**
 * Fetches historical closing prices for a symbol.
 * Returns data from the earliest available date to today.
 */
export async function getHistoricalPrices(
  symbol: string,
): Promise<HistoricalPrice[]> {
  const { data, error } = await supabase
    .from("stock_prices_history")
    .select("date, close")
    .eq("stock_symbol", symbol)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching historical prices", error);
    return [];
  }

  return (data || []).map((row) => ({
    date: row.date,
    close: row.close,
  }));
}
