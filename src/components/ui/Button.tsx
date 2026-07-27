import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { colors, borderRadius, fonts } from "../../constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const renderContent = () => {
    if (loading) {
      const loaderColor = isPrimary || isDanger ? colors.textInverse : colors.icon;
      return <ActivityIndicator color={loaderColor} size="small" />;
    }

    const textStyle: StyleProp<TextStyle> = [
      isPrimary && styles.primaryText,
      isDanger && styles.dangerText,
      variant === "secondary" && styles.secondaryText,
      variant === "ghost" && styles.ghostText,
    ];

    return <Text style={textStyle}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary && styles.primary,
        isDanger && styles.danger,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <View style={styles.contentWrap}>{renderContent()}</View>
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
  primary: {
    backgroundColor: colors.secondary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  contentWrap: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryText: {
    fontSize: 15,
    fontFamily: fonts.sans.extrabold,
    color: colors.textInverse,
    letterSpacing: 0.2,
  },
  dangerText: {
    fontSize: 15,
    fontFamily: fonts.sans.extrabold,
    color: colors.textOnCoral,
    letterSpacing: 0.2,
  },
  secondaryText: {
    fontSize: 15,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
  },
  ghostText: {
    fontSize: 14,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  disabled: {
    opacity: 0.45,
  },
});
