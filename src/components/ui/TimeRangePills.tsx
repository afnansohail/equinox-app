import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";

interface TimeRangePillsProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function TimeRangePills({ options, value, onChange }: TimeRangePillsProps) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = option === value;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            style={[styles.pill, isActive && styles.pillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: colors.secondary,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  labelActive: {
    fontFamily: fonts.sans.bold,
    color: colors.textInverse,
  },
});
