# Equinox visual redesign — design spec

Date: 2026-07-27
Scope: `equinox-app` only (Expo/React Native Android app). No changes to `equinox-scraper-api` or the Supabase schema.

## Purpose

Apply a complete visual redesign to the app based on a Claude Design mockup ("Pakistan Stock Market Redesign", 11 screens), while preserving all existing data, data ordering, and functional behavior. One confirmed functional addition: a 12-month dividend payout bar chart. Auth screens (Welcome/Sign In/Sign Up) are not in the mockup and get a freeform redesign using the new design system, with existing fields/flows preserved.

Source of truth for the mockup: Claude Design project `8efbb888-c103-4fd3-8789-43948e963047`, file `PSX Portfolio App.dc.html`. Full raw extraction (tokens, patterns, per-screen breakdown, ambiguities) is preserved at `/tmp/claude-1000/-home-afnan-Equinox/db00f0c7-9f66-4a6f-b269-3155c46a971a/scratchpad/redesign-spec-extraction.md` for reference during implementation — that scratchpad file is ephemeral, so anything load-bearing from it is restated here.

Non-goal / explicitly out of scope: the linked "Modernist" claude.ai/design system project (`9c228d85-6b8c-471d-a085-644882d9e57d`) is NOT the source for tokens — it's unused scaffolding (light/flat/red palette never actually referenced inside the mockup's phone screens). All tokens below come from the mockup's own hard-coded inline values.

## 1. Design tokens

Replaces `src/constants/theme.ts` colors/fonts/radius and the `tailwind.config.js` color extension. Font changes from Inter to Archivo (weights 400/500/600/700/800, loaded via `expo-font`/Google Fonts the same way Inter is loaded today).

### Colors

| Token | Hex / value | Replaces today |
|---|---|---|
| `background` (page/ground) | `#06100E` | `#0c0c0c` |
| `card` (standard container) | `#0F1A18` | `#171717` |
| `cardElevated` (icon buttons, neutral chips) | `#101C1A` | `#1e1e1e` (cardHover) |
| `accentTile` (ticker avatar bg) | `#12211E` | n/a (new) |
| `trackDeep` (segmented-control/input track) | `#0A1513` | n/a (new) |
| `positionCard` (stock-detail position card bg) | `#0C1614` | n/a (new) |
| `border` (hairline) | `rgba(255,255,255,.06)` | `#252525` |
| `borderStrong` | `rgba(255,255,255,.08)` | `#333333` (borderLight) |
| `secondary` (brand teal accent) | `#1FE3B6` | `#29fde6` |
| `secondaryDark` (avatar gradient partner) | `#0B6F5C` | `#1AD4C3` |
| `secondaryMuted` (teal-tint border/badge bg) | `rgba(31,227,182,.16)` and `.12` variants | `secondaryMuted` (kept, re-valued) |
| `success` (financial positive) | `#34D399` | `#00FF88` |
| `successMuted` | `rgba(52,211,153,.09–.14)` | kept, re-valued |
| `danger` (financial negative / destructive) | `#FF6B6B` | kept (already `#FF6B6B` — no change) |
| `dangerMuted` | `rgba(255,107,107,.12–.25)` | kept, re-valued |
| Chart categorical: purple / orange / yellow | `#7C6CF5` / `#F27F3D` / `#EFC940` | new (sector donut, already exists — just re-colored) |
| Chart categorical 6th slot ("Insurance") | pick a color distinct from brand teal/red — use a muted slate/gray (e.g. `#8A97A6`) rather than reusing showcase red `#EC3013` (mockup inconsistency, not carried forward) | |
| Text primary | `#F2F5F4` | `#FFFFFF` |
| Text secondary | `#B9C6C3` | `#A8A8A8` |
| Text muted | `#7C8B88` | `#555555` |
| Text dim (inactive tab/placeholder) | `#5D6D6A` | new tier |
| Text on teal fill | `#04120F` | `#0c0c0c` (textInverse) |
| Text on coral fill | `#180909` | new |

