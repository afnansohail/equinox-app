# Redesign Foundation (design tokens + shared components) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme the app's design-token layer (colors, fonts, radius) and shared primitive components to match the new dark/teal "Modernist mockup" visual language, and add the small set of new generic components later screen-restyle plans will consume — with zero change to any screen's data, ordering, or business logic.

**Architecture:** This app already centralizes styling through `src/constants/theme.ts` (`colors`/`fonts`/`spacing`/`borderRadius` consts + a derived `theme` `StyleSheet` object) and NativeWind's `tailwind.config.js`. Because nearly every existing component/screen references these tokens by name rather than hardcoding hex values, retargeting the token *values* re-skins most of the app automatically without touching consumer files. This plan updates the token layer, then touches only the small number of shared `ui`/`shared` components that (a) hardcode a color/weight instead of referencing a token, or (b) need a structural restyle the mockup calls for (flat buttons instead of gradients). It also adds four new, screen-agnostic presentational components (`SegmentedToggle`, `TimeRangePills`, `StatTile`, `RankedBar`) that don't yet exist, so later per-screen plans have them ready to consume. No screen file is modified in this plan.

**Tech Stack:** Expo/React Native, NativeWind v4, TypeScript, Zustand, `@expo-google-fonts/*`, `expo-font`.

## Global Constraints

- No automated test suite exists for this app (`npm test` is not set up); verification per task is `npx tsc --noEmit` (must pass with zero errors) plus a written manual on-device check the user runs later via `npx expo start` + Expo Go — do not claim visual correctness beyond what `tsc` can prove.
- Design tokens must come from the mockup's actual inline values, documented in `docs/superpowers/specs/2026-07-27-visual-redesign-design.md` §1 — not the linked "Modernist" claude.ai/design kit, which is unused scaffolding.
- Do not touch any screen file (`src/screens/*.tsx`) in this plan — foundation only. Screens are restyled in follow-on plans once this lands.
- **Known risk to flag forward, not fix here:** any component that sets `fontWeight: "..."` directly instead of `fontFamily: fonts.sans.*` will silently keep rendering in the system font, not Archivo, because RN ignores `fontFamily` inheritance from a theme swap — it must be set explicitly per `Text` style. `CustomModal.tsx` has this bug today (fixed in Task 5 below since this plan touches it anyway); other screens likely have the same bug and must be audited file-by-file in their own restyle plan — this plan does not attempt an app-wide audit.
- `useAccentColor()` / `useThemeStore` / `THEME_PRESETS` are confirmed dead (no UI ever calls `setAccent`; `Button.tsx` is the only consumer) — this plan deletes them rather than preserving unused optionality (see spec §3a).

---

### Task 1: Rewrite design tokens in `theme.ts`

