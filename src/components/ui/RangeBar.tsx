import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

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
      <Text style={styles.label}>{label}</Text>
      <View style={styles.labelRow}>
        <Text style={styles.edgeText}>{hasRange ? fmt(min) : "—"}</Text>
        <Text style={styles.edgeText}>{hasRange ? fmt(max) : "—"}</Text>
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
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  edgeText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  trackWrap: {
    height: 18,
    justifyContent: "center",
  },
  track: {
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.borderLight,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.secondaryMuted,
  },
  dot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.background,
    top: 1,
    marginLeft: -8,
  },
});
