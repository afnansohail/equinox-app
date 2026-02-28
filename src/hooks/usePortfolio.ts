import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTransaction,
  getPortfolioHoldings,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  type PortfolioHolding,
  type Transaction,
} from "../services/api";
import { useAuthStore } from "../stores/authStore";

export function usePortfolio() {
  const user = useAuthStore((state) => state.user);

  return useQuery<PortfolioHolding[]>({
    queryKey: ["portfolio", user?.id],
    queryFn: () => getPortfolioHoldings(user!.id),
    enabled: !!user,
  });
}

export function useTransactions() {
  const user = useAuthStore((state) => state.user);

  return useQuery<Transaction[]>({
    queryKey: ["transactions", user?.id],
    queryFn: () => getTransactions(user!.id),
    enabled: !!user,
  });
}

export function useAddTransaction() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tx: Omit<Transaction, "id">) => addTransaction(user!.id, tx),
    onSuccess: (_, tx) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
    },
  });
}
