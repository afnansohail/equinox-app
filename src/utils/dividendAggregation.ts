import type { Dividend } from "../services/api";

export interface MonthlyData {
  monthLabel: string;
  month: number; // 0-11
  year: number;
  amount: number;
  count: number;
}

export function aggregateDividendsByMonth(
  dividends: Dividend[],
  year?: number,
): MonthlyData[] {
  const targetYear = year ?? new Date().getFullYear();
  const monthMap = new Map<number, { amount: number; count: number }>();

  // Initialize all 12 months with 0
  for (let i = 0; i < 12; i++) {
    monthMap.set(i, { amount: 0, count: 0 });
  }

  // Aggregate dividends by month
  for (const div of dividends) {
    const parts = div.paymentDate.split("-");
    const divYear = parseInt(parts[0], 10);
    const divMonth = parseInt(parts[1], 10) - 1; // Convert to 0-11

    if (divYear === targetYear) {
      const existing = monthMap.get(divMonth) || { amount: 0, count: 0 };
      existing.amount += div.totalAmount;
      existing.count += 1;
      monthMap.set(divMonth, existing);
    }
  }

  // Convert to array with month labels
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return Array.from({ length: 12 }, (_, i) => {
    const data = monthMap.get(i) || { amount: 0, count: 0 };
    return {
      monthLabel: monthNames[i],
      month: i,
      year: targetYear,
      amount: data.amount,
      count: data.count,
    };
  });
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Rolling 12-month window ending at `referenceDate`'s month (inclusive),
 * so the current month is always last and the oldest of the prior 11
 * months is first — independent of calendar year boundaries.
 */
export function aggregateDividendsRolling12Months(
  dividends: Dividend[],
  referenceDate: Date = new Date(),
): MonthlyData[] {
  const totals = new Map<string, { amount: number; count: number }>();

  for (const div of dividends) {
    const parts = div.paymentDate.split("-");
    const divYear = parseInt(parts[0], 10);
    const divMonth = parseInt(parts[1], 10) - 1;
    const key = `${divYear}-${divMonth}`;
    const existing = totals.get(key) || { amount: 0, count: 0 };
    existing.amount += div.totalAmount;
    existing.count += 1;
    totals.set(key, existing);
  }

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();

  return Array.from({ length: 12 }, (_, i) => {
    const offset = 11 - i;
    const d = new Date(refYear, refMonth - offset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${month}`;
    const data = totals.get(key) || { amount: 0, count: 0 };
    return {
      monthLabel: MONTH_NAMES[month],
      month,
      year,
      amount: data.amount,
      count: data.count,
    };
  });
}

export function calculateYoYChange(
  currentMonthly: MonthlyData[],
  priorMonthly: MonthlyData[],
): Array<{ monthLabel: string; percentChange: number }> {
  return currentMonthly.map((current, i) => {
    const prior = priorMonthly[i];
    const priorAmount = prior?.amount ?? 0;
    const percentChange =
      priorAmount === 0
        ? current.amount === 0
          ? 0
          : 100
        : ((current.amount - priorAmount) / priorAmount) * 100;

    return {
      monthLabel: current.monthLabel,
      percentChange: Math.round(percentChange * 100) / 100, // 2 decimal places
    };
  });
}
