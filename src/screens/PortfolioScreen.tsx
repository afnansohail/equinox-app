import React from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
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
} from "lucide-react-native";
import { usePortfolio } from "../hooks/usePortfolio";
import type { RootStackParamList, MainTabParamList } from "../navigation/types";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Portfolio">,
  NativeStackNavigationProp<RootStackParamList>
>;

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
      style={[
        styles.letterAvatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.letterAvatarText, { fontSize: size * 0.32 }]}>
        {text.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

export default function PortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const { data: holdings, isLoading } = usePortfolio();

  const totalValue =
    holdings?.reduce(
      (s, h) => s + (h.stock?.currentPrice ?? 0) * h.quantity,
      0,
    ) ?? 0;
  const totalInvested = holdings?.reduce((s, h) => s + h.totalInvested, 0) ?? 0;
  const totalPnL = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPositive = totalPnL >= 0;

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + 24 },
        ]}
      >
        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Value</Text>
            <Text style={styles.summaryValue}>
              PKR{" "}
              {totalValue.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
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

        {/* Holdings List */}
        {!holdings || holdings.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No holdings yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first stock to start tracking
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() =>
                navigation.navigate("MainTabs", { screen: "Search" })
              }
            >
              <Text style={styles.emptyBtnText}>Search Stocks →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              Holdings ({holdings.length})
            </Text>
            {holdings.map((h) => {
              const price = h.stock?.currentPrice ?? 0;
              const currentValue = price * h.quantity;
              const gainLoss = currentValue - h.totalInvested;
              const gainLossPct =
                h.totalInvested > 0 ? (gainLoss / h.totalInvested) * 100 : 0;
              const isUp = gainLoss >= 0;

              return (
                <TouchableOpacity
                  key={h.id}
                  style={styles.holdingRow}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate("StockDetail", {
                      symbol: h.stockSymbol,
                    })
                  }
                >
                  {h.stock?.logoUrl ? (
                    <Image
                      source={{ uri: h.stock.logoUrl }}
                      style={styles.stockLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <LetterAvatar text={h.stockSymbol} size={44} />
                  )}

                  <View style={styles.holdingMeta}>
                    <View style={styles.holdingTop}>
                      <Text style={styles.holdingSymbol}>{h.stockSymbol}</Text>
                      {h.stock?.isShariahCompliant && (
                        <View style={styles.shariahBadge}>
                          <Text style={styles.shariahText}>S</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.holdingSubtitle} numberOfLines={1}>
                      {h.quantity} shares · Avg PKR{" "}
                      {h.averageBuyPrice.toFixed(2)}
                    </Text>
                    <Text style={styles.holdingPrice} numberOfLines={1}>
                      Mkt{" "}
                      <Text
                        style={{ color: colors.textPrimary, fontWeight: "600" }}
                      >
                        PKR{" "}
                        {price > 0
                          ? price.toLocaleString("en-PK", {
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.holdingRight}>
                    <Text style={styles.holdingValue}>
                      PKR{" "}
                      {currentValue.toLocaleString("en-PK", {
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                    <View
                      style={[
                        styles.gainChip,
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
                          styles.gainChipText,
                          { color: isUp ? "#22C55E" : colors.danger },
                        ]}
                      >
                        {isUp ? "+" : ""}
                        {gainLossPct.toFixed(2)}%
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
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
  scroll: { paddingHorizontal: 20 },
  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
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
  holdingPrice: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
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
});
