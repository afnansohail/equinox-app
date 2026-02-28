import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors } from "../../constants/theme";

// ─── Types & helpers ─────────────────────────────────────────────────────────

type Mode = "value" | "shares";

export interface SectorSlice {
  sector: string;
  value: number;
  percentage: number;
  color: string;
}

const SECTOR_COLORS_NEW = [
  "#29fde6",
  "#6C63FF",
  "#FF6B35",
  "#FFD60A",
  "#22C55E",
  "#FF2D8A",
  "#0A84FF",
  "#BF5AF2",
  "#FF6B6B",
  "#34D399",
  "#FBBF24",
  "#60A5FA",
  "#A78BFA",
  "#F472B6",
];

function buildSlices(
  holdings: {
    stock?: { sector?: string; currentPrice?: number };
    quantity: number;
    totalInvested: number;
  }[],
  mode: Mode,
): SectorSlice[] {
  const map = new Map<string, number>();
  for (const h of holdings) {
    const sector = h.stock?.sector?.trim() || "Others";
    const val =
      mode === "shares"
        ? h.quantity
        : (h.stock?.currentPrice ?? 0) * h.quantity || h.totalInvested;
    map.set(sector, (map.get(sector) ?? 0) + val);
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
  if (total === 0) return [];
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([sector, value], i) => ({
      sector,
      value,
      percentage: (value / total) * 100,
      color: SECTOR_COLORS_NEW[i % SECTOR_COLORS_NEW.length],
    }));
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  const e = end >= start + 360 ? start + 359.99 : end;
  const s2 = polar(cx, cy, r, e);
  const e2 = polar(cx, cy, r, start);
  const large = e - start > 180 ? 1 : 0;
  return `M ${s2.x} ${s2.y} A ${r} ${r} 0 ${large} 0 ${e2.x} ${e2.y}`;
}

// ─── Dimensions ──────────────────────────────────────────────────────────────
// scroll paddingH 20×2=40  card padding 18×2=36  total=76
const SCREEN_W = Dimensions.get("window").width;
const SIZE = Math.min(SCREEN_W - 76, 200);
const CX = SIZE / 2;
const CY = SIZE / 2;
// OUTER_R is the outer boundary of the ring.
// We draw the arc at MID_R so SVG stroke (centered on path) stays within SIZE/2.
// Active slices expand +5px → need 9px headroom → OUTER_R = SIZE/2 - 10.
const OUTER_R = SIZE / 2 - 10;
const INNER_R = OUTER_R * 0.6;
const STROKE = OUTER_R - INNER_R; // ring thickness
const MID_R = (OUTER_R + INNER_R) / 2; // arc drawn here
const GAP = 1.5; // degrees gap between slices

// ─── Component ───────────────────────────────────────────────────────────────

interface SectorPieChartProps {
  holdings: {
    stock?: { sector?: string; currentPrice?: number };
    quantity: number;
    totalInvested: number;
  }[];
}

export function buildSectorSlices(
  holdings: SectorPieChartProps["holdings"],
): SectorSlice[] {
  return buildSlices(holdings, "value");
}