**Files:**
- Modify: `src/constants/theme.ts:1-119` (everything from the imports through the end of the `theme = StyleSheet.create({...})` block's *opening* — i.e., replace the `colors`, `spacing`, `TAB_BAR_HEIGHT`, `fonts`, `borderRadius` exports and remove `THEME_PRESETS`/`ThemePreset`. Leave the `export const theme = StyleSheet.create({...})` block, which starts at the line `export const theme = StyleSheet.create({` in the current file, completely untouched — every value inside it already references `colors.*`/`fonts.*`/`borderRadius.*`/`spacing.*` by name, so it inherits the new palette automatically with no edits.)

**Interfaces:**
- Produces (consumed by every other task in this plan and all future screen-restyle plans): `colors.{background,backgroundSecondary,card,cardHover,border,borderLight,accentTile,trackDeep,positionCard,trackNeutral,primary,secondary,secondaryDark,secondaryMuted,secondaryGlow,glass,glassBorder,glassBorderStrong,glassLight,success,successMuted,danger,dangerMuted,warning,textPrimary,textSecondary,textMuted,textDim,textInverse,textOnCoral,icon,iconMuted,buttonText,chartPurple,chartOrange,chartYellow,chartSlate,gradientSecondary,gradientGlass,gradientDark,gradientSuccess,gradientDanger}` (all `as const`); `fonts.sans.{regular,medium,semibold,bold,extrabold}` (string font-family names); `borderRadius.{xs,sm,md,lg,xl,xxl,full}` (numbers); `spacing.{xs,sm,md,lg,xl,xxl,xxxl}` (unchanged from today); `TAB_BAR_HEIGHT` (unchanged). `THEME_PRESETS` and `ThemePreset` no longer exist — Task 3 removes their only consumers.

- [ ] **Step 1: Replace the token exports**

Replace everything in `src/constants/theme.ts` from the top of the file through (but not including) the line `export const theme = StyleSheet.create({` with:

```ts
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

```

- [ ] **Step 2: Verify the file still parses and the untouched `theme` block still compiles**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: no new errors caused by this file (pre-existing unrelated errors, if any, are out of scope — note them but don't fix here). If there are errors referencing `THEME_PRESETS` or `ThemePreset`, that's expected — Task 3 removes their last consumer; continue and Task 3 will resolve them.

- [ ] **Step 3: Commit**

```bash
git add src/constants/theme.ts
git commit -m "redesign: retheme design tokens to dark/teal palette"
```

---

### Task 2: Update `tailwind.config.js` to match

NativeWind's `tailwind.config.js` hardcodes its own copy of the palette (it doesn't import from `theme.ts`), so it must be updated in lockstep.

**Files:**
- Modify: `tailwind.config.js`

**Interfaces:**
- Consumes: no code dependency, but values must match `colors` from Task 1 for visual consistency wherever a screen uses NativeWind `className`s (e.g. `bg-background`, `text-text-primary`) instead of the `theme.ts` `colors` object directly.
- Produces: NativeWind utility classes `bg-background`, `bg-card`, `border-border`, `bg-primary`, `bg-success`, `bg-danger`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `bg-blue-{500,600}`, `bg-green-{500,600}`, `bg-red-{500,600}` resolving to the new hex values.

- [ ] **Step 1: Replace the color extension**

Replace the `theme.extend.colors` object in `tailwind.config.js` with:

```js
      colors: {
        background: "#06100E",
        card: "#0F1A18",
        border: "#262626",
        primary: "#1FE3B6",
        success: "#34D399",
        danger: "#FF6B6B",
        "text-primary": "#F2F5F4",
        "text-secondary": "#B9C6C3",
        "text-muted": "#7C8B88",
        blue: {
          500: "#3B82F6",
          600: "#2563EB",
        },
        green: {
          500: "#34D399",
          600: "#22C55E",
        },
        red: {
          500: "#FF6B6B",
          600: "#E05555",
        },
      },
```

(`border` stays a plain hex here, not `rgba(...)`, because Tailwind/NativeWind color tokens must resolve to a single opaque value usable with its opacity-modifier syntax like `border-border/50` — pick `#262626`, a neutral dark gray close to how the `rgba(255,255,255,.06)` hairline reads against the `#06100E` background, since NativeWind consumers of `border-border` are comparatively rare against direct `theme.ts` usage.)

- [ ] **Step 2: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: no errors (this file isn't type-checked, but confirm the repo-wide check still runs clean to catch any accidental syntax issue).

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "redesign: retheme tailwind color tokens to match new palette"
```

---

### Task 3: Swap Inter → Archivo, delete dead accent-theming code

**Files:**
- Modify: `App.tsx:1-34`
- Modify: `package.json` (add `@expo-google-fonts/archivo`, remove `@expo-google-fonts/inter` only if nothing else uses it — check first)
- Modify: `src/components/ui/Button.tsx` (drop `useAccentColor` usage — done fully in Task 4, but its import must be removed here too since this task deletes the hook file it points to)
- Delete: `src/stores/themeStore.ts`
- Delete: `src/hooks/useAccentColor.ts`

**Interfaces:**
- Consumes: `fonts.sans.*` string values from Task 1 (must exactly match the keys `useFonts` is given here).
- Produces: the app boots with Archivo loaded under the family names `Archivo_400Regular`, `Archivo_500Medium`, `Archivo_600SemiBold`, `Archivo_700Bold`, `Archivo_800ExtraBold`. `useThemeStore`/`useAccentColor`/`THEME_PRESETS`/`ThemePreset` no longer exist anywhere in the codebase.

- [ ] **Step 1: Confirm nothing else imports Inter or the theme store before deleting**

Run: `cd equinox-app && grep -rln "expo-google-fonts/inter\|useThemeStore\|useAccentColor\|THEME_PRESETS\|ThemePreset" src App.tsx`
Expected output: only `App.tsx`, `src/hooks/useAccentColor.ts`, `src/stores/themeStore.ts`, and `src/components/ui/Button.tsx`. If anything else appears, stop and re-scope this task rather than deleting.

- [ ] **Step 2: Install the Archivo font package**

Run: `cd equinox-app && npx expo install @expo-google-fonts/archivo`

- [ ] **Step 3: Swap the font import/load in `App.tsx`**

In `App.tsx`, replace:

```ts
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
```

with:

```ts
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from "@expo-google-fonts/archivo";
```

and replace:

```ts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
```

with:

```ts
  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });
