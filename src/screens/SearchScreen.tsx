import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react-native";
import { Badge } from "../components/ui/Badge";
import { useStock, useRefreshStocks } from "../hooks/useStocks";
import type { RootStackParamList, MainTabParamList } from "../navigation/types";
import { colors, theme, spacing, borderRadius } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<MainTabParamList, "Search">;

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const initialSymbol = route.params?.symbol;

  const [searchQuery, setSearchQuery] = useState(initialSymbol ?? "");
  const [searchedSymbol, setSearchedSymbol] = useState<string | null>(
    initialSymbol ?? null,
  );
  const refreshMutation = useRefreshStocks();

  // Auto-search when symbol is passed from navigation
  useEffect(() => {
    if (initialSymbol) {
      setSearchQuery(initialSymbol);
      setSearchedSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  const {
    data: stock,
    isLoading,
    refetch,
    isError,
  } = useStock(searchedSymbol ?? "");

  const handleSearch = () => {
    const symbol = searchQuery.trim().toUpperCase();
    if (symbol) {
      setSearchedSymbol(symbol);
    }
  };

  const handleRefresh = async () => {
    if (searchedSymbol) {
      await refreshMutation.mutateAsync([searchedSymbol]);
      await refetch();
    }
  };

  const handleBuy = () => {
    if (searchedSymbol && stock) {
      navigation.navigate("AddTransaction", {
        symbol: searchedSymbol,
        currentPrice: stock.currentPrice,
        type: "BUY",
      });
    }
  };

  const handleSell = () => {
    if (searchedSymbol && stock) {
      navigation.navigate("AddTransaction", {
        symbol: searchedSymbol,
        currentPrice: stock.currentPrice,
        type: "SELL",
      });
    }
  };

  const dayChange = stock ? stock.currentPrice - stock.previousClose : 0;

  return (
    <SafeAreaView style={theme.screen} edges={["top"]}>
      <LinearGradient
        colors={["rgba(41, 255, 232, 0.03)", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
      />
      <ScrollView
        style={theme.screen}
        contentContainerStyle={[
          theme.screenPadding,
          { paddingBottom: spacing.xxl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshMutation.isPending}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={theme.titleSection}>
          <Text style={theme.title}>Search</Text>
          <Text style={theme.subtitle}>Find PSX stocks by symbol</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Search color={colors.textMuted} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter stock symbol (e.g., OGDC)"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.searchBtn,
              !searchQuery.trim() && styles.searchBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleSearch}
            disabled={!searchQuery.trim()}
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </View>

        {/* Loading State */}
        {isLoading && searchedSymbol && (
          <View style={styles.card}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loadingText}>
                Fetching data for {searchedSymbol}...
              </Text>
            </View>
          </View>
        )}

        {/* Error State */}
        {isError && searchedSymbol && !isLoading && (
          <View style={styles.card}>
            <View style={styles.errorContainer}>
              <View style={styles.errorIcon}>
                <Search color={colors.danger} size={24} />
              </View>
              <Text style={styles.errorTitle}>Stock Not Found</Text>
              <Text style={styles.errorText}>
                Could not find data for "{searchedSymbol}". Please check the
                symbol and try again.
              </Text>
            </View>
          </View>
        )}

        {/* Stock Data */}
        {stock && !isLoading && (
          <>
            {/* Main Stock Card */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={
                  dayChange >= 0
                    ? ["rgba(16, 185, 129, 0.1)", "transparent"]
                    : ["rgba(239, 68, 68, 0.1)", "transparent"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.card}>
                <View style={[theme.rowBetween, { marginBottom: spacing.md }]}>
                  <View style={[theme.row, { flex: 1 }]}>
                    {stock.logoUrl && (
                      <Image
                        source={{ uri: stock.logoUrl }}
                        style={styles.logo}
                        resizeMode="contain"
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stockName} numberOfLines={1}>
                        {stock.name}
                      </Text>
                      <View style={theme.row}>
                        <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                        {stock.isShariahCompliant && (
                          <View style={styles.shariahBadge}>
                            <Text style={styles.shariahText}>Shariah</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={handleRefresh}
                    disabled={refreshMutation.isPending}
                    style={({ pressed }) => [
                      styles.refreshBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <RefreshCw
                      color={colors.textMuted}
                      size={18}
                      style={
                        refreshMutation.isPending ? { opacity: 0.5 } : undefined
                      }
                    />
                  </Pressable>
                </View>

                {/* Price */}
                <Text style={styles.priceLarge}>
                  <Text style={styles.currencyPrefix}>PKR </Text>
                  {stock.currentPrice.toFixed(2)}
                </Text>

                <View
                  style={[
                    theme.row,
                    { marginTop: spacing.sm, gap: spacing.sm },
                  ]}
                >
                  <View
                    style={[
                      styles.changeBadge,
                      dayChange >= 0
                        ? styles.changeBadgePositive
                        : styles.changeBadgeNegative,
                    ]}
                  >
                    {dayChange >= 0 ? (
                      <ArrowUp color={colors.success} size={14} />
                    ) : (
                      <ArrowDown color={colors.danger} size={14} />
                    )}
                    <Text
                      style={[
                        styles.changeText,
                        dayChange >= 0
                          ? { color: colors.success }
                          : { color: colors.danger },
                      ]}
                    >
                      {dayChange >= 0 ? "+" : ""}
                      {dayChange.toFixed(2)} (
                      {stock.changePercent >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%)
                    </Text>
                  </View>
                  {stock.lastUpdated && (
                    <Text style={styles.updateTime}>
                      {new Date(stock.lastUpdated).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Buy/Sell Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.buyBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleBuy}
              >
                <TrendingUp color="#fff" size={18} />
                <Text style={styles.actionBtnText}>Buy</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.sellBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={handleSell}
              >
                <TrendingDown color="#fff" size={18} />
                <Text style={styles.actionBtnText}>Sell</Text>
              </Pressable>
            </View>

            {/* Key Statistics */}
            <View style={[styles.card, { marginTop: spacing.lg }]}>
              <Text style={styles.sectionLabel}>KEY STATISTICS</Text>
              <View style={styles.statsGrid}>
                <StatItem
                  label="Previous Close"
                  value={`PKR ${stock.previousClose.toFixed(2)}`}
                />
                {stock.volume > 0 && (
                  <StatItem
                    label="Volume"
                    value={stock.volume.toLocaleString("en-PK")}
                  />
                )}
                {stock.open && (
                  <StatItem
                    label="Open"
                    value={`PKR ${stock.open.toFixed(2)}`}
                  />
                )}
                {stock.high && (
                  <StatItem
                    label="Day High"
                    value={`PKR ${stock.high.toFixed(2)}`}
                  />
                )}
                {stock.low && (
                  <StatItem
                    label="Day Low"
                    value={`PKR ${stock.low.toFixed(2)}`}
                  />
                )}
                {stock.marketCap && (
                  <StatItem
                    label="Market Cap"
                    value={`PKR ${(stock.marketCap / 1000000).toFixed(1)}M`}
                  />
                )}
                {stock.high52Week && (
                  <StatItem
                    label="52W High"
                    value={`PKR ${stock.high52Week.toFixed(2)}`}
                  />
                )}
                {stock.low52Week && (
                  <StatItem
                    label="52W Low"
                    value={`PKR ${stock.low52Week.toFixed(2)}`}
                  />
                )}
              </View>
              {stock.sector && (
                <View style={styles.sectorRow}>
                  <Text style={styles.sectorLabel}>Sector</Text>
                  <Text style={styles.sectorValue}>{stock.sector}</Text>
                </View>
              )}
            </View>

            {stock.source && (
              <Text style={styles.sourceText}>Data source: {stock.source}</Text>
            )}
          </>
        )}

        {/* Empty State */}
        {!searchedSymbol && (
          <View style={[styles.card, styles.emptyCard]}>
            <View style={styles.emptyIconContainer}>
              <Search color={colors.primary} size={28} />
            </View>
            <Text style={styles.emptyTitle}>Search for a Stock</Text>
            <Text style={styles.emptyText}>
              Enter a PSX stock symbol above to view its details and add it to
              your portfolio.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 48,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
  },
  searchBtnDisabled: {
    opacity: 0.4,
  },
  searchBtnText: {
    color: colors.textInverse,
    fontWeight: "700",
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  cardWrapper: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    marginTop: spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dangerMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    backgroundColor: colors.backgroundSecondary,
  },
  stockName: {
    fontSize: 13,
    color: colors.textMuted,
  },
  stockSymbol: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  shariahBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.successMuted,
  },
  shariahText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceLarge: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  changeBadgePositive: {
    backgroundColor: colors.successMuted,
  },
  changeBadgeNegative: {
    backgroundColor: colors.dangerMuted,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  updateTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  buyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  sellBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  statItem: {
    width: "50%",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sectorRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  sectorLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
    marginBottom: 2,
  },
  sectorValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sourceText: {
    marginTop: spacing.lg,
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
  },
});
