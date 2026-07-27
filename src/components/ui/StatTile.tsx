import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, borderRadius } from "../../constants/theme";

interface StatTileProps {
  label: string;
  value: string;
  subValue?: string;
  tone?: "neutral" | "positive" | "negative";
}

export function StatTile({ label, value, subValue, tone = "neutral" }: StatTileProps) {
  const isPositive = tone === "positive";
  const isNegative = tone === "negative";
  const valueColor = isPositive
    ? colors.success
    : isNegative
      ? colors.danger
      : colors.textPrimary;

  return (
    <View
      style={[
        styles.tile,
        isPositive && styles.tilePositive,
        isNegative && styles.tileNegative,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {subValue ? (
        <Text style={[styles.subValue, { color: valueColor }]}>{subValue}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: "45%",
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  tilePositive: {
    backgroundColor: colors.successMuted,
    borderColor: "rgba(52, 211, 153, 0.22)",
  },
  tileNegative: {
    backgroundColor: colors.dangerMuted,
    borderColor: "rgba(255, 107, 107, 0.22)",
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  value: {
    fontSize: 19,
    letterSpacing: -0.3,
    fontFamily: fonts.sans.extrabold,
  },
  subValue: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    opacity: 0.8,
  },
});
