import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTransaction,
  getPortfolioHoldings,
  getPortfolioHistory,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  type PortfolioHolding,
  type PortfolioHistoryPoint,
  type Transaction,
} from "../services/api";
import { useAuthStore } from "../stores/authStore";

export function usePortfolio() {
  const user = useAuthStore((state) => state.user);

  return useQuery<PortfolioHolding[]>({
    queryKey: ["portfolio", user?.id],
    queryFn: () => getPortfolioHoldings(user!.id),
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: "always", // Fetch fresh data on app open
  });
}

export function useTransactions() {
  const user = useAuthStore((state) => state.user);

  return useQuery<Transaction[]>({
    queryKey: ["transactions", user?.id],
    queryFn: () => getTransactions(user!.id),
    enabled: !!user,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: "always", // Fetch fresh data on app open
  });
}

/**
 * Fetches a day-by-day portfolio market-value series from the Vercel
 * portfolio-history endpoint (PSX EOD data, server-side computed).
 *
 * staleTime: Infinity — never re-fetches on its own.
 * Only refreshed when:
 *   • component first mounts with holdings present (initial load)
 *   • a transaction mutation invalidates it
 *   • manual refresh calls refetch() explicitly
 */
export function usePortfolioHistory() {
  const user = useAuthStore((state) => state.user);
  const { data: holdings } = usePortfolio();
  const { data: transactions } = useTransactions();

  return useQuery<PortfolioHistoryPoint[]>({
    queryKey: ["portfolioHistory", user?.id],
    queryFn: () => getPortfolioHistory(holdings ?? [], transactions ?? []),
    enabled:
      !!user && (holdings?.length ?? 0) > 0 && transactions !== undefined,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useAddTransaction() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tx: Omit<Transaction, "id">) => addTransaction(user!.id, tx),
    onSuccess: (_, tx) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["portfolioHistory", user?.id],
      });
      // Bust the stock cache so StockDetail shows fresh price immediately
      queryClient.invalidateQueries({ queryKey: ["stock", tx.stockSymbol] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
}

export function useUpdateTransaction() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      id: string;
      quantity: number;
      pricePerShare: number;
      totalAmount: number;
      transactionDate: string;
      notes: string | null;
    }) =>
      updateTransaction(user!.id, params.id, {
        quantity: params.quantity,
        pricePerShare: params.pricePerShare,
        totalAmount: params.totalAmount,
        transactionDate: params.transactionDate,
        notes: params.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["portfolioHistory", user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
}

export function useDeleteTransaction() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["portfolioHistory", user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
}
