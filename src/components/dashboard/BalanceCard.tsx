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
import { colors, fonts } from "../../constants/theme";
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
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.balanceLabel}>Portfolio value</Text>
            <View style={styles.balanceValueRow}>
              <Text style={styles.balanceCurrency}>PKR</Text>
              <Text style={styles.balanceValue}>{formatPKR(totalValue)}</Text>
            </View>
          </View>
          {totalValue > 0 && (
            <View
              style={[
                styles.pnlBadge,
                {
                  backgroundColor: dayIsPositive
                    ? "rgba(52,211,153,0.14)"
                    : "rgba(255,107,107,0.14)",
                },
              ]}
            >
              {dayIsPositive ? (
                <TrendingUp size={13} color={colors.success} />
              ) : (
                <TrendingDown size={13} color={colors.danger} />
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

        <View style={styles.pnlBlock}>
          <View style={styles.pnlCol}>
            <Text style={styles.pnlRowLabel}>Today</Text>
            <Text
              style={[
                styles.pnlRowAmount,
                { color: dayIsPositive ? colors.success : colors.danger },
              ]}
            >
              {dayIsPositive ? "+" : "-"}PKR {formatPKR(Math.abs(dayPnL))}
            </Text>
          </View>

          <View style={styles.pnlDivider} />

          <View style={styles.pnlCol}>
            <Text style={styles.pnlRowLabel}>Total P/L</Text>
            <Text
              style={[
                styles.pnlRowAmount,
                { color: isPositive ? colors.success : colors.danger },
              ]}
            >
              {isPositive ? "+" : "-"}PKR {formatPKR(Math.abs(totalPnL))}{" "}
              <Text style={styles.pnlRowAmountMuted}>
                · {formatPercentage(totalPnLPct)}
              </Text>
            </Text>
          </View>
        </View>

        {(isChartLoading || chartData.length >= 2) && (
          <View style={styles.chartWrap}>
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
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.secondaryGlow,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  balanceLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.16,
    textTransform: "uppercase",
  },
  balanceValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  balanceCurrency: {
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  balanceValue: {
    fontSize: 38,
    fontFamily: fonts.sans.extrabold,
    color: colors.textPrimary,
    letterSpacing: -0.03,
    lineHeight: 40,
  },
  pnlBlock: {
    flexDirection: "row",
    gap: 22,
    marginTop: 14,
    marginBottom: 14,
  },
  pnlCol: {
    gap: 3,
  },
  pnlDivider: {
    width: 1,
    backgroundColor: colors.borderLight,
  },
  pnlRowLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  pnlRowAmount: {
    fontSize: 15,
    fontFamily: fonts.sans.bold,
  },
  pnlRowAmountMuted: {
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  pnlBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pnlBadgeText: {
    fontSize: 13,
    fontFamily: fonts.sans.bold,
  },
  chartWrap: {
    overflow: "visible",
  },
  chartSkeleton: {
    height: 160,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  filterRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  filterPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterPillActive: {
    backgroundColor: colors.secondary,
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  filterPillTextActive: {
    fontFamily: fonts.sans.bold,
    color: colors.textInverse,
  },
});
