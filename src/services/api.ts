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
  pe_ratio?: string | number | null;
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
    peRatio:
      row.pe_ratio !== undefined && row.pe_ratio !== null
        ? toNumber(row.pe_ratio) || undefined
        : undefined,
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

function buildStockUpsertPayload(stock: {
  symbol: string;
  name: string;
  sector?: string | null;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  marketCap?: number | null;
  high52Week?: number | null;
  low52Week?: number | null;
  high?: number | null;
  low?: number | null;
  logoUrl?: string | null;
  isShariahCompliant?: boolean | null;
  peRatio?: number | null;
  lastUpdated: string;
}) {
  const payload: Record<string, unknown> = {
    symbol: stock.symbol,
    name: stock.name,
    current_price: stock.currentPrice,
    previous_close: stock.previousClose,
    change_percent: stock.changePercent,
    volume: stock.volume,
    market_cap: stock.marketCap ?? null,
    high_52week: stock.high52Week ?? null,
    low_52week: stock.low52Week ?? null,
    day_high: stock.high ?? null,
    day_low: stock.low ?? null,
    logo_url: stock.logoUrl ?? null,
    is_shariah_compliant: stock.isShariahCompliant ?? null,
    pe_ratio: stock.peRatio ?? null,
    last_updated: stock.lastUpdated,
    updated_at: new Date().toISOString(),
  };
  // Preserve existing sector if scraper fails to detect it
  if (stock.sector) payload.sector = stock.sector;
  return payload;
}

function buildPriceUpsertPayload(stock: {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  marketCap?: number | null;
  high52Week?: number | null;
  low52Week?: number | null;
  high?: number | null;
  low?: number | null;
  lastUpdated: string;
}) {
  return {
    symbol: stock.symbol,
    name: stock.name,
    current_price: stock.currentPrice,
    previous_close: stock.previousClose,
    change_percent: stock.changePercent,
    volume: stock.volume,
    market_cap: stock.marketCap ?? null,
    high_52week: stock.high52Week ?? null,
    low_52week: stock.low52Week ?? null,
    day_high: stock.high ?? null,
    day_low: stock.low ?? null,
    last_updated: stock.lastUpdated,
    updated_at: new Date().toISOString(),
  };
}

