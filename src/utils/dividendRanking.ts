import type { Dividend, ScrapedPayoutBySymbol } from "../services/api";

export interface HoldingMeta {
  symbol: string;
  quantity?: number;
  currentPrice?: number;
  peRatio?: number | null;
  sector?: string;
}

export interface DividendScoreBreakdown {
  yield: number;
  consistency: number;
  valuation: number;
}

export interface RankedDividendStock {
  symbol: string;
  totalAmount: number;
  dividendYield: number;
  score: number;
  breakdown: DividendScoreBreakdown;
  recordCount: number;
  isETF?: boolean;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Yield score (max 40 pts).
 *
 * Rewards sustainable income yields (3–10%) and gently penalises extreme
 * yields (>14%) that are often a distress / dividend-trap signal.
 *
 *  0–3 %   → 0–8   (linear ramp)
 *  3–6 %   → 8–20  (linear ramp)
 *  6–10 %  → 20–40 (linear ramp, plateau at 40)
 * 10–14 %  → 40    (extended plateau — good dividend yields)
 * 14–22 %  → 40→20 (linear fade — distress warning zone)
 * >22 %    → 0     (almost certainly a trap or special situation)
 */
function calcYieldScore(dividendYield: number): number {
  if (dividendYield <= 0) return 0;
  if (dividendYield <= 3) return (dividendYield / 3) * 8;
  if (dividendYield <= 6) return 8 + ((dividendYield - 3) / 3) * 12;
  if (dividendYield <= 10) return 20 + ((dividendYield - 6) / 4) * 20;
  if (dividendYield <= 14) return 40; // extended plateau — good dividend yields
  if (dividendYield <= 22)
    return Math.max(20, 40 - ((dividendYield - 14) / 8) * 20);
  return 0;
}

/**
 * Consistency score (max 40 pts).
 *
 * Based on year-to-year stability PLUS bonus for frequent/regular payouts.
 *
 * - Drops up to 20% year-to-year are treated as normal noise.
 * - Larger drops are penalized progressively (max at 70%+ drop).
 * - Bonus: Frequent payers (4+ payouts/year = quarterly) get +5 pts.
 * - Single year of data: return baseline + payout frequency bonus.
 */
function calcConsistencyScore(
  yearlySums: number[],
  payoutCount: number = 0,
): number {
  // Calculate payout frequency bonus upfront
  let bonusPts = 0;
  const avgPayoutsPerYear =
    yearlySums.length > 0 ? payoutCount / yearlySums.length : 0;
  if (avgPayoutsPerYear >= 4) {
    bonusPts = 5; // +5 pts for quarterly or more frequent
  } else if (avgPayoutsPerYear >= 3) {
    bonusPts = 2.5; // +2.5 pts for 3x/year
  }

  // If only one year of data, return baseline + bonus
  if (yearlySums.length < 2) return Math.min(40, 26 + bonusPts);

  const severities: number[] = [];
  for (let i = 1; i < yearlySums.length; i++) {
    const prev = yearlySums[i - 1];
    const curr = yearlySums[i];

    if (prev <= 0) {
      severities.push(0);
      continue;
    }

    const dropPct = (prev - curr) / prev;
    // 20% drop is tolerated (accounts for biannual/lumpy payouts);
    // 70%+ drop is treated as max severity to catch real cuts.
    const severity = Math.max(0, Math.min(1, (dropPct - 0.2) / 0.5));
    severities.push(severity);
  }

  const avgSeverity =
    severities.length > 0
      ? severities.reduce((sum, value) => sum + value, 0) / severities.length
      : 0;

  const baseScore = 40 * (1 - avgSeverity);
  return Math.min(40, baseScore + bonusPts);
}

/**
 * Valuation score (max 20 pts).
 *
 * When P/E is null/unavailable we return a neutral 10 pts rather than
 * penalising the stock for missing data.
 *
 * Negative P/E (loss-making company) is a genuine red flag → 0 pts.
 *
 *  null      → 10  (neutral / data unavailable)
 *  ≤0        →  0  (company not profitable)
 *  1–8       → 20  (cheap)
 *  8–15      → 20→12 (fair)
 * 15–25      → 12→2  (pricey)
 * >25        → max(0, 2 − (pe−25)×0.1)
 */
function calcValuationScore(peRatio: number | null): number {
  if (peRatio === null) return 10; // neutral — data unavailable
  if (peRatio <= 0) return 0; // loss-making
  if (peRatio <= 8) return 20;
  if (peRatio <= 15) return 20 - ((peRatio - 8) / 7) * 8;
  if (peRatio <= 25) return 12 - ((peRatio - 15) / 10) * 10;
  return Math.max(0, 2 - (peRatio - 25) * 0.1);
}

function calcDividendScore(data: {
  dividendYield: number;
  yearlySums: number[];
  peRatio: number | null;
  payoutCount?: number;
}): { score: number; breakdown: DividendScoreBreakdown } {
  const yieldScore = calcYieldScore(data.dividendYield);
  const consistencyScore = calcConsistencyScore(
    data.yearlySums,
    data.payoutCount,
  );
  const valuationScore = calcValuationScore(data.peRatio);

  const totalScore = Math.round(yieldScore + consistencyScore + valuationScore);

  return {
    score: Math.min(100, totalScore),
    breakdown: {
      yield: Math.round(yieldScore),
      consistency: Math.round(consistencyScore),
      valuation: Math.round(valuationScore),
    },
  };
}

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

type SymbolAccumulator = {
  /** Sum of dividends per share across all recorded payouts. */
  totalAmount: number;
  yearlyDivPerShare: Map<number, number>;
  ttmDivPerShare: number;
  currentPrice: number;
  peRatio: number | null;
  recordCount: number;
  sector?: string;
};

export function buildDividendRanking(params: {
  dividends: Dividend[];
  scrapedPayouts?: ScrapedPayoutBySymbol[];
  faceValueBySymbol?: Record<string, number>;
  holdingMeta?: HoldingMeta[];
}): RankedDividendStock[] {
  const { dividends, scrapedPayouts, faceValueBySymbol, holdingMeta } = params;

  // Use setFullYear for a leap-year-safe trailing-12-month window.
  const now = new Date();
  const ttmStart = new Date(now);
  ttmStart.setFullYear(now.getFullYear() - 1);

  const map = new Map<string, SymbolAccumulator>();

  // Build a map of symbol → quantity from holdings for scraped payout calculations.
  const holdingQtyBySymbol = new Map<string, number>();
  for (const holding of holdingMeta ?? []) {
    const symbol = holding.symbol.toUpperCase();
    if (holding.quantity && holding.quantity > 0) {
      holdingQtyBySymbol.set(symbol, holding.quantity);
    }
  }

  // Pre-populate map with metadata so every held symbol appears in results.
  for (const holding of holdingMeta ?? []) {
    const symbol = holding.symbol.toUpperCase();
    if (map.has(symbol)) continue;
    map.set(symbol, {
      totalAmount: 0,
      yearlyDivPerShare: new Map<number, number>(),
      ttmDivPerShare: 0,
      currentPrice: holding.currentPrice ?? 0,
      peRatio: holding.peRatio ?? null,
      recordCount: 0,
      sector: holding.sector,
    });
  }

  const hasScraped = (scrapedPayouts?.length ?? 0) > 0;
  const symbolsWithScrapedData = new Set<string>();

  // --- Scraped payouts (preferred source) ---
  if (hasScraped) {
    for (const stockPayout of scrapedPayouts ?? []) {
      const symbol = stockPayout.symbol.toUpperCase();
      const faceValue = faceValueBySymbol?.[symbol] ?? 10;
      const existing: SymbolAccumulator = map.get(symbol) ?? {
        totalAmount: 0,
        yearlyDivPerShare: new Map<number, number>(),
        ttmDivPerShare: 0,
        currentPrice: 0,
        peRatio: null,
        recordCount: 0,
      };

      const beforeCount = existing.recordCount;

      for (const payout of stockPayout.payouts ?? []) {
        if (!(payout.dividendPercent > 0) || !payout.paymentDate) continue;

        const dividendPerShare = (payout.dividendPercent / 100) * faceValue;
        const paymentDate = new Date(payout.paymentDate);
        const year = paymentDate.getFullYear();

        // For scraped payouts, multiply by current holding quantity to get total cash.
        const holdingQty = holdingQtyBySymbol.get(symbol) ?? 0;
        const totalCash = dividendPerShare * holdingQty;

        existing.totalAmount += totalCash;
        existing.yearlyDivPerShare.set(
          year,
          (existing.yearlyDivPerShare.get(year) ?? 0) + dividendPerShare,
        );
        if (paymentDate >= ttmStart) {
          existing.ttmDivPerShare += dividendPerShare;
        }
        existing.recordCount += 1;
      }

      if (existing.recordCount > beforeCount) {
        symbolsWithScrapedData.add(symbol);
      }
      map.set(symbol, existing);
    }
  }

  // --- Manual/broker dividends (fallback — skipped when scraped data exists) ---
  for (const d of dividends) {
    const symbol = d.stockSymbol.toUpperCase();
    if (hasScraped && symbolsWithScrapedData.has(symbol)) continue;

    const paymentDate = new Date(d.paymentDate);
    const year = paymentDate.getFullYear();

    const existing: SymbolAccumulator = map.get(symbol) ?? {
      totalAmount: 0,
      yearlyDivPerShare: new Map<number, number>(),
      ttmDivPerShare: 0,
      currentPrice: d.stockCurrentPrice ?? 0,
      peRatio: d.stockPeRatio ?? null,
      recordCount: 0,
    };

    // For manual dividends, use the recorded totalAmount (already includes shares * divPerShare).
    existing.totalAmount += d.totalAmount;
    existing.yearlyDivPerShare.set(
      year,
      (existing.yearlyDivPerShare.get(year) ?? 0) + d.dividendPerShare,
    );
    if (paymentDate >= ttmStart) {
      existing.ttmDivPerShare += d.dividendPerShare;
    }
    existing.recordCount += 1;

    // Always prefer the most recent price / P/E from broker data.
    if (d.stockCurrentPrice) existing.currentPrice = d.stockCurrentPrice;
    if (d.stockPeRatio != null) existing.peRatio = d.stockPeRatio;

    map.set(symbol, existing);
  }

  // --- Build ranked results ---
  const results: RankedDividendStock[] = [...map.entries()].map(
    ([symbol, data]) => {
      const yearlySums = [...data.yearlyDivPerShare.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, value]) => value);

      const avgAnnualDivPerShare =
        yearlySums.length > 0
          ? yearlySums.reduce((sum, y) => sum + y, 0) / yearlySums.length
          : 0;

      // Cadence-aware yield proxy: use the stronger of trailing-12m and
      // multi-year annual average so annual/biannual payers are not undercounted.
      const effectiveDivPerShare = Math.max(
        data.ttmDivPerShare,
        avgAnnualDivPerShare,
      );

      const effectiveYield =
        data.currentPrice > 0
          ? (effectiveDivPerShare / data.currentPrice) * 100
          : 0;

      const hasDividendData = yearlySums.length > 0;
      const isETF = data.sector === "EXCHANGE TRADED FUNDS";

      const scored = isETF
        ? { score: 0, breakdown: { yield: 0, consistency: 0, valuation: 0 } }
        : calcDividendScore({
            dividendYield: effectiveYield,
            yearlySums,
            peRatio: data.peRatio, // pass null explicitly — scorer handles it
            payoutCount: data.recordCount, // payout frequency bonus
          });

      return {
        symbol,
        totalAmount: data.totalAmount,
        dividendYield: effectiveYield,
        score: isETF ? 0 : hasDividendData ? scored.score : 0,
        breakdown: isETF
          ? { yield: 0, consistency: 0, valuation: 0 }
          : hasDividendData
            ? scored.breakdown
            : { yield: 0, consistency: 0, valuation: 0 },
        recordCount: data.recordCount,
        isETF,
      };
    },
  );

  return results.sort((a, b) => b.score - a.score);
}
