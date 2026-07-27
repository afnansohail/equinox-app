import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "../../constants/theme";
import { formatPKR } from "../../utils/format";
import { aggregateDividendsByMonth } from "../../utils/dividendAggregation";
import type { Dividend } from "../../services/api";

interface DividendSummaryCardProps {
  totalAmount: number;
  highestScoreSymbol: string | null;
  topPayer: string | null;
  dividends: Dividend[];
}

export default function DividendSummaryCard({
  totalAmount,
  highestScoreSymbol,
  topPayer,
  dividends,
}: DividendSummaryCardProps) {
  const monthly = useMemo(() => aggregateDividendsByMonth(dividends), [dividends]);
  const maxAmount = Math.max(...monthly.map((m) => m.amount), 1);
  const peak = monthly.reduce((a, b) => (b.amount > a.amount ? b : a), monthly[0]);
  const hasPayouts = peak.amount > 0;

  return (
    <LinearGradient
      colors={["#0E2320", "#091513"]}
      style={styles.card}
    >
      <View style={styles.mainStat}>
        <Text style={styles.label}>Total earned</Text>
        <Text style={styles.totalValue}>
          PKR{" "}
          {formatPKR(totalAmount, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>

      {hasPayouts && (
        <View style={styles.chartBlock}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartHeaderLabel}>Payout by month</Text>
            <Text style={styles.chartHeaderPeak}>
              Peak {peak.monthLabel} ·{" "}
              {peak.amount.toLocaleString("en-PK", {
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
          <View style={styles.bars}>
            {monthly.map((m) => {
              const isPeak = m.month === peak.month;
              const heightPct =
                m.amount > 0 ? Math.max((m.amount / maxAmount) * 100, 6) : 0;
              return (
                <View
                  key={m.month}
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(heightPct, 3)}%`,
                      backgroundColor: isPeak
                        ? colors.secondary
                        : m.amount > 0
                          ? "#1B4038"
                          : colors.trackNeutral,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.monthLabels}>
            {monthly.map((m) => (
              <Text
                key={m.month}
                style={[
                  styles.monthLabel,
                  m.month === peak.month && styles.monthLabelActive,
                ]}
              >
                {m.monthLabel[0]}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.secondaryStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue} numberOfLines={1}>
            {highestScoreSymbol ?? "—"}
          </Text>
          <Text style={styles.statLabel}>Highest Score</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue} numberOfLines={1}>
            {topPayer ?? "—"}
          </Text>
          <Text style={styles.statLabel}>Highest Payout</Text>
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
  totalValue: {
    fontSize: 32,
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
  bar: {
    flex: 1,
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
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
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
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.1,
  },
});
