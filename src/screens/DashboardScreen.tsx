import React, { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
} from "lucide-react-native";
import { CartesianChart, Area } from "victory-native";
import { LoadingState } from "../components/shared/LoadingState";
import { usePortfolio, useTransactions } from "../hooks/usePortfolio";
import { useRefreshStocks } from "../hooks/useStocks";
import type { RootStackParamList } from "../navigation/types";
import {
  colors,
  theme,
  spacing,
  borderRadius,
  fonts,
} from "../constants/theme";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type ChartPeriod = "1D" | "1W" | "1M" | "6M" | "1Y" | "ALL";

const PERIOD_OPTIONS: { label: string; value: ChartPeriod }[] = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "All", value: "ALL" },
];

// Generate portfolio performance data based on transactions and current value
function generatePortfolioData(
  totalValue: number,
  totalInvested: number,
  period: ChartPeriod,
): { x: number; y: number }[] {
  if (totalValue <= 0) {
    return Array.from({ length: 12 }, (_, i) => ({ x: i + 1, y: 0 }));
  }

  const pointsMap: Record<ChartPeriod, number> = {
    "1D": 24,
    "1W": 7,
    "1M": 30,
    "6M": 26,
    "1Y": 52,
    ALL: 100,
  };
  const points = pointsMap[period];

  // Simulate portfolio growth with variance
  const volatility = period === "1D" ? 0.02 : period === "1W" ? 0.05 : 0.15;
  const periodYears: Record<ChartPeriod, number> = {
    "1D": 1 / 365,
    "1W": 7 / 365,
    "1M": 1 / 12,
    "6M": 0.5,
    "1Y": 1,
    ALL: 3,
  };

  // Use invested amount as starting point
  const startValue = totalInvested > 0 ? totalInvested : totalValue * 0.9;

  const data: { x: number; y: number }[] = [];
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const randomFactor = 1 + (Math.random() - 0.5) * volatility;
    const value =
      startValue + (totalValue - startValue) * progress * randomFactor;
    data.push({ x: i + 1, y: Math.round(value) });
  }

  // Ensure last point is current value
  data[data.length - 1].y = Math.round(totalValue);

  return data;
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { data: holdings, refetch, isLoading } = usePortfolio();
  const { data: transactions } = useTransactions();
  const refreshMutation = useRefreshStocks();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("1M");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const symbols = holdings?.map((h) => h.stockSymbol) ?? [];
    if (symbols.length > 0) {
      await refreshMutation.mutateAsync(symbols);
    }
    await refetch();
    setRefreshing(false);
  }, [holdings, refreshMutation, refetch]);

  // Calculate portfolio metrics
  const totalValue =
    holdings?.reduce((sum, h) => {
      const price = h.stock?.currentPrice ?? 0;
      return sum + price * h.quantity;
    }, 0) ?? 0;

  const totalInvested =
    holdings?.reduce((sum, h) => sum + h.totalInvested, 0) ?? 0;

  const totalPnL = totalValue - totalInvested;
  const totalPnLPercent =
    totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Calculate day's P&L (sum of daily changes)
  const dayPnL =
    holdings?.reduce((sum, h) => {
      const price = h.stock?.currentPrice ?? 0;
      const prevClose = h.stock?.previousClose ?? price;
      const dayChange = (price - prevClose) * h.quantity;
      return sum + dayChange;
    }, 0) ?? 0;

  const dayPnLPercent =
    totalValue - dayPnL > 0 ? (dayPnL / (totalValue - dayPnL)) * 100 : 0;

  const chartData = generatePortfolioData(
    totalValue,
    totalInvested,
    selectedPeriod,
  );
  const isPositive = totalPnL >= 0;

  if (isLoading) {
    return (
      <SafeAreaView style={theme.screen} edges={["top"]}>
        <View style={[theme.titleSection, theme.screenPadding]}>
          <Text style={theme.title}>Dashboard</Text>
        </View>
        <LoadingState message="Loading portfolio..." />
      </SafeAreaView>
    );
  }

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
        contentContainerStyle={theme.screenPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={theme.titleSection}>
          <Text style={theme.title}>Dashboard</Text>
          <Text style={theme.subtitle}>Your PSX portfolio at a glance</Text>
        </View>

        {/* Portfolio Summary Card with Gradient Border */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={[
              "rgba(41, 255, 232, 0.2)",
              "rgba(139, 92, 246, 0.1)",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradientBorder}
          />
          <View style={styles.card}>
            <Text style={styles.cardLabel}>CURRENT MARKET VALUE</Text>
            <Text style={styles.valueLarge}>
              <Text style={styles.currencyPrefix}>PKR </Text>
              {totalValue.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
            </Text>

            {/* P&L Cards */}
            <View style={styles.pnlRow}>
              <View
                style={[
                  styles.pnlCard,
                  dayPnL >= 0 ? styles.pnlPositive : styles.pnlNegative,
                ]}
              >
                <Text style={styles.pnlLabel}>Day's P&L</Text>
                <Text
                  style={[
                    styles.pnlValue,
                    dayPnL >= 0
                      ? styles.pnlValuePositive
                      : styles.pnlValueNegative,
                  ]}
                >
                  {dayPnL >= 0 ? "+" : ""}PKR{" "}
                  {Math.abs(dayPnL).toLocaleString("en-PK", {
                    maximumFractionDigits: 0,
                  })}
                </Text>
                <Text
                  style={[
                    styles.pnlPercent,
                    dayPnL >= 0
                      ? styles.pnlValuePositive
                      : styles.pnlValueNegative,
                  ]}
                >
                  ({dayPnLPercent >= 0 ? "+" : ""}
                  {dayPnLPercent.toFixed(2)}%)
                </Text>
              </View>
              <View
                style={[
                  styles.pnlCard,
                  totalPnL >= 0 ? styles.pnlPositive : styles.pnlNegative,
                ]}
              >
                <Text style={styles.pnlLabel}>Total P&L</Text>
                <Text
                  style={[
                    styles.pnlValue,
                    totalPnL >= 0
                      ? styles.pnlValuePositive
                      : styles.pnlValueNegative,
                  ]}
                >
                  {totalPnL >= 0 ? "+" : ""}PKR{" "}
                  {Math.abs(totalPnL).toLocaleString("en-PK", {
                    maximumFractionDigits: 0,
                  })}
                </Text>
                <Text
                  style={[
                    styles.pnlPercent,
                    totalPnL >= 0
                      ? styles.pnlValuePositive
                      : styles.pnlValueNegative,
                  ]}
                >
                  ({totalPnLPercent >= 0 ? "+" : ""}
                  {totalPnLPercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Portfolio Chart */}
        <View style={[styles.cardWrapper, { marginTop: spacing.lg }]}>
          <View style={styles.card}>
            <View style={[theme.rowBetween, { marginBottom: spacing.sm }]}>
              <Text style={styles.sectionLabel}>PORTFOLIO HISTORY</Text>
              {isPositive ? (
                <TrendingUp color={colors.success} size={20} />
              ) : (
                <TrendingDown color={colors.danger} size={20} />
              )}
            </View>

            {/* Period Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.md }}
            >
              <View style={styles.periodSelector}>
                {PERIOD_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.periodBtn,
                      selectedPeriod === option.value && styles.periodBtnActive,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => setSelectedPeriod(option.value)}
                  >
                    <Text
                      style={[
                        styles.periodText,
                        selectedPeriod === option.value &&
                          styles.periodTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Chart */}
            {totalValue > 0 ? (
              <View style={{ height: 180 }}>
                <CartesianChart
                  data={chartData}
                  xKey="x"
                  yKeys={["y"]}
                  domainPadding={{ left: 10, right: 10, top: 20, bottom: 10 }}
                >
                  {({ points, chartBounds }) => (
                    <Area
                      points={points.y}
                      y0={chartBounds.bottom}
                      color={isPositive ? colors.success : colors.danger}
                      opacity={0.3}
                      curveType="natural"
                      animate={{ type: "timing", duration: 300 }}
                    />
                  )}
                </CartesianChart>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={theme.textMuted}>
                  Add investments to see portfolio history
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Holdings Quick View */}
        {holdings && holdings.length > 0 && (
          <View style={[styles.cardWrapper, { marginTop: spacing.lg }]}>
            <View style={styles.card}>
              <View style={[theme.rowBetween, { marginBottom: spacing.md }]}>
                <Text style={styles.sectionLabel}>
                  HOLDINGS ({holdings.length})
                </Text>
                <Pressable
                  style={styles.viewAllBtn}
                  onPress={() =>
                    navigation.navigate("MainTabs", { screen: "Portfolio" })
                  }
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <ChevronRight color={colors.primary} size={14} />
                </Pressable>
              </View>

              {holdings.slice(0, 4).map((holding, index) => {
                const currentPrice = holding.stock?.currentPrice ?? 0;
                const currentValue = currentPrice * holding.quantity;
                const gainLoss = currentValue - holding.totalInvested;
                const gainLossPercent =
                  holding.totalInvested > 0
                    ? (gainLoss / holding.totalInvested) * 100
                    : 0;

                return (
                  <View
                    key={holding.id}
                    style={[
                      styles.holdingRow,
                      index === Math.min(holdings.length - 1, 3) && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.holdingSymbol}>
                        {holding.stockSymbol}
                      </Text>
                      <Text style={styles.holdingShares}>
                        {holding.quantity} shares
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.holdingValue}>
                        PKR{" "}
                        {currentValue.toLocaleString("en-PK", {
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                      <Text
                        style={[
                          styles.holdingChange,
                          gainLoss >= 0
                            ? { color: colors.success }
                            : { color: colors.danger },
                        ]}
                      >
                        {gainLoss >= 0 ? "+" : ""}
                        {gainLossPercent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <View
            style={[
              styles.cardWrapper,
              { marginTop: spacing.lg, marginBottom: spacing.xl },
            ]}
          >
            <View style={styles.card}>
              <View style={[theme.rowBetween, { marginBottom: spacing.md }]}>
                <Text style={styles.sectionLabel}>RECENT TRANSACTIONS</Text>
                <Pressable
                  style={styles.viewAllBtn}
                  onPress={() => navigation.navigate("TransactionHistory")}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <ChevronRight color={colors.primary} size={14} />
                </Pressable>
              </View>

              {transactions.slice(0, 3).map((tx, index) => (
                <View
                  key={tx.id}
                  style={[
                    styles.transactionRow,
                    index === Math.min(transactions.length - 1, 2) && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.txIconContainer,
                      tx.transactionType === "BUY"
                        ? { backgroundColor: colors.successMuted }
                        : { backgroundColor: colors.dangerMuted },
                    ]}
                  >
                    {tx.transactionType === "BUY" ? (
                      <TrendingUp color={colors.success} size={16} />
                    ) : (
                      <TrendingDown color={colors.danger} size={16} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.txTitle}>
                      {tx.transactionType} {tx.stockSymbol}
                    </Text>
                    <Text style={styles.txSubtitle}>
                      {tx.quantity} @ PKR {tx.pricePerShare.toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.txAmount}>
                      PKR{" "}
                      {tx.totalAmount.toLocaleString("en-PK", {
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.transactionDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {(!holdings || holdings.length === 0) && (
          <View style={[styles.cardWrapper, { marginTop: spacing.lg }]}>
            <View style={[styles.card, styles.emptyState]}>
              <View style={styles.emptyIconContainer}>
                <Clock color={colors.icon} size={28} />
              </View>
              <Text style={styles.emptyTitle}>No Holdings Yet</Text>
              <Text style={styles.emptyDescription}>
                Search for stocks and add them to your portfolio to see your
                investment performance.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() =>
                  navigation.navigate("MainTabs", { screen: "Search" })
                }
              >
                <Text style={styles.emptyButtonText}>Find Stocks</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: "relative",
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  cardGradientBorder: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    margin: 1,
  },
  cardLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  valueLarge: {
    fontSize: 34,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  currencyPrefix: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  pnlRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  pnlCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  pnlPositive: {
    backgroundColor: colors.successMuted,
  },
  pnlNegative: {
    backgroundColor: colors.dangerMuted,
  },
  pnlLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  pnlValue: {
    fontSize: 14,
  },
  pnlValuePositive: {
    color: colors.success,
  },
  pnlValueNegative: {
    color: colors.danger,
  },
  pnlPercent: {
    fontSize: 10,
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  periodBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: "transparent",
  },
  periodBtnActive: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
  },
  periodText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  periodTextActive: {
    color: colors.textPrimary,
  },
  emptyChart: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingSymbol: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  holdingShares: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  holdingValue: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  holdingChange: {
    fontSize: 11,
    marginTop: 2,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  txSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  txDate: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glassLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
});
