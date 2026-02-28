import { useThemeStore } from "../stores/themeStore";
import { colors } from "../constants/theme";

/**
 * Returns the current dynamic accent color and derived values.
 * Use this wherever `colors.secondary` was used and needs to react
 * to the user's theme selection.
 */
export function useAccentColor() {
  const { accentColor, accentGradient } = useThemeStore();

  return {
    accent: accentColor,
    accentGradient,
    accentMuted: `${accentColor}1F`, // ~12% opacity
    accentGlow: `${accentColor}40`, // ~25% opacity
    accentBorder: `${accentColor}80`, // ~50% opacity
    // Merged full color palette convenience object
    c: {
      ...colors,
      secondary: accentColor,
      secondaryMuted: `${accentColor}1F`,
      secondaryGlow: `${accentColor}40`,
      gradientSecondary: accentGradient as [string, string],
    },
  };
}
