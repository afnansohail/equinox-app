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
    // Always re-check DB so we never serve a cached 0-price result.
    // getStock() handles its own 30-min scrape throttle internally.
    staleTime: 0,
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
