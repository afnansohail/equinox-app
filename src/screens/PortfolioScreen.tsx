import React, { useState, useCallback, useMemo } from "react";
import {
  FlatList,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
  Moon,
} from "lucide-react-native";
import { usePortfolio } from "../hooks/usePortfolio";
import { useRefreshStocks } from "../hooks/useStocks";
import StockLogo from "../components/shared/StockLogo";
import Toast from "../components/shared/Toast";
import SectorPieChart from "../components/charts/SectorPieChart";
import type { RootStackParamList, MainTabParamList } from "../navigation/types";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";
import type { PortfolioHolding } from "../services/api";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Portfolio">,
  NativeStackNavigationProp<RootStackParamList>
>;

// Memoized holding row component for FlatList performance
const HoldingRow = React.memo(function HoldingRow({
  holding,
  onPress,
}: {
  holding: PortfolioHolding;
  onPress: () => void;
}) {
  const marketPrice = holding.stock?.currentPrice ?? 0;
  const effectivePrice =
    marketPrice > 0 ? marketPrice : holding.averageBuyPrice;
  const currentValue = effectivePrice * holding.quantity;
  const gainLoss = currentValue - holding.totalInvested;
  const gainLossPct =
    holding.totalInvested > 0 ? (gainLoss / holding.totalInvested) * 100 : 0;
  const isUp = gainLoss >= 0;
  const prevClose = holding.stock?.previousClose ?? 0;
  const todayPnL =
    marketPrice - prevClose !== 0
      ? (marketPrice - prevClose) * holding.quantity
      : 0;
  const todayPct =
    prevClose > 0 ? ((marketPrice - prevClose) / prevClose) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.holdingRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <StockLogo
        logoUrl={holding.stock?.logoUrl}
        symbol={holding.stockSymbol}
        size={44}
      />

      <View style={styles.holdingMeta}>
        <View style={styles.holdingTop}>
          <Text style={styles.holdingSymbol}>{holding.stockSymbol}</Text>
          {holding.stock?.isShariahCompliant && (
            <View style={styles.shariahBadge}>
              <Moon size={12} color={colors.success} />
            </View>
          )}
        </View>
        {/* Two separate lines: quantity + market price (replaced avg price) */}
        <Text style={styles.holdingSubtitle} numberOfLines={1}>
          {holding.quantity} shares
        </Text>
        <Text style={styles.holdingSubtitle} numberOfLines={1}>
          {marketPrice > 0
            ? `PKR ${marketPrice.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`
            : "—"}
        </Text>
      </View>

      <View style={styles.holdingRight}>
        <Text style={styles.holdingValue}>
          PKR{" "}
          {currentValue.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
        </Text>
        <View
          style={[
            styles.gainChip,
            {
              backgroundColor: isUp
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)",
              marginTop: 8,
            },
          ]}
        >
          {isUp ? (
            <TrendingUp size={11} color="#22C55E" />
          ) : (
            <TrendingDown size={11} color={colors.danger} />
          )}
          <Text
            style={[
              styles.gainChipText,
              { color: isUp ? "#22C55E" : colors.danger },
            ]}
          >
            ALL {isUp ? "+" : ""}
            {gainLossPct.toFixed(2)}%
          </Text>
        </View>

        <View
          style={[
            styles.gainChip,
            {
              backgroundColor:
                todayPnL >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              marginTop: 6,
            },
          ]}
        >
          {todayPnL >= 0 ? (
            <TrendingUp size={11} color="#22C55E" />
          ) : (
            <TrendingDown size={11} color={colors.danger} />
          )}
          <Text
            style={[
              styles.gainChipText,
              { color: todayPnL >= 0 ? "#22C55E" : colors.danger },
            ]}
          >
            DAY {todayPnL >= 0 ? "+" : ""}
            {todayPct.toFixed(2)}%
          </Text>
        </View>
      </View>

      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
});

