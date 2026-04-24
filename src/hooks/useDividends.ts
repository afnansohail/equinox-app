import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDividends,
  addDividend,
  updateDividend,
  deleteDividend,
  getScrapedPayouts,
  type Dividend,
  type ScrapedPayoutBySymbol,
} from "../services/api";
import { useAuthStore } from "../stores/authStore";

export function useDividends() {
  const user = useAuthStore((state) => state.user);

  return useQuery<Dividend[]>({
    queryKey: ["dividends", user?.id],
    queryFn: () => getDividends(user!.id),
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useAddDividend() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      d: Omit<Dividend, "id" | "totalAmount" | "stockName" | "stockLogoUrl">,
    ) => addDividend(user!.id, d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends", user?.id] });
    },
  });
}

export function useUpdateDividend() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        shares?: number;
        dividendPerShare?: number;
        paymentDate?: string;
        notes?: string | null;
      };
    }) => updateDividend(user!.id, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends", user?.id] });
    },
  });
}

export function useDeleteDividend() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDividend(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends", user?.id] });
    },
  });
}

export function useScrapedPayouts(symbols: string[]) {
  const uniqueSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];

  return useQuery<ScrapedPayoutBySymbol[]>({
    queryKey: ["scraped-payouts", uniqueSymbols.sort().join("|")],
    queryFn: () => getScrapedPayouts(uniqueSymbols),
    enabled: uniqueSymbols.length > 0,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    refetchOnWindowFocus: false,
  });
}
