import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Search, TrendingUp } from "lucide-react-native";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/shared/EmptyState";
import {
  useAllStocks,
  useStockSearch,
  usePsxSymbolSearch,
} from "../hooks/useStocks";
import { useWishlist } from "../hooks/useWishlist";
import type { RootStackParamList } from "../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors, theme, borderRadius, fonts } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabType = "all" | "wishlist";

export default function MarketsScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const { data: allStocks } = useAllStocks();
  const { data: searchedStocks } = useStockSearch(query.trim());
  const { data: psxSymbols, isLoading: psxSearching } = usePsxSymbolSearch(
    query.trim(),
  );
  const { data: wishlistItems } = useWishlist();

  const wishlistStocks =
    wishlistItems?.map((item) => item.stock).filter(Boolean) ?? [];

  // Get symbols already in local DB to avoid duplicates
  const localSymbols = new Set([
    ...(searchedStocks?.map((s) => s.symbol) ?? []),
    ...(allStocks?.map((s) => s.symbol) ?? []),
  ]);

  // PSX symbols not in local DB
  const additionalPsxSymbols =
    psxSymbols?.filter((s) => !localSymbols.has(s.symbol)) ?? [];

  const getDisplayStocks = () => {
    if (activeTab === "wishlist") {
      if (query.trim()) {
        return wishlistStocks.filter(
          (stock) =>
            stock?.symbol.toLowerCase().includes(query.toLowerCase()) ||
            stock?.name.toLowerCase().includes(query.toLowerCase()),
        );
      }
      return wishlistStocks;
    }
    return query.trim() ? (searchedStocks ?? []) : (allStocks ?? []);
  };

  const stocks = getDisplayStocks();

  return (
    <SafeAreaView style={theme.screen} edges={["top"]}>
      <View style={[theme.screenPadding, { paddingTop: 24, paddingBottom: 8 }]}>
        <Text style={[theme.title, { marginBottom: 16 }]}>Markets</Text>
        <View style={styles.searchRow}>
          <Search color={colors.icon} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks by symbol or name"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
          />
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab("all")}
            style={[styles.tab, activeTab === "all" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.tabTextActive,
              ]}
            >
              All Stocks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("wishlist")}
            style={[styles.tab, activeTab === "wishlist" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "wishlist" && styles.tabTextActive,
              ]}
            >
              Wishlist
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={theme.screen}
        contentContainerStyle={theme.screenPadding}
      >
        {stocks.map(
          (stock) =>
            stock && (
              <TouchableOpacity
                key={stock.symbol}
                onPress={() =>
                  navigation.navigate("StockDetail", { symbol: stock.symbol })
                }
              >
                <Card style={{ marginBottom: 12 }}>
                  <View style={theme.rowBetween}>
                    <View style={[theme.row, { flex: 1, marginRight: 12 }]}>
                      {stock.logoUrl && (
                        <Image
                          source={{ uri: stock.logoUrl }}
                          style={styles.stockLogo}
                          resizeMode="contain"
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={theme.row}>
                          <Text style={[theme.value, { fontSize: 18 }]}>
                            {stock.symbol}
                          </Text>
                          {stock.isShariahCompliant && (
                            <View style={styles.shariahBadge}>
                              <Text style={styles.shariahText}>S</Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={theme.textMuted}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {stock.name}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      {stock.currentPrice > 0 ? (
                        <>
                          <Text style={theme.valueSmall}>
                            PKR {stock.currentPrice.toFixed(2)}
                          </Text>
                          <Badge value={stock.changePercent} />
                        </>
                      ) : (
                        <Text style={[theme.textMuted, { fontSize: 12 }]}>
                          Tap to load
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ),
        )}

        {/* Additional PSX symbols (not in local DB) */}
        {activeTab === "all" &&
          query.trim().length >= 2 &&
          additionalPsxSymbols.length > 0 && (
            <>
              <View style={styles.psxHeader}>
                <TrendingUp color={colors.icon} size={16} />
                <Text style={styles.psxHeaderText}>
                  More from PSX ({additionalPsxSymbols.length})
                </Text>
              </View>
              {additionalPsxSymbols.map((psxStock) => (
                <TouchableOpacity
                  key={psxStock.symbol}
                  onPress={() =>
                    navigation.navigate("StockDetail", {
                      symbol: psxStock.symbol,
                    })
                  }
                >
                  <Card style={{ marginBottom: 12 }}>
                    <View style={theme.rowBetween}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[theme.value, { fontSize: 18 }]}>
                          {psxStock.symbol}
                        </Text>
                        <Text
                          style={theme.textMuted}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {psxStock.name}
                        </Text>
                        <Text
                          style={[
                            theme.textMuted,
                            { fontSize: 10, marginTop: 2 },
                          ]}
                        >
                          {psxStock.sector}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[theme.textMuted, { fontSize: 12 }]}>
                          Tap to load
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </>
          )}

        {/* Loading indicator for PSX search */}
        {activeTab === "all" && query.trim().length >= 2 && psxSearching && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[theme.textMuted, { marginLeft: 8 }]}>
              Searching all PSX stocks...
            </Text>
          </View>
        )}

        {stocks.length === 0 &&
          additionalPsxSymbols.length === 0 &&
          activeTab === "wishlist" && (
            <EmptyState message="Your wishlist is empty. Add stocks from the All Stocks tab." />
          )}
        {stocks.length === 0 &&
          additionalPsxSymbols.length === 0 &&
          activeTab === "all" &&
          !psxSearching && (
            <EmptyState
              message={
                query.trim().length >= 2
                  ? "No stocks found matching your search."
                  : "Type at least 2 characters to search all PSX stocks."
              }
            />
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textPrimary,
    paddingVertical: 4,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabText: {
    textAlign: "center",
    fontFamily: fonts.sans.semibold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  psxHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  psxHeaderText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
    color: colors.textSecondary,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  stockLogo: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    marginRight: 10,
    backgroundColor: colors.glass,
  },
  shariahBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.successMuted,
  },
  shariahText: {
    fontSize: 9,
    fontFamily: fonts.sans.bold,
    color: colors.success,
  },
});
