import { StyleSheet } from "react-native";

export const colors = {
  // Core palette - Bloomberg-style deep charcoal
  background: "#0A0A0A",
  backgroundSecondary: "#121212",
  card: "#161616",
  cardHover: "#1C1C1C",
  border: "#252525",
  borderLight: "#333333",

  // Primary - Use sparingly (accent only)
  primary: "#29FFE8",
  primaryDark: "#1AD4C3",
  primaryMuted: "rgba(41, 255, 232, 0.12)",
  primaryGlow: "rgba(41, 255, 232, 0.25)",

  // Glass/Frost effect colors
  glass: "rgba(22, 22, 22, 0.85)",
  glassBorder: "rgba(255, 255, 255, 0.08)",
  glassLight: "rgba(255, 255, 255, 0.03)",

  // Semantic - Electric neon green for gains, coral for losses
  success: "#00FF88",
  successMuted: "rgba(0, 255, 136, 0.12)",
  danger: "#FF6B6B",
  dangerMuted: "rgba(255, 107, 107, 0.12)",
  warning: "#FFB800",

  // Text - White and light grey hierarchy
  textPrimary: "#FFFFFF",
  textSecondary: "#B8B8B8",
  textMuted: "#6B6B6B",
  textInverse: "#0A0A0A",

  // Icon/button colors - Light grey focus
  icon: "#E0E0E0",
  iconMuted: "#888888",
  buttonText: "#F0F0F0",

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ["#29FFE8", "#06B6D4"] as const,
  gradientGlass: [
    "rgba(255, 255, 255, 0.08)",
    "rgba(255, 255, 255, 0.02)",
  ] as const,
  gradientDark: ["#161616", "#0A0A0A"] as const,
  gradientSuccess: ["#00FF88", "#00CC6A"] as const,
  gradientDanger: ["#FF6B6B", "#E05555"] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

// Font families
export const fonts = {
  // Serif - for headings and values
  serif: {
    regular: "PlayfairDisplay_400Regular",
    medium: "PlayfairDisplay_500Medium",
    semibold: "PlayfairDisplay_600SemiBold",
    bold: "PlayfairDisplay_700Bold",
  },
  // Sans-serif - for body and UI
  sans: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
} as const;

// Reduced roundness - more angular, modern
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  full: 9999,
} as const;

export const theme = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadding: {
    paddingHorizontal: spacing.lg,
  },
  titleSection: {
    paddingVertical: spacing.xl,
  },
  // Titles - serif font for elegance
  title: {
    fontSize: 28,
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleLarge: {
    fontSize: 36,
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Cards - glassmorphism style
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardGlass: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  valueLarge: {
    fontSize: 32,
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  value: {
    fontSize: 16,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  valueSmall: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  textMuted: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  success: {
    color: colors.success,
  },
  danger: {
    color: colors.danger,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  // Buttons - reduced roundness, light grey text
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    letterSpacing: 0.2,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    color: colors.buttonText,
    fontSize: 15,
    fontFamily: fonts.sans.medium,
  },
  ghostButton: {
    backgroundColor: colors.glassLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: colors.icon,
    fontSize: 14,
    fontFamily: fonts.sans.medium,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontFamily: fonts.sans.regular,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  // Pill/badge styles
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glassLight,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
  },
});
