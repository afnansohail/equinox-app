import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";

interface EmptyStateProps {
  title?: string;
  message: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, message, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
});
