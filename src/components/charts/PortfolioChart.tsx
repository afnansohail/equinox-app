import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Circle,
  G,
  Text as SvgText,
  Rect,
} from "react-native-svg";
import { colors } from "../../constants/theme";

function fmtY(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value.toFixed(0)}`;
}

function buildLinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    d += ` L ${curr.x} ${curr.y}`;
  }
  return d;
}

function buildAreaPath(
  points: { x: number; y: number }[],
  baseline: number,
): string {
  if (points.length < 2) return "";
  const line = buildLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

interface PortfolioChartProps {
  data: { value: number; label?: string }[];
  investedSeries?: { value: number; label?: string }[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export default function PortfolioChart({
  data,
  investedSeries,
  isPositive,
  width = Dimensions.get("window").width - 80,
  height = 160,
}: PortfolioChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const PADDING = { top: 16, bottom: 32, left: 48, right: 12 };
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  // Keep a ref to latest data so panResponder callbacks always use fresh values
  const dataRef = useRef(data);
  const chartWRef = useRef(chartW);
  dataRef.current = data;
  chartWRef.current = chartW;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent.locationX),
      onPanResponderRelease: () => setActiveIndex(null),
      onPanResponderTerminate: () => setActiveIndex(null),
    }),
  ).current;

  function handleTouch(touchX: number) {
    const currentData = dataRef.current;
    const currentChartW = chartWRef.current;
    if (!currentData || currentData.length < 2) return;
    const relX = touchX - PADDING.left;
    const idx = Math.round((relX / currentChartW) * (currentData.length - 1));
    setActiveIndex(Math.max(0, Math.min(currentData.length - 1, idx)));
  }

  if (data.length < 2) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>Not enough data to display chart</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const investedValues = investedSeries
    ? investedSeries.map((d) => d.value)
    : [];
  const allYValues = values.concat(investedValues);
  const minVal = Math.min(...allYValues);
  const maxVal = Math.max(...allYValues);
  const valRange = maxVal - minVal || maxVal * 0.1 || 1;
  const yMin = minVal - valRange * 0.08;
  const yMax = maxVal + valRange * 0.12;

  const toX = (i: number) => (i / (data.length - 1)) * chartW;
  const toY = (v: number) => chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  const svgPoints = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const investedPoints =
    investedSeries && investedSeries.length === data.length
      ? investedSeries.map((d, i) => ({ x: toX(i), y: toY(d.value) }))
      : null;
  const baseline = chartH;

  const linePath = buildLinePath(svgPoints);
  const areaPath = buildAreaPath(svgPoints, baseline);
  const investedLinePath = investedPoints
    ? buildLinePath(investedPoints)
    : null;

  // Helper to get invested value at a given index
  const getInvestedAt = (idx: number | null) =>
    investedSeries && idx !== null && investedSeries.length > idx
      ? investedSeries[idx].value
      : null;

  const chartColor = isPositive ? "#22C55E" : "#EF4444";
  const investedColor = "#0a99ff";
  const gradientId = "areaGrad";

  const yTicks = [0, 0.5, 1].map((t) => yMin + t * (yMax - yMin));

  const n = data.length;
  const xLabelIndices = new Set([0, Math.floor(n / 2), n - 1]);

  // Clamp activeIndex to valid range (guards against stale index after filter change)
  const safeIndex =
    activeIndex !== null && activeIndex < svgPoints.length ? activeIndex : null;
  const active = safeIndex !== null ? data[safeIndex] : null;
  const activeX = safeIndex !== null ? (svgPoints[safeIndex]?.x ?? null) : null;
  const activeY = safeIndex !== null ? (svgPoints[safeIndex]?.y ?? null) : null;

  return (
    <View
      style={[styles.container, { width, height }]}
      {...panResponder.panHandlers}
    >
      {active && (
        <View style={[styles.tooltip, { left: PADDING.left }]}>
          <Text style={styles.tooltipValue}>
            Value: PKR{" "}
            {active.value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
          </Text>
          {investedSeries && investedSeries.length === data.length && (
            <Text style={styles.tooltipValue}>
              Invested: PKR{" "}
              {getInvestedAt(safeIndex)?.toLocaleString("en-PK", {
                maximumFractionDigits: 0,
              })}
            </Text>
          )}
          {active.label ? (
            <Text style={styles.tooltipLabel}>{active.label}</Text>
          ) : null}
        </View>
      )}

      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={chartColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <G x={PADDING.left} y={PADDING.top}>
          {/* Horizontal grid lines + Y labels */}
          {yTicks.map((v, i) => {
            const y = toY(v);
            return (
              <G key={i}>
                <Line
                  x1={0}
                  y1={y}
                  x2={chartW}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth={1}
                />
                <SvgText
                  x={-6}
                  y={y + 4}
                  fontSize={9}
                  fill={colors.textMuted}
                  textAnchor="end"
                >
                  {fmtY(v)}
                </SvgText>
              </G>
            );
          })}

          {/* Area fill */}
          <Path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Portfolio Value Line */}
          <Path
            d={linePath}
            fill="none"
            stroke={chartColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Net Invested Line */}
          {investedLinePath && (
            <Path
              d={investedLinePath}
              fill="none"
              stroke={investedColor}
              strokeWidth={1}
              strokeDasharray="6,3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X-axis labels */}
          {data.map((d, i) => {
            if (!xLabelIndices.has(i) || !d.label) return null;
            return (
              <SvgText
                key={i}
                x={toX(i)}
                y={chartH + 18}
                fontSize={9}
                fill={colors.textMuted}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            );
          })}

          {/* Scrubber */}
          {safeIndex !== null && activeX !== null && activeY !== null && (
            <G>
              <Line
                x1={activeX}
                y1={0}
                x2={activeX}
                y2={chartH}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
              />
              <Circle
                cx={activeX}
                cy={activeY}
                r={5}
                fill={chartColor}
                stroke={colors.background}
                strokeWidth={2}
              />
            </G>
          )}
          {/* Legend */}
          <G x={0} y={-10}>
            <Rect x={0} y={0} width={10} height={3} fill={chartColor} />
            <SvgText x={15} y={3} fontSize={10} fill={colors.textMuted}>
              Value
            </SvgText>
            <Rect x={60} y={0} width={10} height={3} fill={investedColor} />
            <SvgText x={75} y={3} fontSize={10} fill={colors.textMuted}>
              Invested
            </SvgText>
          </G>
        </G>
      </Svg>
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
  tooltip: {
    position: "absolute",
    top: 0,
    zIndex: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltipValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  tooltipLabel: {
    color: colors.textMuted,
    fontSize: 10,
  },
});
