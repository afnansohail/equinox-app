import React from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { colors, borderRadius, fonts } from "../../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.sans.regular,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.danger,
    marginTop: 4,
  },
});
