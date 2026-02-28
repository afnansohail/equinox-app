import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { colors, borderRadius, fonts } from "../../constants/theme";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.danger,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
});
