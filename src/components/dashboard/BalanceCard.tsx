import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import PortfolioChart from "../charts/PortfolioChart";
import { colors } from "../../constants/theme";
import { formatPKR, formatPercentage } from "../../utils/format";
import { ChartPoint, FilterPeriod } from "../../utils/portfolio";

interface BalanceCardProps {
  totalValue: number;
  totalPnL: number;
  totalPnLPct: number;
  isPositive: boolean;
  dayPnL: number;
  dayPnLPct: number;
  dayIsPositive: boolean;
  chartData: ChartPoint[];
  investedSeries?: { value: number; label?: string }[];
  chartFilter: FilterPeriod;
  onFilterChange: (filter: FilterPeriod) => void;
  isChartLoading?: boolean;
}

const FILTER_OPTIONS: FilterPeriod[] = ["1W", "1M", "YTD", "1Y", "ALL"];

export const BalanceCard = React.memo(
  ({
    totalValue,
    totalPnL,
    totalPnLPct,
    isPositive,
    dayPnL,
    dayPnLPct,
    dayIsPositive,
    chartData,
    investedSeries,
    chartFilter,
    onFilterChange,
    isChartLoading = false,
  }: BalanceCardProps) => {
    // Pulsing opacity animation for the chart skeleton
    const pulseAnim = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
      if (!isChartLoading) return;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [isChartLoading, pulseAnim]);
    return (
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Portfolio Balance</Text>
        <Text style={styles.balanceValue}>PKR {formatPKR(totalValue)}</Text>

        <View style={styles.pnlBlock}>
          <View style={styles.pnlRow}>
            <Text style={styles.pnlRowLabel}>Total P/L</Text>
            <View style={styles.pnlRowRight}>
              <Text
                style={[
                  styles.pnlRowAmount,
                  { color: isPositive ? colors.success : colors.danger },
                ]}
              >
                {isPositive ? "+" : "-"}PKR {formatPKR(Math.abs(totalPnL))}
              </Text>
              <View
                style={[
                  styles.pnlBadge,
                  {
                    backgroundColor: isPositive
                      ? "rgba(34,197,94,0.14)"
                      : "rgba(239,68,68,0.14)",
                  },
                ]}
              >
                {isPositive ? (
                  <TrendingUp size={11} color={colors.success} />
                ) : (
                  <TrendingDown size={11} color={colors.danger} />
                )}
                <Text
                  style={[
                    styles.pnlBadgeText,
                    { color: isPositive ? colors.success : colors.danger },
                  ]}
                >
                  {formatPercentage(totalPnLPct)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.pnlDivider} />

          <View style={styles.pnlRow}>
            <Text style={styles.pnlRowLabel}>Today</Text>
            <View style={styles.pnlRowRight}>
              <Text
                style={[
                  styles.pnlRowAmount,
                  { color: dayIsPositive ? colors.success : colors.danger },
                ]}
              >
                {dayIsPositive ? "+" : "-"}PKR {formatPKR(Math.abs(dayPnL))}
              </Text>
              {totalValue > 0 && (
                <View
                  style={[
                    styles.pnlBadge,
                    {
                      backgroundColor: dayIsPositive
                        ? "rgba(34,197,94,0.14)"
                        : "rgba(239,68,68,0.14)",
                    },
                  ]}
                >
                  {dayIsPositive ? (
                    <TrendingUp size={11} color={colors.success} />
                  ) : (
                    <TrendingDown size={11} color={colors.danger} />
                  )}
                  <Text
                    style={[
                      styles.pnlBadgeText,
                      { color: dayIsPositive ? colors.success : colors.danger },
                    ]}
                  >
                    {formatPercentage(dayPnLPct)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {(isChartLoading || chartData.length >= 2) && (
          <View style={styles.chartWrap}>
            <View style={styles.filterRow}>
              {FILTER_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.filterPill,
                    chartFilter === f && styles.filterPillActive,
                  ]}
                  onPress={() => onFilterChange(f)}
                  disabled={isChartLoading}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      chartFilter === f && styles.filterPillTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {isChartLoading ? (
              <Animated.View
                style={[styles.chartSkeleton, { opacity: pulseAnim }]}
              />
            ) : (
              <PortfolioChart
                data={chartData}
                investedSeries={investedSeries}
                isPositive={isPositive}
                width={Dimensions.get("window").width - 80}
                height={160}
              />
            )}
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  pnlBlock: {
    marginBottom: 12,
    gap: 8,
  },
  pnlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pnlDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  pnlRowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pnlRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pnlRowAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  pnlBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pnlBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chartWrap: {
    marginTop: 12,
    overflow: "visible",
  },
  chartSkeleton: {
    height: 160,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterPillActive: {
    backgroundColor: "rgba(41,253,230,0.12)",
    borderColor: "rgba(41,253,230,0.35)",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  filterPillTextActive: {
    color: colors.secondary,
  },
});
