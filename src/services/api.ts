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

const mapDbStock = (row: DbStockRow): Stock => ({
  symbol: row.symbol,
  name: row.name,
  currentPrice: toNumber(row.current_price),
  previousClose: toNumber(row.previous_close),
  changePercent: toNumber(row.change_percent),
  volume: Math.trunc(toNumber(row.volume)),
  marketCap:
    row.market_cap !== undefined
      ? Math.trunc(toNumber(row.market_cap))
      : undefined,
  high52Week:
    row.high_52week !== undefined ? toNumber(row.high_52week) : undefined,
  low52Week:
    row.low_52week !== undefined ? toNumber(row.low_52week) : undefined,
  sector: row.sector ?? undefined,
  logoUrl: row.logo_url ?? undefined,
  isShariahCompliant: row.is_shariah_compliant ?? undefined,
  lastUpdated: row.last_updated ?? new Date().toISOString(),
});

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

    if (dbStock && isRecent(dbStock.last_updated)) {
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
      total_invested,
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
    console.error("Error fetching portfolio", error);
    return [];
  }

  return (
    data?.map((row: any) => ({
      id: row.id,
      stockSymbol: row.stock_symbol,
      quantity: row.quantity,
      averageBuyPrice: Number(row.average_buy_price),
      totalInvested: Number(row.total_invested),
      stock: row.stocks ? mapDbStock(row.stocks as DbStockRow) : undefined,
    })) ?? []
  );
}

export async function addTransaction(
  userId: string,
  tx: Omit<Transaction, "id">,
): Promise<boolean> {
  try {
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

    if (txError) throw txError;

    const { data: holding } = await supabase
      .from("portfolio_holdings")
      .select("*")
      .eq("user_id", userId)
      .eq("stock_symbol", tx.stockSymbol)
      .maybeSingle<any>();

    if (tx.transactionType === "BUY") {
      if (holding) {
        const newQuantity = holding.quantity + tx.quantity;
        const newTotalInvested =
          Number(holding.total_invested) + tx.totalAmount;
        const newAvgPrice = newTotalInvested / newQuantity;

        await supabase
          .from("portfolio_holdings")
          .update({
            quantity: newQuantity,
            average_buy_price: newAvgPrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", holding.id);
      } else {
        await supabase.from("portfolio_holdings").insert({
          user_id: userId,
          stock_symbol: tx.stockSymbol,
          quantity: tx.quantity,
          average_buy_price: tx.pricePerShare,
        });
      }
    } else {
      if (holding) {
        const newQuantity = holding.quantity - tx.quantity;
        if (newQuantity > 0) {
          await supabase
            .from("portfolio_holdings")
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", holding.id);
        } else {
          await supabase
            .from("portfolio_holdings")
            .delete()
            .eq("id", holding.id);
        }
      }
    }

    return true;
  } catch (error) {
    console.error("Error adding transaction", error);
    return false;
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
