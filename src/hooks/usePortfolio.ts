import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTransaction,
  getPortfolioHoldings,
  getTransactions,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
