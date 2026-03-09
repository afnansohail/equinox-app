import { PortfolioHistoryPoint, Transaction } from "../services/api";

export type FilterPeriod = "1W" | "1M" | "1Y" | "5Y" | "YTD" | "ALL";

export function getFilterStartDate(filter: FilterPeriod): Date | null {
  const now = new Date();
  switch (filter) {
    case "1W": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "1M": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "1Y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    case "5Y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 5);
      return d;
    }
    case "YTD":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}

export type ChartPoint = { value: number; invested?: number; label?: string };

export function buildChartFromHistory(
  history: PortfolioHistoryPoint[] | undefined,
  filter: FilterPeriod,
  fallbackData?: {
    currentValue: number;
    transactions?: Array<{ transactionDate: string; totalAmount: number }>;
  },
): ChartPoint[] {
  if (history && history.length >= 2) {
    const startDate = getFilterStartDate(filter);
    const startTs = startDate ? Math.floor(startDate.getTime() / 1000) : null;

    const filtered = startTs
      ? history.filter((p) => p.timestamp >= startTs)
      : history;

    if (filtered.length >= 2) {
      const n = filtered.length;
      const labelSet = new Set<number>([0, n - 1]);
      if (n >= 4) {
        labelSet.add(Math.round(n / 3));
        labelSet.add(Math.round((2 * n) / 3));
      } else if (n === 3) {
        labelSet.add(1);
      }

      return filtered.map((p, i) => ({
        value: p.marketValue,
        invested: p.invested,
        label: labelSet.has(i)
          ? new Date(p.timestamp * 1000).toLocaleDateString("en-PK", {
              month: "short",
              day: "numeric",
            })
          : undefined,
      }));
    }
  }

  if (fallbackData?.transactions && fallbackData.transactions.length > 0) {
    const sorted = [...fallbackData.transactions].sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime(),
    );
    const firstBuyDate = new Date(sorted[0].transactionDate);
    const today = new Date();
    const firstBuyAmount = sorted[0].totalAmount;

    return [
      {
        value: firstBuyAmount,
        label: firstBuyDate.toLocaleDateString("en-PK", {
          month: "short",
          day: "numeric",
        }),
      },
      {
        value: fallbackData.currentValue,
        label: today.toLocaleDateString("en-PK", {
          month: "short",
          day: "numeric",
        }),
      },
    ];
  }

  return [];
}

export function computeRealizedPnL(transactions: Transaction[]): {
  realizedPnl: number;
  realizedCost: number;
  txPnL: Record<string, number>;
} {
  const positions = new Map<string, { quantity: number; avgCost: number }>();
  let realizedPnl = 0;
  let realizedCost = 0;
  const txPnL: Record<string, number> = {};

  const ordered = [...transactions].sort(
    (a, b) =>
      a.transactionDate.localeCompare(b.transactionDate) ||
      a.id.localeCompare(b.id),
  );

  for (const tx of ordered) {
    const current = positions.get(tx.stockSymbol) ?? {
      quantity: 0,
      avgCost: 0,
    };

    if (tx.transactionType === "BUY") {
      const totalCostBefore = current.quantity * current.avgCost;
      const totalCostAfter = totalCostBefore + tx.quantity * tx.pricePerShare;
      const quantityAfter = current.quantity + tx.quantity;
      positions.set(tx.stockSymbol, {
        quantity: quantityAfter,
        avgCost: quantityAfter > 0 ? totalCostAfter / quantityAfter : 0,
      });
      continue;
    }

    const sellQty = Math.min(tx.quantity, current.quantity);
    if (sellQty > 0) {
      const pnl = (tx.pricePerShare - current.avgCost) * sellQty;
      realizedPnl += pnl;
      realizedCost += current.avgCost * sellQty;
      txPnL[tx.id] = pnl;
    }

    const quantityAfter = Math.max(current.quantity - tx.quantity, 0);
    positions.set(tx.stockSymbol, {
      quantity: quantityAfter,
      avgCost: quantityAfter > 0 ? current.avgCost : 0,
    });
  }

  return { realizedPnl, realizedCost, txPnL };
}
