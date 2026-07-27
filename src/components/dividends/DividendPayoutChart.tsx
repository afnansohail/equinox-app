import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Text as SvgText, Line, G } from "react-native-svg";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { colors, fonts, borderRadius, spacing } from "../../constants/theme";
import type { Dividend } from "../../services/api";
import { aggregateDividendsByMonth } from "../../utils/dividendAggregation";

const screenWidth = Dimensions.get("window").width;

interface DividendPayoutChartProps {
  dividends: Dividend[];
  year?: number;
}

export default function DividendPayoutChart({
  dividends,
  year,
}: DividendPayoutChartProps) {
  const [mode, setMode] = useState<"total" | "monthly">("total");

  const monthlyData = useMemo(
    () => aggregateDividendsByMonth(dividends, year),
    [dividends, year],
  );

  const maxAmount = useMemo(
    () => Math.max(...monthlyData.map((m) => m.amount), 1),
    [monthlyData],
  );

  const hasData = monthlyData.some((m) => m.amount > 0);

  if (!hasData) {
    return (
      <View style={styles.cardWrapper}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No payout data for this year</Text>
        </View>
      </View>
    );
  }

  const chartWidth = screenWidth - 40;
  const chartHeight = 180;
  const barWidth = (chartWidth - 40) / 12;
  const padding = 40;
  const bottomPadding = 40;

  const maxYValue = Math.ceil(maxAmount / 500) * 500; // Round up to nearest 500
  const yAxisTicks = [0, maxYValue * 0.5, maxYValue];

  return (
    <View style={styles.cardWrapper}>
      {/* Header with toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monthly Payouts</Text>
        <SegmentedToggle<"total" | "monthly">
          options={[
            { label: "Total", value: "total" },
            { label: "Count", value: "monthly" },
          ]}
          value={mode}
          onChange={setMode}
          activeColor={colors.secondary}
        />
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg
          width={chartWidth}
          height={chartHeight + bottomPadding}
          style={styles.chart}
        >
          {/* Y-axis grid lines and labels */}
          {yAxisTicks.map((tick, i) => {
            const y = chartHeight - (tick / maxYValue) * chartHeight;
            return (
              <G key={`grid-${i}`}>
                <Line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - 10}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={0.5}
                />
                <SvgText
                  x={padding - 8}
                  y={y + 4}
                  fontSize={10}
                  fill={colors.textMuted}
                  fontFamily={fonts.sans.semibold}
                  textAnchor="end"
                >
                  {tick > 0 ? `${(tick / 1000).toFixed(tick % 1000 === 0 ? 0 : 1)}K` : "0"}
                </SvgText>
              </G>
            );
          })}

          {/* Bars */}
          {monthlyData.map((month, i) => {
            const value = mode === "total" ? month.amount : month.count;
            const barHeight = maxYValue > 0 ? (value / maxYValue) * chartHeight : 0;
            const x = padding + i * barWidth + barWidth * 0.1;
            const y = chartHeight - barHeight;
            const w = barWidth * 0.8;

            return (
              <G key={`bar-${i}`}>
                {/* Bar */}
                <Rect
                  x={x}
                  y={y}
                  width={w}
                  height={barHeight}
                  fill={colors.secondary}
                  rx={4}
                />
                {/* Month label */}
                <SvgText
                  x={x + w / 2}
                  y={chartHeight + 18}
                  fontSize={11}
                  fill={colors.textMuted}
                  fontFamily={fonts.sans.semibold}
                  textAnchor="middle"
                >
                  {month.monthLabel}
                </SvgText>
              </G>
            );
          })}

          {/* X-axis */}
          <Line
            x1={padding}
            y1={chartHeight}
            x2={chartWidth - 10}
            y2={chartHeight}
            stroke={colors.border}
            strokeWidth={1}
          />
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendColor, { backgroundColor: colors.secondary }]}
          />
          <Text style={styles.legendLabel}>
            {mode === "total" ? "Total Amount (PKR)" : "Payout Count"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  chart: {
    overflow: "visible",
  },
  emptyContainer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
  },
});
