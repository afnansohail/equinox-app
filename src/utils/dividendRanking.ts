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

function calcYieldScore(dividendYield: number): number {
  if (dividendYield <= 0) return 0;
  if (dividendYield <= 3) return (dividendYield / 3) * 8;
  if (dividendYield <= 6) return 8 + ((dividendYield - 3) / 3) * 12;
  if (dividendYield <= 10) return 20 + ((dividendYield - 6) / 4) * 20;
  if (dividendYield <= 14) return 40;
  if (dividendYield <= 22)
    return Math.max(20, 40 - ((dividendYield - 14) / 8) * 20);
  return 0;
}

function calcConsistencyScore(
  yearlySums: number[],
  payoutCount: number = 0,
): number {
  let bonusPts = 0;
  const avgPayoutsPerYear =
    yearlySums.length > 0 ? payoutCount / yearlySums.length : 0;
  if (avgPayoutsPerYear >= 4) {
    bonusPts = 5;
  } else if (avgPayoutsPerYear >= 3) {
    bonusPts = 2.5;
  }

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

function calcValuationScore(peRatio: number | null): number {
  if (peRatio === null) return 10;
  if (peRatio <= 0) return 0;
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

export function buildDividendRanking(params: {
  dividends: Dividend[];
  scrapedPayouts?: ScrapedPayoutBySymbol[];
  holdingMeta?: HoldingMeta[];
}): RankedDividendStock[] {
  const { dividends, scrapedPayouts, holdingMeta } = params;

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
    scrapedYield: number | null;
    scrapedYearlyYields: Map<number, number>;
    scrapedPayoutCount: number;
    manualRecordCount: number;
  };

  const accumMap = new Map<string, SymbolAccumulator>();

  const holdingMetaMap = new Map<string, HoldingMeta>();
  for (const holding of holdingMeta ?? []) {
    holdingMetaMap.set(holding.symbol.toUpperCase(), holding);
  }

  for (const stockPayout of scrapedPayouts ?? []) {
    const sym = stockPayout.symbol.toUpperCase();

    const acc: SymbolAccumulator = accumMap.get(sym) ?? {
      yearlyDivPerShare: new Map(),
      ttmDivPerShare: 0,
      currentPrice: 0,
      peRatio: null,
      payoutCount: 0,
      totalAmount: 0,
      scrapedYield: null,
      scrapedYearlyYields: new Map(),
      scrapedPayoutCount: 0,
      manualRecordCount: 0,
    };

    if (stockPayout.payouts && stockPayout.payouts.length > 0) {
      const mostRecent = stockPayout.payouts[0];
      acc.scrapedYield = mostRecent.dividendPercent;

      for (const payout of stockPayout.payouts) {
        if (payout.dividendPercent > 0) {
          const paymentDate = new Date(payout.paymentDate);
          const year = paymentDate.getFullYear();

          const existing = acc.scrapedYearlyYields.get(year) ?? 0;
          const count = acc.scrapedYearlyYields.has(year) ? 2 : 1;
          acc.scrapedYearlyYields.set(
            year,
            (existing + payout.dividendPercent) / count,
          );
        }
      }

      acc.scrapedPayoutCount = stockPayout.payouts.length;
    }

    const holdingData = holdingMetaMap.get(sym);
    if (holdingData) {
      acc.currentPrice = holdingData.currentPrice ?? acc.currentPrice;
      acc.peRatio = holdingData.peRatio ?? acc.peRatio;
      acc.sector = holdingData.sector ?? acc.sector;
    }

    accumMap.set(sym, acc);
  }

  for (const d of dividends) {
    const sym = d.stockSymbol.toUpperCase();

    const acc: SymbolAccumulator = accumMap.get(sym) ?? {
      yearlyDivPerShare: new Map(),
      ttmDivPerShare: 0,
      currentPrice: d.stockCurrentPrice ?? 0,
      peRatio: d.stockPeRatio ?? null,
      payoutCount: 0,
      totalAmount: 0,
      scrapedYield: null,
      scrapedYearlyYields: new Map(),
      scrapedPayoutCount: 0,
      manualRecordCount: 0,
    };

    acc.totalAmount += d.totalAmount;
    acc.manualRecordCount += 1;

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

  for (const [sym, acc] of accumMap.entries()) {
    const holdingData = holdingMetaMap.get(sym);
    if (holdingData) {
      acc.currentPrice = holdingData.currentPrice ?? acc.currentPrice;
      acc.peRatio = holdingData.peRatio ?? acc.peRatio;
      acc.sector = holdingData.sector ?? acc.sector;
    }
  }

  const results: RankedDividendStock[] = [...accumMap.entries()].map(
    ([symbol, acc]) => {
      let dividendYield = 0;

      if (acc.scrapedYield !== null && acc.scrapedYield > 0) {
        dividendYield = acc.scrapedYield;
      } else if (acc.currentPrice > 0) {
        const avgAnnualDivPerShare =
          acc.yearlyDivPerShare.size > 0
            ? Array.from(acc.yearlyDivPerShare.values()).reduce(
                (sum, y) => sum + y,
                0,
              ) / acc.yearlyDivPerShare.size
            : 0;
        const effectiveDivPerShare = Math.max(
          acc.ttmDivPerShare,
          avgAnnualDivPerShare,
        );
        dividendYield = (effectiveDivPerShare / acc.currentPrice) * 100;
      }

      let yearlySums: number[];
      let payoutCount: number;

      if (acc.scrapedYearlyYields.size > 0) {
        yearlySums = Array.from(acc.scrapedYearlyYields.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([, yield_]) => yield_);
        payoutCount = acc.scrapedPayoutCount;
      } else {
        yearlySums = Array.from(acc.yearlyDivPerShare.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([, value]) => value);
        payoutCount = acc.payoutCount;
      }

      const hasDividendData = yearlySums.length > 0;
      const isETF = acc.sector === "EXCHANGE TRADED FUNDS";

      const scored = isETF
        ? { score: 0, breakdown: { yield: 0, consistency: 0, valuation: 0 } }
        : calcDividendScore({
            dividendYield,
            yearlySums,
            peRatio: acc.peRatio,
            payoutCount,
          });

      return {
        symbol,
        totalAmount: acc.totalAmount,
        dividendYield,
        score: isETF ? 0 : hasDividendData ? scored.score : 0,
        breakdown: isETF
          ? { yield: 0, consistency: 0, valuation: 0 }
          : hasDividendData
            ? scored.breakdown
            : { yield: 0, consistency: 0, valuation: 0 },
        recordCount: acc.manualRecordCount,
        isETF,
      };
    },
  );

  return results
    .filter((stock) => stock.recordCount > 0)
    .sort((a, b) => b.score - a.score);
}
