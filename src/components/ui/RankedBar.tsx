import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

interface RankedBarProps {
  value: number;
  max?: number;
  color?: string;
  trackColor?: string;
}

export default function RankedBar({
  value,
  max = 100,
  color = colors.secondary,
  trackColor = colors.trackNeutral,
}: RankedBarProps) {
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0;

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
