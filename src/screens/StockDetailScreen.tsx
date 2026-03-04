import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Heart,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Moon,
} from "lucide-react-native";
import { useStock } from "../hooks/useStocks";
import { useIsInWishlist, useToggleWishlist } from "../hooks/useWishlist";
import { usePortfolio, useTransactions } from "../hooks/usePortfolio";
import { getStock } from "../services/api";
import StockLogo from "../components/shared/StockLogo";
import RangeBar from "../components/ui/RangeBar";
import type { RootStackParamList } from "../navigation/types";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";

type Route = RouteProp<RootStackParamList, "StockDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList, "StockDetail">;

function computeRealizedForSymbol(
  symbol: string,
  transactions: {
    id: string;
    stockSymbol: string;
    transactionType: "BUY" | "SELL";
    quantity: number;
    pricePerShare: number;
    transactionDate: string;
  }[],
) {
  let quantity = 0;
  let avgCost = 0;
  let realizedPnL = 0;
  let realizedCost = 0;

  const ordered = [...transactions]
    .filter((tx) => tx.stockSymbol === symbol)
    .sort(
      (a, b) =>
        a.transactionDate.localeCompare(b.transactionDate) ||
        a.id.localeCompare(b.id),
    );

  for (const tx of ordered) {
    if (tx.transactionType === "BUY") {
      const totalCostBefore = quantity * avgCost;
      const totalCostAfter = totalCostBefore + tx.quantity * tx.pricePerShare;
      quantity += tx.quantity;
      avgCost = quantity > 0 ? totalCostAfter / quantity : 0;
      continue;
    }

    const sellQty = Math.min(tx.quantity, quantity);
    if (sellQty > 0) {
      realizedPnL += (tx.pricePerShare - avgCost) * sellQty;
      realizedCost += avgCost * sellQty;
    }
    quantity = Math.max(quantity - tx.quantity, 0);
    if (quantity === 0) {
      avgCost = 0;
    }
  }

  return {
    realizedPnL,
    realizedPct: realizedCost > 0 ? (realizedPnL / realizedCost) * 100 : 0,
  };
}