export default function PortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const { data: holdings, isLoading } = usePortfolio();
  const refreshMutation = useRefreshStocks();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [toastConfig, setToastConfig] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const symbols = (holdings ?? []).map((h) => h.stockSymbol);
      if (symbols.length > 0) {
        // refreshStockPrices scrapes live prices and onSuccess patches the
        // portfolio cache directly — no extra DB round-trip needed.
        await refreshMutation.mutateAsync(symbols);
      }
      setToastConfig({ type: "success", msg: "Portfolio updated" });
    } catch (error: any) {
      console.error("Error refreshing portfolio:", error);
      setToastConfig({
        type: "error",
        msg: error?.message || "Could not refresh portfolio",
      });
    } finally {
      setRefreshing(false);
    }
  }, [holdings, refreshMutation]);

  const totalValue =
    holdings?.reduce(
      (s, h) =>
        s +
        ((h.stock?.currentPrice ?? 0) > 0
          ? (h.stock?.currentPrice ?? 0)
          : h.averageBuyPrice) *
          h.quantity,
      0,
    ) ?? 0;
  const dayPnL = useMemo(
    () =>
      holdings?.reduce((s, h) => {
        const price = h.stock?.currentPrice ?? 0;
        const prev =
          h.stock?.previousClose && h.stock.previousClose > 0
            ? h.stock.previousClose
            : price;
        return s + (price - prev) * h.quantity;
      }, 0) ?? 0,
    [holdings],
  );

  const previousCloseValue = useMemo(
    () =>
      holdings?.reduce((s, h) => {
        const prev =
          h.stock?.previousClose && h.stock.previousClose > 0
            ? h.stock.previousClose
            : (h.stock?.currentPrice ?? 0);
        return s + prev * h.quantity;
      }, 0) ?? 0,
    [holdings],
  );
  const totalInvested = holdings?.reduce((s, h) => s + h.totalInvested, 0) ?? 0;
  const totalPnL = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPositive = totalPnL >= 0;
  const dayIsPositive = dayPnL >= 0;
  const dayPnLPct =
    previousCloseValue > 0 ? (dayPnL / previousCloseValue) * 100 : 0;

  const filteredHoldings = useMemo(
    () =>
      selectedSector
        ? (holdings ?? []).filter((h) => h.stock?.sector === selectedSector)
        : (holdings ?? []),
    [holdings, selectedSector],
  );

  const renderHolding: ListRenderItem<PortfolioHolding> = useCallback(
    ({ item }) => (
      <HoldingRow
        holding={item}
        onPress={() =>
          navigation.navigate("StockDetail", { symbol: item.stockSymbol })
        }
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item: PortfolioHolding) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <>
        {/* 2x2 summary grid: Today P&L | Total P&L  and Invested | Total Value */}
        <View style={styles.summaryGrid}>
          <View style={styles.gridRow}>
            <View
              style={[
                styles.summaryCard,
                styles.smallCard,
                {
                  borderColor: dayIsPositive
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(239,68,68,0.3)",
                },
              ]}
            >
              <Text style={styles.summaryLabel}>Today's P&L</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: dayIsPositive ? "#22C55E" : colors.danger },
                ]}
              >
                {dayIsPositive ? "+" : ""}PKR{" "}
                {Math.abs(dayPnL).toLocaleString("en-PK", {
                  maximumFractionDigits: 0,
                })}
              </Text>
              <Text
                style={[
                  styles.summarySub,
                  { color: dayIsPositive ? "#22C55E" : colors.danger },
                ]}
              >
                {dayIsPositive ? "+" : ""}
                {dayPnLPct.toFixed(2)}%
              </Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                styles.smallCard,
                {
                  borderColor: isPositive
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(239,68,68,0.3)",
                },
              ]}
            >
              <Text style={styles.summaryLabel}>Total P&L</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: isPositive ? "#22C55E" : colors.danger },
                ]}
              >
                {isPositive ? "+" : ""}PKR{" "}
                {Math.abs(totalPnL).toLocaleString("en-PK", {
                  maximumFractionDigits: 0,
                })}
              </Text>
              <Text
                style={[
                  styles.summarySub,
                  { color: isPositive ? "#22C55E" : colors.danger },
                ]}
              >
                {isPositive ? "+" : ""}
                {totalPnLPct.toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.summaryCard, styles.smallCardNoPad]}>
              <Text style={styles.summaryLabel}>Invested</Text>
              <Text style={styles.summaryValue}>
                PKR{" "}
                {totalInvested.toLocaleString("en-PK", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.smallCardNoPad]}>
              <Text style={styles.summaryLabel}>Total Value</Text>
              <Text style={styles.summaryValue}>
                PKR{" "}
                {totalValue.toLocaleString("en-PK", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Sector Allocation Chart */}
        {(holdings?.length ?? 0) > 0 && (
          <SectorPieChart
            holdings={holdings ?? []}
            selectedSector={selectedSector}
            onSectorPress={(sector) => setSelectedSector(sector)}
          />
        )}

        {/* Active sector filter chip */}
        {selectedSector && (
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setSelectedSector(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterChipText}>{selectedSector}</Text>
            <Text style={styles.filterChipClear}>✕</Text>
          </TouchableOpacity>
        )}

        {/* Holdings Section Title */}
        {holdings && holdings.length > 0 && (
          <Text style={styles.sectionTitle}>
            Holdings (
            {selectedSector ? filteredHoldings.length : holdings.length})
          </Text>
        )}
      </>
    ),
    [
      holdings,
      filteredHoldings,
      totalValue,
      totalPnL,
      totalPnLPct,
      totalInvested,
      isPositive,
      selectedSector,
    ],
  );

  const EmptyList = useMemo(
    () => (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No holdings yet</Text>
        <Text style={styles.emptySubtitle}>
          Add your first stock to start tracking
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate("MainTabs", { screen: "Search" })}
        >
          <Text style={styles.emptyBtnText}>Search Stocks →</Text>
        </TouchableOpacity>
      </View>
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfolio</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("AddTransaction", { type: "BUY" })}
        >
          <Plus size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredHoldings}
        renderItem={renderHolding}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyList}
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
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
      <Toast config={toastConfig} onClose={() => setToastConfig(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  totalValueCard: {
    flex: 0,
    marginBottom: 24,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(108,99,255,0.15)",
    borderColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.secondary,
  },
  filterChipClear: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  summarySub: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  // Holding row
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  letterAvatar: { justifyContent: "center", alignItems: "center" },
  letterAvatarText: { color: "#fff", fontWeight: "700", letterSpacing: 0.5 },
  stockLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
  },
  holdingMeta: { flex: 1, gap: 4 },
  holdingTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  holdingSymbol: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  shariahBadge: {
    backgroundColor: "rgba(34,197,94,0.15)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  shariahText: { fontSize: 10, color: "#22C55E", fontWeight: "700" },
  holdingSubtitle: { fontSize: 12, color: colors.textSecondary },
  holdingMktPrice: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  holdingRight: { alignItems: "flex-end", gap: 5 },
  holdingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  gainChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gainChipText: { fontSize: 11, fontWeight: "600" },
  // Empty state
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.secondary,
    borderRadius: 20,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textInverse,
  },
  summaryGrid: { gap: 12, marginBottom: 12 },
  gridRow: { flexDirection: "row", gap: 12 },
  smallCard: { flex: 1, paddingVertical: 12 },
  smallCardNoPad: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  holdingToday: { fontSize: 11, marginTop: 4 },
  holdingTotalPct: { fontSize: 12, fontWeight: "700", marginTop: 6 },
});
