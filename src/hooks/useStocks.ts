import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllStocks,
  getStock,
  refreshStockPrices,
  searchStocks,
  type Stock,
  type PortfolioHolding,
  type WishlistItem,
} from "../services/api";

export function useStock(symbol: string) {
  return useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => getStock(symbol),
    enabled: !!symbol,
    // getStock() handles its own 30-min scrape throttle internally.
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAllStocks() {
  return useQuery<Stock[]>({
    queryKey: ["stocks"],
    queryFn: getAllStocks,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useStockSearch(query: string) {
  return useQuery<Stock[]>({
    queryKey: ["stocks", "search", query],
    queryFn: () => searchStocks(query),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRefreshStocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (symbols: string[]) => refreshStockPrices(symbols),
    onSuccess: (freshStocks) => {
      if (!freshStocks.length) return;

      // Build a symbol → Stock lookup from the freshly scraped data
      const stockMap = new Map<string, Stock>(
        freshStocks.map((s) => [s.symbol, s]),
      );

      // ── 1. Patch every portfolio cache entry directly ────────────────────
      // No DB round-trip: we already have the fresh prices in memory.
      // Preserve existing sector/shariah if scraper returned empty values.
      queryClient.setQueriesData<PortfolioHolding[]>(
        { queryKey: ["portfolio"] },
        (old) => {
          if (!old) return old;
          return old.map((h) => {
            const fresh = stockMap.get(h.stockSymbol);
            if (!fresh) return h;
            // Merge fresh data but preserve old sector if fresh is missing
            return {
              ...h,
              stock: {
                ...fresh,
                sector: fresh.sector || h.stock?.sector || undefined,
                isShariahCompliant:
                  fresh.isShariahCompliant ?? h.stock?.isShariahCompliant,
              },
            };
          });
        },
      );

      // ── 2. Patch every wishlist cache entry directly ──────────────────────
      queryClient.setQueriesData<WishlistItem[]>(
        { queryKey: ["wishlist"] },
        (old) => {
          if (!old) return old;
          return old.map((w) => {
            const fresh = stockMap.get(w.stockSymbol);
            if (!fresh) return w;
            return {
              ...w,
              stock: {
                ...fresh,
                sector: fresh.sector || w.stock?.sector || undefined,
                isShariahCompliant:
                  fresh.isShariahCompliant ?? w.stock?.isShariahCompliant,
              },
            };
          });
        },
      );

      // ── 3. Invalidate the stocks list so Markets screen stays in sync ─────
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
}
