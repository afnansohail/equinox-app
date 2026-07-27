import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { colors, fonts } from "../../constants/theme";

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
  selectedSector?: string | null;
  /** Called when a sector slice is tapped. Passes the sector name, or null when deselected. */
  onSectorPress?: (sector: string | null) => void;
}

export function buildSectorSlices(
  holdings: SectorPieChartProps["holdings"],
): SectorSlice[] {
  return buildSlices(holdings, "value");
}

export default function SectorPieChart({
  holdings,
  selectedSector,
  onSectorPress,
}: SectorPieChartProps) {
  const [mode, setMode] = useState<Mode>("value");
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  function handleSlicePress(idx: number, sectorName: string) {
    if (activeIdx === idx) {
      setActiveIdx(null);
      onSectorPress?.(null);
    } else {
      setActiveIdx(idx);
      onSectorPress?.(sectorName);
    }
  }

  const slices = buildSlices(holdings, mode);

  useEffect(() => {
    if (!slices.length) {
      setActiveIdx(null);
      return;
    }
    if (!selectedSector) {
      setActiveIdx(null);
      return;
    }
    const idx = slices.findIndex((s) => s.sector === selectedSector);
    setActiveIdx(idx >= 0 ? idx : null);
  }, [selectedSector, slices]);

  if (!slices.length) return null;

  let angle = 0;
  const arcData = slices.map((s) => {
    const sweep = (s.percentage / 100) * 360;
    const startAngle = angle;
    angle += sweep;
    return { ...s, startAngle, endAngle: angle };
  });

  const activeSlice = activeIdx !== null ? arcData[activeIdx] : null;

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
              onSectorPress?.(null);
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
              onSectorPress?.(null);
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
                onPress={() => handleSlicePress(i, s.sector)}
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

      {/* Legend — single column list */}
      <View style={styles.legendList}>
        {slices.map((s, idx) => {
          const isActive = activeIdx === idx;
          return (
            <TouchableOpacity
              key={s.sector}
              style={styles.legendRow}
              onPress={() => handleSlicePress(idx, s.sector)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.legendDot, { backgroundColor: s.color }]}
              />
              <Text
                style={[styles.legendName, isActive && styles.legendNameActive]}
                numberOfLines={1}
              >
                {s.sector}
              </Text>
              <Text style={styles.legendPct}>{s.percentage.toFixed(1)}%</Text>
            </TouchableOpacity>
          );
        })}
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
    marginBottom: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 999,
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
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  toggleTextActive: {
    fontFamily: fonts.sans.bold,
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
    fontFamily: fonts.sans.extrabold,
    letterSpacing: -0.02,
  },
  centerName: {
    fontSize: 10,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 13,
    paddingHorizontal: 4,
  },
  centerSub: {
    fontSize: 9,
    fontFamily: fonts.sans.medium,
    color: colors.textDim,
    textAlign: "center",
    marginTop: 1,
  },
  centerHint: {
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 15,
  },
  legendList: {
    gap: 9,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendName: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.sans.medium,
    color: colors.textSecondary,
  },
  legendNameActive: {
    color: colors.textPrimary,
    fontFamily: fonts.sans.semibold,
  },
  legendPct: {
    fontSize: 12,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
    flexShrink: 0,
  },
});