export default function StockDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { symbol } = route.params;

  const { data: stock, isLoading, refetch } = useStock(symbol);
  const { data: isInWishlist } = useIsInWishlist(symbol);
  const toggleWishlistMutation = useToggleWishlist();
  const { data: holdings } = usePortfolio();
  const { data: transactions } = useTransactions();
  const holding = holdings?.find((h) => h.stockSymbol === symbol);
  const [refreshing, setRefreshing] = useState(false);

  const { realizedPnL, realizedPct } = useMemo(
    () => computeRealizedForSymbol(symbol, transactions ?? []),
    [symbol, transactions],
  );
  const hasSoldForSymbol = useMemo(
    () =>
      (transactions ?? []).some(
        (tx) => tx.stockSymbol === symbol && tx.transactionType === "SELL",
      ),
    [symbol, transactions],
  );
  const realizedPositive = realizedPnL >= 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Force a full scrape on Stock Detail refresh so logo/sector/shariah
      // can refresh too (not only price fields).
      await getStock(symbol, {
        forceScrape: true,
        preserveNonPriceFromDb: false,
      });
      await refetch();
    } catch (error: any) {
      console.error("Error refreshing stock:", error);
      Alert.alert(
        "Refresh Failed",
        error?.message || "Could not refresh stock data. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setRefreshing(false);
    }
  }, [symbol, refetch]);

  const handleToggleWishlist = () => {
    toggleWishlistMutation.mutate({
      symbol,
      isCurrentlyInWishlist: isInWishlist ?? false,
    });
  };

  const prevClose = stock?.previousClose ?? 0;
  const dayChange = stock ? stock.currentPrice - prevClose : 0;
  const dayChangePct = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;
  const isPositive = dayChange >= 0;

  const fmt = (n?: number) =>
    n != null && n > 0
      ? `PKR ${n.toLocaleString("en-PK", { maximumFractionDigits: 2 })}`
      : "—";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {stock?.name ?? symbol}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleToggleWishlist}
            disabled={toggleWishlistMutation.isPending}
          >
            <Heart
              size={20}
              color={isInWishlist ? colors.danger : colors.textSecondary}
              fill={isInWishlist ? colors.danger : "transparent"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={20}
              color={refreshing ? colors.textMuted : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.secondary} size="large" />
          <Text style={styles.loadingText}>Loading {symbol}...</Text>
        </View>
      ) : !stock ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>Could not load stock data.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: TAB_BAR_HEIGHT + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.secondary}
            />
          }
        >
          {/* Stock Identity */}
          <View style={styles.identityRow}>
            <StockLogo logoUrl={stock.logoUrl} symbol={symbol} size={56} />
            <View style={styles.identityMeta}>
              <Text style={styles.identitySymbol}>{symbol}</Text>
              <Text style={styles.identityName} numberOfLines={2}>
                {stock.name}
              </Text>
            </View>
            {stock.isShariahCompliant && (
              <View style={styles.shariahBadge}>
                <Moon size={12} color="#22C55E" />
                <Text style={styles.shariahText}>Shariah</Text>
              </View>
            )}
          </View>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={styles.priceValue}>
              PKR{" "}
              {stock.currentPrice.toLocaleString("en-PK", {
                maximumFractionDigits: 2,
              })}
            </Text>
            <View
              style={[
                styles.changeChip,
                {
                  backgroundColor: isPositive
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(239,68,68,0.15)",
                },
              ]}
            >
              {isPositive ? (
                <TrendingUp size={14} color="#22C55E" />
              ) : (
                <TrendingDown size={14} color={colors.danger} />
              )}
              <Text
                style={[
                  styles.changeChipText,
                  { color: isPositive ? "#22C55E" : colors.danger },
                ]}
              >
                {isPositive ? "+" : ""}
                {dayChange.toFixed(2)} ({isPositive ? "+" : ""}
                {dayChangePct.toFixed(2)}%) Today
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>Key Statistics</Text>
            <View style={styles.statRangeRow}>
              <RangeBar
                label="Day Range"
                low={stock.low}
                high={stock.high}
                value={stock.currentPrice}
              />
            </View>
            <View style={styles.statRangeRow}>
              <RangeBar
                label="52-Week Range"
                low={stock.low52Week}
                high={stock.high52Week}
                value={stock.currentPrice}
              />
            </View>
            {[
              [
                { label: "Sector", value: stock.sector ?? "—" },
                { label: "Previous Close", value: fmt(stock.previousClose) },
              ],
            ].map((row, ri) => (
              <View key={ri} style={styles.statRow}>
                {row.map((stat) => (
                  <View key={stat.label} style={styles.statBox}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          {/* Your Position */}
          {holding &&
            (() => {
              const currentValue = stock.currentPrice * holding.quantity;
              const invested = holding.totalInvested;
              const unrealizedPnL = currentValue - invested;
              const unrealizedPct =
                invested > 0 ? (unrealizedPnL / invested) * 100 : 0;
              const posPositive = unrealizedPnL >= 0;
              const todayPnL =
                (stock.currentPrice - (stock.previousClose ?? 0)) *
                holding.quantity;
              const todayPct =
                stock.previousClose && stock.previousClose > 0
                  ? ((stock.currentPrice - stock.previousClose) /
                      stock.previousClose) *
                    100
                  : 0;
              const todayPositive = todayPnL >= 0;
              return (
                <View style={[styles.statsCard, { marginTop: 12 }]}>
                  <Text style={styles.statsCardTitle}>Your Position</Text>
                  {/* Row 1: Shares held | Current value */}
                  <View style={styles.statRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Shares held</Text>
                      <Text style={styles.statValue}>{holding.quantity}</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Current value</Text>
                      <Text style={styles.statValue}>
                        PKR{" "}
                        {currentValue.toLocaleString("en-PK", {
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                    </View>
                  </View>
                  {/* Row 2: Today P/L | Unrealized P/L */}
                  <View style={styles.statRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Today's P/L</Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: todayPositive ? "#22C55E" : colors.danger },
                        ]}
                      >
                        {todayPositive ? "+" : ""}
                        {todayPnL.toLocaleString("en-PK", {
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                      <View
                        style={[
                          styles.percentagePill,
                          {
                            backgroundColor: todayPositive
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(239,68,68,0.12)",
                          },
                        ]}
                      >
                        {todayPositive ? (
                          <TrendingUp size={11} color="#22C55E" />
                        ) : (
                          <TrendingDown size={11} color={colors.danger} />
                        )}
                        <Text
                          style={[
                            styles.percentagePillText,
                            {
                              color: todayPositive ? "#22C55E" : colors.danger,
                            },
                          ]}
                        >
                          {todayPositive ? "+" : ""}
                          {todayPct.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Unrealized P/L</Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: posPositive ? "#22C55E" : colors.danger },
                        ]}
                      >
                        {posPositive ? "+" : ""}
                        {unrealizedPnL.toLocaleString("en-PK", {
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                      <View
                        style={[
                          styles.percentagePill,
                          {
                            backgroundColor: posPositive
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(239,68,68,0.12)",
                          },
                        ]}
                      >
                        {posPositive ? (
                          <TrendingUp size={11} color="#22C55E" />
                        ) : (
                          <TrendingDown size={11} color={colors.danger} />
                        )}
                        <Text
                          style={[
                            styles.percentagePillText,
                            { color: posPositive ? "#22C55E" : colors.danger },
                          ]}
                        >
                          {posPositive ? "+" : ""}
                          {unrealizedPct.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                  {/* Row 3: Avg buy price | Total invested */}
                  <View style={styles.statRow}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Avg buy price</Text>
                      <Text style={styles.statValue}>
                        PKR{" "}
                        {holding.averageBuyPrice.toLocaleString("en-PK", {
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Total invested</Text>
                      <Text style={styles.statValue}>
                        PKR{" "}
                        {invested.toLocaleString("en-PK", {
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                    </View>
                  </View>
                  {/* Row 4 (optional): Realized P&L */}
                  {hasSoldForSymbol && (
                    <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Realized P&L</Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Text
                            style={[
                              styles.statValue,
                              {
                                color: realizedPositive
                                  ? "#22C55E"
                                  : colors.danger,
                              },
                            ]}
                          >
                            {realizedPositive ? "+" : ""}
                            {realizedPnL.toLocaleString("en-PK", {
                              maximumFractionDigits: 0,
                            })}
                          </Text>
                          <View
                            style={[
                              styles.percentagePill,
                              {
                                backgroundColor: realizedPositive
                                  ? "rgba(34,197,94,0.12)"
                                  : "rgba(239,68,68,0.12)",
                              },
                            ]}
                          >
                            {realizedPositive ? (
                              <TrendingUp size={11} color="#22C55E" />
                            ) : (
                              <TrendingDown size={11} color={colors.danger} />
                            )}
                            <Text
                              style={[
                                styles.percentagePillText,
                                {
                                  color: realizedPositive
                                    ? "#22C55E"
                                    : colors.danger,
                                },
                              ]}
                            >
                              {realizedPositive ? "+" : ""}
                              {realizedPct.toFixed(2)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.statBox} />
                    </View>
                  )}
                </View>
              );
            })()}
        </ScrollView>
      )}

      {/* Buy / Sell Buttons — pinned above tab bar */}
      {stock && (
        <View
          style={[
            styles.actionBar,
            { bottom: TAB_BAR_HEIGHT + (Platform.OS === "ios" ? 0 : 8) },
          ]}
        >
          <TouchableOpacity
            style={styles.sellBtn}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("AddTransaction", {
                symbol,
                currentPrice: stock.currentPrice,
                type: "SELL",
              })
            }
          >
            <Text style={styles.sellBtnText}>Sell</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyBtn}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("AddTransaction", {
                symbol,
                currentPrice: stock.currentPrice,
                type: "BUY",
              })
            }
          >
            <Text style={styles.buyBtnText}>Buy</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerRight: { flexDirection: "row", gap: 6 },
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
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  errorText: { fontSize: 15, color: colors.textSecondary },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.secondary,
    borderRadius: 20,
  },
  retryText: { fontSize: 14, fontWeight: "700", color: colors.textInverse },
  scroll: { paddingHorizontal: 20, paddingTop: 12 },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  stockLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.card,
  },
  identityMeta: { flex: 1, gap: 4 },
  identitySymbol: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  identityName: { fontSize: 14, color: colors.textSecondary },
  shariahBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shariahText: { fontSize: 11, color: "#22C55E", fontWeight: "600" },
  priceSection: { marginBottom: 24, gap: 10 },
  priceValue: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  changeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeChipText: { fontSize: 13, fontWeight: "600" },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 0,
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statRangeRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 4,
  },
  statBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 4,
  },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  percentagePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  percentagePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Action bar
  actionBar: {
    position: "absolute",
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  sellBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  sellBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  buyBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  buyBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textInverse,
  },
});
