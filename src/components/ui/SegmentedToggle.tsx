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
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  activeColor = colors.secondary,
  activeTextColor = colors.textInverse,
  trackColor = colors.trackDeep,
}: SegmentedToggleProps<T>) {
  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.pill, isActive && { backgroundColor: activeColor }]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? activeTextColor : colors.textMuted },
                isActive && styles.labelActive,
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
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
  },
  labelActive: {
    fontFamily: fonts.sans.bold,
  },
});
