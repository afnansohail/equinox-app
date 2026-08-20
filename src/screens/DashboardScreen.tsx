import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Settings } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BalanceCard } from "../components/dashboard/BalanceCard";
import { ActionButtons } from "../components/dashboard/ActionButtons";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import TopPointContributorsChart from "../components/charts/TopPointContributorsChart";
import Toast from "../components/shared/Toast";

import { useDashboardData } from "../hooks/useDashboardData";
import { usePortfolioHistory } from "../hooks/usePortfolio";
import { useRefreshStocks } from "../hooks/useStocks";
import { useWishlist } from "../hooks/useWishlist";
import { useAuthStore } from "../stores/authStore";
import type { RootStackParamList, MainTabParamList } from "../navigation/types";
import { colors, fonts, TAB_BAR_HEIGHT } from "../constants/theme";
import { FilterPeriod } from "../utils/portfolio";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Dashboard">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { getDisplayName } = useAuthStore();
  const { data: wishlist } = useWishlist();
  const { refetch: refetchHistory } = usePortfolioHistory();
  const refreshMutation = useRefreshStocks();

  const [refreshing, setRefreshing] = useState(false);
  const [chartFilter, setChartFilter] = useState<FilterPeriod>("1W");
  const [toastConfig, setToastConfig] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const {
    holdings,
    totalValue,
    totalPnL,
    totalPnLPct,
    isPositive,
    dayPnL,
    dayPnLPct,
    dayIsPositive,
    chartData,
    investedSeries,
    recentTransactions,
    isLoading: isDashboardLoading,
  } = useDashboardData(chartFilter);

  // ── Auto-refresh stock prices on app open / foreground ───────────────────
  // Module-level timestamp so the throttle survives tab switches but resets on
  // app kill (which is the desired behaviour — always scrape fresh on cold open).
  const autoRefreshDone = useRef(false);

  const triggerBackgroundRefresh = useCallback(
    (holdingsData: typeof holdings, wishlistData: typeof wishlist) => {
      const portfolioSymbols = holdingsData?.map((h) => h.stockSymbol) ?? [];
      const wishlistSymbols = wishlistData?.map((w) => w.stockSymbol) ?? [];
      const symbols = [...new Set([...portfolioSymbols, ...wishlistSymbols])];
      if (symbols.length > 0) {
        refreshMutation.mutate(symbols);
      }
    },
    [refreshMutation],
  );

  // Trigger once after initial data load (cold open)
  useEffect(() => {
    if (autoRefreshDone.current) return;
    if (holdings === undefined || wishlist === undefined) return;
    autoRefreshDone.current = true;
    triggerBackgroundRefresh(holdings, wishlist);
  }, [holdings, wishlist, triggerBackgroundRefresh]);

  // Re-trigger whenever the app comes back to the foreground (throttled to 30 min)
  useEffect(() => {
    const THIRTY_MINUTES = 30 * 60 * 1000;
    let lastForegroundRefresh = 0;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active") return;
      const now = Date.now();
      if (now - lastForegroundRefresh < THIRTY_MINUTES) return;
      lastForegroundRefresh = now;
      triggerBackgroundRefresh(holdings, wishlist);
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => subscription.remove();
  }, [holdings, wishlist, triggerBackgroundRefresh]);
  // ─────────────────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const portfolioSymbols = holdings?.map((h) => h.stockSymbol) ?? [];
      const wishlistSymbols = wishlist?.map((w) => w.stockSymbol) ?? [];
      const symbols = [...new Set([...portfolioSymbols, ...wishlistSymbols])];

      // Run independently: a stock-price refresh failure must not prevent the
      // chart's history refetch from running (and vice versa) — previously
      // these were sequential awaits, so a single failed price refresh meant
      // the history data never even got a chance to update.
      const [priceResult, historyResult] = await Promise.allSettled([
        symbols.length > 0
          ? refreshMutation.mutateAsync(symbols)
          : Promise.resolve(),
        refetchHistory(),
      ]);

      const failures: string[] = [];
      if (priceResult.status === "rejected") {
        console.error("Error refreshing stock prices:", priceResult.reason);
        failures.push(
          priceResult.reason?.message || "Could not refresh stock prices",
        );
      }
      if (historyResult.status === "rejected") {
        console.error("Error refreshing portfolio history:", historyResult.reason);
        failures.push("Could not refresh the value chart");
      } else if (historyResult.value.isError) {
        const historyError = historyResult.value.error as any;
        console.error("Portfolio history query failed:", historyError);
        failures.push(
          historyError?.message
            ? `Could not refresh the value chart: ${historyError.message}`
            : "Could not refresh the value chart",
        );
      }

      if (failures.length > 0) {
        setToastConfig({ type: "error", msg: failures.join(" · ") });
      } else {
        setToastConfig({ type: "success", msg: "Data updated" });
      }
    } finally {
      setRefreshing(false);
    }
  }, [holdings, wishlist, refreshMutation, refetchHistory]);

  const displayName = getDisplayName();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={colors.gradientSecondary}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {displayName?.[0]?.toUpperCase() ?? "U"}
            </Text>
          </LinearGradient>
          <View>
            <Text style={styles.welcomeLabel}>Welcome back</Text>
            <Text style={styles.welcomeName}>{displayName}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            navigation.navigate("MainTabs", { screen: "Settings" })
          }
        >
          <Settings size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
          />
        }
      >
        <BalanceCard
          totalValue={totalValue}
          totalPnL={totalPnL}
          totalPnLPct={totalPnLPct}
          isPositive={isPositive}
          dayPnL={dayPnL}
          dayPnLPct={dayPnLPct}
          dayIsPositive={dayIsPositive}
          chartData={chartData}
          investedSeries={investedSeries}
          chartFilter={chartFilter}
          onFilterChange={setChartFilter}
          isChartLoading={isDashboardLoading}
        />

        <ActionButtons
          onBuy={() => navigation.navigate("AddTransaction", { type: "BUY" })}
          onSell={() => navigation.navigate("AddTransaction", { type: "SELL" })}
          onHistory={() => navigation.navigate("TransactionHistory")}
          onRefresh={onRefresh}
        />

        {holdings && holdings.length > 0 && (
          <TopPointContributorsChart holdings={holdings} />
        )}

        <RecentActivity
          transactions={recentTransactions}
          onViewAll={() => navigation.navigate("TransactionHistory")}
        />
      </ScrollView>
      <Toast config={toastConfig} onClose={() => setToastConfig(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 15,
    fontFamily: fonts.sans.extrabold,
    color: colors.textInverse,
  },
  welcomeLabel: {
    fontSize: 12,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    letterSpacing: 0.02,
  },
  welcomeName: {
    fontSize: 17,
    color: colors.textPrimary,
    fontFamily: fonts.sans.bold,
    letterSpacing: -0.1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
