import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";

interface Props {
  label: string;
  low?: number | null;
  high?: number | null;
  value?: number | null;
}

const fmt = (n?: number | null) =>
  n != null && Number.isFinite(n)
    ? `PKR ${n.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`
    : "—";

export default function RangeBar({ label, low, high, value }: Props) {
  const hasRange = low != null && high != null && !(low === 0 && high === 0);

  const min = hasRange ? Math.min(low!, high!) : 0;
  const max = hasRange ? Math.max(low!, high!) : 0;
  const ratio =
    hasRange && value != null
      ? max > min
        ? Math.min(Math.max((value - min) / (max - min), 0), 1)
        : 0.5
      : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.edgeText}>
          {hasRange ? `${fmt(min)} — ${fmt(max)}` : "—"}
        </Text>
      </View>
      <View style={styles.trackWrap}>
        <View style={styles.track} />
        {hasRange && (
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        )}
        {hasRange && <View style={[styles.dot, { left: `${ratio * 100}%` }]} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 10,
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.12,
    textTransform: "uppercase",
    color: colors.textMuted,
    fontFamily: fonts.sans.semibold,
  },
  edgeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.sans.semibold,
  },
  trackWrap: {
    height: 14,
    justifyContent: "center",
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.trackNeutral,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  dot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    marginLeft: -6,
  },
});
