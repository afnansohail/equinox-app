import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Search,
  AlertCircle,
  Heart,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { getStock } from "../services/api";
import { useWishlist } from "../hooks/useWishlist";
import StockLogo from "../components/shared/StockLogo";
import type { RootStackParamList } from "../navigation/types";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchState = "idle" | "loading" | "not_found" | "error";

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const { data: wishlistItems, isLoading: wishlistLoading } = useWishlist();

  const isSearching = query.trim().length > 0;

  const handleSearch = async () => {
    const symbol = query.trim().toUpperCase();
    if (!symbol) return;
    setState("loading");
    try {
      const stock = await getStock(symbol);
      if (stock) {
        setState("idle");
        navigation.navigate("StockDetail", { symbol: stock.symbol });
      } else {
        setState("not_found");
      }
    } catch {
      setState("error");
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (state !== "idle") setState("idle");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Fixed top: title + search row */}
      <View style={styles.topSection}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              (state === "not_found" || state === "error") && styles.inputError,
            ]}
            placeholder="Enter PSX symbol…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleChangeText}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            editable={state !== "loading"}
          />
          <TouchableOpacity
            style={[
              styles.searchBtn,
              (state === "loading" || query.trim().length === 0) &&
                styles.searchBtnDisabled,
            ]}
            onPress={handleSearch}
            activeOpacity={0.8}
            disabled={state === "loading" || query.trim().length === 0}
          >
            {state === "loading" ? (
              <ActivityIndicator color={colors.secondary} size="small" />
            ) : (
              <Search size={20} color={colors.secondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Inline feedback */}
        {state === "not_found" && (
          <View style={styles.feedback}>
            <AlertCircle size={15} color={colors.danger} />
            <Text style={styles.feedbackText}>
              No stock found for &ldquo;{query.trim().toUpperCase()}&rdquo;
            </Text>
          </View>
        )}
        {state === "error" && (
          <View style={styles.feedback}>
            <AlertCircle size={15} color={colors.danger} />
            <Text style={styles.feedbackText}>
              Network error — check your connection
            </Text>
          </View>
        )}
        {state === "loading" && (
          <Text style={styles.loadingHint}>
            Looking up {query.trim().toUpperCase()}…
          </Text>
        )}
      </View>

      {/* Watchlist — shown when not actively searching */}
      {!isSearching && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: TAB_BAR_HEIGHT + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sectionHeader}>
            <Heart size={15} color={colors.secondary} fill={colors.secondary} />
            <Text style={styles.sectionTitle}>Watchlist</Text>
          </View>

          {wishlistLoading ? (
            <ActivityIndicator
              color={colors.secondary}
              style={{ marginTop: 32 }}
            />
          ) : !wishlistItems || wishlistItems.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the <Text style={{ color: colors.danger }}>♥</Text> on any
                stock detail page to add it here
              </Text>
            </View>
          ) : (
            wishlistItems.map((item) => {
              const stock = item.stock;
              if (!stock) return null;
              const changePct = stock.changePercent ?? 0;
              const isUp = changePct >= 0;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.stockRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("StockDetail", {
                      symbol: stock.symbol,
                    })
                  }
                >
                  <StockLogo
                    logoUrl={stock.logoUrl}
                    symbol={stock.symbol}
                    size={44}
                  />
                  <View style={styles.stockMeta}>
                    <Text style={styles.stockSymbol}>{stock.symbol}</Text>
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
                      {isUp ? (
                        <TrendingUp size={11} color="#22C55E" />
                      ) : (
                        <TrendingDown size={11} color={colors.danger} />
                      )}
                      <Text
                        style={[
                          styles.changeText,
                          { color: isUp ? "#22C55E" : colors.danger },
                        ]}
                      >
                        {isUp ? "+" : ""}
                        {changePct.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "stretch",
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
  },
  searchBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnDisabled: { opacity: 0.4 },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: colors.danger,
  },
  loadingHint: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 4,
  },
  // Watchlist list
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptyWrap: {
    paddingTop: 48,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
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
  stockMeta: { flex: 1, gap: 3 },
  stockSymbol: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  stockName: { fontSize: 12, color: colors.textSecondary },
  stockRight: { alignItems: "flex-end", gap: 4 },
  stockPrice: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  changeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  changeText: { fontSize: 11, fontWeight: "600" },
});