### Typography

- Family: Archivo (400/500/600/700/800), replacing Inter everywhere.
- Hero figures (portfolio value, dividend total, stock price): 38–40px / 800 / letter-spacing -0.03 to -0.035em.
- Screen H1 (Portfolio/Dividends/Search/Settings headers): 26px / 800 / -0.02em — normalize Settings to 26px too (mockup had it at 24px, inconsistent; not carried forward).
- Sub-header (pushed-screen titles — "Record a trade", "Add dividend", "Transactions"): 18px / 700 / -0.01em.
- Section headers ("Today's movers", "Holdings", "Sector allocation", etc.): 16px / 700 / -0.01em (normalize the mockup's stray 15px on "Sector allocation").
- Row primary text: 14px / 700. Row meta/secondary: 11–12px / 600.
- Kicker/eyebrow uppercase labels: 10–11px / 600–700 / letter-spacing +0.1 to +0.18em.
- Tab bar label: 10px, 600 inactive / 700 active.

### Shape & spacing

- Radius scale: 999px (pills/badges/CTAs) · 26–28px (hero cards) · 20–24px (functional cards) · 14–18px (tiles/inputs/small buttons) · 50% (avatars/icon circles).
- No shadows anywhere in-app (flat surfaces, differentiated by bg-color steps + 1px hairlines only). The mockup's phone-frame shadow is presentation-only chrome and is not part of this spec.
- Screen horizontal padding: 20px. Inter-section vertical gap: 14–18px. Card padding: 14px (standard) to 22px (hero). Row internal gap: 12px. Grid gaps (stat tiles, quick actions): 10px.

## 2. Shared component work (build/rework in `src/components/ui/` and `src/components/shared/`)

New or reworked reusable pieces, used across multiple screens:

1. **SegmentedToggle** (2-option pill track + solid active pill) — used for Value/Return%, Today/All-time, Value/Shares, Buy/Sell, Per-share/Total.
2. **TimeRangePills** (1W/1M/YTD/1Y/ALL row) — Dashboard only.
3. **StatTile** (2×2 metric grid, neutral vs. green-tinted variants) — Portfolio summary.
4. **RangeBar** — two variants already partially exist (`components/ui/RangeBar.tsx`): (a) handle-range bar (day/52-week range), (b) ranked-comparison bar (movers, dividend score ranking) with no handle, just proportional fill. Confirm existing `RangeBar.tsx` covers both or needs a second variant.
5. **Donut + legend** — `SectorPieChart.tsx` already implements this; restyle only (recolor slices, adjust legend row spacing/typography).
6. **Row anatomy** (avatar/icon tile + 2-line text + right-aligned 2-line value + divider) — shared shape across holdings, watchlist, movers, transactions; audit `HoldingRow.tsx`, `DividendRow.tsx`, watchlist rows in `SearchScreen.tsx`, and transaction rows for a common underlying pattern rather than 4 divergent implementations, where that consolidation is low-risk.
7. **ActivityRow** (icon-bubble + 2-line text + value) — Dashboard "Latest activity", reused shape for Transaction History rows (with added BUY/SELL tag + date-group headers).
8. **QuickActionTile** — `ActionButtons.tsx`, restyle only.
9. **Badge/Tag** — Shariah pill, BUY/SELL tag chip.
10. **Dialog** — new themed modal component (dark bg, teal/coral action variants) to replace the inline `Modal` markup in `SettingsScreen.tsx` for Delete All Data / Sign Out confirmations.
11. **EmptyState / LoadingState / ErrorState** — restyle to new tokens and wire into Dashboard, Portfolio, Dividends, Search, Transaction History (currently dead code — each screen hand-rolls its own inline version).
12. **Input** — restyle (label-above convention, teal/coral active-border states already used contextually on Buy/Sell/Add-dividend hero fields).

## 3. Per-screen plan

All screens below are a **restyle only** unless a delta is called out — same data, same order, same calculations.

- **Dashboard** — restyle balance hero card, quick actions, movers, activity feed, tab bar. All data (invested-line chart, Value/Return% toggle, time-range pills) already exists; no logic changes.
- **Portfolio** — restyle stat tiles (map to existing Today's P/L / Unrealized P/L / Invested / Total Value — mockup's "Market value" label maps to existing "Total Value"), sector donut (recolor per token table above), holdings list.
- **Stock Detail** — restyle price header, day/52-week range bars, info grid, "Your position" card, sticky Buy/Sell footer. No new price-history chart added (mockup doesn't have one either — confirmed intentional, not a gap).
- **Buy / Sell (`AddTransactionScreen`)** — restyle only; multi-entry batch pattern already exists and is unchanged. **Addition**: surface a live realized-P/L preview on the Sell path before save, reusing the existing `computeRealizedPnL` calc from `utils/portfolio.ts` (today it's only shown post-hoc in `RealizedHistory.tsx`).
- **Dividends** — restyle hero card, score ranking list (existing `DividendStockRanking.tsx` / `dividendRanking.ts`, unchanged calculation). **Addition**: 12-month rolling payout bar chart — bucket the existing `useDividends()` record list by `paymentDate` month client-side, sum `totalAmount` per month, default missing months to 0 (thin tick per mockup), highlight the peak month. No new data fetching required.
- **Add Dividend** — restyle only; already a single screen with a Per-share/Total-amount toggle, matching the mockup's intent despite it showing two separate mocks.
- **Search** — restyle watchlist rows + search input. No new "search results list" state is introduced (mockup doesn't show one either); current single-lookup-on-submit behavior is unchanged.
- **Transaction History** — restyle rows, add date-group section headers (pure display grouping via `SectionList` or equivalent, no change to underlying data/order), add BUY/SELL tag chips. **Not** merging dividends into this list and **not** adding a "Div." filter chip — stays Buy/Sell-only, matching current behavior. Remains a pushed stack screen with a back button and no bottom tab bar (this fixes an inconsistency in the mockup, which erroneously showed an active tab bar here).
- **Settings** — restyle profile card, Account/About/Danger Zone groups; replace the ad-hoc inline confirmation `Modal` markup with the new shared `Dialog` component for Delete All Data and Sign Out. Same rows/fields, no new settings added.
- **Welcome / Sign In / Sign Up** — not in the mockup. Freeform redesign applying the same design tokens/components, preserving all current fields and flows (anonymous-first entry, email/password sign-in/up, account linking).

## 3a. Addendum — dynamic accent-color theming

`useAccentColor()` / `useThemeStore` / `THEME_PRESETS` (teal/blue/purple/pink/orange/red/gold) exist but are not wired into any UI — `Button.tsx` is the only consumer, and `SettingsScreen.tsx` has no theme-picker row. This is unused infrastructure, not a live user-facing feature (same category as the unused `EmptyState`/`LoadingState`/`ErrorState`). The redesign fixes the accent to the new brand teal (`#1FE3B6`) token directly; it does not need to preserve dynamic accent switching, since there is no way for a user to have ever changed it.

## 4. Explicit non-goals

- No changes to `equinox-scraper-api` or Supabase schema/RLS.
- No new "dividend score" concept beyond what `dividendRanking.ts` already computes.
- No scrollable multi-result search list.
- No merging of dividends into Transaction History.
- No new historical price chart on Stock Detail.

## 5. Open item to confirm during implementation review

The Sell-form realized-P/L preview (§3) is a small functional addition beyond pure restyling, included because it reuses existing calculation logic and was explicitly shown in the mockup. If this turns out to be unwanted scope creep, it can be dropped without affecting anything else in this spec.