export default function SectorPieChart({ holdings }: SectorPieChartProps) {
  const [mode, setMode] = useState<Mode>("value");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const slices = buildSlices(holdings, mode);
  if (!slices.length) return null;

  let angle = 0;
  const arcData = slices.map((s) => {
    const sweep = (s.percentage / 100) * 360;
    const startAngle = angle;
    angle += sweep;
    return { ...s, startAngle, endAngle: angle };
  });

  const activeSlice = activeIdx !== null ? arcData[activeIdx] : null;
  const mainSlices = slices.filter((s) => s.percentage >= 3);
  const otherSlices = slices.filter((s) => s.percentage < 3);

  return (
    <View style={styles.card}>
      {/* Header: title + mode toggle */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Sector Allocation</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === "value" && styles.toggleBtnActive,
            ]}
            onPress={() => {
              setMode("value");
              setActiveIdx(null);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "value" && styles.toggleTextActive,
              ]}
            >
              By Value
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              mode === "shares" && styles.toggleBtnActive,
            ]}
            onPress={() => {
              setMode("shares");
              setActiveIdx(null);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "shares" && styles.toggleTextActive,
              ]}
            >
              By Shares
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Donut chart */}
      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE}>
          {arcData.map((s, i) => {
            const isActive = activeIdx === i;
            // Active: shift arc outward by 5, widen by 8 — stays within OUTER_R + 9 = SIZE/2 - 1
            const r = isActive ? MID_R + 5 : MID_R;
            const sw = isActive ? STROKE + 8 : STROKE;
            const path = arc(
              CX,
              CY,
              r,
              s.startAngle + GAP / 2,
              s.endAngle - GAP / 2,
            );
            return (
              <Path
                key={s.sector + i}
                d={path}
                stroke={s.color}
                strokeWidth={sw}
                strokeLinecap="butt"
                fill="none"
                onPress={() => setActiveIdx(activeIdx === i ? null : i)}
              />
            );
          })}
          <Circle cx={CX} cy={CY} r={INNER_R - 1} fill={colors.card} />
        </Svg>

        {/* Center overlay */}
        <View style={styles.centerOverlay} pointerEvents="none">
          {activeSlice ? (
            <>
              <Text style={[styles.centerPct, { color: activeSlice.color }]}>
                {activeSlice.percentage.toFixed(1)}%
              </Text>
              <Text style={styles.centerName} numberOfLines={2}>
                {activeSlice.sector}
              </Text>
              <Text style={styles.centerSub}>
                {mode === "shares"
                  ? `${activeSlice.value.toLocaleString()} shares`
                  : `PKR ${Math.round(activeSlice.value).toLocaleString("en-PK")}`}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.centerHint}>Tap a</Text>
              <Text style={styles.centerHint}>slice</Text>
            </>
          )}
        </View>
      </View>

      {/* Legend grid — 2 columns */}
      <View style={styles.legendGrid}>
        {mainSlices.map((s) => {
          const idx = arcData.findIndex((a) => a.sector === s.sector);
          const isActive = activeIdx === idx;
          return (
            <TouchableOpacity
              key={s.sector}
              style={[styles.legendItem, isActive && styles.legendItemActive]}
              onPress={() => setActiveIdx(activeIdx === idx ? null : idx)}
              activeOpacity={0.7}
            >
              <View style={styles.legendLeft}>
                <View
                  style={[styles.legendDot, { backgroundColor: s.color }]}
                />
                <Text style={styles.legendName} numberOfLines={1}>
                  {s.sector}
                </Text>
              </View>
              <Text style={[styles.legendPct, { color: s.color }]}>
                {s.percentage.toFixed(1)}%
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Others strip */}
      {otherSlices.length > 0 && (
        <View style={styles.othersStrip}>
          <Text style={styles.othersLabel}>Others</Text>
          <View style={styles.othersRow}>
            {otherSlices.map((s) => (
              <View key={s.sector} style={styles.otherChip}>
                <View style={[styles.otherDot, { backgroundColor: s.color }]} />
                <Text style={styles.otherText}>{s.sector}</Text>
                <Text style={[styles.otherPct, { color: s.color }]}>
                  {s.percentage.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
    marginBottom: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  chartWrap: {
    alignSelf: "center",
    width: SIZE,
    height: SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  centerOverlay: {
    position: "absolute",
    width: INNER_R * 2 - 12,
    height: INNER_R * 2 - 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  centerPct: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  centerName: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 13,
    paddingHorizontal: 4,
  },
  centerSub: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 1,
  },
  centerHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 15,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  legendItemActive: {
    borderColor: colors.borderLight,
    backgroundColor: colors.backgroundSecondary,
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendName: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  legendPct: {
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 0,
  },
  othersStrip: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  othersLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  othersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  otherChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  otherDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  otherText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  otherPct: {
    fontSize: 10,
    fontWeight: "600",
  },
});
