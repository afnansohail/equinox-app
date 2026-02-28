import React from "react";
import {
  ScrollView,
  Text,
  Pressable,
  View,
  StyleSheet,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Plus, TrendingDown, Briefcase } from "lucide-react-native";
import { Badge } from "../components/ui/Badge";
import { usePortfolio } from "../hooks/usePortfolio";
import type { RootStackParamList, MainTabParamList } from "../navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  colors,
  theme,
  spacing,
  borderRadius,
  fonts,
} from "../constants/theme";

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Portfolio">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function PortfolioScreen() {
  const navigation = useNavigation<Nav>();
  const { data: holdings } = usePortfolio();

  const totalValue =
    holdings?.reduce((sum, h) => {
      const price = h.stock?.currentPrice ?? 0;
      return sum + price * h.quantity;
    }, 0) ?? 0;

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
      >
        <View style={[theme.rowBetween, theme.titleSection]}>
          <Text style={theme.title}>Portfolio</Text>
          <Pressable
            onPress={() => navigation.navigate("AddTransaction", {})}
            style={({ pressed }) => [
              styles.addButton,
              pressed && { opacity: 0.8 },
            ]}
          >
            <LinearGradient
              colors={["#29FFE8", "#06B6D4"]}
              style={styles.addButtonGradient}
            >
              <Plus color={colors.textInverse} size={20} />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Distribution Card */}
        {holdings && holdings.length > 0 && totalValue > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>PORTFOLIO DISTRIBUTION</Text>
            <View style={styles.distributionList}>
              {holdings.slice(0, 6).map((holding, index) => {
                const value =
                  (holding.stock?.currentPrice ?? 0) * holding.quantity;
                const pct = (value / totalValue) * 100;
                const barColors = [
                  colors.primary,
                  colors.accent,
                  colors.success,
                  "#F59E0B",
                  "#EC4899",
                  "#06B6D4",
                ];
                return (
                  <View key={holding.id} style={styles.distributionRow}>
                    <Text style={styles.symbolLabel} numberOfLines={1}>
                      {holding.stockSymbol}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor:
                              barColors[index % barColors.length],
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.pctLabel}>{pct.toFixed(0)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty Distribution */}
        {(!holdings || holdings.length === 0 || totalValue <= 0) && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>PORTFOLIO DISTRIBUTION</Text>
            <Text style={styles.emptyDistText}>
              Add holdings to see allocation
            </Text>
          </View>
        )}

        {/* Holdings Section */}
        <View style={{ marginTop: spacing.lg }}>
          <Text style={styles.holdingsTitle}>Holdings</Text>

          {holdings?.map((holding) => {
            const currentPrice = holding.stock?.currentPrice ?? 0;
            const currentValue = currentPrice * holding.quantity;
            const gainLoss = currentValue - holding.totalInvested;
            const gainLossPercent =
              holding.totalInvested > 0
                ? (gainLoss / holding.totalInvested) * 100
                : 0;

            return (
              <Pressable
                key={holding.id}
                style={({ pressed }) => [
                  styles.holdingCard,
                  pressed && { backgroundColor: colors.cardHover },
                ]}
                onPress={() =>
                  navigation.navigate("Search", {
                    symbol: holding.stockSymbol,
                  })
                }
              >
                <View style={styles.holdingHeader}>
                  {holding.stock?.logoUrl ? (
                    <Image
                      source={{ uri: holding.stock.logoUrl }}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.logo, styles.logoPlaceholder]}>
                      <Briefcase color={colors.icon} size={18} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={theme.row}>
                      <Text style={styles.holdingSymbol}>
                        {holding.stockSymbol}
                      </Text>
                      {holding.stock?.isShariahCompliant && (
                        <View style={styles.shariahBadge}>
                          <Text style={styles.shariahText}>Shariah</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.holdingName} numberOfLines={1}>
                      {holding.stock?.name}
                    </Text>
                  </View>
                  <Badge value={holding.stock?.changePercent ?? 0} />
                </View>

                <View style={styles.holdingStats}>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Qty</Text>
                    <Text style={styles.statValue}>{holding.quantity}</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Avg Buy</Text>
                    <Text style={styles.statValue}>
                      PKR {holding.averageBuyPrice.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Value</Text>
                    <Text style={styles.statValue}>
                      PKR{" "}
                      {currentValue.toLocaleString("en-PK", {
                        maximumFractionDigits: 0,
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.holdingFooter}>
                  <Text
                    style={[
                      styles.pnlText,
                      gainLoss >= 0
                        ? { color: colors.success }
                        : { color: colors.danger },
                    ]}
                  >
                    {gainLoss >= 0 ? "+" : "-"}PKR{" "}
                    {Math.abs(gainLoss).toLocaleString("en-PK", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    ({gainLossPercent >= 0 ? "+" : ""}
                    {gainLossPercent.toFixed(2)}%)
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.sellBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() =>
                      navigation.navigate("AddTransaction", {
                        symbol: holding.stockSymbol,
                        currentPrice: holding.stock?.currentPrice,
                        type: "SELL",
                      })
                    }
                  >
                    <TrendingDown color={colors.danger} size={14} />
                    <Text style={styles.sellBtnText}>Sell</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })}

          {/* Empty State */}
          {(!holdings || holdings.length === 0) && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconContainer}>
                <Briefcase color={colors.icon} size={28} />
              </View>
              <Text style={styles.emptyTitle}>No Holdings Yet</Text>
              <Text style={styles.emptyText}>
                Add your first transaction to start tracking your portfolio
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => navigation.navigate("AddTransaction", {})}
              >
                <Plus color={colors.primary} size={16} />
                <Text style={styles.emptyButtonText}>Add Transaction</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.semibold,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  distributionList: {
    gap: spacing.sm,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  symbolLabel: {
    fontSize: 12,
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
    width: 50,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
  pctLabel: {
    fontSize: 12,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    width: 36,
    textAlign: "right",
  },
  emptyDistText: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
  },
  holdingsTitle: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  holdingCard: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  holdingHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.glass,
  },
  logoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  holdingSymbol: {
    fontSize: 18,
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
  },
  holdingName: {
    fontSize: 13,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  shariahBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.successMuted,
  },
  shariahText: {
    fontSize: 9,
    fontFamily: fonts.sans.bold,
    color: colors.success,
  },
  holdingStats: {
    flexDirection: "row",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fonts.sans.medium,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontFamily: fonts.serif.semibold,
    color: colors.textPrimary,
  },
  holdingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  pnlText: {
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
  },
  sellBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.dangerMuted,
    gap: spacing.xs,
  },
  sellBtnText: {
    fontSize: 13,
    fontFamily: fonts.sans.semibold,
    color: colors.danger,
  },
  emptyCard: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.xl,
    alignItems: "center",
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
    fontFamily: fonts.serif.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.sans.semibold,
  },
});