```

- [ ] **Step 4: Remove the dead `loadSavedTheme` wiring from `App.tsx`**

Remove the `const { loadSavedTheme } = useThemeStore();` line, its import (`import { useThemeStore } from "./src/stores/themeStore";`), and the `void loadSavedTheme();` call inside the `useEffect`, leaving `void initialize();` and the cleanup return intact.

- [ ] **Step 5: Delete the dead files**

Run: `cd equinox-app && rm src/stores/themeStore.ts src/hooks/useAccentColor.ts`

- [ ] **Step 6: Remove `@expo-google-fonts/inter` if now unused**

Run: `grep -rl "expo-google-fonts/inter" .` (repo root) — if no matches remain, run `npm uninstall @expo-google-fonts/inter`.

- [ ] **Step 7: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: errors about `useAccentColor`/`useThemeStore` in `Button.tsx` are expected here and resolved by Task 4 — if any *other* file now errors, stop and investigate before continuing.

- [ ] **Step 8: Commit**

```bash
git add App.tsx package.json package-lock.json
git rm src/stores/themeStore.ts src/hooks/useAccentColor.ts
git commit -m "redesign: swap Inter for Archivo, remove unused accent-theming"
```

---

### Task 4: Simplify `Button.tsx` to flat fills (mockup has no button gradients)

**Files:**
- Modify: `src/components/ui/Button.tsx` (full rewrite)

**Interfaces:**
- Consumes: `colors.{secondary,danger,card,border,textInverse,textOnCoral,textPrimary,textMuted,icon}`, `borderRadius.md`, `fonts.sans.{extrabold,bold,medium}` from Task 1.
- Produces: same public API as before — `<Button title variant="primary"|"secondary"|"ghost"|"danger" loading? disabled? style? {...TouchableOpacityProps} />` — no breaking change for any existing consumer. Internally: `primary`/`danger` are now flat solid fills (no `LinearGradient`, no `useAccentColor`).

- [ ] **Step 1: Replace the full file**

```tsx
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
```

- [ ] **Step 2: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: PASS with no errors referencing `Button.tsx`, `useAccentColor`, or `expo-linear-gradient` in this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "redesign: flatten Button to solid fills, drop dynamic accent theming"
```

---

### Task 5: Restyle `CustomModal.tsx` (becomes the shared Dialog)

The component's API is already flexible enough (icon/title/message/buttons with `default`/`cancel`/`destructive` styles) to serve as the "Dialog" the redesign spec calls for — no API changes, just token/font fixes. It currently hardcodes a stale teal alpha and never sets `fontFamily`, so it wouldn't pick up Archivo without this fix.

**Files:**
- Modify: `src/components/ui/CustomModal.tsx`

**Interfaces:**
- Consumes: `colors.{card,border,secondaryMuted,secondary,danger,textPrimary,textSecondary,textInverse,textOnCoral}`, `fonts.sans.{bold,regular,semibold}`, `borderRadius.{xl,md}` from Task 1.
- Produces: same public API — `<CustomModal visible onClose title message? buttons? icon? />`, `ModalButton { text, onPress, style?, loading? }` — unchanged, so `SignInScreen.tsx`/`SignUpScreen.tsx` (its current consumers) need no changes.

