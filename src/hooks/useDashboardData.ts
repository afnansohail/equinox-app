import { useMemo } from "react";
import {
  usePortfolio,
  useTransactions,
  usePortfolioHistory,
} from "./usePortfolio";
import { buildChartFromHistory, FilterPeriod } from "../utils/portfolio";

export function useDashboardData(chartFilter: FilterPeriod) {
  const { data: holdings, isLoading: isPortfolioLoading } = usePortfolio();
  const { data: transactions, isLoading: isTransactionsLoading } =
    useTransactions();
  const { data: portfolioHistory, isLoading: isHistoryLoading } =
    usePortfolioHistory();

  const totalValue = useMemo(
    () =>
      holdings?.reduce((s, h) => {
        const marketPrice = h.stock?.currentPrice ?? 0;
        const effectivePrice =
          marketPrice > 0 ? marketPrice : h.averageBuyPrice;
        return s + effectivePrice * h.quantity;
      }, 0) ?? 0,
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

  const chartData = useMemo(
    () =>
      buildChartFromHistory(portfolioHistory, chartFilter, {
        currentValue: totalValue,
        transactions: transactions ?? [],
      }),
    [portfolioHistory, chartFilter, totalValue, transactions],
  );

  // Extract net invested series for dual-line chart
  const investedSeries = useMemo(
    () =>
      chartData.map((d) => ({
        value: d.invested ?? 0,
        label: d.label,
      })),
    [chartData],
  );

  const recentTransactions = useMemo(
    () => (transactions ?? []).slice(0, 3),
    [transactions],
  );

  return {
    holdings,
    transactions,
    portfolioHistory,
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPct,
    isPositive,
    dayPnL,
    dayPnLPct,
    dayIsPositive,
    chartData,
    investedSeries,
    recentTransactions,
    isLoading: isPortfolioLoading || isTransactionsLoading || isHistoryLoading,
  };
}
