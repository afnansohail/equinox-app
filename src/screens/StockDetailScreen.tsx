import React, { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Heart, RefreshCw } from "lucide-react-native";
import { VictoryAxis, VictoryChart, VictoryLine } from "victory-native";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { LoadingState } from "../components/shared/LoadingState";
import { useStock, useRefreshStocks, useChartData } from "../hooks/useStocks";
import type { ChartPeriod } from "../services/api";
import { useIsInWishlist, useToggleWishlist } from "../hooks/useWishlist";
import type { RootStackParamList } from "../navigation/types";
import { colors, theme, borderRadius, fonts } from "../constants/theme";

type Route = RouteProp<RootStackParamList, "StockDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList, "StockDetail">;

const PERIOD_OPTIONS: { label: string; value: ChartPeriod }[] = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "6M", value: "6M" },
  { label: "YTD", value: "YTD" },
  { label: "1Y", value: "1Y" },
  { label: "3Y", value: "3Y" },
  { label: "5Y", value: "5Y" },
];

export default function StockDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { symbol } = route.params;
  const { data: stock, isLoading, refetch } = useStock(symbol);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("1M");
  const { data: chartData, isLoading: chartLoading } = useChartData(
    symbol,
    selectedPeriod,
  );
  const { data: isInWishlist } = useIsInWishlist(symbol);
  const toggleWishlistMutation = useToggleWishlist();
  const refreshMutation = useRefreshStocks();
  const [refreshing, setRefreshing] = useState(false);

  // Transform chart data for Victory
  const chartPoints =
    chartData?.data?.map((point, index) => ({
      x: index,
      y: point.close,
    })) ?? [];

  const handleToggleWishlist = () => {
    toggleWishlistMutation.mutate({
      symbol,
      isCurrentlyInWishlist: isInWishlist ?? false,
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMutation.mutateAsync([symbol]);
      await refetch();
    } catch (error) {
      console.error("Error refreshing stock:", error);
    }
    setRefreshing(false);
  }, [symbol, refreshMutation, refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={theme.screen} edges={["top"]}>
        <View style={[theme.screenPadding, { paddingTop: 16 }]}>
          <Text style={theme.title}>{symbol}</Text>
        </View>
        <LoadingState message="Loading stock..." />
      </SafeAreaView>
    );
  }

  const dayChange = stock ? stock.currentPrice - stock.previousClose : 0;

  // Determine if chart shows positive or negative change
  const chartChangePercent = chartData?.stats?.changePercent ?? 0;
  const chartColor = chartChangePercent >= 0 ? colors.success : colors.danger;

  return (
    <SafeAreaView style={theme.screen} edges={["top"]}>
      <ScrollView
        style={theme.screen}
        contentContainerStyle={[theme.screenPadding, { paddingTop: 16 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ marginBottom: 16 }}>
          <View style={theme.rowBetween}>
            <View style={[theme.row, { flex: 1 }]}>
              {stock?.logoUrl && (
                <Image
                  source={{ uri: stock.logoUrl }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={theme.textMuted}>
                  {stock?.name ?? "Loading..."}
                </Text>
                <View style={theme.row}>
                  <Text style={theme.title}>{symbol}</Text>
                  {stock?.isShariahCompliant && (
                    <View style={styles.shariahBadge}>
                      <Text style={styles.shariahText}>Shariah</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              disabled={refreshing}
              style={styles.refreshBtn}
            >
              <RefreshCw
                color={colors.icon}
                size={20}
                style={refreshing ? { opacity: 0.5 } : undefined}
              />
            </TouchableOpacity>
          </View>
          <Text style={[theme.valueLarge, { fontSize: 36, marginTop: 8 }]}>
            {stock ? `PKR ${stock.currentPrice.toFixed(2)}` : "—"}
          </Text>
          {stock && (
            <View style={[theme.row, { marginTop: 8 }]}>
              <Text
                style={[
                  theme.valueSmall,
                  dayChange >= 0 ? theme.success : theme.danger,
                ]}
              >
                {dayChange >= 0 ? "+" : ""}
                {dayChange.toFixed(2)}
              </Text>
              <View style={{ marginLeft: 8 }}>
                <Badge value={stock.changePercent} />
              </View>
              {stock.lastUpdated && (
                <Text
                  style={[theme.textMuted, { marginLeft: 12, fontSize: 10 }]}
                >
                  Updated: {new Date(stock.lastUpdated).toLocaleTimeString()}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={[theme.row, { marginBottom: 16, gap: 12 }]}>
          <TouchableOpacity
            onPress={handleToggleWishlist}
            disabled={toggleWishlistMutation.isPending}
            style={[
              styles.wishlistBtn,
              isInWishlist && styles.wishlistBtnActive,
            ]}
          >
            <Heart
              color={isInWishlist ? colors.danger : colors.icon}
              fill={isInWishlist ? colors.danger : "transparent"}
              size={24}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Button
              title="Add to Portfolio"
              onPress={() =>
                navigation.navigate("AddTransaction", {
                  symbol,
                  currentPrice: stock?.currentPrice,
                  type: "BUY",
                })
              }
            />
          </View>
        </View>

        <Card style={{ marginBottom: 16 }}>
          <View style={[theme.rowBetween, { marginBottom: 8 }]}>
            <Text style={theme.cardTitle}>Performance</Text>
            {chartData?.stats && (
              <Text
                style={[
                  theme.valueSmall,
                  chartChangePercent >= 0 ? theme.success : theme.danger,
                ]}
              >
                {chartChangePercent >= 0 ? "+" : ""}
                {chartChangePercent.toFixed(2)}%
              </Text>
            )}
          </View>

          {/* Period Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}
          >
            <View style={styles.periodSelector}>
              {PERIOD_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.periodBtn,
                    selectedPeriod === option.value && styles.periodBtnActive,
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
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Chart */}
          <View style={{ height: 180 }}>
            {chartLoading ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : chartPoints.length > 1 ? (
              <VictoryChart
                padding={{ left: 50, right: 16, top: 12, bottom: 30 }}
                domainPadding={{ x: 10, y: 10 }}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: colors.border },
                    tickLabels: { fill: colors.textMuted, fontSize: 9 },
                    grid: { stroke: "transparent" },
                  }}
                  tickFormat={() => ""}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: colors.border },
                    tickLabels: { fill: colors.textMuted, fontSize: 9 },
                    grid: { stroke: colors.border, strokeDasharray: "2,4" },
                  }}
                  tickFormat={(t) =>
                    t >= 1000 ? `${(t / 1000).toFixed(0)}k` : t.toFixed(0)
                  }
                />
                <VictoryLine
                  interpolation="monotoneX"
                  data={chartPoints}
                  style={{
                    data: { stroke: chartColor, strokeWidth: 2 },
                  }}
                />
              </VictoryChart>
            ) : (
              <View style={styles.chartLoading}>
                <Text style={theme.textMuted}>No chart data available</Text>
              </View>
            )}
          </View>

          {/* Chart Stats */}
          {chartData?.stats && (
            <View style={styles.chartStats}>
              <View style={styles.chartStatItem}>
                <Text style={theme.label}>High</Text>
                <Text style={theme.valueSmall}>
                  {chartData.stats.high.toFixed(2)}
                </Text>
              </View>
              <View style={styles.chartStatItem}>
                <Text style={theme.label}>Low</Text>
                <Text style={theme.valueSmall}>
                  {chartData.stats.low.toFixed(2)}
                </Text>
              </View>
              <View style={styles.chartStatItem}>
                <Text style={theme.label}>Avg Vol</Text>
                <Text style={theme.valueSmall}>
                  {(chartData.stats.avgVolume / 1000000).toFixed(1)}M
                </Text>
              </View>
            </View>
          )}
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Text style={[theme.valueSmall, { marginBottom: 12 }]}>
            Key Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={theme.label}>Market Cap</Text>
              <Text style={theme.valueSmall}>
                {stock?.marketCap
                  ? `PKR ${(stock.marketCap / 1000000).toFixed(1)}M`
                  : "—"}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={theme.label}>Volume</Text>
              <Text style={theme.valueSmall}>
                {stock ? stock.volume.toLocaleString("en-PK") : "—"}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={theme.label}>52W High</Text>
              <Text style={theme.valueSmall}>
                {stock?.high52Week ? `PKR ${stock.high52Week.toFixed(2)}` : "—"}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={theme.label}>52W Low</Text>
              <Text style={theme.valueSmall}>
                {stock?.low52Week ? `PKR ${stock.low52Week.toFixed(2)}` : "—"}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={{ marginBottom: 40 }}>
          <View style={theme.rowBetween}>
            <Text style={theme.textMuted}>Previous Close</Text>
            <Text style={theme.valueSmall}>
              {stock ? `PKR ${stock.previousClose.toFixed(2)}` : "—"}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  wishlistBtn: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  wishlistBtnActive: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.danger,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statItem: {
    width: "50%",
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 4,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  periodBtnActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  periodText: {
    fontSize: 12,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
  },
  periodTextActive: {
    color: colors.primary,
  },
  chartLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chartStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  chartStatItem: {
    alignItems: "center",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: 12,
    backgroundColor: colors.glass,
  },
  shariahBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.successMuted,
  },
  shariahText: {
    fontSize: 10,
    fontFamily: fonts.sans.semibold,
    color: colors.success,
  },
});
