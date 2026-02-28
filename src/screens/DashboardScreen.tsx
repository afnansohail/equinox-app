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
import {
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  History,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { LineChart } from "react-native-gifted-charts";
import { usePortfolio, useTransactions } from "../hooks/usePortfolio";
import { useRefreshStocks } from "../hooks/useStocks";
import { useAuthStore } from "../stores/authStore";
import type { RootStackParamList, MainTabParamList } from "../navigation/types";
import { colors, TAB_BAR_HEIGHT } from "../constants/theme";
import type { Transaction } from "../services/api";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Dashboard">,
  NativeStackNavigationProp<RootStackParamList>
>;

function fmtLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

type ChartPoint = { value: number; label?: string; dataPointText?: string };

function buildChartFromTransactions(
  transactions: Transaction[] | undefined,
  totalValue: number,
): ChartPoint[] {
  const today = new Date().toISOString().slice(0, 10);
  if (!transactions || transactions.length === 0) {
    return [{ value: totalValue, label: fmtLabel(today) }];
  }

  // Sort oldest → newest
  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(a.transactionDate).getTime() -
      new Date(b.transactionDate).getTime(),
  );

  // Build cumulative portfolio cost basis per transaction date
  let cumulative = 0;
  const points: ChartPoint[] = [];
  for (const tx of sorted) {
    if (tx.transactionType === "BUY") cumulative += tx.totalAmount;
    else cumulative = Math.max(0, cumulative - tx.totalAmount);
    points.push({
      value: Math.round(cumulative),
      label: fmtLabel(tx.transactionDate),
    });
  }

  // Final point = today's current market value
  if (totalValue > 0) {
    points.push({ value: Math.round(totalValue), label: fmtLabel(today) });
  }

  if (points.length < 2) {
    return [{ value: 0, label: points[0]?.label }, points[0]];
  }

  // Only show labels on first, last, and ~2 middle points to avoid clutter
  const labelIdxs = new Set([0, points.length - 1]);
  if (points.length > 4) {
    labelIdxs.add(Math.floor(points.length / 3));
    labelIdxs.add(Math.floor((2 * points.length) / 3));
  }
  return points.map((p, i) => ({
    ...p,
    label: labelIdxs.has(i) ? p.label : undefined,
  }));
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user, isAnonymous } = useAuthStore();
  const { data: holdings, refetch, isLoading } = usePortfolio();
  const { data: transactions } = useTransactions();
  const refreshMutation = useRefreshStocks();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const symbols = holdings?.map((h) => h.stockSymbol) ?? [];
    if (symbols.length > 0) await refreshMutation.mutateAsync(symbols);
    await refetch();
    setRefreshing(false);
  }, [holdings, refreshMutation, refetch]);

  const totalValue =
    holdings?.reduce(
      (s, h) => s + (h.stock?.currentPrice ?? 0) * h.quantity,
      0,
    ) ?? 0;
  const totalInvested = holdings?.reduce((s, h) => s + h.totalInvested, 0) ?? 0;
  const totalPnL = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const isPositive = totalPnL >= 0;

  const dayPnL =
    holdings?.reduce((s, h) => {
      const price = h.stock?.currentPrice ?? 0;
      const prev =
        h.stock?.previousClose && h.stock.previousClose > 0
          ? h.stock.previousClose
          : price;
      return s + (price - prev) * h.quantity;
    }, 0) ?? 0;

  const chartData = buildChartFromTransactions(transactions, totalValue);
  const chartColor = isPositive ? "#22C55E" : colors.danger;

  const displayName = isAnonymous
    ? "Guest"
    : (user?.email?.split("@")[0] ?? "User");
  const avatarLetter = displayName[0]?.toUpperCase() ?? "U";

  const recentTx = (transactions ?? []).slice(0, 3);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{avatarLetter}</Text>
          </View>
          <View>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{displayName} 👋</Text>
          </View>
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
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Portfolio balance</Text>
          <Text style={styles.balanceValue}>
            PKR{" "}
            {totalValue.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
          </Text>

          {/* P/L rows */}
          <View style={styles.pnlBlock}>
            <View style={styles.pnlRow}>
              <Text style={styles.pnlRowLabel}>Total P/L</Text>
              <View style={styles.pnlRowRight}>
                <Text
                  style={[
                    styles.pnlRowAmount,
                    { color: isPositive ? "#22C55E" : colors.danger },
                  ]}
                >
                  {isPositive ? "+" : ""}PKR{" "}
                  {Math.abs(totalPnL).toLocaleString("en-PK", {
                    maximumFractionDigits: 0,
                  })}
                </Text>
                <View
                  style={[
                    styles.pnlBadge,
                    {
                      backgroundColor: isPositive
                        ? "rgba(34,197,94,0.14)"
                        : "rgba(239,68,68,0.14)",
                    },
                  ]}
                >
                  {isPositive ? (
                    <TrendingUp size={11} color="#22C55E" />
                  ) : (
                    <TrendingDown size={11} color={colors.danger} />
                  )}
                  <Text
                    style={[
                      styles.pnlBadgeText,
                      { color: isPositive ? "#22C55E" : colors.danger },
                    ]}
                  >
                    {isPositive ? "+" : ""}
                    {totalPnLPct.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.pnlRow,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  paddingTop: 8,
                },
              ]}
            >
              <Text style={styles.pnlRowLabel}>Today</Text>
              <Text
                style={[
                  styles.pnlRowAmount,
                  { color: dayPnL >= 0 ? "#22C55E" : colors.danger },
                ]}
              >
                {dayPnL >= 0 ? "+" : ""}PKR{" "}
                {Math.abs(dayPnL).toLocaleString("en-PK", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>

          {/* Chart */}
          {chartData.length >= 2 && (
            <View style={styles.chartWrap}>
              <LineChart
                data={chartData}
                height={110}
                adjustToWidth
                hideDataPoints={false}
                dataPointsColor={chartColor}
                dataPointsRadius={3}
                color={chartColor}
                thickness={2}
                curved
                areaChart
                startFillColor={
                  isPositive ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.20)"
                }
                endFillColor="transparent"
                rulesColor="rgba(255,255,255,0.07)"
                rulesType="solid"
                showVerticalLines={false}
                xAxisColor="rgba(255,255,255,0.12)"
                yAxisColor="transparent"
                yAxisTextStyle={{
                  color: colors.textMuted,
                  fontSize: 9,
                }}
                xAxisLabelTextStyle={{
                  color: colors.textMuted,
                  fontSize: 9,
                }}
                noOfSections={3}
                yAxisLabelPrefix="₨"
                initialSpacing={6}
                endSpacing={6}
                pointerConfig={{
                  pointerStripHeight: 110,
                  pointerStripColor: "rgba(255,255,255,0.18)",
                  pointerStripWidth: 1,
                  pointerColor: chartColor,
                  radius: 5,
                  pointerLabelWidth: 130,
                  pointerLabelHeight: 44,
                  activatePointersOnLongPress: false,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items: any[]) => (
                    <View style={styles.tooltipBox}>
                      <Text style={styles.tooltipVal}>
                        PKR{" "}
                        {Number(items[0].value).toLocaleString("en-PK", {
                          maximumFractionDigits: 0,
                        })}
                      </Text>
                      {items[0].label ? (
                        <Text style={styles.tooltipDate}>{items[0].label}</Text>
                      ) : null}
                    </View>
                  ),
                }}
              />
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <ActionBtn
            icon={<ArrowUpRight size={22} color="#22C55E" />}
            label="Buy"
            onPress={() =>
              navigation.navigate("AddTransaction", { type: "BUY" })
            }
          />
          <ActionBtn
            icon={<ArrowDownRight size={22} color={colors.danger} />}
            label="Sell"
            onPress={() =>
              navigation.navigate("AddTransaction", { type: "SELL" })
            }
          />
          <ActionBtn
            icon={<History size={22} color={colors.icon} />}
            label="History"
            onPress={() => navigation.navigate("TransactionHistory")}
          />
          <ActionBtn
            icon={<RefreshCw size={22} color={colors.icon} />}
            label="Refresh"
            onPress={onRefresh}
          />
        </View>

        {/* Latest Activity */}
        {recentTx.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest activity</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("TransactionHistory")}
              >
                <Text style={styles.seeAllText}>View all →</Text>
              </TouchableOpacity>
            </View>
            {recentTx.map((tx) => {
              const isBuy = tx.transactionType === "BUY";
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View
                    style={[
                      styles.txIconCircle,
                      {
                        backgroundColor: isBuy
                          ? "rgba(34,197,94,0.12)"
                          : "rgba(239,68,68,0.12)",
                      },
                    ]}
                  >
                    {isBuy ? (
                      <ArrowUpRight size={18} color="#22C55E" />
                    ) : (
                      <ArrowDownRight size={18} color={colors.danger} />
                    )}
                  </View>
                  <View style={styles.txMeta}>
                    <Text style={styles.txTitle}>
                      {isBuy ? "Bought" : "Sold"} {tx.quantity} {tx.stockSymbol}
                    </Text>
                    <Text style={styles.txDate}>{tx.transactionDate}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>
                      PKR{" "}
                      {tx.totalAmount.toLocaleString("en-PK", {
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.txStatus,
                        { color: isBuy ? colors.danger : "#22C55E" },
                      ]}
                    >
                      {isBuy ? "Debited" : "Credited"}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.actionIconCircle}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: "700",
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
    paddingTop: 4,
  },
  // Balance card
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  balanceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  pnlChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pnlChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dayPnLText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chartWrap: {
    marginTop: 12,
    marginHorizontal: -4,
    overflow: "hidden",
  },
  // P/L block
  pnlBlock: {
    marginBottom: 12,
    gap: 8,
  },
  pnlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pnlRowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pnlRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pnlRowAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  pnlBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pnlBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Tooltip
  tooltipBox: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tooltipVal: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  tooltipDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  // Actions
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  // Stock rows
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  letterAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  letterAvatarText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  stockLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
  },
  stockMeta: {
    flex: 1,
    gap: 3,
  },
  stockSymbol: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  stockName: {
    fontSize: 12,
    color: colors.textSecondary,
    maxWidth: 140,
  },
  stockRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stockChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: "500",
  },
  // Empty state
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
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
  // Transaction rows
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  txMeta: {
    flex: 1,
    gap: 3,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  txDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  txRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  txStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
});
