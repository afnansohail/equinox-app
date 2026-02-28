import { StyleSheet, Platform } from "react-native";

// ─── Theme Presets ────────────────────────────────────────────────────────────
export const THEME_PRESETS = {
  teal: {
    name: "Teal",
    color: "#29fde6",
    gradient: ["#29fde6", "#06B6D4"] as [string, string],
  },
  blue: {
    name: "Blue",
    color: "#0A84FF",
    gradient: ["#0A84FF", "#005FCC"] as [string, string],
  },
  purple: {
    name: "Purple",
    color: "#BF5AF2",
    gradient: ["#BF5AF2", "#9A3DD4"] as [string, string],
  },
  pink: {
    name: "Pink",
    color: "#FF2D8A",
    gradient: ["#FF2D8A", "#CC1166"] as [string, string],
  },
  orange: {
    name: "Orange",
    color: "#FF6B35",
    gradient: ["#FF6B35", "#E84F22"] as [string, string],
  },
  red: {
    name: "Red",
    color: "#FF3B30",
    gradient: ["#FF3B30", "#CC1F15"] as [string, string],
  },
  gold: {
    name: "Gold",
    color: "#FFD60A",
    gradient: ["#FFD60A", "#F5A623"] as [string, string],
  },
} as const;

export type ThemePreset = keyof typeof THEME_PRESETS;

export const colors = {
  // Core palette
  background: "#0c0c0c",
  backgroundSecondary: "#111111",
  card: "#171717",
  cardHover: "#1e1e1e",
  border: "#252525",
  borderLight: "#333333",

  // Primary - near-white; used for selected nav icons, main brand text
  primary: "#f5f5f5",

  // Secondary - default teal accent (overridden dynamically by theme store)
  secondary: "#29fde6",
  secondaryDark: "#1AD4C3",
  secondaryMuted: "rgba(41, 253, 230, 0.12)",
  secondaryGlow: "rgba(41, 253, 230, 0.25)",

  // Glass / Frosted
  glass: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.10)",
  glassBorderStrong: "rgba(255, 255, 255, 0.16)",
  glassLight: "rgba(255, 255, 255, 0.03)",

  // Semantic
  success: "#00FF88",
  successMuted: "rgba(0, 255, 136, 0.12)",
  danger: "#FF6B6B",
  dangerMuted: "rgba(255, 107, 107, 0.12)",
  warning: "#FFB800",

  // Text hierarchy
  textPrimary: "#FFFFFF",
  textSecondary: "#A8A8A8",
  textMuted: "#555555",
  textInverse: "#0c0c0c",

  // Icons
  icon: "#D4D4D4",
  iconMuted: "#5A5A5A",
  buttonText: "#f5f5f5",

  // Gradients
  gradientSecondary: ["#29fde6", "#06B6D4"] as const,
  gradientGlass: [
    "rgba(255, 255, 255, 0.08)",
    "rgba(255, 255, 255, 0.02)",
  ] as const,
  gradientDark: ["#171717", "#0c0c0c"] as const,
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

// Tab bar height for proper bottom padding
export const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 84 : 70;

// Font families — sans-serif only
export const fonts = {
  sans: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
} as const;

// Border radius — reduced roundness for modern 2026 aesthetic
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
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
  // Titles — sans-serif
  title: {
    fontSize: 28,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  titleLarge: {
    fontSize: 36,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Cards — frosted glass
  card: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
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
    fontFamily: fonts.sans.bold,
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
  // Buttons
  primaryButton: {
    backgroundColor: colors.secondary,
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
    borderColor: colors.glassBorder,
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
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontFamily: fonts.sans.regular,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.secondary,
  },
  // Badge
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
