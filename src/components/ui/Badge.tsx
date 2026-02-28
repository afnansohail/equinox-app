import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, borderRadius, fonts } from "../../constants/theme";

interface BadgeProps {
  value: number;
  showSign?: boolean;
}

export function Badge({ value, showSign = true }: BadgeProps) {
  const isPositive = value >= 0;
  const sign = showSign ? (isPositive ? "+" : "") : "";

  return (
    <View
      style={[
        styles.badge,
        isPositive ? styles.badgePositive : styles.badgeNegative,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          isPositive ? styles.textPositive : styles.textNegative,
        ]}
      >
        {sign}
        {value.toFixed(2)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgePositive: {
    backgroundColor: colors.successMuted,
  },
  badgeNegative: {
    backgroundColor: colors.dangerMuted,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
  },
  textPositive: {
    color: colors.success,
  },
  textNegative: {
    color: colors.danger,
  },
});
