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
import { LinearGradient } from "expo-linear-gradient";
import { colors, borderRadius, fonts } from "../../constants/theme";
import { useAccentColor } from "../../hooks/useAccentColor";

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
  const { accentGradient } = useAccentColor();

  const isGradient = variant === "primary" || variant === "danger";
  const gradientColors = (variant === "danger" 
    ? [colors.danger, "#E05555"] 
    : accentGradient) as [string, string];

  const renderContent = () => {
    if (loading) {
      const loaderColor = isGradient ? colors.textInverse : colors.icon;
      return <ActivityIndicator color={loaderColor} size="small" />;
    }

    const textStyle: StyleProp<TextStyle> = [
      isGradient ? styles.primaryText : styles.secondaryText,
      variant === "ghost" ? { color: colors.textMuted } : null,
    ];

    return <Text style={textStyle}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === "secondary" && styles.secondary,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={isGradient ? 0.85 : 0.8}
      {...props}
    >
      {isGradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      ) : (
        <View style={styles.contentWrap}>
          {renderContent()}
        </View>
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
  contentWrap: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  ghost: {
    backgroundColor: "transparent",
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
