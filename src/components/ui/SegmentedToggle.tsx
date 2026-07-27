import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";

interface SegmentedToggleOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedToggleProps<T extends string> {
  options: SegmentedToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  activeColor?: string;
  activeTextColor?: string;
  trackColor?: string;
  /** "compact" (default) hugs its content — used for chart/list toggles like
   * Value/Return %. "full" stretches each segment to fill the row — used in
   * forms, matching the Buy/Sell type toggle on the Add Transaction screen. */
  variant?: "compact" | "full";
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  activeColor = colors.secondary,
  activeTextColor = colors.textInverse,
  trackColor = colors.trackDeep,
  variant = "compact",
}: SegmentedToggleProps<T>) {
  const isFull = variant === "full";
  return (
    <View
      style={[
        styles.track,
        { backgroundColor: trackColor },
        isFull && styles.trackFull,
      ]}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.pill,
              isFull && styles.pillFull,
              isActive && { backgroundColor: activeColor },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                isFull && styles.labelFull,
                { color: isActive ? activeTextColor : colors.textMuted },
                isActive && (isFull ? styles.labelActiveFull : styles.labelActive),
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  trackFull: {
    padding: 4,
    gap: 4,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  pillFull: {
    flex: 1,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
  },
  labelFull: {
    fontSize: 14,
  },
  labelActive: {
    fontFamily: fonts.sans.bold,
  },
  labelActiveFull: {
    fontFamily: fonts.sans.extrabold,
  },
});
