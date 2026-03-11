import { useMemo } from "react";
import { usePortfolio, useTransactions } from "./usePortfolio";
import { computeRealizedPnL } from "../utils/portfolio";

export function usePortfolioData(selectedSector: string | null) {
  const { data: holdings, isLoading: isPortfolioLoading } = usePortfolio();
  const { data: transactions, isLoading: isTransactionsLoading } =
    useTransactions();

  const totalValue = useMemo(
    () =>
      holdings?.reduce(
        (s, h) =>
          s +
          ((h.stock?.currentPrice ?? 0) > 0
            ? (h.stock?.currentPrice ?? 0)
            : h.averageBuyPrice) *
            h.quantity,
        0,
      ) ?? 0,
    [holdings],
  );

  const totalInvested = useMemo(
    () => holdings?.reduce((s, h) => s + h.totalInvested, 0) ?? 0,
    [holdings],
  );

  const totalPnL = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPositive = totalPnL >= 0;

  const dayPnL = useMemo(
    () =>
      holdings?.reduce((s, h) => {
        const price = h.stock?.currentPrice ?? 0;
        const prev =
          h.stock?.previousClose && h.stock.previousClose > 0
            ? h.stock.previousClose
            : price;
        return s + (price - prev) * h.quantity;
      }, 0) ?? 0,
    [holdings],
  );

  const previousCloseValue = useMemo(
    () =>
      holdings?.reduce((s, h) => {
        const prev =
          h.stock?.previousClose && h.stock.previousClose > 0
            ? h.stock.previousClose
            : (h.stock?.currentPrice ?? 0);
        return s + prev * h.quantity;
      }, 0) ?? 0,
    [holdings],
  );

  const dayPnLPct =
    previousCloseValue > 0 ? (dayPnL / previousCloseValue) * 100 : 0;
  const dayIsPositive = dayPnL >= 0;

  const soldTransactions = useMemo(
    () =>
      [...(transactions ?? [])]
        .filter((tx) => tx.transactionType === "SELL")
        .sort(
          (a, b) =>
            b.transactionDate.localeCompare(a.transactionDate) ||
            b.id.localeCompare(a.id),
        ),
    [transactions],
  );

  const {
    realizedPnl: totalRealizedPnL,
    realizedCost: totalRealizedCost,
    txPnL,
  } = useMemo(() => computeRealizedPnL(transactions ?? []), [transactions]);

  const realizedIsPositive = totalRealizedPnL >= 0;
  const totalRealizedPct =
    totalRealizedCost > 0 ? (totalRealizedPnL / totalRealizedCost) * 100 : 0;

  const filteredHoldings = useMemo(
    () =>
      selectedSector
        ? (holdings ?? []).filter((h) => h.stock?.sector === selectedSector)
        : (holdings ?? []),
    [holdings, selectedSector],
  );

  return {
    holdings,
    filteredHoldings,
    transactions,
    soldTransactions,
    txPnL,
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPct,
    isPositive,
    dayPnL,
    dayPnLPct,
    dayIsPositive,
    totalRealizedPnL,
    totalRealizedCost,
    totalRealizedPct,
    realizedIsPositive,
    isLoading: isPortfolioLoading || isTransactionsLoading,
  };
}
