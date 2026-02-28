import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { CartesianChart, Line, Area, useChartPressState } from "victory-native";
import { colors } from "../../constants/theme";

interface PortfolioChartProps {
  data: { value: number; label?: string }[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export default function PortfolioChart({
  data,
  isPositive,
  width = Dimensions.get("window").width - 80,
  height = 160,
}: PortfolioChartProps) {
  // Convert data to format victory-native expects
  const chartData = data.map((d, i) => ({
    x: i,
    y: d.value,
    label: d.label || "",
  }));

  const { state, isActive } = useChartPressState({
    x: 0,
    y: { y: 0 },
  });

  if (chartData.length < 2) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>Not enough data to display chart</Text>
      </View>
    );
  }

  const chartColor = isPositive ? "#22C55E" : "#EF4444";
  const gradientColor = isPositive
    ? "rgba(34,197,94,0.20)"
    : "rgba(239,68,68,0.20)";

  // Format Y axis label
  const formatYAxisLabel = (value: number) => {
    if (value >= 1000000) return `₨${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₨${(value / 1000).toFixed(0)}K`;
    return `₨${value.toFixed(0)}`;
  };

  // Get X axis label
  const formatXAxisLabel = (index: number) => {
    const point = chartData[Math.round(index)];
    return point?.label || "";
  };

  // Get tooltip values
  const activeValue = isActive ? state.y.y.value.value : null;
  const activeIndex = isActive ? Math.round(state.x.value.value) : null;
  const activeLabel =
    activeIndex !== null ? chartData[activeIndex]?.label : null;

  return (
    <View style={[styles.container, { width, height }]}>
      {isActive && activeValue !== null && (
        <View style={styles.tooltipContainer}>
          <Text style={styles.tooltipValue}>
            PKR{" "}
            {activeValue.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
          </Text>
          {activeLabel && (
            <Text style={styles.tooltipLabel}>{activeLabel}</Text>
          )}
        </View>
      )}
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={["y"]}
        padding={{ top: 30, bottom: 25, left: 45, right: 10 }}
        chartPressState={state}
        axisOptions={{
          font: null,
          tickCount: { x: 3, y: 3 },
          formatYLabel: formatYAxisLabel,
          formatXLabel: formatXAxisLabel,
          labelColor: colors.textMuted,
          lineColor: "transparent",
        }}
        domainPadding={{ top: 20, bottom: 10 }}
      >
        {({ points, chartBounds }) => (
          <>
            <Area
              points={points.y}
              y0={chartBounds.bottom}
              color={gradientColor}
              curveType="natural"
            />
            <Line
              points={points.y}
              color={chartColor}
              strokeWidth={2}
              curveType="natural"
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingTop: 50,
  },
  tooltipContainer: {
    position: "absolute",
    top: 0,
    left: 45,
    right: 10,
    zIndex: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltipValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  tooltipLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