- [ ] **Step 1: Add the `fonts`/`borderRadius` import**

Change:
```ts
import { colors } from "../../constants/theme";
```
to:
```ts
import { colors, fonts, borderRadius } from "../../constants/theme";
```

- [ ] **Step 2: Fix the icon wrap color and font/radius gaps in the stylesheet**

Replace the `iconWrap`, `title`, `message`, `card`, `button`, `buttonText`, `buttonTextDestructive` style entries with:

```ts
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondaryMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.sans.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
```
and (in the `card` entry) change `borderRadius: 20,` to `borderRadius: borderRadius.xl,`
and (in the `button` entry) change `borderRadius: 12,` to `borderRadius: borderRadius.md,`
and:
```ts
  buttonText: {
    fontSize: 15,
    fontFamily: fonts.sans.semibold,
    color: colors.textInverse,
  },
  buttonTextDestructive: {
    fontFamily: fonts.sans.semibold,
    color: colors.textOnCoral,
  },
```

- [ ] **Step 3: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: PASS, no errors in `CustomModal.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/CustomModal.tsx
git commit -m "redesign: retheme CustomModal (Archivo fonts, new tokens)"
```

---

### Task 6: Add `RankedBar` (ranked-comparison progress bar, no handle) and fix `RangeBar`'s missing font-family

The mockup uses two visually distinct progress-bar shapes (see spec §2 "Progress / range bar"): the existing `RangeBar.tsx` is the handle-based variant (day range / 52-week range); movers and the dividend score ranking need a second, simpler variant with no handle, just a proportional fill. `RangeBar.tsx` also sets `fontWeight` directly instead of `fontFamily`, so it has the same Archivo-miss bug as `CustomModal.tsx` had.

**Files:**
- Modify: `src/components/ui/RangeBar.tsx` (font-family fix + token-only recolor, no structural change)
- Create: `src/components/ui/RankedBar.tsx`

**Interfaces:**
- Produces: `RankedBar({ value: number; max?: number; color?: string; trackColor?: string }): JSX.Element` — renders a `trackNeutral`-colored track (radius `full`, height 6) with a solid fill whose width is `(value/max)*100%`, clamped to `[0,100]`. Defaults: `max=100`, `color=colors.secondary`, `trackColor=colors.trackNeutral`. Consumed by future Dashboard ("Today's movers") and Dividends ("Score ranking") restyle plans — not wired into any screen by this task.

- [ ] **Step 1: Fix `RangeBar.tsx`'s font-family and recolor the dot/fill to the new tokens**

Add `fonts` to the import:
```ts
import { colors, fonts } from "../../constants/theme";
```

Replace the `label` and `edgeText` style entries:
```ts
  label: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: fonts.sans.semibold,
  },
  ...
  edgeText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontFamily: fonts.sans.semibold,
  },
```
(remove the old `fontWeight: "600"` lines from both). Leave `track`/`fill`/`dot`/`trackWrap`/`wrap`/`labelRow` untouched — they already reference `colors.borderLight`/`colors.secondaryMuted`/`colors.secondary`/`colors.background`, which now resolve to the new palette automatically via Task 1.

- [ ] **Step 2: Create `RankedBar.tsx`**

```tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../../constants/theme";

interface RankedBarProps {
  value: number;
  max?: number;
  color?: string;
  trackColor?: string;
}

export default function RankedBar({
  value,
  max = 100,
  color = colors.secondary,
  trackColor = colors.trackNeutral,
}: RankedBarProps) {
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) * 100 : 0;

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
```

- [ ] **Step 3: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: PASS, no errors in `RangeBar.tsx` or `RankedBar.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/RangeBar.tsx src/components/ui/RankedBar.tsx
git commit -m "redesign: add RankedBar, fix RangeBar font-family"
```

---

### Task 7: Add `SegmentedToggle` (shared-track 2+ option pill toggle)