export async function getStock(
  symbol: string,
  options?: { forceScrape?: boolean; preserveNonPriceFromDb?: boolean },
): Promise<Stock | null> {
  const upper = symbol.toUpperCase();
  const forceScrape = options?.forceScrape ?? false;
  const preserveNonPriceFromDb = options?.preserveNonPriceFromDb ?? true;
  let dbStock: DbStockRow | null = null;

  try {
    const { data } = await supabase
      .from("stocks")
      .select("*")
      .eq("symbol", upper)
      .maybeSingle<DbStockRow>();
    dbStock = data;

    const cpNum = toNumber(dbStock?.current_price);
    const pcNum = toNumber(dbStock?.previous_close);
    const prevCloseSeemsSane = pcNum > 0 && pcNum !== cpNum;
    if (
      !forceScrape &&
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

  if (!vercelApiUrl) {
    return dbStock ? mapDbStock(dbStock) : null;
  }

  try {
    const response = await axios.get(`${vercelApiUrl}/api/scrape-stock`, {
      params: { symbol: upper },
    });

    const scraped = response.data as any;

    const merged = preserveNonPriceFromDb
      ? {
          ...scraped,
          name: dbStock?.name || scraped.name || upper,
          sector: dbStock?.sector ?? scraped.sector,
          logoUrl: dbStock?.logo_url ?? scraped.logoUrl,
          isShariahCompliant:
            dbStock?.is_shariah_compliant ?? scraped.isShariahCompliant,
          high: scraped.high,
          low: scraped.low,
        }
      : {
          ...scraped,
          name: scraped.name || dbStock?.name || upper,
          sector: scraped.sector ?? dbStock?.sector,
          logoUrl: scraped.logoUrl ?? dbStock?.logo_url,
          isShariahCompliant:
            scraped.isShariahCompliant ?? dbStock?.is_shariah_compliant,
          high: scraped.high,
          low: scraped.low,
        };

    await supabase.from("stocks").upsert(buildStockUpsertPayload(merged), {
      onConflict: "symbol",
    });

    return {
      symbol: merged.symbol,
      name: merged.name,
      currentPrice: merged.currentPrice,
      previousClose: merged.previousClose,
      change: merged.change,
      changePercent: merged.changePercent,
      open: merged.open,
      high: merged.high,
      low: merged.low,
      volume: merged.volume,
      marketCap: merged.marketCap,
      high52Week: merged.high52Week,
      low52Week: merged.low52Week,
      sector: merged.sector ?? undefined,
      peRatio: merged.peRatio,
      logoUrl: merged.logoUrl ?? undefined,
      isShariahCompliant: merged.isShariahCompliant ?? undefined,
      lastUpdated: merged.lastUpdated,
      source: merged.source,
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

  const staleSymbols = symbols.filter((sym) => {
    const s = stocksMap.get(sym);
    return !s || s.currentPrice <= 0 || !isRecent(s.lastUpdated);
  });

  if (staleSymbols.length > 0 && vercelApiUrl) {
    // Background refresh stale symbols without blocking initial render
    (async () => {
      try {
        const response = await axios.post(
          `${vercelApiUrl}/api/scrape-all-stocks`,
          {
            symbols: staleSymbols,
          },
        );
        const payload = response.data as { data: any[] };

        for (const stock of payload.data) {
          const existing = stocksMap.get(stock.symbol);
          await supabase.from("stocks").upsert(
            buildPriceUpsertPayload({
              ...stock,
              name: existing?.name ?? stock.name ?? stock.symbol,
              high: stock.high,
              low: stock.low,
            }),
            { onConflict: "symbol" },
          );
        }
      } catch (error) {
        console.error("Error background scraping stale symbols:", error);
      }
    })();
  }

  return data.map((row: any) => ({
    id: row.id,
    stockSymbol: row.stock_symbol,
    quantity: Number(row.quantity),
    averageBuyPrice: Number(row.average_buy_price),
    totalInvested: Number(row.quantity) * Number(row.average_buy_price),
    stock: stocksMap.get(row.stock_symbol),
  }));
}

export async function addTransaction(
  userId: string,
  tx: Omit<Transaction, "id">,
): Promise<void> {
  // Ensure stock row exists to satisfy FK constraints
  const { error: seedError } = await supabase.from("stocks").upsert(
    {
      symbol: tx.stockSymbol.toUpperCase(),
      name: tx.stockSymbol.toUpperCase(),
    },
    { onConflict: "symbol", ignoreDuplicates: true },
  );

  if (seedError) {
    console.error("Supabase seed error (check GRANT permissions):", seedError);
    throw new Error(
      `Failed to initialize stock '${tx.stockSymbol}': ${seedError.message}`,
    );
  }

  // Non-blocking live price enrichment
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
}

export async function updateTransaction(
  userId: string,
  id: string,
  updates: Partial<Transaction>,
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

  const { error: txUpdateError } = await supabase
    .from("transactions")
    .update(updatePayload)
    .eq("id", id);

  if (txUpdateError) {
    console.error("Error updating transaction", txUpdateError);
    throw new Error(`Failed to update transaction: ${txUpdateError.message}`);
  }
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

  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting transaction", deleteError);
    throw new Error(`Failed to delete transaction: ${deleteError.message}`);
  }
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

export async function refreshStockPrices(symbols: string[]): Promise<Stock[]> {
  if (!vercelApiUrl || symbols.length === 0) return [];

  const upperSymbols = symbols.map((s) => s.toUpperCase());

  const { data: existingRows } = await supabase
    .from("stocks")
    .select("*")
    .in("symbol", upperSymbols);

  const existingMap = new Map<string, Stock>(
    (existingRows as DbStockRow[] | null | undefined)?.map((row) => [
      row.symbol,
      mapDbStock(row),
    ]) ?? [],
  );

  const response = await axios.post(`${vercelApiUrl}/api/scrape-all-stocks`, {
    symbols: upperSymbols,
  });
  const payload = response.data as { data: any[] };

  const refreshed: Stock[] = [];

  await Promise.all(
    payload.data.map(async (stock) => {
      const existing = existingMap.get(stock.symbol);
      const { error: upsertErr } = await supabase.from("stocks").upsert(
        buildPriceUpsertPayload({
          ...stock,
          name: existing?.name ?? stock.name ?? stock.symbol,
          high: stock.high,
          low: stock.low,
        }),
        { onConflict: "symbol" },
      );

      if (upsertErr) console.error("Stock refresh upsert failed:", upsertErr);

      refreshed.push({
        symbol: stock.symbol,
        name: existing?.name ?? stock.name,
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
        sector: existing?.sector ?? stock.sector,
        logoUrl: existing?.logoUrl ?? stock.logoUrl,
        isShariahCompliant:
          existing?.isShariahCompliant ?? stock.isShariahCompliant,
        lastUpdated: stock.lastUpdated,
        source: stock.source,
      });
    }),
  );

  return refreshed;
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

// ── Portfolio History ───────────────────────────────────────────────────────

export interface PortfolioHistoryPoint {
  /** Unix epoch seconds (midnight UTC of the trading day) */
  timestamp: number;
  /** Total portfolio market value at close of that day (PKR) */
  marketValue: number;
  /** Net cash deployed: Σ BUY costs − Σ SELL proceeds (PKR) */
  invested: number;
}

// ── Dividends ─────────────────────────────────────────────────────────────────

export interface Dividend {
  id: string;
  stockSymbol: string;
  shares: number;
  dividendPerShare: number;
  totalAmount: number;
  paymentDate: string; // YYYY-MM-DD
  notes?: string | null;
  // Enriched from stocks table where available
  stockName?: string;
  stockLogoUrl?: string;
  stockCurrentPrice?: number;
  stockPeRatio?: number | null;
}

export async function getDividends(userId: string): Promise<Dividend[]> {
  const { data, error } = await supabase
    .from("dividends")
    .select("*")
    .eq("user_id", userId)
    .order("payment_date", { ascending: false });

  if (error) {
    console.error("Error fetching dividends", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Enrich with stock logo/name where the stock exists in our DB
  const symbols = [
    ...new Set((data as any[]).map((row) => row.stock_symbol as string)),
  ];
  const { data: stocksData } = await supabase
    .from("stocks")
    .select("symbol, name, logo_url, current_price, pe_ratio")
    .in("symbol", symbols);

  const stockMap = new Map<
    string,
    {
      name: string;
      logoUrl: string | null;
      currentPrice: number;
      peRatio: number | null;
    }
  >();
  if (stocksData) {
    for (const s of stocksData as any[]) {
      stockMap.set(s.symbol, {
        name: s.name,
        logoUrl: s.logo_url ?? null,
        currentPrice: s.current_price ? Number(s.current_price) : 0,
        peRatio: s.pe_ratio ? Number(s.pe_ratio) : null,
      });
    }
  }

  return (data as any[]).map((row) => {
    const enriched = stockMap.get(row.stock_symbol);
    return {
      id: row.id,
      stockSymbol: row.stock_symbol,
      shares: Number(row.shares),
      dividendPerShare: Number(row.dividend_per_share),
      totalAmount: Number(row.total_amount),
      paymentDate: row.payment_date,
      notes: row.notes ?? null,
      stockName: enriched?.name,
      stockLogoUrl: enriched?.logoUrl ?? undefined,
      stockCurrentPrice: enriched?.currentPrice ?? undefined,
      stockPeRatio: enriched?.peRatio ?? null,
    };
  });
}

export async function addDividend(
  userId: string,
  d: Omit<Dividend, "id" | "totalAmount" | "stockName" | "stockLogoUrl">,
): Promise<void> {
  // Seed a minimal stock row so logo/name enrichment works for known symbols
  await supabase.from("stocks").upsert(
    {
      symbol: d.stockSymbol.toUpperCase(),
      name: d.stockSymbol.toUpperCase(),
    },
    { onConflict: "symbol", ignoreDuplicates: true },
  );

  // Non-blocking price enrichment — same pattern as addTransaction
  getStock(d.stockSymbol).catch(() => null);

  const { error } = await supabase.from("dividends").insert({
    user_id: userId,
    stock_symbol: d.stockSymbol.toUpperCase(),
    shares: d.shares,
    dividend_per_share: d.dividendPerShare,
    payment_date: d.paymentDate,
    notes: d.notes ?? null,
  });

  if (error) {
    console.error("Error inserting dividend", error);
    throw new Error(`Failed to add dividend: ${error.message}`);
  }
}

export async function updateDividend(
  userId: string,
  id: string,
  updates: {
    shares?: number;
    dividendPerShare?: number;
    paymentDate?: string;
    notes?: string | null;
  },
): Promise<void> {
  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("dividends")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new Error("Dividend not found or unauthorized");
  }

  const updatePayload: any = {};
  if (updates.shares !== undefined) updatePayload.shares = updates.shares;
  if (updates.dividendPerShare !== undefined)
    updatePayload.dividend_per_share = updates.dividendPerShare;
  if (updates.paymentDate !== undefined)
    updatePayload.payment_date = updates.paymentDate;
  if (updates.notes !== undefined) updatePayload.notes = updates.notes;

  // NOTE: total_amount is GENERATED ALWAYS in the database schema,
  // so it automatically recalculates when shares or dividend_per_share change.
  // Do NOT include it in the update payload.

  const { error } = await supabase
    .from("dividends")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    console.error("Error updating dividend", error);
    throw new Error(`Failed to update dividend: ${error.message}`);
  }
}

export async function deleteDividend(
  userId: string,
  id: string,
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("dividends")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !existing) {
    throw new Error("Dividend not found or unauthorized");
  }

  const { error } = await supabase.from("dividends").delete().eq("id", id);

  if (error) {
    console.error("Error deleting dividend", error);
    throw new Error(`Failed to delete dividend: ${error.message}`);
  }
}

/**
 * Calls the Vercel portfolio-history endpoint which fetches PSX EOD data
 * server-side and returns a pre-computed day-by-day value series.
 * Only called on explicit manual refresh — not on every mount.
 */
export async function getPortfolioHistory(
  holdings: PortfolioHolding[],
  transactions: Transaction[],
): Promise<PortfolioHistoryPoint[]> {
  if (!vercelApiUrl || holdings.length === 0) return [];

  const response = await axios.post(`${vercelApiUrl}/api/portfolio-history`, {
    holdings: holdings.map((h) => ({
      symbol: h.stockSymbol,
      averageBuyPrice: h.averageBuyPrice,
      quantity: h.quantity,
    })),
    transactions: transactions.map((t) => ({
      symbol: t.stockSymbol,
      type: t.transactionType,
      quantity: t.quantity,
      pricePerShare: t.pricePerShare,
      transactionDate: t.transactionDate,
    })),
  });

  return (response.data?.data ?? []) as PortfolioHistoryPoint[];
}
