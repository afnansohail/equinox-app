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
import { Plus } from "lucide-react-native";

import { HoldingRow } from "../components/portfolio/HoldingRow";
import { SummaryGrid } from "../components/portfolio/SummaryGrid";
import { RealizedHistory } from "../components/portfolio/RealizedHistory";
import SectorPieChart from "../components/charts/SectorPieChart";
import Toast from "../components/shared/Toast";

import { usePortfolioData } from "../hooks/usePortfolioData";
import { useRefreshStocks } from "../hooks/useStocks";
import type { RootStackParamList, MainTabParamList } from "../navigation/types";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";
import type { PortfolioHolding } from "../services/api";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Portfolio">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function PortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const {
    holdings,
    filteredHoldings,
    soldTransactions,
    txPnL,
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPct,
    isPositive,
    dayPnL,
    dayPnLPct,
    dayIsPositive,
    totalRealizedPnL,
    totalRealizedCost,
    totalRealizedPct,
    realizedIsPositive,
  } = usePortfolioData(selectedSector);

  const refreshMutation = useRefreshStocks();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const symbols = (holdings ?? []).map((h) => h.stockSymbol);
      if (symbols.length > 0) {
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
        <SummaryGrid
          dayPnL={dayPnL}
          dayPnLPct={dayPnLPct}
          dayIsPositive={dayIsPositive}
          totalPnL={totalPnL}
          totalPnLPct={totalPnLPct}
          isPositive={isPositive}
          totalInvested={totalInvested}
          totalValue={totalValue}
        />

        {(holdings?.length ?? 0) > 0 && (
          <SectorPieChart
            holdings={holdings ?? []}
            selectedSector={selectedSector}
            onSectorPress={(sector) => setSelectedSector(sector)}
          />
        )}

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

        {holdings && holdings.length > 0 && (
          <Text style={styles.sectionTitle}>
            Holdings ({selectedSector ? filteredHoldings.length : holdings.length})
          </Text>
        )}
      </>
    ),
    [
      holdings,
      filteredHoldings,
      dayIsPositive,
      dayPnL,
      dayPnLPct,
      totalValue,
      totalPnL,
      totalPnLPct,
      totalInvested,
      isPositive,
      selectedSector,
    ],
  );

  const ListFooter = useMemo(
    () => (
      <RealizedHistory
        transactions={soldTransactions}
        txPnL={txPnL}
        totalRealizedPnL={totalRealizedPnL}
        totalRealizedCost={totalRealizedCost}
        totalRealizedPct={totalRealizedPct}
        realizedIsPositive={realizedIsPositive}
      />
    ),
    [
      soldTransactions,
      txPnL,
      totalRealizedPnL,
      totalRealizedCost,
      totalRealizedPct,
      realizedIsPositive,
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
        ListFooterComponent={ListFooter}
        ListEmptyComponent={EmptyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + 48 },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
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
});