Generic reusable version of the "Value/Return %", "Today/All-time", "Value/Shares", "Buy/Sell", "Per share/Total amount" pattern (spec §2). Not wired into any screen by this task — each of those currently has its own bespoke inline toggle; swapping them to this shared component happens in each feature's own restyle plan.

**Files:**
- Create: `src/components/ui/SegmentedToggle.tsx`

**Interfaces:**
- Produces: `SegmentedToggle<T extends string>({ options: { label: string; value: T }[]; value: T; onChange: (value: T) => void; activeColor?: string; activeTextColor?: string }): JSX.Element`. Defaults: `activeColor=colors.secondary`, `activeTextColor=colors.textInverse` (callers pass `activeColor={colors.danger} activeTextColor={colors.textOnCoral}` for a Sell/coral context).

- [ ] **Step 1: Create the component**

```tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";

interface SegmentedToggleOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedToggleProps<T extends string> {
  options: SegmentedToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  activeColor?: string;
  activeTextColor?: string;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  activeColor = colors.secondary,
  activeTextColor = colors.textInverse,
}: SegmentedToggleProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.pill,
              isActive && { backgroundColor: activeColor },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? activeTextColor : colors.textMuted },
                isActive && styles.labelActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.trackDeep,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    whiteSpace: "nowrap",
  },
  labelActive: {
    fontFamily: fonts.sans.bold,
  },
});
```

Note: `whiteSpace` is a web-only RN-Web style property; if `npx tsc --noEmit` flags it as invalid on the plain `TextStyle` type, remove that line — React Native text doesn't wrap pill labels in practice given the fixed short label lengths this component is used for, so it's not load-bearing.

- [ ] **Step 2: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: PASS. If `whiteSpace` errors, remove it per the note above and re-run.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/SegmentedToggle.tsx
git commit -m "redesign: add shared SegmentedToggle component"
```

---

### Task 8: Add `TimeRangePills` (individually-pilled range row)

Visually distinct from `SegmentedToggle`: each option is its own separately-rounded pill in an equal-flex row, not a shared track with one moving pill (spec §2 "Time-range pill row"). Used today, inline, by the Dashboard's 1W/1M/YTD/1Y/ALL selector — not rewired by this task.

**Files:**
- Create: `src/components/ui/TimeRangePills.tsx`

**Interfaces:**
- Produces: `TimeRangePills({ options: string[]; value: string; onChange: (value: string) => void }): JSX.Element`. Each option renders as an equal-flex pill; active gets `colors.secondary` fill + `colors.textInverse` bold text; inactive is transparent + `colors.textMuted` text.

- [ ] **Step 1: Create the component**

```tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";

interface TimeRangePillsProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function TimeRangePills({ options, value, onChange }: TimeRangePillsProps) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive = option === value;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onChange(option)}
            style={[styles.pill, isActive && styles.pillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: colors.secondary,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  labelActive: {
    fontFamily: fonts.sans.bold,
    color: colors.textInverse,
  },
});
```

- [ ] **Step 2: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/TimeRangePills.tsx
git commit -m "redesign: add shared TimeRangePills component"
```

---

### Task 9: Add `StatTile` (2×2 metric grid tile)

Used by the Portfolio screen's stat grid (Invested / Market value / Today's P/L / Unrealised, spec §2 "Stat tile grid") — not wired into `SummaryGrid.tsx` by this task.

**Files:**
- Create: `src/components/ui/StatTile.tsx`

**Interfaces:**
- Produces: `StatTile({ label: string; value: string; subValue?: string; tone?: "neutral" | "positive" | "negative" }): JSX.Element`. `tone="neutral"` (default) uses `colors.card`/`colors.border`; `"positive"` uses `colors.successMuted` bg + a green-tinted border + `colors.success` value/subValue text; `"negative"` mirrors with `colors.dangerMuted`/`colors.danger`.

- [ ] **Step 1: Create the component**

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, borderRadius } from "../../constants/theme";

