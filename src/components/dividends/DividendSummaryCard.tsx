import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "../../constants/theme";
import { formatPKR } from "../../utils/format";
import { aggregateDividendsRolling12Months } from "../../utils/dividendAggregation";
import type { Dividend } from "../../services/api";

interface DividendSummaryCardProps {
  totalAmount: number;
  highestScoreSymbol: string | null;
  highestScore: number | null;
  topPayerSymbol: string | null;
  topPayerAmount: number | null;
  dividends: Dividend[];
  selectedMonth: { year: number; month: number } | null;
  onMonthPress: (month: { year: number; month: number } | null) => void;
}

export default function DividendSummaryCard({
  totalAmount,
  highestScoreSymbol,
  highestScore,
  topPayerSymbol,
  topPayerAmount,
  dividends,
  selectedMonth,
  onMonthPress,
}: DividendSummaryCardProps) {
  const monthly = useMemo(
    () => aggregateDividendsRolling12Months(dividends),
    [dividends],
  );
  const maxAmount = Math.max(...monthly.map((m) => m.amount), 1);
  const hasPayouts = monthly.some((m) => m.amount > 0);
  const activeMonth = monthly.find(
    (m) =>
      selectedMonth &&
      m.year === selectedMonth.year &&
      m.month === selectedMonth.month,
  );

  function handleMonthPress(m: { year: number; month: number }) {
    if (selectedMonth && selectedMonth.year === m.year && selectedMonth.month === m.month) {
      onMonthPress(null);
    } else {
      onMonthPress({ year: m.year, month: m.month });
    }
  }

  return (
    <LinearGradient
      colors={["#0E2320", "#091513"]}
      style={styles.card}
    >
      <View style={styles.mainStat}>
        <Text style={styles.label}>Total earned</Text>
        <View style={styles.totalValueRow}>
          <Text style={styles.totalCurrency}>PKR</Text>
          <Text
            style={styles.totalValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {formatPKR(totalAmount, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {hasPayouts && (
        <View style={styles.chartBlock}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartHeaderLabel}>Payout by month</Text>
            {activeMonth && (
              <Text style={styles.chartHeaderPeak}>
                {activeMonth.monthLabel} ·{" "}
                {activeMonth.amount.toLocaleString("en-PK", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            )}
          </View>
          <View style={styles.bars}>
            {monthly.map((m) => {
              const key = `${m.year}-${m.month}`;
              const isActive =
                !!selectedMonth &&
                selectedMonth.year === m.year &&
                selectedMonth.month === m.month;
              const heightPct =
                m.amount > 0 ? Math.max((m.amount / maxAmount) * 100, 6) : 0;
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.barTouchTarget}
                  onPress={() => handleMonthPress(m)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 2, right: 2 }}
                >
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(heightPct, 3)}%`,
                        backgroundColor: isActive
                          ? colors.secondary
                          : m.amount > 0
                            ? "#1B4038"
                            : colors.trackNeutral,
                      },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.monthLabels}>
            {monthly.map((m) => {
              const key = `${m.year}-${m.month}`;
              const isActive =
                !!selectedMonth &&
                selectedMonth.year === m.year &&
                selectedMonth.month === m.month;
              return (
                <Text
                  key={key}
                  style={[styles.monthLabel, isActive && styles.monthLabelActive]}
                >
                  {m.monthLabel[0]}
                </Text>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.secondaryStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Highest score</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {highestScoreSymbol ?? "—"}
            {highestScoreSymbol && highestScore != null && (
              <Text style={styles.statValueAccent}> {highestScore}</Text>
            )}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Highest payout</Text>
          <Text style={styles.statValue} numberOfLines={1}>
            {topPayerSymbol ?? "—"}
            {topPayerSymbol && topPayerAmount != null && (
              <Text style={styles.statValueAccent}> {formatPKR(topPayerAmount)}</Text>
            )}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.secondaryGlow,
    padding: 20,
    marginBottom: 16,
    gap: 18,
  },
  mainStat: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.16,
  },
  totalValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  totalCurrency: {
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 38,
    fontFamily: fonts.sans.extrabold,
    color: colors.secondary,
    letterSpacing: -0.02,
  },
  chartBlock: {
    gap: 8,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartHeaderLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.12,
  },
  chartHeaderPeak: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    height: 64,
  },
  barTouchTarget: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    borderRadius: 3,
    minHeight: 3,
  },
  monthLabels: {
    flexDirection: "row",
    gap: 5,
  },
  monthLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontFamily: fonts.sans.semibold,
    color: colors.textDim,
  },
  monthLabelActive: {
    color: colors.secondary,
    fontFamily: fonts.sans.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  secondaryStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  stat: {
    flex: 1,
    alignItems: "flex-start",
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLight,
  },
  statValue: {
    fontSize: 15,
    fontFamily: fonts.sans.extrabold,
    color: colors.textPrimary,
  },
  statValueAccent: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.secondary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
