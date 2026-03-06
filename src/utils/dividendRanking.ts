import type { Dividend } from "../services/api";

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

export function buildDividendRanking(params: {
  dividends: Dividend[];
  holdingMeta?: HoldingMeta[];
}): RankedDividendStock[] {
  const { dividends, holdingMeta } = params;

  // Leap-year-safe trailing-12-month window.
  const now = new Date();
  const ttmStart = new Date(now);
  ttmStart.setFullYear(now.getFullYear() - 1);

  type SymbolAccumulator = {
    yearlyDivPerShare: Map<number, number>;
    ttmDivPerShare: number;
    currentPrice: number;
    peRatio: number | null;
    payoutCount: number;
    totalAmount: number;
    sector?: string;
  };

  const accumMap = new Map<string, SymbolAccumulator>();

  // Seed every held symbol so it always appears in results.
  for (const holding of holdingMeta ?? []) {
    const sym = holding.symbol.toUpperCase();
    if (!accumMap.has(sym)) {
      accumMap.set(sym, {
        yearlyDivPerShare: new Map(),
        ttmDivPerShare: 0,
        currentPrice: holding.currentPrice ?? 0,
        peRatio: holding.peRatio ?? null,
        payoutCount: 0,
        totalAmount: 0,
        sector: holding.sector,
      });
    }
  }

  // Accumulate manual entries for both scoring and total-received display.
  for (const d of dividends) {
    const sym = d.stockSymbol.toUpperCase();

    const acc: SymbolAccumulator = accumMap.get(sym) ?? {
      yearlyDivPerShare: new Map(),
      ttmDivPerShare: 0,
      currentPrice: d.stockCurrentPrice ?? 0,
      peRatio: d.stockPeRatio ?? null,
      payoutCount: 0,
      totalAmount: 0,
      sector: undefined,
    };

    acc.totalAmount += d.totalAmount;

    if (d.dividendPerShare > 0) {
      const paymentDate = new Date(d.paymentDate);
      const year = paymentDate.getFullYear();
      acc.yearlyDivPerShare.set(
        year,
        (acc.yearlyDivPerShare.get(year) ?? 0) + d.dividendPerShare,
      );
      if (paymentDate >= ttmStart) acc.ttmDivPerShare += d.dividendPerShare;
      acc.payoutCount += 1;
    }

    accumMap.set(sym, acc);
  }

  // Build ranked results.
  const results: RankedDividendStock[] = [...accumMap.entries()].map(
    ([symbol, acc]) => {
      const yearlySums = [...acc.yearlyDivPerShare.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, value]) => value);

      const avgAnnualDivPerShare =
        yearlySums.length > 0
          ? yearlySums.reduce((sum, y) => sum + y, 0) / yearlySums.length
          : 0;

      // Cadence-aware yield: use the stronger of TTM and multi-year average so
      // annual / biannual payers are not undercounted.
      const effectiveDivPerShare = Math.max(
        acc.ttmDivPerShare,
        avgAnnualDivPerShare,
      );

      const effectiveYield =
        acc.currentPrice > 0
          ? (effectiveDivPerShare / acc.currentPrice) * 100
          : 0;

      const hasDividendData = yearlySums.length > 0;
      const isETF = acc.sector === "EXCHANGE TRADED FUNDS";

      const scored = isETF
        ? { score: 0, breakdown: { yield: 0, consistency: 0, valuation: 0 } }
        : calcDividendScore({
            dividendYield: effectiveYield,
            yearlySums,
            peRatio: acc.peRatio,
            payoutCount: acc.payoutCount,
          });

      return {
        symbol,
        totalAmount: acc.totalAmount,
        dividendYield: effectiveYield,
        score: isETF ? 0 : hasDividendData ? scored.score : 0,
        breakdown: isETF
          ? { yield: 0, consistency: 0, valuation: 0 }
          : hasDividendData
            ? scored.breakdown
            : { yield: 0, consistency: 0, valuation: 0 },
        recordCount: acc.payoutCount,
        isETF,
      };
    },
  );

  return results.sort((a, b) => b.score - a.score);
}
