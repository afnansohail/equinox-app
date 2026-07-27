import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "../../constants/theme";
import { formatPKR } from "../../utils/format";
import { aggregateDividendsRolling12Months } from "../../utils/dividendAggregation";
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
  const monthly = useMemo(
    () => aggregateDividendsRolling12Months(dividends),
    [dividends],
  );
  const maxAmount = Math.max(...monthly.map((m) => m.amount), 1);
  const hasPayouts = monthly.some((m) => m.amount > 0);
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);
  const activeMonth = monthly.find(
    (m) => `${m.year}-${m.month}` === activeMonthKey,
  );

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
              const isActive = key === activeMonthKey;
              const heightPct =
                m.amount > 0 ? Math.max((m.amount / maxAmount) * 100, 6) : 0;
              return (
                <Pressable
                  key={key}
                  style={styles.barTouchTarget}
                  onPressIn={() => setActiveMonthKey(key)}
                  onPressOut={() =>
                    setActiveMonthKey((curr) => (curr === key ? null : curr))
                  }
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
                </Pressable>
              );
            })}
          </View>
          <View style={styles.monthLabels}>
            {monthly.map((m) => {
              const key = `${m.year}-${m.month}`;
              return (
                <Text
                  key={key}
                  style={[
                    styles.monthLabel,
                    key === activeMonthKey && styles.monthLabelActive,
                  ]}
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
