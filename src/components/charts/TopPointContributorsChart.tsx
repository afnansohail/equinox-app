import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";
import { formatPKR } from "../../utils/format";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import type { PortfolioHolding } from "../../services/api";

type Mode = "today" | "allTime";

interface HoldingContribution {
  symbol: string;
  netAmount: number;
  percentage: number;
  quantity: number;
  currentPrice: number;
  totalInvested: number;
  previousClose: number;
}

function buildContributions(
  holdings: PortfolioHolding[],
  mode: Mode,
): HoldingContribution[] {
  return holdings
    .map((h) => {
      const symbol = h.stockSymbol;
      const quantity = h.quantity;
      const currentPrice = h.stock?.currentPrice ?? 0;
      const totalInvested = h.totalInvested;
      const previousClose =
        h.stock?.previousClose && h.stock.previousClose > 0
          ? h.stock.previousClose
          : currentPrice;

      let netAmount = 0;
      let percentage = 0;

      if (mode === "today") {
        netAmount = (currentPrice - previousClose) * quantity;
        percentage =
          previousClose > 0
            ? ((currentPrice - previousClose) / previousClose) * 100
            : 0;
      } else {
        // All-time: current value - invested
        const currentValue = currentPrice * quantity;
        netAmount = currentValue - totalInvested;
        percentage = totalInvested > 0 ? (netAmount / totalInvested) * 100 : 0;
      }

      return {
        symbol,
        netAmount,
        percentage,
        quantity,
        currentPrice,
        totalInvested,
        previousClose,
      };
    })
    .filter((c) => c.percentage !== 0); // Only show holdings with non-zero percentage change
}

interface TopPointContributorsChartProps {
  holdings: PortfolioHolding[];
}

interface RenderContribution extends HoldingContribution {
  widthRatio: number;
}

export default function TopPointContributorsChart({
  holdings,
}: TopPointContributorsChartProps) {
  const [mode, setMode] = useState<Mode>("today");

  const contributions = useMemo(
    () => buildContributions(holdings, mode),
    [holdings, mode],
  );

  const topContributors = useMemo<RenderContribution[]>(() => {
    const topPositive = contributions
      .filter((c) => c.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    const topNegative = contributions
      .filter((c) => c.percentage < 0)
      .sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage))
      .slice(0, 5);

    const positiveBase = topPositive[0]?.percentage ?? 0;
    const negativeBase = Math.abs(topNegative[0]?.percentage ?? 0);

    return [
      ...topPositive.map((c) => ({
        ...c,
        widthRatio: positiveBase > 0 ? c.percentage / positiveBase : 0,
      })),
      ...topNegative.map((c) => ({
        ...c,
        widthRatio:
          negativeBase > 0 ? Math.abs(c.percentage) / negativeBase : 0,
      })),
    ];
  }, [contributions]);

  const BAR_HEIGHT = 32;
  const BAR_GAP = 2;
  const firstNegativeIndex = topContributors.findIndex((c) => c.percentage < 0);
  const hasSplitDivider = firstNegativeIndex > 0;
  const CHART_HEIGHT =
    topContributors.length * (BAR_HEIGHT + BAR_GAP) +
    (hasSplitDivider ? 14 : 0) +
    10;

  return (
    <View style={styles.section}>
      {/* Header: title + mode toggle */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Today's movers</Text>
        <SegmentedToggle
          options={[
            { label: "Today", value: "today" },
            { label: "All-time", value: "allTime" },
          ]}
          value={mode}
          onChange={setMode}
          trackColor={colors.cardHover}
        />
      </View>

      {topContributors.length === 0 ? (
        <Text
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            fontSize: 12,
            paddingVertical: 8,
          }}
        >
          No contributors to show
        </Text>
      ) : (
        <View
          style={{
            height: CHART_HEIGHT,
            overflow: "hidden",
          }}
        >
          {topContributors.map((contrib, idx) => {
            const barWidth: `${number}%` = `${Math.max(0, Math.min(contrib.widthRatio, 1)) * 100}%`;
            const isPositive = contrib.netAmount >= 0;

            return (
              <View key={contrib.symbol + idx}>
                {idx === firstNegativeIndex && (
                  <View style={styles.splitDivider} />
                )}
                <View
                  style={[
                    styles.barRowContainer,
                    {
                      marginBottom:
                        idx < topContributors.length - 1 ? BAR_GAP : 0,
                    },
                  ]}
                >
                  {/* Symbol label - left side */}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.barLabel}
                  >
                    {contrib.symbol}
                  </Text>

                  {/* Bar container - center */}
                  <View style={styles.barChart}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: barWidth,
                          backgroundColor: isPositive
                            ? colors.success
                            : colors.danger,
                        },
                      ]}
                    />
                  </View>

                  {/* Amount + percentage - right side */}
                  <Text
                    style={[
                      styles.amountText,
                      { color: isPositive ? colors.success : colors.danger },
                    ]}
                    numberOfLines={1}
                  >
                    {isPositive ? "+" : "-"}
                    {formatPKR(Math.abs(contrib.netAmount))}
                  </Text>
                  <Text style={styles.pctText} numberOfLines={1}>
                    {isPositive ? "+" : ""}
                    {contrib.percentage.toFixed(2)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  barRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 32,
  },
  barLabel: {
    width: 52,
    fontSize: 13,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  barChart: {
    flex: 1,
    height: 6,
    backgroundColor: colors.trackNeutral,
    borderRadius: 999,
    justifyContent: "center",
    overflow: "hidden",
  },
  bar: {
    height: 6,
    borderRadius: 999,
  },
  amountText: {
    width: 68,
    textAlign: "right",
    fontSize: 13,
    fontFamily: fonts.sans.bold,
  },
  pctText: {
    width: 54,
    textAlign: "right",
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
  },
  splitDivider: {
    height: 1,
    width: "100%",
    marginBottom: 10,
    backgroundColor: colors.border,
  },
});