interface StatTileProps {
  label: string;
  value: string;
  subValue?: string;
  tone?: "neutral" | "positive" | "negative";
}

export function StatTile({ label, value, subValue, tone = "neutral" }: StatTileProps) {
  const isPositive = tone === "positive";
  const isNegative = tone === "negative";
  const valueColor = isPositive
    ? colors.success
    : isNegative
      ? colors.danger
      : colors.textPrimary;

  return (
    <View
      style={[
        styles.tile,
        isPositive && styles.tilePositive,
        isNegative && styles.tileNegative,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {subValue ? (
        <Text style={[styles.subValue, { color: valueColor }]}>{subValue}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: "45%",
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  tilePositive: {
    backgroundColor: colors.successMuted,
    borderColor: "rgba(52, 211, 153, 0.22)",
  },
  tileNegative: {
    backgroundColor: colors.dangerMuted,
    borderColor: "rgba(255, 107, 107, 0.22)",
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
  },
  value: {
    fontSize: 19,
    letterSpacing: -0.3,
    fontFamily: fonts.sans.extrabold,
  },
  subValue: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    opacity: 0.8,
  },
});
```

- [ ] **Step 2: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/StatTile.tsx
git commit -m "redesign: add shared StatTile component"
```

---

### Task 10: Restyle `EmptyState` / `LoadingState` / `ErrorState`

These three are currently dead code (no screen imports them — each screen hand-rolls its own inline empty/loading/error markup, per the design spec's codebase audit). This task only fixes their token/font references so they're ready to use; wiring them into screens (replacing each screen's bespoke inline version) happens in that screen's own restyle plan, not here.

**Files:**
- Modify: `src/components/shared/EmptyState.tsx`
- Modify: `src/components/shared/LoadingState.tsx`
- Modify: `src/components/shared/ErrorState.tsx`

**Interfaces:**
- Produces: same public APIs as today — `EmptyState({ title?, message, children? })`, `LoadingState({ message? })`, `ErrorState({ message, onRetry? })` — unchanged, so any future wiring is a drop-in.

- [ ] **Step 1: Fix `EmptyState.tsx`'s title weight**

Change the `title` style's `fontFamily` from `fonts.sans.semibold` to `fonts.sans.bold` (matches the mockup's heavier empty-state heading weight); leave everything else as-is (it already uses `colors`/`fonts` tokens correctly, so it inherits the new palette from Task 1 automatically).

- [ ] **Step 2: Fix `LoadingState.tsx`'s spinner color**

Change `<ActivityIndicator size="large" color={colors.icon} />` to `<ActivityIndicator size="large" color={colors.secondary} />` (the mockup treats loading affordances with the brand teal, not a neutral icon gray).

- [ ] **Step 3: Fix `ErrorState.tsx`'s retry button radius**

Change the `button` style's `borderRadius: borderRadius.md,` — first add `borderRadius` to the import (`import { colors, fonts, borderRadius } from "../../constants/theme";`), replacing the current hardcoded literal if `ErrorState.tsx` doesn't already import `borderRadius` (it currently doesn't — check the import line and add it). Leave `colors.glass`/`colors.glassBorder` as-is; they already resolve to the new card tokens via Task 1.

- [ ] **Step 4: Verify**

Run: `cd equinox-app && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/EmptyState.tsx src/components/shared/LoadingState.tsx src/components/shared/ErrorState.tsx
git commit -m "redesign: retheme EmptyState/LoadingState/ErrorState"
```

---

## After this plan

Run `cd equinox-app && npx tsc --noEmit` once more at the very end to confirm the whole repo is clean, then start the dev server (`npx expo start --tunnel --clear`) and open a couple of existing screens in Expo Go — you should already see the new near-black/teal/Archivo look bleed through anywhere a screen uses `colors`/`fonts`/`theme.*` (Button fills, Card backgrounds, badges, borders), even though no screen file has been touched yet. That's the signal this foundation is solid before starting the first per-screen restyle plan (Dashboard is the natural first candidate, since it's the most component-dense screen and exercises the new `TimeRangePills`/`SegmentedToggle`/`RankedBar` all at once).
