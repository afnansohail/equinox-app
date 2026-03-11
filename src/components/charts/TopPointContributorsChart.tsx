import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../../constants/theme";
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

const BAR_LABEL_W = 50;
const PILL_W = 68;

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
    <View style={styles.card}>
      {/* Header: title + mode toggle */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Top Contributors</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === "today" && styles.toggleBtnActive,
            ]}
            onPress={() => setMode("today")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "today" && styles.toggleTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === "allTime" && styles.toggleBtnActive,
            ]}
            onPress={() => setMode("allTime")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "allTime" && styles.toggleTextActive,
              ]}
            >
              All-Time
            </Text>
          </TouchableOpacity>
        </View>
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
                          backgroundColor: isPositive ? "#22C55E" : "#EF4444",
                        },
                      ]}
                    />
                  </View>

                  {/* Percentage pill - right side */}
                  <View style={styles.pillSlot}>
                    <View
                      style={[
                        styles.pnlBadge,
                        {
                          backgroundColor: isPositive
                            ? "rgba(34, 197, 94, 0.14)"
                            : "rgba(239, 68, 68, 0.14)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pnlBadgeText,
                          { color: isPositive ? "#22C55E" : colors.danger },
                        ]}
                      >
                        {isPositive ? "+" : ""}
                        {contrib.percentage.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: "#22C55E",
              },
            ]}
          />
          <Text style={styles.legendText}>Gainers</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: "#EF4444",
              },
            ]}
          />
          <Text style={styles.legendText}>Losers</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  toggleBtnActive: {
    backgroundColor: colors.secondary,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.textInverse,
  },
  barRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 32,
  },
  barLabel: {
    width: 48,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  barChart: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    justifyContent: "center",
    overflow: "hidden",
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  pillSlot: {
    width: PILL_W,
    alignItems: "flex-end",
  },
  pnlBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: PILL_W,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pnlBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  splitDivider: {
    height: 1,
    width: "100%",
    marginBottom: 10,
    backgroundColor: colors.border,
  },
  legend: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
