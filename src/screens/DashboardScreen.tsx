import React, { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Settings } from "lucide-react-native";

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
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";
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
  } = useDashboardData(chartFilter);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const portfolioSymbols = holdings?.map((h) => h.stockSymbol) ?? [];
      const wishlistSymbols = wishlist?.map((w) => w.stockSymbol) ?? [];
      const symbols = [...new Set([...portfolioSymbols, ...wishlistSymbols])];
      if (symbols.length > 0) await refreshMutation.mutateAsync(symbols);
      await refetchHistory();
      setToastConfig({ type: "success", msg: "Data updated" });
    } catch (error: any) {
      console.error("Error refreshing dashboard:", error);
      setToastConfig({
        type: "error",
        msg: error?.message || "Could not refresh data",
      });
    } finally {
      setRefreshing(false);
    }
  }, [holdings, wishlist, refreshMutation, refetchHistory]);

  const displayName = getDisplayName();

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeLabel}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{displayName} 🫡</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            navigation.navigate("MainTabs", { screen: "Settings" })
          }
        >
          <Settings size={20} color={colors.textSecondary} />
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
  welcomeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  welcomeName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
