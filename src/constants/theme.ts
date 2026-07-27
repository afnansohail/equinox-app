import { StyleSheet, Platform } from "react-native";

export const colors = {
  // Core surfaces
  background: "#06100E",
  backgroundSecondary: "#08130F",
  card: "#0F1A18",
  cardHover: "#101C1A",
  border: "rgba(255, 255, 255, 0.06)",
  borderLight: "rgba(255, 255, 255, 0.08)",

  // Additional surface tiers used by the redesign
  accentTile: "#12211E",
  trackDeep: "#0A1513",
  positionCard: "#0C1614",
  trackNeutral: "#182C28",

  // Primary - near-white; used for selected nav icons, main brand text
  primary: "#F2F5F4",

  // Secondary - teal brand accent
  secondary: "#1FE3B6",
  secondaryDark: "#0B6F5C",
  secondaryMuted: "rgba(31, 227, 182, 0.14)",
  secondaryGlow: "rgba(31, 227, 182, 0.25)",

  // Glass tokens — kept for existing consumers, repointed to solid dark fills
  // (the redesign has no translucency; these now match `card`/`cardHover`)
  glass: "#0F1A18",
  glassBorder: "rgba(255, 255, 255, 0.06)",
  glassBorderStrong: "rgba(255, 255, 255, 0.08)",
  glassLight: "#101C1A",

  // Semantic
  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.12)",
  danger: "#FF6B6B",
  dangerMuted: "rgba(255, 107, 107, 0.12)",
  warning: "#EFC940",

  // Text hierarchy
  textPrimary: "#F2F5F4",
  textSecondary: "#B9C6C3",
  textMuted: "#7C8B88",
  textDim: "#5D6D6A",
  textInverse: "#04120F",
  textOnCoral: "#180909",

  // Icons
  icon: "#B9C6C3",
  iconMuted: "#5D6D6A",
  buttonText: "#F2F5F4",

  // Chart categorical colors (sector donut, beyond secondary/success)
  chartPurple: "#7C6CF5",
  chartOrange: "#F27F3D",
  chartYellow: "#EFC940",
  chartSlate: "#8A97A6",

  // Gradients
  gradientSecondary: ["#1FE3B6", "#0B6F5C"] as const,
  gradientGlass: [
    "rgba(255, 255, 255, 0.08)",
    "rgba(255, 255, 255, 0.02)",
  ] as const,
  gradientDark: ["#0F1A18", "#06100E"] as const,
  gradientSuccess: ["#34D399", "#22C55E"] as const,
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

// Font family — Archivo throughout (replaces Inter)
export const fonts = {
  sans: {
    regular: "Archivo_400Regular",
    medium: "Archivo_500Medium",
    semibold: "Archivo_600SemiBold",
    bold: "Archivo_700Bold",
    extrabold: "Archivo_800ExtraBold",
  },
} as const;

// Border radius — generous rounding per redesign (hero cards down to pills)
export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 28,
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
