import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, X, TrendingUp, TrendingDown } from "lucide-react-native";
import { useAllStocks, useStockSearch } from "../hooks/useStocks";
import { useWishlist } from "../hooks/useWishlist";
import type { RootStackParamList } from "../navigation/types";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TabType = "all" | "watchlist";

const AVATAR_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
];

function LetterAvatar({ text, size = 44 }: { text: string; size?: number }) {
  const color = AVATAR_COLORS[text.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#fff", fontSize: size * 0.32, fontWeight: "700" }}>
        {text.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

export default function MarketsScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const { data: allStocks, isLoading: allLoading } = useAllStocks();
  const { data: searchResults, isLoading: searchLoading } = useStockSearch(
    query.trim().length >= 1 ? query.trim() : "",
  );
  const { data: wishlistItems } = useWishlist();

  const wishlistStocks =
    wishlistItems?.map((item) => item.stock).filter(Boolean) ?? [];

  const getDisplayStocks = () => {
    if (activeTab === "watchlist") {
      if (query.trim()) {
        return wishlistStocks.filter(
          (s) =>
            s?.symbol.toLowerCase().includes(query.toLowerCase()) ||
            s?.name.toLowerCase().includes(query.toLowerCase()),
        );
      }
      return wishlistStocks;
    }
    return query.trim().length >= 1 ? (searchResults ?? []) : (allStocks ?? []);
  };

  const stocks = getDisplayStocks();
  const isLoading =
    activeTab === "all" &&
    (query.trim().length >= 1 ? searchLoading : allLoading);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topSection}>
        <Text style={styles.title}>Markets</Text>

        <View style={styles.searchBar}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="characters"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabRow}>
          {(["all", "watchlist"] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === "all" ? "All Stocks" : "Watchlist"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.secondary} />
          </View>
        ) : stocks.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {activeTab === "watchlist"
                ? "No watchlist items yet"
                : query
                  ? `No results for "${query}"`
                  : "No stocks available"}
            </Text>
          </View>
        ) : (
          stocks.map((stock) => {
            if (!stock) return null;
            const isUp = (stock.changePercent ?? 0) >= 0;
            return (
              <TouchableOpacity
                key={stock.symbol}
                style={styles.stockRow}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("StockDetail", { symbol: stock.symbol })
                }
              >
                {stock.logoUrl ? (
                  <Image
                    source={{ uri: stock.logoUrl }}
                    style={styles.stockLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <LetterAvatar text={stock.symbol} size={44} />
                )}
                <View style={styles.stockMeta}>
                  <View style={styles.stockTopRow}>
                    <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                    {stock.isShariahCompliant && (
                      <View style={styles.shariahBadge}>
                        <Text style={styles.shariahText}>S</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.stockName} numberOfLines={1}>
                    {stock.name}
                  </Text>
                </View>
                <View style={styles.stockRight}>
                  <Text style={styles.stockPrice}>
                    PKR{" "}
                    {stock.currentPrice.toLocaleString("en-PK", {
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <View
                    style={[
                      styles.changeChip,
                      {
                        backgroundColor: isUp
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(239,68,68,0.12)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.changeText,
                        { color: isUp ? "#22C55E" : colors.danger },
                      ]}
                    >
                      {isUp ? "+" : ""}
                      {(stock.changePercent ?? 0).toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    gap: 10,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    height: "100%",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.textPrimary,
    borderColor: "transparent",
  },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse },
  scroll: { paddingHorizontal: 20 },
  centered: { paddingTop: 60, alignItems: "center" },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  stockLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
  },
  stockMeta: { flex: 1, gap: 4 },
  stockTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stockSymbol: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  shariahBadge: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  shariahText: { fontSize: 10, color: "#22C55E", fontWeight: "700" },
  stockName: { fontSize: 12, color: colors.textSecondary },
  stockRight: { alignItems: "flex-end", gap: 5 },
  stockPrice: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  changeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  changeText: { fontSize: 12, fontWeight: "600" },
});
