import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, borderRadius, fonts } from "../../constants/theme";
import { useAccentColor } from "../../hooks/useAccentColor";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { accentGradient } = useAccentColor();

  if (variant === "primary") {
    return (
      <TouchableOpacity
        style={[styles.base, disabled && styles.disabled, style as any]}
        disabled={disabled || loading}
        activeOpacity={0.85}
        {...props}
      >
        <LinearGradient
          colors={accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "danger") {
    return (
      <TouchableOpacity
        style={[styles.base, disabled && styles.disabled, style as any]}
        disabled={disabled || loading}
        activeOpacity={0.85}
        {...props}
      >
        <LinearGradient
          colors={[colors.danger, "#E05555"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === "secondary" ? styles.secondary : styles.ghost,
        disabled && styles.disabled,
        style as any,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.icon} size="small" />
      ) : (
        <Text
          style={[
            styles.secondaryText,
            variant === "ghost" && { color: colors.textMuted },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    minHeight: 48,
    justifyContent: "center",
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondary: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  secondaryText: {
    fontSize: 15,
    fontFamily: fonts.sans.medium,
    color: colors.textSecondary,
  },
  disabled: {
    opacity: 0.45,
  },
});
