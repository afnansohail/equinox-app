import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllStocks,
  getStock,
  refreshStockPrices,
  searchStocks,
  type Stock,
} from "../services/api";

export function useStock(symbol: string) {
  return useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => getStock(symbol),
    enabled: !!symbol,
    // getStock() handles its own 30-min scrape throttle internally,
    // so we can cache the result for 5 minutes to avoid redundant re-fetches.
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

export function useAllStocks() {
  return useQuery<Stock[]>({
    queryKey: ["stocks"],
    queryFn: getAllStocks,
    staleTime: 30 * 60 * 1000,
  });
}

export function useStockSearch(query: string) {
  return useQuery<Stock[]>({
    queryKey: ["stocks", "search", query],
    queryFn: () => searchStocks(query),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRefreshStocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (symbols: string[]) => refreshStockPrices(symbols),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
