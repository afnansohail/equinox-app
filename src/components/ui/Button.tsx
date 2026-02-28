import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from "react-native";
import { colors, borderRadius, fonts } from "../../constants/theme";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
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
  const touchableStyle = [
    {
      borderRadius: borderRadius.md,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    isPrimary && {
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    variant === "secondary" && {
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    variant === "ghost" && { backgroundColor: "transparent" },
  ];

  return (
    <TouchableOpacity
      style={touchableStyle}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text
          style={{
            fontSize: 16,
            fontFamily: fonts.sans.semibold,
            color: isPrimary ? colors.primary : colors.textSecondary,
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
